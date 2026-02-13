// Add ChainConfig interface definition
interface ChainConfig {
  id: string;
  name: string;
  displayName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: string;
    fallbacks: string[];
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
      apiUrl: string;
      apiKey?: string;
    };
  };
}

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: "1",
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://eth.llamarpc.com",
      fallbacks: [
        "https://ethereum.publicnode.com",
        "https://rpc.ankr.com/eth",
        "https://cloudflare-eth.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "Etherscan",
        url: "https://etherscan.io",
        apiUrl: "https://api.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
    },
  },
  arbitrum: {
    id: "42161",
    name: "arbitrum",
    displayName: "Arbitrum One",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://arb1.arbitrum.io/rpc",
      fallbacks: [
        "https://arbitrum.publicnode.com",
        "https://arbitrum-one.publicnode.com",
        "https://arbitrum.meowrpc.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "Arbiscan",
        url: "https://arbiscan.io",
        apiUrl: "https://api.arbiscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_ARBISCAN_API_KEY,
      },
    },
  },
  bsc: {
    id: "56",
    name: "bsc",
    displayName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://bsc-dataseed.binance.org",
      fallbacks: [
        "https://bsc-dataseed1.defibit.io",
        "https://bsc-dataseed1.ninicoin.io",
        "https://bsc.publicnode.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "BscScan",
        url: "https://bscscan.com",
        apiUrl: "https://api.bscscan.com/api",
        apiKey: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
      },
    },
  },
  base: {
    id: "8453",
    name: "base",
    displayName: "Base",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.base.org",
      fallbacks: [
        "https://base.blockpi.network/v1/rpc/public",
        "https://base.meowrpc.com",
        "https://base.publicnode.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "Basescan",
        url: "https://basescan.org",
        apiUrl: "https://api.basescan.org/api",
        apiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY,
      },
    },
  },
  optimism: {
    id: "10",
    name: "optimism",
    displayName: "Optimism",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.optimism.io",
      fallbacks: [
        "https://optimism.publicnode.com",
        "https://optimism.meowrpc.com",
        "https://opt-mainnet.g.alchemy.com/v2/demo",
      ],
    },
    blockExplorers: {
      default: {
        name: "Optimistic Etherscan",
        url: "https://optimistic.etherscan.io",
        apiUrl: "https://api-optimistic.etherscan.io/api",
        apiKey: process.env.NEXT_PUBLIC_OPTIMISM_API_KEY,
      },
    },
  },
  polygon: {
    id: "137",
    name: "polygon",
    displayName: "Polygon",
    nativeCurrency: {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://polygon-rpc.com",
      fallbacks: [
        "https://polygon.llamarpc.com",
        "https://polygon.publicnode.com",
        "https://polygon.meowrpc.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "PolygonScan",
        url: "https://polygonscan.com",
        apiUrl: "https://api.polygonscan.com/api",
        apiKey: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
      },
    },
  },
  avalanche: {
    id: "43114",
    name: "avalanche",
    displayName: "Avalanche C-Chain",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://api.avax.network/ext/bc/C/rpc",
      fallbacks: [
        "https://avalanche.public-rpc.com",
        "https://avalanche.api.onfinality.io/public",
        "https://avalanche.publicnode.com",
      ],
    },
    blockExplorers: {
      default: {
        name: "SnowTrace",
        url: "https://snowtrace.io",
        apiUrl: "https://api.snowtrace.io/api",
      },
    },
  },
  aurora: {
    id: "1313161554",
    name: "aurora",
    displayName: "Aurora",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: "https://mainnet.aurora.dev",
      fallbacks: [
        "https://aurora.drpc.org",
        "https://endpoints.omniatech.io/v1/aurora/mainnet/public",
        "https://1rpc.io/aurora",
      ],
    },
    blockExplorers: {
      default: {
        name: "Aurora Explorer",
        url: "https://explorer.aurora.dev",
        apiUrl: "https://explorer.aurora.dev/api",
      },
    },
  },
} as const;

export const KNOWN_CONTRACTS: Record<
  string,
  { labels: string[]; projectName: string }
> = {
  // Uniswap Protocol Contracts
  "0x000000000022d473030f116ddee9f6b43ac78ba3": {
    labels: ["Permit2"],
    projectName: "Uniswap Protocol",
  },
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": {
    labels: ["Universal Router"],
    projectName: "Uniswap Protocol",
  },
  "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b": {
    labels: ["Universal Router"],
    projectName: "Uniswap Protocol",
  },
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": {
    labels: ["Universal Router 2"],
    projectName: "Uniswap Protocol",
  },
  "0x1f98431c8ad98523631ae4a59f267346ea31f984": {
    labels: ["Factory"],
    projectName: "Uniswap V3",
  },
  "0xe592427a0aece92de3edee1f18e0157c05861564": {
    labels: ["Router"],
    projectName: "Uniswap V3",
  },

  // OpenSea Contracts
  "0x00000000006c3852cbef3e08e8df289169ede581": {
    labels: ["Seaport 1.1"],
    projectName: "OpenSea",
  },
  "0x00000000000006c7676171937c444f6bde3d6282": {
    labels: ["Seaport 1.5"],
    projectName: "OpenSea",
  },

  // Chainlink Contracts
  "0x47fb2585d2c56fe188d0e6ec628a38b74fceeedf": {
    labels: ["Price Feed"],
    projectName: "Chainlink",
  },
  "0xc18f85a6dd3bcd0516a1ca08d3b1f0a4e191c2c2": {
    labels: ["Validator"],
    projectName: "Chainlink",
  },

  // AAVE Contracts
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": {
    labels: ["Pool V3"],
    projectName: "AAVE",
  },
  "0x2f39d218133afab8f2b819b1066c7e434ad94e9e": {
    labels: ["Pool Proxy"],
    projectName: "AAVE",
  },

  // Lido Contracts
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": {
    labels: ["stETH"],
    projectName: "Lido",
  },
  "0x1982b2f5814301d4e9a8b0201555376e62f82428": {
    labels: ["Staking Router"],
    projectName: "Lido",
  },

  // Compound Contracts
  "0xc0da01a04c3f3e0be433606045bb7017a7323e38": {
    labels: ["Timelock"],
    projectName: "Compound",
  },
  "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b": {
    labels: ["Comptroller"],
    projectName: "Compound",
  },

  // 1inch Contracts
  "0x1111111254eeb25477b68fb85ed929f73a960582": {
    labels: ["Router"],
    projectName: "1inch",
  },
  "0x1111111254760f7ab3f16433eea9304126dcd199": {
    labels: ["Aggregation Router V5"],
    projectName: "1inch",
  },

  // Curve Contracts
  "0xd51a44d3fae010294c616388b506acda1bfaae46": {
    labels: ["Tricrypto2 Pool"],
    projectName: "Curve",
  },
  "0xbabe61887f1de2713c6f97e567623453d3c79f67": {
    labels: ["Factory"],
    projectName: "Curve",
  },

  // Balancer Contracts
  "0xba12222222228d8ba445958a75a0704d566bf2c8": {
    labels: ["Vault"],
    projectName: "Balancer",
  },
  "0x4e7bbd911cf1efa442bc1b2e9ea01ffe785412ec": {
    labels: ["Gauge Factory"],
    projectName: "Balancer",
  },

  // ENS Contracts
  "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e": {
    labels: ["Registry"],
    projectName: "ENS",
  },
  "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85": {
    labels: ["Base Registrar"],
    projectName: "ENS",
  },

  // orbitchain
  "0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a": {
    labels: ["ETH Vault"],
    projectName: "OrbitChain",
  },
};

// Change to your own domain
export const WEBSITE_URL = "chainvine.vercel.app";
