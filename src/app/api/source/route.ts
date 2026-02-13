import { NextRequest, NextResponse } from 'next/server';
import type { ContractFile } from '@/types/blockchain';
import { getApiScanConfig, getChainId } from '@/utils/chainServices';

type ExplorerApiResponse = {
  status?: string;
  message?: string;
  result?: unknown;
} & Record<string, unknown>;

type SourceCodeResultItem = {
  SourceCode: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  Implementation?: string;
} & Record<string, unknown>;

function toV2BaseUrl(v1Url: string): string {
  if (v1Url.includes('/v2/')) return v1Url;
  // Most Etherscan-family explorers use .../api (v1) and .../v2/api (v2)
  return v1Url.replace(/\/api\/?$/, '/v2/api');
}

function isDeprecatedV1Error(data: ExplorerApiResponse): boolean {
  const msg = `${String(data?.result || '')} ${String(data?.message || '')}`.toLowerCase();
  return msg.includes('deprecated') && msg.includes('v1');
}

function extractSourceContent(fileInfo: unknown): string {
  if (typeof fileInfo === 'string') return fileInfo;
  if (fileInfo && typeof fileInfo === 'object' && 'content' in fileInfo) {
    const content = (fileInfo as { content?: unknown }).content;
    if (typeof content === 'string') return content;
  }
  return '';
}

function getResultArray(data: ExplorerApiResponse): unknown[] {
  return Array.isArray(data.result) ? data.result : [];
}

function getFirstSourceItem(data: ExplorerApiResponse): SourceCodeResultItem | null {
  const first = getResultArray(data)[0];
  if (first && typeof first === 'object') return first as SourceCodeResultItem;
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const chain = searchParams.get('chain');

  if (!address || !chain) {
    return NextResponse.json(
      { error: 'Address and chain are required' },
      { status: 400 }
    );
  }

  try {
    const { url, apiKey } = getApiScanConfig(chain);
    const chainId = getChainId(chain) || '';
    // Many Etherscan-compatible explorers reject missing/empty api keys.
    // Use the documented placeholder token as a best-effort public key when users didn't configure one.
    const effectiveApiKey = apiKey || 'YourApiKeyToken';

    const fetchExplorer = async (params: URLSearchParams) => {
      const attempt = async (baseUrl: string, useV2: boolean) => {
        const p = new URLSearchParams(params);
        if (useV2 && chainId) {
          p.set('chainid', chainId);
        }
        const requestUrl = `${baseUrl}?${p.toString()}`;
        const resp = await fetch(requestUrl);
        const json = (await resp.json()) as ExplorerApiResponse;
        return { json, requestUrl };
      };

      // v1 first
      let { json, requestUrl } = await attempt(url, false);

      // auto-upgrade to v2 if v1 is deprecated
      if (json?.status === '0' && isDeprecatedV1Error(json)) {
        ({ json, requestUrl } = await attempt(toV2BaseUrl(url), true));
      }

      return { data: json, requestUrl };
    };
    
    // // 1. Try to get source code from blockscan
    // try {
    //   const blockscanResponse = await fetch(`${blockscanUrl}/${address}`);
    //   if (blockscanResponse.ok) {
    //     const blockscanData = await blockscanResponse.json();
    //     if (blockscanData.result) {
    //       // Process blockscan response data
    //       return NextResponse.json({
    //         files: blockscanData.result.files,
    //         settings: blockscanData.result.settings,
    //         contractName: blockscanData.result.name,
    //         compiler: blockscanData.result.compiler,
    //         optimization: blockscanData.result.settings?.optimizer?.enabled || false,
    //         runs: blockscanData.result.settings?.optimizer?.runs || 200
    //       });
    //     }
    //   }
    // } catch (e) {
    //   console.log('Failed to fetch from blockscan, falling back to etherscan');
    // }

    // 2. If blockscan fails, fallback to explorer API (Etherscan-compatible)
    const sourceParams = new URLSearchParams({
      module: 'contract',
      action: 'getsourcecode',
      address,
    });
    sourceParams.set('apikey', effectiveApiKey);

    const { data, requestUrl: apiUrl } = await fetchExplorer(sourceParams);

    const result = data.status === '1' ? getFirstSourceItem(data) : null;
    if (result) {
      
      if (result.SourceCode === '') {
        return NextResponse.json(
          { error: 'Contract source code not verified' },
          { status: 404 }
        );
      }

      const files: ContractFile[] = [];
      const filteredFiles: ContractFile[] = [];
      let settings = null;
      
      // Handle multi-file contract case
      if (result.SourceCode.startsWith('{')) {
        try {
          const sourceString = result.SourceCode.substring(1, result.SourceCode.length - 1);
          const parsed = JSON.parse(sourceString);
          
          // Extract compiler settings
          if (parsed.settings) {
            settings = parsed.settings;
          }
          
          // Process source files
          if (parsed.sources) {
            Object.entries(parsed.sources as Record<string, unknown>).forEach(([path, fileInfo]: [string, unknown]) => {
              files.push({
                name: path.split('/').pop() || path,
                path: path,
                content: extractSourceContent(fileInfo)
              });
            });
          } else {
            Object.entries(parsed as Record<string, unknown>).forEach(([path, content]: [string, unknown]) => {
              files.push({
                name: path.split('/').pop() || path,
                path: path,
                content: extractSourceContent(content)
              });
            });
          }
        } catch (_e) {
          console.error('Error parsing multi-file contract:', _e);
          files.push({
            name: `${result.ContractName}.sol`,
            path: `${result.ContractName}.sol`,
            content: result.SourceCode
          });
        }
      } else {
        files.push({
          name: `${result.ContractName}.sol`,
          path: `${result.ContractName}.sol`,
          content: result.SourceCode
        });
      }

      // Create default settings.json
      if (!settings) {
        settings = {
          remappings: [],
          optimizer: {
            enabled: result.OptimizationUsed === '1',
            runs: parseInt(result.Runs) || 200
          },
          metadata: {
            bytecodeHash: "none"
          },
          outputSelection: {
            "*": {
              "*": [
                "evm.bytecode",
                "evm.deployedBytecode",
                "devdoc",
                "userdoc",
                "metadata",
                "abi"
              ]
            }
          }
        };
      }

      // Check if this is a proxy contract (normalize implementation address for type-safety)
      const implementationRaw =
        typeof result.Implementation === 'string' ? result.Implementation : '';
      const normalizedImplementation =
        implementationRaw && implementationRaw !== '0x0000000000000000000000000000000000000000'
          ? implementationRaw
          : null;
      const isProxy = normalizedImplementation !== null;

      if (isProxy) {
        // Process proxy contract source code
        if (result.SourceCode.startsWith('{')) {
          try {
            const sourceString = result.SourceCode.substring(1, result.SourceCode.length - 1);
            const parsed = JSON.parse(sourceString);
            
            if (parsed.sources) {
              // Add proxy contract files
              Object.entries(parsed.sources as Record<string, unknown>).forEach(([path, fileInfo]: [string, unknown]) => {
                filteredFiles.push({
                  name: path.split('/').pop() || path,
                  path: `proxy/${path}`,  // Add proxy/ prefix
                  content: extractSourceContent(fileInfo)
                });
              });
            }
          } catch {
            filteredFiles.push({
              name: `${result.ContractName}.sol`,
              path: `proxy/${result.ContractName}.sol`,  // Add proxy/ prefix
              content: result.SourceCode
            });
          }
        } else {
          filteredFiles.push({
            name: `${result.ContractName}.sol`,
            path: `proxy/${result.ContractName}.sol`,  // Add proxy/ prefix
            content: result.SourceCode
          });
        }

        // Get implementation contract source code
        const implSourceParams = new URLSearchParams({
          module: 'contract',
          action: 'getsourcecode',
          address: normalizedImplementation,
        });
        implSourceParams.set('apikey', effectiveApiKey);
        const { data: implData } = await fetchExplorer(implSourceParams);

        const implResult = implData.status === '1' ? getFirstSourceItem(implData) : null;
        if (implResult) {
          
          if (implResult.SourceCode.startsWith('{')) {
            try {
              const sourceString = implResult.SourceCode.substring(1, implResult.SourceCode.length - 1);
              const parsed = JSON.parse(sourceString);
              
              if (parsed.sources) {
                // Add implementation contract files
                Object.entries(parsed.sources as Record<string, unknown>).forEach(([path, fileInfo]: [string, unknown]) => {
                  filteredFiles.push({
                    name: path.split('/').pop() || path,
                    path: `implementation/${path}`,  // Add implementation/ prefix
                    content: extractSourceContent(fileInfo)
                  });
                });
              }
            } catch {
              filteredFiles.push({
                name: `${implResult.ContractName}.sol`,
                path: `implementation/${implResult.ContractName}.sol`,  // Add implementation/ prefix
                content: implResult.SourceCode
              });
            }
          } else {
            filteredFiles.push({
              name: `${implResult.ContractName}.sol`,
              path: `implementation/${implResult.ContractName}.sol`,  // Add implementation/ prefix
              content: implResult.SourceCode
            });
          }
        }
      } else {
        // Process non-proxy contract source code
        if (result.SourceCode.startsWith('{')) {
          try {
            const sourceString = result.SourceCode.substring(1, result.SourceCode.length - 1);
            const parsed = JSON.parse(sourceString);
            
            if (parsed.sources) {
              // Add source files
              Object.entries(parsed.sources as Record<string, unknown>).forEach(([path, fileInfo]: [string, unknown]) => {
                filteredFiles.push({
                  name: path.split('/').pop() || path,
                  path: path,  // No prefix for non-proxy contracts
                  content: extractSourceContent(fileInfo)
                });
              });
            }
          } catch {
            filteredFiles.push({
              name: `${result.ContractName}.sol`,
              path: `${result.ContractName}.sol`,  // No prefix for non-proxy contracts
              content: result.SourceCode
            });
          }
        } else {
          filteredFiles.push({
            name: `${result.ContractName}.sol`,
            path: `${result.ContractName}.sol`,  // No prefix for non-proxy contracts
            content: result.SourceCode
          });
        }
      }

      // Get contract ABI
      const abiParams = new URLSearchParams({
        module: 'contract',
        action: 'getabi',
        address,
      });
      abiParams.set('apikey', effectiveApiKey);
      const { data: abiData } = await fetchExplorer(abiParams);

      let contractABI = [];
      let implementationABI = [];

      if (abiData.status === '1' && typeof abiData.result === 'string') {
        try {
          contractABI = JSON.parse(abiData.result);
        } catch (e) {
          console.error('Error parsing ABI:', e);
        }
      }

      // If proxy contract, also get implementation contract ABI
      if (isProxy) {
        const implAbiParams = new URLSearchParams({
          module: 'contract',
          action: 'getabi',
          address: normalizedImplementation,
        });
        implAbiParams.set('apikey', effectiveApiKey);
        const { data: implAbiData } = await fetchExplorer(implAbiParams);

        if (implAbiData.status === '1' && typeof implAbiData.result === 'string') {
          try {
            implementationABI = JSON.parse(implAbiData.result);
          } catch (e) {
            console.error('Error parsing implementation ABI:', e);
          }
        }
      }

      return NextResponse.json({
        files: filteredFiles,
        settings,
        contractName: result.ContractName,
        compiler: result.CompilerVersion,
        optimization: settings.optimizer.enabled,
        runs: settings.optimizer.runs,
        abi: contractABI,
        implementationAbi: implementationABI,
        // ... other return fields ...
      });
    }

    // Surface explorer error details to help debugging (e.g. missing/invalid API key, rate limits)
    console.error('Explorer getsourcecode failed', {
      chain,
      address,
      apiUrl,
      apiKeyMode: apiKey ? 'custom' : 'public',
      status: data?.status,
      message: data?.message,
      result: data?.result,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch contract source',
        explorer: {
          status: data?.status,
          message: data?.message,
          result: data?.result,
          apiKeyMode: apiKey ? 'custom' : 'public',
        },
      },
      { status: 502 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract source' },
      { status: 500 }
    );
  }
} 