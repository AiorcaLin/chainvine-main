interface ContractConfig {
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  evmVersion: string;
  bytecode?: {
    creationCode: string;
    deployedBytecode: string;
  };
}

export function generateConfig({
  contractName,
  compiler,
  optimization,
  runs,
  evmVersion,
  creationCode,
  deployedBytecode
}: {
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  evmVersion?: string;
  creationCode?: string;
  deployedBytecode?: string;
}): ContractConfig {
  return {
    contractName,
    compiler,
    optimization,
    runs,
    evmVersion: evmVersion || 'default',
    bytecode: {
      creationCode: creationCode || '',
      deployedBytecode: deployedBytecode || ''
    }
  };
}

export function formatConfig(config: ContractConfig): string {
  return JSON.stringify(config, null, 2);
} 