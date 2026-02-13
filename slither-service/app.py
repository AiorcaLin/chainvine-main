"""
Slither Analysis Service
========================
FastAPI 微服务，封装 Slither 静态分析引擎。
接收 Solidity 合约源码，返回结构化漏洞扫描结果。
"""

import json
import os
import shutil
import subprocess
import tempfile
import time
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Slither Analysis Service",
    description="智能合约静态分析微服务 - 基于 Trail of Bits Slither",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 请求/响应模型 ───────────────────────────────────────────────


class ContractFile(BaseModel):
    """单个合约源文件"""
    path: str
    content: str


class AnalyzeRequest(BaseModel):
    """分析请求"""
    files: list[ContractFile]
    main_file: Optional[str] = None
    solc_version: Optional[str] = None


class SlitherElement(BaseModel):
    """Slither 发现中的代码元素"""
    type: str
    name: str
    source_mapping: Optional[dict] = None
    additional_fields: Optional[dict] = None


class SlitherFinding(BaseModel):
    """单条 Slither 检测结果"""
    check: str
    impact: str
    confidence: str
    description: str
    markdown: Optional[str] = None
    first_markdown_element: Optional[str] = None
    elements: list[dict] = []
    id: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """分析响应"""
    success: bool
    findings: list[SlitherFinding] = []
    summary: dict = {}
    error: Optional[str] = None
    duration_ms: int = 0
    solc_version: Optional[str] = None
    slither_version: Optional[str] = None


# ─── 工具函数 ────────────────────────────────────────────────────


def detect_solc_version(source_code: str) -> str:
    """
    从 Solidity 源码中检测 pragma 指定的编译器版本。
    返回可用的最接近版本。
    """
    import re
    
    # 匹配 pragma solidity ^0.8.19; 或 pragma solidity >=0.8.0 <0.9.0; 等
    patterns = [
        r'pragma\s+solidity\s*\^?\s*(\d+\.\d+\.\d+)',
        r'pragma\s+solidity\s*>=?\s*(\d+\.\d+\.\d+)',
        r'pragma\s+solidity\s+(\d+\.\d+\.\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, source_code)
        if match:
            version = match.group(1)
            return version
    
    return "0.8.28"  # 默认版本


def install_solc_if_needed(version: str) -> str:
    """确保指定的 solc 版本已安装，返回实际使用的版本"""
    try:
        # 获取已安装版本列表
        result = subprocess.run(
            ["solc-select", "versions"],
            capture_output=True, text=True, timeout=30
        )
        installed = result.stdout
        
        if version in installed:
            subprocess.run(
                ["solc-select", "use", version],
                capture_output=True, text=True, timeout=30
            )
            return version
        
        # 尝试安装
        install_result = subprocess.run(
            ["solc-select", "install", version],
            capture_output=True, text=True, timeout=120
        )
        
        if install_result.returncode == 0:
            subprocess.run(
                ["solc-select", "use", version],
                capture_output=True, text=True, timeout=30
            )
            return version
        
        # 如果精确版本安装失败，尝试同一 minor 版本的最新 patch
        major_minor = ".".join(version.split(".")[:2])
        fallback_versions = [
            f"{major_minor}.28", f"{major_minor}.26", f"{major_minor}.24",
            f"{major_minor}.20", f"{major_minor}.19", f"{major_minor}.0"
        ]
        
        for fb in fallback_versions:
            if fb in installed:
                subprocess.run(
                    ["solc-select", "use", fb],
                    capture_output=True, text=True, timeout=30
                )
                return fb
        
        # 最终回退到默认版本
        subprocess.run(
            ["solc-select", "use", "0.8.28"],
            capture_output=True, text=True, timeout=30
        )
        return "0.8.28"
        
    except Exception as e:
        print(f"solc version management error: {e}")
        return "0.8.28"


def run_slither(contract_dir: str, main_file: str, timeout: int = 120) -> dict:
    """
    在指定目录中运行 Slither 分析。
    
    Args:
        contract_dir: 合约文件所在目录
        main_file: 主合约文件名
        timeout: 超时时间（秒）
    
    Returns:
        Slither JSON 输出
    """
    target = os.path.join(contract_dir, main_file)
    
    cmd = [
        "slither",
        target,
        "--json", "-",                    # JSON 输出到 stdout
        "--no-fail",                      # 即使有发现也返回 0
        "--filter-paths", "node_modules", # 过滤 node_modules
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=contract_dir,
        )
        
        # Slither 把 JSON 输出到 stdout
        stdout = result.stdout.strip()
        
        if stdout:
            try:
                return json.loads(stdout)
            except json.JSONDecodeError:
                # 有时 stdout 中混杂了非 JSON 内容，尝试提取
                for line in stdout.split("\n"):
                    line = line.strip()
                    if line.startswith("{"):
                        try:
                            return json.loads(line)
                        except json.JSONDecodeError:
                            continue
        
        # 如果 stdout 没有有效 JSON，检查 stderr
        return {
            "success": False,
            "error": result.stderr[:2000] if result.stderr else "No output from Slither",
            "results": {"detectors": []}
        }
        
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": f"Slither analysis timed out after {timeout}s",
            "results": {"detectors": []}
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "results": {"detectors": []}
        }


# ─── API 端点 ────────────────────────────────────────────────────


@app.get("/health")
async def health_check():
    """健康检查"""
    # 获取 Slither 版本
    try:
        result = subprocess.run(
            ["slither", "--version"],
            capture_output=True, text=True, timeout=10
        )
        slither_version = result.stdout.strip()
    except Exception:
        slither_version = "unknown"
    
    # 获取当前 solc 版本
    try:
        result = subprocess.run(
            ["solc", "--version"],
            capture_output=True, text=True, timeout=10
        )
        solc_version = result.stdout.strip()
    except Exception:
        solc_version = "unknown"
    
    return {
        "status": "healthy",
        "slither_version": slither_version,
        "solc_version": solc_version,
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_contract(request: AnalyzeRequest):
    """
    分析智能合约
    
    接收一组 Solidity 源文件，运行 Slither 静态分析，
    返回结构化的漏洞检测结果。
    """
    start_time = time.time()
    
    if not request.files:
        raise HTTPException(status_code=400, detail="No contract files provided")
    
    # 创建临时目录
    work_dir = tempfile.mkdtemp(prefix="slither_", dir="/tmp/contracts")
    
    try:
        # 写入合约文件
        for f in request.files:
            file_path = os.path.join(work_dir, f.path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as fp:
                fp.write(f.content)
        
        # 确定主文件
        main_file = request.main_file
        if not main_file:
            # 如果没指定主文件，用第一个 .sol 文件
            sol_files = [f.path for f in request.files if f.path.endswith(".sol")]
            if not sol_files:
                raise HTTPException(status_code=400, detail="No .sol files found")
            main_file = sol_files[0]
        
        # 检测并设置 solc 版本
        if request.solc_version:
            solc_ver = request.solc_version
        else:
            # 从主文件内容中检测
            main_content = next(
                (f.content for f in request.files if f.path == main_file), ""
            )
            solc_ver = detect_solc_version(main_content)
        
        actual_solc = install_solc_if_needed(solc_ver)
        
        # 运行 Slither
        raw_result = run_slither(work_dir, main_file, timeout=120)
        
        # 获取 Slither 版本
        slither_ver = None
        try:
            ver_result = subprocess.run(
                ["slither", "--version"],
                capture_output=True, text=True, timeout=10
            )
            slither_ver = ver_result.stdout.strip()
        except Exception:
            pass
        
        # 解析结果
        detectors = raw_result.get("results", {}).get("detectors", [])
        
        findings = []
        for d in detectors:
            finding = SlitherFinding(
                check=d.get("check", "unknown"),
                impact=d.get("impact", "Unknown"),
                confidence=d.get("confidence", "Unknown"),
                description=d.get("description", ""),
                markdown=d.get("markdown", ""),
                first_markdown_element=d.get("first_markdown_element", ""),
                elements=d.get("elements", []),
                id=d.get("id", ""),
            )
            findings.append(finding)
        
        # 生成摘要
        summary = {
            "total": len(findings),
            "high": sum(1 for f in findings if f.impact == "High"),
            "medium": sum(1 for f in findings if f.impact == "Medium"),
            "low": sum(1 for f in findings if f.impact == "Low"),
            "informational": sum(
                1 for f in findings if f.impact == "Informational"
            ),
            "optimization": sum(
                1 for f in findings if f.impact == "Optimization"
            ),
        }
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        return AnalyzeResponse(
            success=raw_result.get("success", True),
            findings=findings,
            summary=summary,
            error=raw_result.get("error"),
            duration_ms=duration_ms,
            solc_version=actual_solc,
            slither_version=slither_ver,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        return AnalyzeResponse(
            success=False,
            error=str(e),
            duration_ms=duration_ms,
        )
    finally:
        # 清理临时文件
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass


@app.get("/detectors")
async def list_detectors():
    """列出所有可用的 Slither 检测器"""
    try:
        result = subprocess.run(
            ["slither", "--list-detectors-json"],
            capture_output=True, text=True, timeout=30
        )
        if result.stdout:
            detectors = json.loads(result.stdout)
            return {"detectors": detectors, "total": len(detectors)}
    except Exception as e:
        return {"error": str(e), "detectors": [], "total": 0}
    
    return {"detectors": [], "total": 0}
