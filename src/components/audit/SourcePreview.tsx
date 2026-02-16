"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-solidity";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import FileExplorer from "./FileExplorer";
import ProxyContractAlert from "./ProxyContractAlert";
import PathBreadcrumb from "./PathBreadcrumb";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Link from "next/link";
import { ChainVineLogo } from "@/components/Icons";
import ReactMarkdown from "react-markdown";
import { generateReadme } from "@/utils/readme";
import { generateConfig, formatConfig } from "@/utils/config";
import AIConfigModal from "./AIConfigModal";
import toast from "react-hot-toast";
import { analyzeContract } from "@/services/audit/contractAnalyzer";
import { analyzeDualEngine, DualEngineProgress } from "@/services/audit/dualEngineAnalyzer";
import { checkSlitherHealth } from "@/services/audit/slitherAnalyzer";
import { getExplorerUrl } from "@/utils/chainServices";
import { CHAINS } from "@/utils/constants";
import { useAIConfig, getModelName, getAIConfig } from "@/utils/ai";
import type { AIConfig } from "@/types/ai";
import html2canvas from "html2canvas";
import { marked } from "marked";

interface ContractFile {
  name: string;
  content: string;
  path: string;
}

interface SourcePreviewProps {
  files: ContractFile[];
  onAnalyze: () => void;
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  chainId?: string;
  address?: string;
  implementationAddress?: string;
  implementationInfo?: {
    contractName: string;
    compiler: string;
    optimization: boolean;
    runs: number;
    evmVersion: string;
    creationCode?: string;
    deployedBytecode?: string;
    creator?: string;
    creationTxHash?: string;
  };
  evmVersion?: string;
  tokenName?: string;
  creationCode?: string;
  deployedBytecode?: string;
  abi?: any[];
  implementationAbi?: any[];
  creator?: string;
  creationTxHash?: string;
}

// Remove duplicate markdown headers
function removeDuplicateHeaders(content: string): string {
  const lines = content.split("\n");
  const seenHeaders = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^#{1,6}\s+/)) {
      // Extract header text (without # symbols)
      const headerText = line.replace(/^#{1,6}\s+/, "").trim();
      if (!seenHeaders.has(headerText)) {
        seenHeaders.add(headerText);
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

// Add save as image function
const handleSaveAsImage = async (content: string, fileName: string) => {
  // Create a temporary div to render Markdown
  const tempDiv = document.createElement("div");
  tempDiv.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 800px;
    padding: 20px;
    background: #1A1A1A;
    color: #E5E5E5;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  document.body.appendChild(tempDiv);

  // Render Markdown content
  tempDiv.innerHTML = marked(content);

  try {
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: "#1A1A1A",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement("a");
    link.download = `${fileName.replace(".md", "")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Error generating image:", error);
    toast.error("Failed to generate image");
  } finally {
    document.body.removeChild(tempDiv);
  }
};

export default function SourcePreview({
  files: initialFiles,
  onAnalyze,
  contractName,
  compiler,
  optimization,
  runs,
  chainId,
  address,
  implementationAddress,
  implementationInfo,
  evmVersion,
  tokenName,
  creationCode,
  deployedBytecode,
  abi,
  implementationAbi,
  creator,
  creationTxHash,
}: SourcePreviewProps) {
  const [files, setFiles] = useState<ContractFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<ContractFile>(files[0]);
  const [isWrapped, setIsWrapped] = useState(true);
  const [showProxyAlert, setShowProxyAlert] = useState(false);
  const [contractType, setContractType] = useState<"proxy" | "implementation">(
    "proxy"
  );
  const [showRawReadme, setShowRawReadme] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [slitherAvailable, setSlitherAvailable] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<DualEngineProgress | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streamingText, setStreamingText] = useState("");

  const codeRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const streamingRef = useRef("");
  const streamingEndRef = useRef<HTMLDivElement>(null);

  const { config } = useAIConfig();

  // 流式文本：将 ref 同步到 state（节流，每 150ms 更新一次 UI）
  useEffect(() => {
    if (!isAnalyzing) {
      streamingRef.current = "";
      setStreamingText("");
      return;
    }
    const interval = setInterval(() => {
      if (streamingRef.current !== streamingText) {
        setStreamingText(streamingRef.current);
      }
    }, 150);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyzing]);

  // 流式文本自动滚动到底部
  useEffect(() => {
    streamingEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingText]);

  // 分析过程中每秒更新已用时间
  useEffect(() => {
    if (!isAnalyzing) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Only check once when the component mounts
  useEffect(() => {
    const shouldShowAlert =
      files.some((f) => f.path.startsWith("proxy/")) &&
      files.some((f) => f.path.startsWith("implementation/"));
    if (shouldShowAlert) {
      setShowProxyAlert(true);
    }

    // 检查 Slither 服务是否可用
    checkSlitherHealth().then((health) => {
      setSlitherAvailable(health.healthy);
      if (health.healthy) {
        console.log(`Slither service online: ${health.slither_version}`);
      }
    });
  }, []); // Empty dependency array, only run when mounted

  useEffect(() => {
    if (codeRef.current && preRef.current) {
      preRef.current.classList.add("line-numbers");
      Prism.highlightElement(codeRef.current);
      Prism.plugins.lineNumbers.resize(preRef.current);
    }
  }, [selectedFile]);

  // Build Blockscan URL
  const getBlockscanUrl = () => {
    if (!chainId || !address) return null;
    return `https://vscode.blockscan.com/${chainId}/${address}`;
  };

  // Add file tree formatting function
  const formatFileTree = (files: string[]): string => {
    const tree: { [key: string]: any } = {};

    // Build tree structure
    files.forEach((path) => {
      const parts = path.split("/");
      let current = tree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = null;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    // Recursively generate tree string
    const printTree = (node: any, prefix = "", isLast = true): string => {
      let result = "";
      const entries = Object.entries(node);

      entries.forEach(([key, value], index) => {
        const isLastEntry = index === entries.length - 1;
        const linePrefix = prefix + (isLast ? "└── " : "├── ");
        const nextPrefix = prefix + (isLast ? "    " : "│   ");

        result += linePrefix + key + "\n";

        if (value !== null) {
          result += printTree(value, nextPrefix, isLastEntry);
        }
      });

      return result;
    };

    return printTree(tree);
  };

  // Add download source code function
  const handleDownloadSource = async () => {
    const zip = new JSZip();

    // Add contract files
    files.forEach((file) => {
      zip.file(file.path, file.content);
    });

    // Add README.md
    const readmeContent = generateReadme({
      files,
      tokenName,
      proxyInfo: {
        contractName,
        compiler,
        optimization,
        runs,
        evmVersion,
        address,
        chainId,
        creationCode,
        deployedBytecode,
        creator,
        creationTxHash,
      },
      implementationInfo: implementationInfo
        ? {
            ...implementationInfo,
          }
        : undefined,
      implementationAddress,
    });

    zip.file("README.md", readmeContent);

    // Check if it's a proxy contract
    const hasProxy = files.some((f) => f.path.startsWith("proxy/"));
    const hasImplementation = files.some((f) =>
      f.path.startsWith("implementation/")
    );

    if (hasProxy && hasImplementation) {
      // Add proxy contract configuration file and ABI
      const proxyConfig = generateConfig({
        contractName,
        compiler,
        optimization,
        runs,
        evmVersion,
        creationCode,
        deployedBytecode,
      });
      zip.file("proxy/config.json", formatConfig(proxyConfig));
      zip.file("proxy/abi.json", JSON.stringify(abi || [], null, 2));

      // Add implementation contract configuration file and ABI
      const implConfig = generateConfig({
        contractName: implementationInfo?.contractName || "",
        compiler: implementationInfo?.compiler || "",
        optimization: implementationInfo?.optimization || false,
        runs: implementationInfo?.runs || 200,
        evmVersion: implementationInfo?.evmVersion,
        creationCode: implementationInfo?.creationCode,
        deployedBytecode: implementationInfo?.deployedBytecode,
      });
      zip.file("implementation/config.json", formatConfig(implConfig));
      zip.file(
        "implementation/abi.json",
        JSON.stringify(implementationAbi || [], null, 2)
      );
    } else {
      // Non-proxy contract, only add one configuration file and ABI
      const config = generateConfig({
        contractName,
        compiler,
        optimization,
        runs,
        evmVersion,
        creationCode,
        deployedBytecode,
      });
      zip.file("config.json", formatConfig(config));
      zip.file("abi.json", JSON.stringify(abi || [], null, 2));
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const fileName = `${
        tokenName || implementationInfo?.contractName || contractName
      }-source.zip`;
      saveAs(content, fileName);
    } catch (error) {
      console.error("Error creating zip file:", error);
    }
  };

  const handleViewImplementation = () => {
    setContractType("implementation");
    const implFile = files.find((f) => f.path.startsWith("implementation/"));
    if (implFile) {
      setSelectedFile(implFile);
    }
  };

  // Handle start analysis button click
  const handleAnalyzeClick = () => {
    setShowAIConfig(true);
  };

  // Handle analysis after AI configuration is complete
  const handleStartAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setShowAIConfig(false);
      setAnalysisProgress(null);
      const controller = new AbortController();
      setAbortController(controller);

      // 检查 Slither 是否可用，决定使用哪种分析模式
      const currentConfig = getAIConfig(config);

      // Check if it's a proxy contract
      const isProxy =
        files.some((f) => f.path.startsWith("proxy/")) &&
        files.some((f) => f.path.startsWith("implementation/"));

      // Determine report file name based on contract type
      const reportContractName = isProxy
        ? tokenName || implementationInfo?.contractName || contractName
        : contractName;

      let analysisContent: string;

      // StreamAI: 拦截 ai-chunk 事件，累积流式文本
      const handleProgress = (progress: DualEngineProgress) => {
        if (progress.stage === "ai-chunk" && progress.aiChunk) {
          streamingRef.current += progress.aiChunk;
          return; // 不更新 analysisProgress state（由节流 interval 更新 streamingText）
        }
        setAnalysisProgress(progress);
      };

      if (slitherAvailable) {
        // ═══ 双引擎模式 ═══
        const dualResult = await analyzeDualEngine(
          files,
          currentConfig,
          reportContractName,
          handleProgress,
          controller.signal,
        );
        analysisContent = dualResult.mergedReport;

        const engines = dualResult.metadata.enginesUsed.join(" + ");
        toast.success(`双引擎分析完成 (${engines})`, { duration: 5000 });
      } else {
        // ═══ 仅 AI 模式（回退） ═══
        setAnalysisProgress({
          stage: "ai",
          message: "AI 引擎分析中（Slither 不可用）...",
          slitherDone: true,
          aiDone: false,
          percent: 30,
        });

        const result = await analyzeContract({
          files,
          contractName: reportContractName,
          chain: chainId,
          signal: controller.signal,
          onChunk: (chunk) => { streamingRef.current += chunk; },
        });
        analysisContent = result.report.analysis;
        toast.success("AI 分析完成");
      }

      // Check if there's a main title, if not add it
      if (!analysisContent.match(/^#\s+/m)) {
        analysisContent = `# Smart Contract Security Analysis Report\n\n${analysisContent}`;
      }

      // Remove duplicate titles
      analysisContent = removeDuplicateHeaders(analysisContent);

      // Create report.md file with contract name
      let languageCfg = currentConfig.language;
      if (languageCfg === "english") {
        languageCfg = "";
      } else {
        languageCfg = `-${languageCfg}`;
      }

      let withSuperPrompt = currentConfig.superPrompt
        ? "-SuperPrompt"
        : "";

      const engineSuffix = slitherAvailable ? "-dual" : "";

      const reportFileName = `report-${reportContractName.toLowerCase()}-${getModelName(
        currentConfig
      )}${languageCfg}${withSuperPrompt}${engineSuffix}.md`;
      const reportFile: ContractFile = {
        name: reportFileName,
        path: reportFileName,
        content: analysisContent,
      };

      setFiles((prevFiles) => {
        // Delete old reports for the same model
        const filesWithoutCurrentModelReport = prevFiles.filter(
          (f) => f.path !== reportFileName
        );

        // Append new report file
        return [...filesWithoutCurrentModelReport, reportFile];
      });

      // Display new report
      setSelectedFile(reportFile);
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === "AbortError" || error.message === "Analysis cancelled")) {
        toast.success("Analysis cancelled");
      } else if (error instanceof Error && error.message.includes("402")) {
        // 余额不足 — 给出明确的用户提示
        toast.error("Neversight API 余额不足，请充值后重试", { duration: 8000 });
      } else if (error instanceof Error && (error.message.includes("401") || error.message.includes("403"))) {
        toast.error("Neversight API Key 无效或已过期，请在 AI Configuration 中检查", { duration: 8000 });
      } else {
        console.error("Error in analysis:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        toast.error(`分析出错: ${msg.substring(0, 100)}`, { duration: 6000 });
      }
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
      setAnalysisProgress(null);
    }
  };

  // Add cancel analysis function
  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  return (
    <div className="fixed inset-0 bg-card">
      <div className="absolute top-0 left-0 right-0 h-14 bg-secondary border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChainVineLogo size={28} className="text-accent" />
            <span className="text-xl font-bold text-foreground">
              Chain<span className="text-accent">Vine</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {getBlockscanUrl() && (
            <a
              href={getBlockscanUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-2 px-4 py-1.5
                       bg-secondary rounded-lg text-foreground/80 text-sm
                       border border-border
                       transition-all duration-300
                       hover:bg-card-hover hover:border-muted/40"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Blockscan
            </a>
          )}
          <button
            onClick={handleDownloadSource}
            className="group relative inline-flex items-center gap-2 px-4 py-1.5
                     bg-secondary rounded-lg text-foreground/80 text-sm
                     border border-border
                     transition-all duration-300
                     hover:bg-card-hover hover:border-muted/40"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Source
          </button>
          {/* Slither 状态指示器 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                         ${slitherAvailable 
                           ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                           : "bg-border text-muted/70 border border-border"}`}>
            <div className={`w-2 h-2 rounded-full ${slitherAvailable ? "bg-green-400" : "bg-muted/50"}`} />
            Slither {slitherAvailable ? "Online" : "Offline"}
          </div>
          <button
            onClick={handleAnalyzeClick}
            className="group relative inline-flex items-center gap-2 px-8 py-1.5
                     bg-secondary rounded-lg text-accent text-sm font-medium
                     border border-accent/20
                     transition-all duration-300 ease-out
                     hover:bg-accent/10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="relative z-10">
              {slitherAvailable ? "Dual Engine Analysis" : "Start Analysis"}
            </span>
          </button>
        </div>
      </div>

      <div className="absolute top-14 bottom-0 left-0 right-0 flex">
        <FileExplorer
          files={files}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
          showImplementation={contractType === "implementation"}
          contractType={contractType}
          onContractTypeChange={setContractType}
          isWrapped={isWrapped}
          onWrapChange={setIsWrapped}
          contractName={contractName}
          compiler={compiler}
          optimization={optimization}
          runs={runs}
          chainId={chainId}
          address={address}
          implementationAddress={implementationAddress}
          implementationInfo={implementationInfo}
          evmVersion={evmVersion}
          tokenName={tokenName}
          creationCode={creationCode}
          deployedBytecode={deployedBytecode}
          abi={abi}
          implementationAbi={implementationAbi}
          creator={creator}
          creationTxHash={creationTxHash}
        />

        <div className="flex-1 flex flex-col bg-card min-w-0">
          <div className="px-4 py-2 bg-secondary border-b border-border text-foreground/80 text-sm flex items-center justify-between">
            <PathBreadcrumb path={selectedFile.path} />
            <div className="flex items-center gap-2">
              {selectedFile.path.endsWith(".md") && (
                <>
                  {!showRawReadme && (
                    <button
                      onClick={() =>
                        handleSaveAsImage(
                          selectedFile.content,
                          selectedFile.name
                        )
                      }
                      className="px-3 py-1 hover:bg-border text-muted text-xs rounded-md transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Save as Image
                    </button>
                  )}
                  <button
                    onClick={() => setShowRawReadme(!showRawReadme)}
                    className="px-3 py-1 hover:bg-border text-muted text-xs rounded-md transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {showRawReadme ? (
                        // Review icon - for View Rendered
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      ) : (
                        // Code icon - for View Raw
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      )}
                    </svg>
                    {showRawReadme ? "View Rendered" : "View Raw"}
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  navigator.clipboard.writeText(selectedFile.content)
                }
                className="px-3 py-1 hover:bg-border text-muted text-xs rounded-md transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                Copy
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {selectedFile.path.endsWith(".md") ? (
              <div className="relative">
                {showRawReadme ? (
                  <pre className="p-4 text-foreground/80 text-sm font-mono whitespace-pre-wrap">
                    {selectedFile.content}
                  </pre>
                ) : (
                  <div
                    className="p-4 prose prose-invert max-w-none
                                prose-headings:text-foreground 
                                prose-h1:text-3xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-border
                                prose-h2:text-xl prose-h2:text-accent prose-h2:mt-8 prose-h2:mb-4
                                prose-p:text-foreground/80
                                prose-li:text-foreground/80
                                prose-strong:text-[#4EC9B0]
                                prose-code:text-[#CE9178] prose-code:bg-card
                                [&_ul]:my-0 [&_ul]:pl-4
                                [&_li]:my-1
                                [&_pre]:bg-secondary
                                [&_pre]:border [&_pre]:border-border
                                [&_pre]:rounded-md
                                [&_pre]:shadow-sm"
                  >
                    <ReactMarkdown>{selectedFile.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : selectedFile.path.endsWith("config.json") ||
              selectedFile.path.endsWith("abi.json") ? (
              <pre className="p-4 text-foreground/80 text-sm font-mono whitespace-pre">
                {selectedFile.content}
              </pre>
            ) : (
              <pre
                ref={preRef}
                className={`w-full h-full bg-card language-solidity line-numbers
                  ${
                    isWrapped
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre"
                  }`}
                style={{ margin: 0 }}
              >
                <code
                  ref={codeRef}
                  className={`language-solidity text-sm font-mono ${
                    isWrapped ? "break-all" : ""
                  }`}
                >
                  {selectedFile.content}
                </code>
              </pre>
            )}
          </div>
        </div>
      </div>

      <ProxyContractAlert
        isOpen={showProxyAlert}
        onClose={() => setShowProxyAlert(false)}
        onViewImplementation={handleViewImplementation}
      />

      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
        onStartAnalysis={handleStartAnalysis}
      />

      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`bg-card rounded-lg p-6 flex flex-col items-center ${
            streamingText ? "w-[720px] max-h-[85vh]" : "min-w-[400px]"
          }`}>
            {/* 顶部：Spinner + 标题 + 计时 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div
                  className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 
                              rounded-full animate-spin"
                />
                <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
                  <ChainVineLogo size={28} className="text-accent animate-bounce-slow" />
                </div>
              </div>
              <div>
                <p className="text-foreground text-lg font-medium">
                  {slitherAvailable ? "Dual-Engine Analysis" : "AI Analysis"}
                </p>
                <p className="text-accent text-sm font-mono">
                  {Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
                  {elapsedSeconds > 10 && elapsedSeconds < 120 && (
                    <span className="text-muted/70 ml-2 text-xs">typically 1-3 min</span>
                  )}
                  {elapsedSeconds >= 120 && (
                    <span className="text-yellow-500 ml-2 text-xs">Large contract...</span>
                  )}
                </p>
              </div>
            </div>

            {/* 双引擎进度指示器 */}
            {analysisProgress && (
              <div className="w-full mb-3">
                <div className="w-full bg-border rounded-full h-1.5 mb-2">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${analysisProgress.percent || 0}%` }}
                  />
                </div>

                {slitherAvailable && (
                  <div className="flex justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        analysisProgress.slitherDone ? "bg-green-400" : "bg-accent animate-pulse"
                      }`} />
                      <span className={analysisProgress.slitherDone ? "text-green-400" : "text-muted"}>
                        Slither {analysisProgress.slitherDone ? "✓" : "..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        analysisProgress.aiDone ? "bg-green-400" 
                          : analysisProgress.stage === "ai" || streamingText ? "bg-accent animate-pulse" 
                          : "bg-muted/30"
                      }`} />
                      <span className={analysisProgress.aiDone ? "text-green-400" : "text-muted"}>
                        AI {analysisProgress.aiDone ? "✓" : streamingText ? "streaming..." : analysisProgress.stage === "ai" ? "..." : "waiting"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        analysisProgress.stage === "done" ? "bg-green-400" 
                          : analysisProgress.stage === "merging" ? "bg-accent animate-pulse" 
                          : "bg-muted/30"
                      }`} />
                      <span className={analysisProgress.stage === "done" ? "text-green-400" : "text-muted"}>
                        Fusion {analysisProgress.stage === "done" ? "✓" : analysisProgress.stage === "merging" ? "..." : "waiting"}
                      </span>
                    </div>
                  </div>
                )}

                {analysisProgress.message && analysisProgress.stage !== "ai-chunk" && (
                  <p className="text-muted text-xs text-center">
                    {analysisProgress.message}
                  </p>
                )}

                {analysisProgress.stage === "error" && (
                  <p className="text-red-400 text-sm text-center mt-1 font-medium">
                    {analysisProgress.message}
                  </p>
                )}
              </div>
            )}

            {!analysisProgress && (
              <p className="text-muted text-sm mb-3">
                Initializing engines...
              </p>
            )}

            {/* ── StreamAI 实时文本展示 ── */}
            {streamingText && (
              <div className="w-full flex-1 min-h-0 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-accent font-medium">AI Output (streaming)</span>
                  <span className="text-xs text-muted font-mono">
                    {streamingText.length.toLocaleString()} chars
                  </span>
                </div>
                <div className="w-full max-h-[45vh] overflow-y-auto bg-background border border-border rounded-lg p-3 text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <div ref={streamingEndRef} />
                </div>
              </div>
            )}

            <button
              onClick={handleCancelAnalysis}
              className="px-4 py-2 bg-secondary text-accent rounded-md 
                       border border-accent/20
                       hover:bg-accent/10 transition-colors
                       font-medium text-sm"
            >
              Cancel Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
