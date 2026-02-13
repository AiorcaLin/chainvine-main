import { CHAINS } from "./constants";

// Get chainId function
export function getChainId(chain: string): string | undefined {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) return undefined;
  return chainConfig.id;
}

// Get RPC URL
export function getRpcUrl(chain: string): string {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);
  return chainConfig.rpcUrls.default;
}

// Get API Scan configuration
export function getApiScanConfig(chain: string): {
  url: string;
  apiKey: string;
} {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);
  return {
    url: chainConfig.blockExplorers.default.apiUrl,
    apiKey: chainConfig.blockExplorers.default.apiKey || "",
  };
}

// Get block explorer URL
export function getExplorerUrl(chain: string, address: string): string {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) return "#";
  return `${chainConfig.blockExplorers.default.url}/address/${address}`;
}

// Get block explorer URL for tokens
export function getExplorerTokenUrl(chain: string, address: string): string {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) return "#";
  return `${chainConfig.blockExplorers.default.url}/token/${address}`;
}

// Get AVAX C-Chain specific explorer URL for bytecode
export function getAVAXCExplorerBytecodeUrl(address: string): string {
  return `https://snowtrace.io/token/${address}/contract/code?chainid=43114`;
}

// Get Aurora specific explorer URL for bytecode
export function getAuroraExplorerBytecodeUrl(address: string): string {
  return `https://explorer.mainnet.aurora.dev/api/v2/smart-contracts/${address}`;
}
