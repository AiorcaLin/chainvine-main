interface AbiGenerateParams {
  contractName: string;
  address?: string;
  chainId?: string;
  abi?: any[];
}

export const generateABI = ({ contractName, address, chainId, abi }: AbiGenerateParams) => {
  if (abi && Array.isArray(abi) && abi.length > 0) {
    return JSON.stringify(abi, null, 2);
  }
  return JSON.stringify([], null, 2);
}; 