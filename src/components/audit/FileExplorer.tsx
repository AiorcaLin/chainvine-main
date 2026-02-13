"use client";

import { useState, useRef, useEffect } from "react";
import type { ContractFile } from "@/types/blockchain";
import { generateReadme } from "@/utils/readme";
import { generateConfig, formatConfig } from "@/utils/config";
import { generateABI } from "@/utils/abi";

interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  path: string;
  content?: string;
  children?: FileTreeNode[];
}

interface FileTreeViewProps {
  node: FileTreeNode;
  level?: number;
  onFileSelect: (file: ContractFile) => void;
  selectedPath?: string;
}

// Compress path nodes
function compressPath(node: FileTreeNode): FileTreeNode {
  if (node.type === "file") return node;

  if (
    node.children &&
    node.children.length === 1 &&
    node.children[0].type === "directory"
  ) {
    const child = node.children[0];
    const compressedChild = compressPath(child);
    return {
      ...node,
      name: `${node.name}/${compressedChild.name}`,
      path: compressedChild.path,
      children: compressedChild.children,
    };
  }

  return {
    ...node,
    children: node.children?.map(compressPath),
  };
}

function FileTreeView({
  node,
  level = 0,
  onFileSelect,
  selectedPath,
}: FileTreeViewProps) {
  // Only expand by default for the first level
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const paddingLeft = level * 12;

  if (node.type === "file") {
    return (
      <button
        onClick={() =>
          onFileSelect({
            name: node.name,
            path: node.path,
            content: node.content!,
          })
        }
        className={`w-full text-left px-2 py-1 text-sm hover:bg-secondary-hover flex items-center gap-2 group relative
          ${
            selectedPath === node.path
              ? "bg-secondary-hover text-foreground"
              : "text-muted"
          }
          transition-colors duration-150 ease-in-out overflow-hidden`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 text-accent opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-2 py-1 text-sm hover:bg-secondary-hover flex items-center gap-2
          text-[#CCCCCC] transition-colors duration-150 ease-in-out"
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150
            ${isExpanded ? "transform rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 text-accent opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeView
              key={child.path + index}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  files: ContractFile[];
  onFileSelect: (file: ContractFile) => void;
  selectedFile?: ContractFile;
  showImplementation?: boolean;
  contractType: "proxy" | "implementation";
  onContractTypeChange: (type: "proxy" | "implementation") => void;
  isWrapped: boolean;
  onWrapChange: (wrapped: boolean) => void;
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

export default function FileExplorer({
  files,
  onFileSelect,
  selectedFile,
  showImplementation,
  contractType,
  onContractTypeChange,
  isWrapped,
  onWrapChange,
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
}: FileExplorerProps) {
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  // Check if there are proxy and implementation contracts
  const hasProxyContract = files.some((f) => f.path.startsWith("proxy/"));
  const hasImplementationContract = files.some((f) =>
    f.path.startsWith("implementation/")
  );

  // Modify file filtering logic
  const filteredFiles = files.filter((file) => {
    // Always keep .md files
    if (file.path.endsWith(".md")) {
      return true;
    }

    // If it's a proxy contract scenario
    if (hasProxyContract && hasImplementationContract) {
      if (contractType === "proxy") {
        return file.path.startsWith("proxy/");
      } else {
        return file.path.startsWith("implementation/");
      }
    }
    // Non-proxy contract scenario, show all files
    return true;
  });

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

  // Add README.md to the file list
  const readmeFile: ContractFile = {
    name: "README.md",
    path: "README.md",
    content: readmeContent,
  };

  // Create the corresponding config.json file
  const configFile: ContractFile =
    contractType === "proxy"
      ? {
          name: "config.json",
          path: "proxy/config.json",
          content: formatConfig(
            generateConfig({
              contractName,
              compiler,
              optimization,
              runs,
              evmVersion,
              creationCode,
              deployedBytecode,
            })
          ),
        }
      : {
          name: "config.json",
          path: "implementation/config.json",
          content: formatConfig(
            generateConfig({
              contractName: implementationInfo?.contractName || "",
              compiler: implementationInfo?.compiler || "",
              optimization: implementationInfo?.optimization || false,
              runs: implementationInfo?.runs || 200,
              evmVersion: implementationInfo?.evmVersion,
              creationCode: implementationInfo?.creationCode,
              deployedBytecode: implementationInfo?.deployedBytecode,
            })
          ),
        };

  // Add abi.json to the allFiles array
  const abiFile: ContractFile =
    contractType === "proxy"
      ? {
          name: "abi.json",
          path: "proxy/abi.json",
          content: generateABI({
            contractName,
            address,
            chainId,
            abi, // Directly pass the abi obtained from the parent component
          }),
        }
      : {
          name: "abi.json",
          path: "implementation/abi.json",
          content: generateABI({
            contractName: implementationInfo?.contractName || "",
            address: implementationAddress,
            chainId,
            abi: implementationAbi, // Use the abi of the implementation contract
          }),
        };

  // Build allFiles array with deduplication for report files
  const allFiles = [
    // Keep non-report files
    ...filteredFiles.filter((f) => !f.path.startsWith("report-")),
    readmeFile,
    configFile,
    abiFile,
    // Keep all report files without deduplication
    ...files.filter((f) => f.path.startsWith("report-")),
  ];

  // Build file tree
  const buildFileTree = (files: ContractFile[]): FileTreeNode => {
    const root: FileTreeNode = {
      name: "",
      type: "directory",
      path: "",
      children: [],
    };

    files.forEach((file) => {
      // Remove proxy/ or implementation/ prefixes
      const cleanPath = file.path.replace(/^(proxy|implementation)\//, "");
      const parts = cleanPath.split("/");
      let current = root;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // File node
          current.children = current.children || [];
          current.children.push({
            name: part,
            type: "file",
            path: file.path, // Keep the original path for file selection
            content: file.content,
          });
        } else {
          // Directory node
          current.children = current.children || [];
          let child = current.children.find(
            (node) => node.type === "directory" && node.name === part
          );

          if (!child) {
            child = {
              name: part,
              type: "directory",
              path: parts.slice(0, index + 1).join("/"),
              children: [],
            };
            current.children.push(child);
          }
          current = child;
        }
      });
    });

    // Recursively sort the children of each directory
    const sortNodes = (node: FileTreeNode): FileTreeNode => {
      if (node.children) {
        // First recursively process all children
        node.children = node.children.map(sortNodes);

        // Then sort the children of the current level
        node.children.sort((a, b) => {
          // If types are different, directories come first
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          // If types are the same, sort by name alphabetically
          return a.name.localeCompare(b.name);
        });
      }
      return node;
    };

    // Compress single-path directory nodes and sort
    return sortNodes(compressPath(root));
  };

  // Build file tree - using the file list containing README.md
  const fileTree = buildFileTree(allFiles);

  // Handle window size adjustment
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      <div
        className="bg-secondary border-r border-border flex flex-col overflow-hidden"
        style={{ width: `${width}px` }}
      >
        {/* Contract Type Switcher */}
        {hasProxyContract && hasImplementationContract && (
          <div className="flex flex-col p-2 gap-2 border-b border-border">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onContractTypeChange("proxy");
                  const proxyFile = files.find((f) =>
                    f.path.startsWith("proxy/")
                  );
                  if (proxyFile) onFileSelect(proxyFile);
                }}
                className={`flex-1 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors
                  ${
                    contractType === "proxy"
                      ? "bg-card text-foreground"
                      : "text-muted hover:text-foreground hover:bg-card-hover"
                  }`}
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
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                Proxy
              </button>
              <button
                onClick={() => {
                  onContractTypeChange("implementation");
                  const implFile = files.find((f) =>
                    f.path.startsWith("implementation/")
                  );
                  if (implFile) onFileSelect(implFile);
                }}
                className={`flex-1 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors
                  ${
                    contractType === "implementation"
                      ? "bg-card text-foreground"
                      : "text-muted hover:text-foreground hover:bg-card-hover"
                  }`}
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
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Implementation
              </button>
            </div>
          </div>
        )}

        {/* File Explorer Title with Wrap Toggle */}
        <div className="p-4 text-foreground font-medium border-b border-border flex items-center justify-between">
          <span>Files</span>
          <button
            onClick={() => onWrapChange(!isWrapped)}
            className="px-2 py-1 hover:bg-border text-muted 
              rounded-md transition-colors flex items-center gap-1.5 text-xs"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isWrapped ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
            {isWrapped ? "Unwrap" : "Wrap"}
          </button>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-auto">
          {fileTree.children?.map((node, index) => (
            <FileTreeView
              key={node.path + index}
              node={node}
              onFileSelect={onFileSelect}
              selectedPath={selectedFile?.path}
            />
          ))}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 hover:w-1 cursor-col-resize bg-transparent hover:bg-accent/20 
          active:bg-accent/40 transition-colors"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="w-px h-full bg-border" />
      </div>
    </>
  );
}
