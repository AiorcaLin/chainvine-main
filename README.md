# ChainVine — 双引擎智能合约漏洞扫描系统

<p align="center">
  <strong>Dual-Engine Smart Contract Vulnerability Scanner</strong><br/>
  基于 Slither 静态分析与大语言模型的智能合约安全审计系统
</p>

<p align="center">
  <a href="https://github.com/AiorcaLin/chainvine-main/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-green" alt="License" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Slither-0.10-orange" alt="Slither" />
  <img src="https://img.shields.io/badge/EVM%20Chains-8-brightgreen" alt="Chains" />
</p>

---

![image](https://github.com/user-attachments/assets/336fae3c-06af-4e09-a59a-3d815e1f0f53)

---

## 项目简介

ChainVine 是一个面向区块链的 **双引擎智能合约漏洞扫描系统**，将 Trail of Bits 出品的 [Slither](https://github.com/crytic/slither) 静态分析工具与 LLM（大语言模型）深度审计相结合，实现互补性漏洞检测。

> **项目性质**：成都信息工程大学 · 信息安全专业 · 本科毕业设计

### 核心架构

```
┌──────────────────────────────────────────────────────┐
│                    ChainVine                          │
│                                                      │
│   ┌──────────────┐   Fusion    ┌──────────────┐     │
│   │   Slither    │ ◄──────────►│   AI (LLM)   │     │
│   │ Static Scan  │  Cross-     │  Deep Audit   │     │
│   │ 80+ Detectors│  Validate   │ GPT/Claude/   │     │
│   │              │             │ Gemini/Qwen   │     │
│   └──────────────┘             └──────────────┘     │
│              └──────────┬──────────┘                 │
│                    Unified Report                     │
└──────────────────────────────────────────────────────┘
```

- **Slither 引擎**：基于 AST/CFG/数据流的静态分析，80+ 检测器覆盖重入攻击（SWC-107）、整数溢出（SWC-101）、权限控制（SWC-105）等标准漏洞
- **AI 引擎**：大语言模型语义级代码审计，发现业务逻辑漏洞和复杂跨函数攻击路径
- **融合引擎**：交叉验证两个引擎的结果，去重、评分、生成统一报告，双引擎共识发现具有更高置信度

> **参考**：Dietterich, T.G., "Ensemble Methods in Machine Learning", MCS 2000 — 双引擎融合算法的理论基础

---

## 功能特性

### 双引擎分析 (Dual-Engine)
- Slither 静态扫描 + LLM 深度审计 **并行执行**
- 结果融合引擎：去重 + 交叉验证 + 置信度评分
- 统一漏洞清单，标注来源引擎

### 多模型 AI 支持 (3 Providers)
- **Neversight**（浏览器直连）：Claude / GPT / Gemini 等
- **DashScope 通义千问**（服务器代理）：qwen3-coder-plus / qwen-flash 等
- **OpenAI**（服务器代理）：GPT-4o 等
- 服务器端 API Key 代理，前端零泄露

### 8 条 EVM 链支持
Ethereum · BSC · Arbitrum · Base · Optimism · Polygon · Avalanche-C · Aurora

### StreamAI 流式输出
- 5 层流式管道：LLM Provider → 服务器 → 浏览器 → 分析器 → UI
- 150ms 节流渲染，实时展示 AI 审计过程

### 代理合约自动检测
- 自动识别 EIP-1967 / UUPS / Beacon 代理模式
- 分离 Proxy 与 Implementation 源码

### Agent API
- RESTful API（同步 JSON + 流式 SSE）
- `x-agent-api-key` 鉴权
- 供外部 AI Agent / 自动化脚本集成调用

### 报告导出
- Markdown + ZIP 一键下载
- 包含 Slither 原始 JSON + 融合元数据

---

## 快速开始

### 环境要求
- Node.js 18+ 或 [Bun](https://bun.sh/)
- Docker（运行 Slither 容器）
- Git

### 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/AiorcaLin/chainvine-main.git
cd chainvine-main

# 2. 安装依赖
bun install   # 或 npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 API Key 等配置

# 4. 启动 Slither Docker 容器
docker-compose up -d

# 5. 启动开发服务器
bun dev   # 或 npx next dev
# → http://localhost:3000
```

### 使用流程

1. 打开 `http://localhost:3000`，点击 **Start Audit**
2. 选择分析方式：
   - **Address** — 输入已部署的合约地址 + 选择 EVM 链
   - **Single File** — 在编辑器中粘贴 Solidity 代码
   - **Multi Files** — 上传多个 `.sol` 文件
3. 点击 **AI Configuration** 选择 Provider + Model
4. 点击 **Start Analysis**，观察双引擎实时分析过程
5. 查看审计报告，下载 Markdown 或 ZIP

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | Next.js 15 + TypeScript + Tailwind CSS |
| 代码编辑器 | Monaco Editor |
| 静态分析 | Slither (Docker 隔离运行) |
| AI 集成 | Neversight API / DashScope / OpenAI（OpenAI-compatible） |
| 区块链交互 | ethers.js v6 |
| 容器化 | Docker + docker-compose |
| Markdown 渲染 | react-markdown + marked |

---

## 项目结构

```
chainvine-main/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (with-header)/            # 带 Header 的页面
│   │   │   ├── page.tsx              # 首页
│   │   │   └── audit/page.tsx        # 审计页（主功能）
│   │   ├── (fullscreen)/             # 全屏页面
│   │   │   └── audit/source/page.tsx # 源码查看
│   │   └── api/                      # API Routes
│   │       ├── agent/audit/route.ts  # Agent API（双引擎）
│   │       ├── ai-analyze/route.ts   # 前端 AI 代理
│   │       ├── slither/route.ts      # Slither 代理
│   │       └── ...
│   ├── services/audit/               # 审计核心逻辑
│   │   ├── dualEngineAnalyzer.ts     # 双引擎编排（浏览器端）
│   │   ├── contractAnalyzer.ts       # AI 分析器
│   │   ├── findingFusion.ts          # 融合算法
│   │   ├── slitherAnalyzer.ts        # Slither 通信
│   │   └── prompts.ts               # AI 提示词
│   ├── services/llm/                 # LLM Provider 抽象层
│   ├── components/audit/             # 审计 UI 组件
│   └── utils/                        # 工具函数
├── slither-service/                  # Slither Docker 微服务
├── docs/                             # 项目文档
│   ├── PRD.md                        # 产品需求文档
│   ├── USAGE.md                      # 使用手册
│   └── STAGE_SUMMARY-v*.md           # 阶段性报告
├── docker-compose.yml                # Slither 容器编排
└── .env.example                      # 环境变量模板
```

---

## Agent API

ChainVine 提供 RESTful Agent API，供外部 AI Agent 或脚本调用。

```bash
# 同步模式
curl -X POST http://localhost:3000/api/agent/audit \
  -H "Content-Type: application/json" \
  -H "x-agent-api-key: YOUR_KEY" \
  -d '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum","provider":"dashscope","model":"qwen-flash"}'

# 流式模式
curl -X POST http://localhost:3000/api/agent/audit \
  -H "Content-Type: application/json" \
  -H "x-agent-api-key: YOUR_KEY" \
  -d '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum","provider":"dashscope","model":"qwen-flash","stream":true}'
```

接口文档：[`docs/openapi-agent-audit.yaml`](docs/openapi-agent-audit.yaml)

---

## 参考文献

| 编号 | 引用 | 用途 |
|------|------|------|
| [1] | Feist et al., "Slither: A Static Analysis Framework for Smart Contracts", WETSEB 2019 | Slither 核心论文 |
| [2] | Dietterich, T.G., "Ensemble Methods in Machine Learning", MCS 2000 | 双引擎融合算法理论基础 |
| [3] | David et al., "Do you still need a manual smart contract audit?", arXiv 2023 | LLM 合约审计可行性 |
| [4] | Chen et al., "Large Language Models for Blockchain Security: A Systematic Literature Review", arXiv 2024 | LLM+区块链安全综述 |
| [5] | Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models", ICLR 2023 | Agent API 设计理论基础 |
| [6] | Nielsen, J., "Response Time Limits", Nielsen Norman Group | 流式输出 UX 理论（10s 规则） |

---

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

© 2026 ChainVine
