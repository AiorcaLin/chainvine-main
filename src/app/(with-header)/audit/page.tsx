"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { checkContractOnChains } from "@/utils/blockchain";
import { getRpcUrl } from "@/utils/chainServices";
import type { ChainContractInfo, ContractFile } from "@/types/blockchain";
import ContractInfoCard from "@/components/audit/ContractInfoCard";
import Link from "next/link";
import { ChainVineLogo } from "@/components/Icons";
import {
  FileIcon,
  FilesIcon,
  WalletIcon,
  SecurityIcon,
  SecurityAnalysisIcon,
  MultiChainIcon,
  CodeIcon,
  AIIcon,
} from "@/components/Icons";
import Editor from "@monaco-editor/react";
import AIConfigModal from "@/components/audit/AIConfigModal";
import { analyzeContract } from "@/services/audit/contractAnalyzer";
import { analyzeDualEngine, DualEngineProgress, DualEngineResult } from "@/services/audit/dualEngineAnalyzer";
import { checkSlitherHealth } from "@/services/audit/slitherAnalyzer";
import { useAIConfig, getModelName, getAIConfig } from "@/utils/ai";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  findMainContract,
  mergeContractContents,
} from "@/utils/contractFilters";

type TabType = "address" | "single-file" | "multi-files";

export default function AuditPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [chainInfo, setChainInfo] = useState<ChainContractInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("address");
  const [isAIConfigModalOpen, setIsAIConfigModalOpen] = useState(false);
  const [contractCode, setContractCode] = useState("");
  const [analysisFiles, setAnalysisFiles] = useState<ContractFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { config } = useAIConfig();
  const [editorContent, setEditorContent] =
    useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultLogic {
    address public owner; // slot 0
    bytes32 private password; // slot 1

    constructor(bytes32 _password) public {
        owner = msg.sender;
        password = _password;
    }

    function changeOwner(bytes32 _password, address newOwner) public {
        if (password == _password) {
            owner = newOwner;
        } else {
            revert("password error");
        }
    }
}

contract Vault {
    address public owner; // slot 0
    VaultLogic logic; // slot 1
    mapping(address => uint256) deposites; // slot 2
    bool public canWithdraw = false; // slot 3

    constructor(address _logicAddress) public {
        logic = VaultLogic(_logicAddress);
        owner = msg.sender;
    }

    fallback() external {
        (bool result,) = address(logic).delegatecall(msg.data);
        if (result) {
            this;
        }
    }

    receive() external payable { }

    function deposite() public payable {
        deposites[msg.sender] += msg.value;
    }

    function isSolve() external view returns (bool) {
        if (address(this).balance == 0) {
            return true;
        }
    }

    function openWithdraw() external {
        if (owner == msg.sender) {
            canWithdraw = true;
        } else {
            revert("not owner");
        }
    }

    function withdraw() public {
        if (canWithdraw && deposites[msg.sender] >= 0) {
            (bool result,) = msg.sender.call{ value: deposites[msg.sender] }("");
            if (result) {
                deposites[msg.sender] = 0;
            }
        }
    }
}`);

  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ContractFile[]>([]);
  const [dualEngineProgress, setDualEngineProgress] = useState<DualEngineProgress | null>(null);
  const [lastDualResult, setLastDualResult] = useState<DualEngineResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streamingText, setStreamingText] = useState("");
  const streamingRef = useRef("");
  const streamingEndRef = useRef<HTMLDivElement>(null);

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

  // 流式文本自动滚动
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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();

    if (value && !value.startsWith("0x")) {
      value = "0x" + value;
    }

    setAddress(value);
  };

  const handleCheck = async () => {
    let formattedAddress = address.trim();
    if (formattedAddress && !formattedAddress.startsWith("0x")) {
      formattedAddress = "0x" + formattedAddress;
    }

    if (!ethers.isAddress(formattedAddress)) {
      toast.error("Invalid contract address");
      return;
    }

    try {
      setLoading(true);
      setChainInfo(null);
      const info = await checkContractOnChains(formattedAddress);
      setChainInfo(info);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch contract information");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    try {
      if (!editorContent.trim()) {
        toast.error("Please enter contract code");
        return;
      }

      setIsAnalyzing(true);
      setIsAIConfigModalOpen(false);
      setDualEngineProgress(null);
      setLastDualResult(null);

      const controller = new AbortController();
      setAbortController(controller);

      const contractFile = {
        name: "Contract.sol",
        path: "Contract.sol",
        content: editorContent,
      };

      const currentConfig = getAIConfig(config);
      let languageCfg = currentConfig.language;
      languageCfg = languageCfg === "english" ? "" : `-${languageCfg}`;
      const withSuperPrompt = currentConfig.superPrompt ? "-SuperPrompt" : "";

      // --- Dual Engine: Slither + AI in parallel (with StreamAI) ---
      const handleProgress = (progress: DualEngineProgress) => {
        if (progress.stage === "ai-chunk" && progress.aiChunk) {
          streamingRef.current += progress.aiChunk;
          return;
        }
        setDualEngineProgress(progress);
      };

      const dualResult = await analyzeDualEngine(
        [contractFile],
        currentConfig,
        "Contract",
        handleProgress,
        controller.signal,
      );

      setLastDualResult(dualResult);

      const reportFileName = `report-dual-${getModelName(currentConfig)}${languageCfg}${withSuperPrompt}.md`;

      const reportFile = {
        name: reportFileName,
        path: reportFileName,
        content: dualResult.mergedReport,
      };

      setAnalysisFiles((prev) => {
        const filtered = prev.filter((f) => f.path !== reportFileName);
        return [...filtered, reportFile];
      });

      const engines = dualResult.metadata.enginesUsed;
      toast.success(`Dual-engine analysis done (${engines.join(" + ")}), ${dualResult.metadata.totalDurationMs}ms`);
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === "AbortError" || error.message === "Analysis cancelled")) {
        toast.success("Analysis cancelled");
      } else if (error instanceof Error && error.message.includes("402")) {
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
      setDualEngineProgress(null);
    }
  };

  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleViewReport = (content: string, fileName: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #1A1A1A;
                color: #E5E5E5;
              }
              h1 {
                color: #E5E5E5;
                border-bottom: 1px solid #333;
                padding-bottom: 0.5em;
              }
              h2 {
                color: #059669;
                margin-top: 1.5em;
              }
              pre {
                background: #252526;
                padding: 16px;
                border-radius: 4px;
                overflow-x: auto;
                border: 1px solid #333;
              }
              code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.9em;
              }
              p {
                margin: 1em 0;
              }
              ul, ol {
                padding-left: 2em;
              }
              a {
                color: #059669;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              blockquote {
                border-left: 4px solid #059669;
                margin: 1em 0;
                padding-left: 1em;
                color: #CCCCCC;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
              }
              th, td {
                border: 1px solid #333;
                padding: 8px;
                text-align: left;
              }
              th {
                background: #252526;
              }
            </style>
          </head>
          <body>
            <div id="content"></div>
            <button id="saveAsImage" style="
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 8px 16px;
              background: #252526;
              color: #059669;
              border: 1px solid rgba(5,150,105,0.2);
              border-radius: 6px;
              cursor: pointer;
              font-family: system-ui;
              transition: all 0.2s;
            ">Save as Image</button>
            <script>
              document.getElementById('content').innerHTML = marked.parse(\`${content.replace(
                /`/g,
                "\\`"
              )}\`);
              
              document.getElementById('saveAsImage').addEventListener('click', async () => {
                const content = document.getElementById('content');
                try {
                  const canvas = await html2canvas(content, {
                    backgroundColor: '#1A1A1A',
                    scale: 2,
                    useCORS: true,
                    logging: false
                  });
                  
                  const link = document.createElement('a');
                  link.download = '${fileName.replace(".md", "")}.png';
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                } catch (error) {
                  console.error('Error generating image:', error);
                }
              });
            </script>
          </body>
        </html>
      `);
    }
  };

  const handleDownloadReport = (file: ContractFile) => {
    const blob = new Blob([file.content], { type: "text/markdown" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (analysisFiles.length === 0) return;
    const zip = new JSZip();
    for (const file of analysisFiles) {
      zip.file(file.name, file.content);
    }
    // Include Slither raw JSON if available
    if (lastDualResult?.slitherResult) {
      zip.file("slither-raw.json", JSON.stringify(lastDualResult.slitherResult, null, 2));
    }
    // Include fusion metadata
    if (lastDualResult?.fusionResult) {
      zip.file("fusion-summary.json", JSON.stringify({
        summary: lastDualResult.fusionResult.summary,
        metadata: lastDualResult.fusionResult.metadata,
        engineMetadata: lastDualResult.metadata,
      }, null, 2));
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `chainvine-report-${new Date().toISOString().slice(0, 10)}.zip`);
    toast.success("ZIP report downloaded");
  };

  const handleRemoveFile = (path: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.path !== path));
    // Reset analysis files when removing a file
    setAnalysisFiles([]);
    // Reset analyzing state and abort controller if needed
    if (isAnalyzing) {
      if (abortController) {
        abortController.abort();
      }
      setIsAnalyzing(false);
      setAbortController(null);
    }
    // Close AI config modal if open
    setIsAIConfigModalOpen(false);
  };

  const handleMultiFileAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload contract files first");
      return;
    }

    try {
      setIsAnalyzing(true);
      setIsAIConfigModalOpen(false);
      setDualEngineProgress(null);
      setLastDualResult(null);

      const controller = new AbortController();
      setAbortController(controller);

      const contractName =
        findMainContract(uploadedFiles, false)?.name.replace(".sol", "") ||
        "MultiContract";
      const currentConfig = getAIConfig(config);

      // --- Dual Engine: Slither + AI in parallel (with StreamAI) ---
      const handleMultiProgress = (progress: DualEngineProgress) => {
        if (progress.stage === "ai-chunk" && progress.aiChunk) {
          streamingRef.current += progress.aiChunk;
          return;
        }
        setDualEngineProgress(progress);
      };

      const dualResult = await analyzeDualEngine(
        uploadedFiles,
        currentConfig,
        contractName,
        handleMultiProgress,
        controller.signal,
      );

      setLastDualResult(dualResult);

      let languageCfg = currentConfig.language;
      languageCfg = languageCfg === "english" ? "" : `-${languageCfg}`;
      const withSuperPrompt = currentConfig.superPrompt ? "-SuperPrompt" : "";

      const reportFileName = `report-dual-${getModelName(currentConfig)}${languageCfg}${withSuperPrompt}.md`;

      const reportFile = {
        name: reportFileName,
        path: reportFileName,
        content: dualResult.mergedReport,
      };

      setAnalysisFiles((prev) => {
        const filtered = prev.filter((f) => f.path !== reportFileName);
        return [...filtered, reportFile];
      });

      const engines = dualResult.metadata.enginesUsed;
      toast.success(`Dual-engine analysis done (${engines.join(" + ")}), ${dualResult.metadata.totalDurationMs}ms`);
    } catch (error) {
      if (error instanceof Error && (error.name === "AbortError" || error.message === "Analysis cancelled")) {
        toast.success("Analysis cancelled");
      } else if (error instanceof Error && error.message.includes("402")) {
        toast.error("Neversight API 余额不足，请充值后重试", { duration: 8000 });
      } else if (error instanceof Error && (error.message.includes("401") || error.message.includes("403"))) {
        toast.error("Neversight API Key 无效或已过期，请在 AI Configuration 中检查", { duration: 8000 });
      } else {
        console.error("Analysis failed:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        toast.error(`分析出错: ${msg.substring(0, 100)}`, { duration: 6000 });
      }
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
      setDualEngineProgress(null);
    }
  };

  const handleRemoveReport = (path: string) => {
    setAnalysisFiles((prev) => prev.filter((file) => file.path !== path));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    try {
      // Reset analysis states
      setAnalysisFiles([]);
      setIsAnalyzing(false);
      setIsAIConfigModalOpen(false);
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }

      // Reset input value so the same file can be selected again
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      const contractFiles: ContractFile[] = await Promise.all(
        files.map(async (file) => {
          const content = await file.text();
          return {
            name: file.name,
            path: file.name,
            content: content,
          };
        })
      );
      
      // Update file list, overwrite existing files with the same name
      setUploadedFiles(prevFiles => {
        const newFiles = [...prevFiles];
        
        contractFiles.forEach(newFile => {
          const existingIndex = newFiles.findIndex(f => f.name === newFile.name);
          if (existingIndex !== -1) {
            // If file exists, replace it
            newFiles[existingIndex] = newFile;
          } else {
            // If file doesn't exist, add it
            newFiles.push(newFile);
          }
        });
        
        return newFiles;
      });

      toast.success(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-20 right-4 text-muted text-sm">
        The ticker is ETH
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Smart Contract <span className="text-accent">Security</span>
          </h1>
          <p className="text-muted text-lg">
            Powered by AI, securing your blockchain future with real-time
            analysis
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <p className="text-muted text-center mb-6">
            Choose your preferred method to analyze smart contracts
          </p>

          <div className="bg-gradient-to-r from-card via-secondary to-card p-1 rounded-xl">
            <div className="bg-background/60 rounded-lg p-1 flex gap-1">
              {[
                {
                  id: "address",
                  label: "Address",
                  icon: WalletIcon,
                  desc: "Analyze deployed contracts",
                },
                {
                  id: "single-file",
                  label: "Single File",
                  icon: FileIcon,
                  desc: "Audit a single contract file",
                },
                {
                  id: "multi-files",
                  label: "Multi Files",
                  icon: FilesIcon,
                  desc: "Analyze multiple contract files",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex-1 py-3 px-4 rounded-lg
                    transition-all duration-300 ease-out
                    group hover:bg-secondary
                    ${
                      activeTab === tab.id
                        ? "bg-secondary shadow-lg"
                        : "hover:bg-secondary/50"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <tab.icon
                      className={`w-6 h-6 transition-colors duration-300
                        ${
                          activeTab === tab.id
                            ? "text-accent"
                            : "text-muted group-hover:text-foreground/80"
                        }`}
                    />
                    <span
                      className={`font-medium transition-colors duration-300
                      ${
                        activeTab === tab.id
                          ? "text-accent"
                          : "text-muted group-hover:text-foreground/80"
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span className="text-xs text-muted/70 group-hover:text-muted">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-secondary to-card rounded-xl p-8 mb-8 border border-border/50 relative overflow-hidden
            before:absolute before:inset-0 before:p-[1px] before:-m-[1px] before:bg-gradient-to-r before:from-accent/0 before:via-accent/20 before:to-accent/0 before:rounded-xl before:-z-10
            after:absolute after:inset-0 after:p-[1px] after:-m-[1px] after:bg-gradient-to-b after:from-white/10 after:via-white/0 after:to-white/5 after:rounded-xl after:-z-10"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0" />

          <div className="mb-6">
            <h2 className="text-2xl font-medium text-foreground mb-2">
              {activeTab === "address" && "Enter Contract Address"}
              {activeTab === "single-file" && "Upload Contract File"}
              {activeTab === "multi-files" && "Upload Contract Files"}
            </h2>
            <p className="text-muted">
              {activeTab === "address" &&
                "Enter the deployed contract address to start analysis"}
              {activeTab === "single-file" &&
                "Upload a single Solidity contract file (.sol)"}
              {activeTab === "multi-files" &&
                "Upload multiple related contract files"}
            </p>
          </div>

          {activeTab === "address" && (
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter contract address (0x...)"
                className="flex-1 h-11 bg-background border border-border rounded-lg px-4
                         text-foreground placeholder-muted/70 
                         focus:outline-none focus:border-muted/40
                         hover:border-border
                         focus:ring-1 focus:ring-muted/40
                         transition-[border,box-shadow]
                         duration-200 ease-in-out text-base"
              />
              <button
                onClick={handleCheck}
                disabled={loading}
                className="h-11 inline-flex items-center gap-2 px-5
                         bg-card text-accent text-base font-normal
                         border border-border rounded-lg
                         transition-all duration-300
                         hover:bg-accent/10 hover:border-accent/50
                         whitespace-nowrap
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Check Contract</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "single-file" && (
            <div className="flex flex-col gap-3">
              <Editor
                height="400px"
                defaultLanguage="sol"
                theme="vs-dark"
                value={editorContent}
                onChange={(value) => {
                  const newContent = value || "";
                  if (newContent !== contractCode) {
                    setAnalysisFiles([]);
                  }
                  setEditorContent(newContent);
                  setContractCode(newContent);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  roundedSelection: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />

              {/* Dual-engine metadata badge */}
              {lastDualResult && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {lastDualResult.metadata.enginesUsed.map((e) => (
                    <span key={e} className="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                      {e}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-1 rounded bg-border text-muted">
                    {lastDualResult.metadata.totalDurationMs}ms
                  </span>
                  {lastDualResult.fusionResult && (
                    <>
                      <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        {lastDualResult.fusionResult.summary.bySeverity.Critical + lastDualResult.fusionResult.summary.bySeverity.High} High+
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        {lastDualResult.fusionResult.summary.bySeverity.Medium} Med
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {lastDualResult.fusionResult.summary.bySource.both} Cross-validated
                      </span>
                    </>
                  )}
                </div>
              )}

              {analysisFiles.length > 0 && (
                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-foreground/80 text-sm font-medium">
                      Analysis Reports:
                    </h3>
                    <button
                      onClick={handleDownloadZip}
                      className="text-accent text-xs hover:text-accent/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/10 transition-colors duration-150 border border-accent/20"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download ZIP
                    </button>
                  </div>
                  <div className="space-y-2">
                    {analysisFiles.map((file) => (
                      <div
                        key={file.path}
                        className="bg-secondary p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/80 text-sm">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleViewReport(file.content, file.name)
                              }
                              className="text-muted text-sm hover:text-foreground/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-border transition-colors duration-150"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadReport(file)}
                              className="text-muted text-sm hover:text-foreground/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-border transition-colors duration-150"
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
                              MD
                            </button>
                            <button
                              onClick={() => handleRemoveReport(file.path)}
                              className="text-muted hover:text-red-400 p-1 rounded hover:bg-border transition-colors duration-150"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsAIConfigModalOpen(true)}
                className="self-end h-11 inline-flex items-center gap-2 px-5
                         bg-card text-accent text-base font-normal
                         border border-border rounded-lg
                         transition-all duration-300
                         hover:bg-accent/10 hover:border-accent/50
                         whitespace-nowrap"
              >
                <span>Analyze Contract</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <AIConfigModal
                isOpen={isAIConfigModalOpen}
                onClose={() => setIsAIConfigModalOpen(false)}
                onStartAnalysis={handleStartAnalysis}
              />

              {isAnalyzing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className={`bg-card rounded-lg p-6 flex flex-col items-center ${streamingText ? "w-[720px] max-h-[85vh]" : "min-w-[400px]"}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 rounded-full animate-spin" />
                        <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
                          <ChainVineLogo size={28} className="text-accent animate-bounce-slow" />
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground text-lg font-medium">Dual-Engine Analysis</p>
                        <p className="text-accent text-sm font-mono">
                          {Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
                          {elapsedSeconds > 10 && elapsedSeconds < 120 && <span className="text-muted/70 ml-2 text-xs">typically 1-3 min</span>}
                          {elapsedSeconds >= 120 && <span className="text-yellow-500 ml-2 text-xs">Large contract...</span>}
                        </p>
                      </div>
                    </div>
                    {dualEngineProgress && (
                      <div className="w-full mb-3">
                        <div className="w-full bg-border rounded-full h-1.5 mb-2">
                          <div className="bg-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${dualEngineProgress.percent || 0}%` }} />
                        </div>
                        <div className="flex justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dualEngineProgress.slitherDone ? "bg-green-400" : "bg-accent animate-pulse"}`} />
                            <span className={dualEngineProgress.slitherDone ? "text-green-400" : "text-muted"}>Slither {dualEngineProgress.slitherDone ? "✓" : "..."}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dualEngineProgress.aiDone ? "bg-green-400" : streamingText ? "bg-accent animate-pulse" : dualEngineProgress.stage === "ai" ? "bg-accent animate-pulse" : "bg-muted/30"}`} />
                            <span className={dualEngineProgress.aiDone ? "text-green-400" : "text-muted"}>AI {dualEngineProgress.aiDone ? "✓" : streamingText ? "streaming..." : dualEngineProgress.stage === "ai" ? "..." : "waiting"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dualEngineProgress.stage === "done" ? "bg-green-400" : dualEngineProgress.stage === "merging" ? "bg-accent animate-pulse" : "bg-muted/30"}`} />
                            <span className={dualEngineProgress.stage === "done" ? "text-green-400" : "text-muted"}>Fusion {dualEngineProgress.stage === "done" ? "✓" : dualEngineProgress.stage === "merging" ? "..." : "waiting"}</span>
                          </div>
                        </div>
                        {dualEngineProgress.message && dualEngineProgress.stage !== "ai-chunk" && <p className="text-muted text-xs text-center">{dualEngineProgress.message}</p>}
                        {dualEngineProgress.stage === "error" && <p className="text-red-400 text-sm text-center mt-1 font-medium">{dualEngineProgress.message}</p>}
                      </div>
                    )}
                    {!dualEngineProgress && <p className="text-muted text-sm mb-3">Initializing engines...</p>}
                    {streamingText && (
                      <div className="w-full flex-1 min-h-0 mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-accent font-medium">AI Output (streaming)</span>
                          <span className="text-xs text-muted font-mono">{streamingText.length.toLocaleString()} chars</span>
                        </div>
                        <div className="w-full max-h-[45vh] overflow-y-auto bg-background border border-border rounded-lg p-3 text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                          {streamingText}
                          <div ref={streamingEndRef} />
                        </div>
                      </div>
                    )}
                    <button onClick={handleCancelAnalysis} className="px-4 py-2 bg-secondary text-accent rounded-md border border-accent/20 hover:bg-accent/10 transition-colors font-medium text-sm">Cancel Analysis</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "multi-files" && (
            <div className="flex flex-col gap-4">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border border-dashed border-border rounded-lg p-8 bg-background hover:border-muted/40 transition-colors duration-200"
              >
                <div className="flex flex-col items-center gap-3">
                  <FilesIcon className="w-12 h-12 text-muted/70" />
                  <div className="text-center">
                    <p className="text-foreground/80 mb-1">
                      Drag and drop contract files here
                    </p>
                    <p className="text-muted/70 text-sm">or</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".sol"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <span
                      className="h-9 inline-flex items-center gap-2 px-4
                      bg-card text-accent text-sm font-normal
                      border border-border rounded-lg
                      transition-all duration-300
                      hover:bg-accent/10 hover:border-accent/50
                      cursor-pointer"
                    >
                      Browse files
                    </span>
                  </label>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted">Selected files:</div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-muted" />
                          <span className="text-foreground/80 text-sm">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(file.path)}
                          className="text-muted/70 hover:text-foreground/80"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <>
                  <button
                    onClick={() => setIsAIConfigModalOpen(true)}
                    className="self-end h-11 inline-flex items-center gap-2 px-5
                             bg-card text-accent text-base font-normal
                             border border-border rounded-lg
                             transition-all duration-300
                             hover:bg-accent/10 hover:border-accent/50
                             whitespace-nowrap"
                  >
                    <span>Analyze Contract</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* Dual-engine metadata badge (multi-file) */}
                  {lastDualResult && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lastDualResult.metadata.enginesUsed.map((e) => (
                        <span key={e} className="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                          {e}
                        </span>
                      ))}
                      <span className="text-xs px-2 py-1 rounded bg-border text-muted">
                        {lastDualResult.metadata.totalDurationMs}ms
                      </span>
                      {lastDualResult.fusionResult && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {lastDualResult.fusionResult.summary.bySource.both} Cross-validated
                        </span>
                      )}
                    </div>
                  )}

                  {analysisFiles.length > 0 && (
                    <div className="border-t border-border mt-4 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-foreground/80 text-sm font-medium">
                          Analysis Reports:
                        </h3>
                        <button
                          onClick={handleDownloadZip}
                          className="text-accent text-xs hover:text-accent/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/10 transition-colors duration-150 border border-accent/20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download ZIP
                        </button>
                      </div>
                      <div className="space-y-2">
                        {analysisFiles.map((file) => (
                          <div
                            key={file.path}
                            className="bg-secondary p-3 rounded-lg border border-border"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-foreground/80 text-sm">
                                {file.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleViewReport(file.content, file.name)
                                  }
                                  className="text-muted text-sm hover:text-foreground/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-border transition-colors duration-150"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadReport(file)}
                                  className="text-muted text-sm hover:text-foreground/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-border transition-colors duration-150"
                                >
                                  MD
                                </button>
                                <button
                                  onClick={() => handleRemoveReport(file.path)}
                                  className="text-muted hover:text-red-400 p-1 rounded hover:bg-border transition-colors duration-150"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <AIConfigModal
                isOpen={isAIConfigModalOpen}
                onClose={() => setIsAIConfigModalOpen(false)}
                onStartAnalysis={handleMultiFileAnalysis}
              />

              {isAnalyzing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className={`bg-card rounded-lg p-6 flex flex-col items-center ${streamingText ? "w-[720px] max-h-[85vh]" : "min-w-[400px]"}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 rounded-full animate-spin" />
                        <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
                          <ChainVineLogo size={28} className="text-accent animate-bounce-slow" />
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground text-lg font-medium">Dual-Engine Analysis</p>
                        <p className="text-accent text-sm font-mono">
                          {Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
                          {elapsedSeconds > 10 && elapsedSeconds < 120 && <span className="text-muted/70 ml-2 text-xs">typically 1-3 min</span>}
                          {elapsedSeconds >= 120 && <span className="text-yellow-500 ml-2 text-xs">Large contract...</span>}
                        </p>
                      </div>
                    </div>
                    {dualEngineProgress && (
                      <div className="w-full mb-3">
                        <div className="w-full bg-border rounded-full h-1.5 mb-2">
                          <div className="bg-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${dualEngineProgress.percent || 0}%` }} />
                        </div>
                        <div className="flex justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dualEngineProgress.slitherDone ? "bg-green-400" : "bg-accent animate-pulse"}`} />
                            <span className={dualEngineProgress.slitherDone ? "text-green-400" : "text-muted"}>Slither {dualEngineProgress.slitherDone ? "✓" : "..."}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dualEngineProgress.aiDone ? "bg-green-400" : streamingText ? "bg-accent animate-pulse" : dualEngineProgress.stage === "ai" ? "bg-accent animate-pulse" : "bg-muted/30"}`} />
                            <span className={dualEngineProgress.aiDone ? "text-green-400" : "text-muted"}>AI {dualEngineProgress.aiDone ? "✓" : streamingText ? "streaming..." : dualEngineProgress.stage === "ai" ? "..." : "waiting"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${dualEngineProgress.stage === "done" ? "bg-green-400" : dualEngineProgress.stage === "merging" ? "bg-accent animate-pulse" : "bg-muted/30"}`} />
                            <span className={dualEngineProgress.stage === "done" ? "text-green-400" : "text-muted"}>Fusion {dualEngineProgress.stage === "done" ? "✓" : dualEngineProgress.stage === "merging" ? "..." : "waiting"}</span>
                          </div>
                        </div>
                        {dualEngineProgress.message && dualEngineProgress.stage !== "ai-chunk" && <p className="text-muted text-xs text-center">{dualEngineProgress.message}</p>}
                        {dualEngineProgress.stage === "error" && <p className="text-red-400 text-sm text-center mt-1 font-medium">{dualEngineProgress.message}</p>}
                      </div>
                    )}
                    {!dualEngineProgress && <p className="text-muted text-sm mb-3">Initializing engines...</p>}
                    {streamingText && (
                      <div className="w-full flex-1 min-h-0 mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-accent font-medium">AI Output (streaming)</span>
                          <span className="text-xs text-muted font-mono">{streamingText.length.toLocaleString()} chars</span>
                        </div>
                        <div className="w-full max-h-[45vh] overflow-y-auto bg-background border border-border rounded-lg p-3 text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                          {streamingText}
                          <div ref={streamingEndRef} />
                        </div>
                      </div>
                    )}
                    <button onClick={handleCancelAnalysis} className="px-4 py-2 bg-secondary text-accent rounded-md border border-accent/20 hover:bg-accent/10 transition-colors font-medium text-sm">Cancel Analysis</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === "address" &&
          chainInfo &&
          Object.entries(chainInfo).map(
            ([chain, info]) =>
              info?.exists && (
                <ContractInfoCard
                  key={chain}
                  chainInfo={info}
                  chain={chain}
                  address={address}
                />
              )
          )}
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0" />
    </div>
  );
}
