import { CHAINS } from "./constants";

// Get chain display name
function getChainDisplayName(chainId: string): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  return chain?.displayName || chainId;
}

interface ContractInfo {
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  evmVersion?: string;
  address?: string;
  chainId?: string;
  creationCode?: string;
  deployedBytecode?: string;
  creator?: string;
  creationTxHash?: string;
}

interface ImplementationInfo {
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  evmVersion: string;
  creationCode?: string;
  deployedBytecode?: string;
  creator?: string;
  creationTxHash?: string;
}

// Format file tree structure
export const formatFileTree = (files: string[]): string => {
  // First filter out .md files
  const filteredFiles = files.filter((file) => !file.endsWith(".md"));

  // Build tree structure
  const tree: { [key: string]: any } = {};

  // Build tree structure
  filteredFiles.forEach((path) => {
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

export const generateReadme = ({
  files,
  tokenName,
  proxyInfo,
  implementationInfo,
  implementationAddress,
}: {
  files: { path: string }[];
  tokenName?: string;
  proxyInfo: ContractInfo;
  implementationInfo?: ImplementationInfo;
  implementationAddress?: string;
}): string => {
  // Check if it's a proxy contract
  const isProxy =
    files.some((f) => f.path.startsWith("proxy/")) &&
    files.some((f) => f.path.startsWith("implementation/"));

  let readme = "";

  if (isProxy) {
    readme = `# ${
      tokenName || implementationInfo?.contractName || proxyInfo.contractName
    }

## Proxy Contract Information
- **Contract Name:** ${proxyInfo.contractName}
- **Compiler Version:** ${proxyInfo.compiler}
- **Optimization Enabled:** ${
      proxyInfo.optimization ? `Yes with ${proxyInfo.runs} runs` : "No"
    }
- **Contract Address:** ${proxyInfo.address || "Unknown"}
- **EVM Version:** ${proxyInfo.evmVersion || "default"}
${
  proxyInfo.chainId
    ? `- **Chain:** ${getChainDisplayName(proxyInfo.chainId)}`
    : ""
}
${proxyInfo.creator ? `- **Creator:** ${proxyInfo.creator}` : ""}
${
  proxyInfo.creationTxHash
    ? `- **Creation Transaction:** ${proxyInfo.creationTxHash}`
    : ""
}

## Implementation Contract Information
- **Contract Name:** ${implementationInfo?.contractName || "Unknown"}
- **Compiler Version:** ${implementationInfo?.compiler || "Unknown"}
- **Optimization Enabled:** ${
      implementationInfo?.optimization
        ? `Yes with ${implementationInfo.runs} runs`
        : "No"
    }
- **Contract Address:** ${implementationAddress || "Unknown"}
- **EVM Version:** ${implementationInfo?.evmVersion || "default"}
${
  proxyInfo.chainId
    ? `- **Chain:** ${getChainDisplayName(proxyInfo.chainId)}`
    : ""
}
${
  implementationInfo?.creator
    ? `- **Creator:** ${implementationInfo.creator}`
    : ""
}
${
  implementationInfo?.creationTxHash
    ? `- **Creation Transaction:** ${implementationInfo.creationTxHash}`
    : ""
}`;
  } else {
    readme = `# ${tokenName || proxyInfo.contractName}

## Contract Information
- **Contract Name:** ${proxyInfo.contractName}
- **Compiler Version:** ${proxyInfo.compiler}
- **Optimization Enabled:** ${
      proxyInfo.optimization ? `Yes with ${proxyInfo.runs} runs` : "No"
    }
- **Contract Address:** ${proxyInfo.address || "Unknown"}
- **EVM Version:** ${proxyInfo.evmVersion || "default"}
${
  proxyInfo.chainId
    ? `- **Chain:** ${getChainDisplayName(proxyInfo.chainId)}`
    : ""
}
${proxyInfo.creator ? `- **Creator:** ${proxyInfo.creator}` : ""}
${
  proxyInfo.creationTxHash
    ? `- **Creation Transaction:** ${proxyInfo.creationTxHash}`
    : ""
}`;
  }

  // Add file structure section
  return `${readme}

## Source Code Structure
\`\`\`
${formatFileTree(files.map((f) => f.path))}
\`\`\``;
};
