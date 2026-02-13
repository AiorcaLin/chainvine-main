/**
 * Contract Info API 路由
 * ======================
 * 获取合约元数据（名称、编译器、代理检测等）。
 * 支持 Etherscan V1/V2 API 自动切换。
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiScanConfig, getChainId } from "@/utils/chainServices";

// ─── Etherscan V1→V2 兼容层（与 /api/source 保持一致） ───

type ExplorerApiResponse = {
  status?: string;
  message?: string;
  result?: unknown;
} & Record<string, unknown>;

function toV2BaseUrl(v1Url: string): string {
  if (v1Url.includes("/v2/")) return v1Url;
  return v1Url.replace(/\/api\/?$/, "/v2/api");
}

function isDeprecatedV1Error(data: ExplorerApiResponse): boolean {
  const msg = `${String(data?.result || "")} ${String(data?.message || "")}`.toLowerCase();
  return (
    (msg.includes("deprecated") && msg.includes("v1")) ||
    msg.includes("missing/invalid api key")
  );
}

// ─── API 路由 ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const chain = searchParams.get("chain");

  if (!address || !chain) {
    return NextResponse.json(
      { error: "Missing address or chain" },
      { status: 400 }
    );
  }

  try {
    // Aurora chain — uses Blockscout V2 API directly
    if (chain === "aurora") {
      const auroraUrl = `https://explorer.mainnet.aurora.dev/api/v2/smart-contracts/${address}`;
      const response = await fetch(auroraUrl);
      const data = await response.json();

      const { url: apiUrl, apiKey } = getApiScanConfig(chain);
      const effectiveApiKey = apiKey || "YourApiKeyToken";
      const creationUrl = `${apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${effectiveApiKey}`;
      const creationResponse = await fetch(creationUrl);
      const creationData = await creationResponse.json();

      let creator = "";
      let creationTxHash = "";

      if (creationData.status === "1" && creationData.result?.[0]) {
        creator = creationData.result[0].contractCreator;
        creationTxHash = creationData.result[0].txHash;
      }

      return NextResponse.json({
        contractName: data.name || "",
        compiler: data.compiler_version || "",
        optimization: data.optimization_enabled || false,
        runs: data.optimization_runs || 200,
        evmVersion: data.evm_version || "default",
        creationCode: data.creation_bytecode || "",
        deployedBytecode: data.deployed_bytecode || "",
        implementation: data.proxy_type ? data.implementations[0] : null,
        creator: creator,
        creationTxHash: creationTxHash,
      });
    }

    // ─── Other EVM chains (Etherscan-compatible) ───
    const { url: apiUrl, apiKey } = getApiScanConfig(chain);
    const chainId = getChainId(chain) || "";
    const effectiveApiKey = apiKey || "YourApiKeyToken";

    /**
     * fetchExplorer — 自动处理 V1→V2 升级
     * 复用 /api/source 中已验证的逻辑
     */
    const fetchExplorer = async (params: URLSearchParams): Promise<ExplorerApiResponse> => {
      const attempt = async (baseUrl: string, useV2: boolean) => {
        const p = new URLSearchParams(params);
        if (useV2 && chainId) {
          p.set("chainid", chainId);
        }
        const requestUrl = `${baseUrl}?${p.toString()}`;
        const resp = await fetch(requestUrl);
        return (await resp.json()) as ExplorerApiResponse;
      };

      // V1 first
      let json = await attempt(apiUrl, false);

      // Auto-upgrade to V2 if V1 is deprecated
      if (json?.status === "0" && isDeprecatedV1Error(json)) {
        json = await attempt(toV2BaseUrl(apiUrl), true);
      }

      return json;
    };

    // 1. Get contract bytecode
    const bytecodeParams = new URLSearchParams({
      module: "proxy",
      action: "eth_getCode",
      address,
      tag: "latest",
    });
    bytecodeParams.set("apikey", effectiveApiKey);
    const bytecodeData = await fetchExplorer(bytecodeParams);

    // 2. Get contract creation code and creator info
    const creationParams = new URLSearchParams({
      module: "contract",
      action: "getcontractcreation",
      contractaddresses: address,
    });
    creationParams.set("apikey", effectiveApiKey);
    const creationData = await fetchExplorer(creationParams);

    let creationCode = "";
    let creator = "";
    let creationTxHash = "";

    if (creationData.status === "1" && Array.isArray(creationData.result) && creationData.result[0]) {
      const r = creationData.result[0] as Record<string, string>;
      creationCode = r.creationBytecode || "";
      creator = r.contractCreator || "";
      creationTxHash = r.txHash || "";
    }

    // 3. Get contract source code information
    const sourceParams = new URLSearchParams({
      module: "contract",
      action: "getsourcecode",
      address,
    });
    sourceParams.set("apikey", effectiveApiKey);
    const sourceData = await fetchExplorer(sourceParams);

    // 4. Get deployed bytecode
    let deployedBytecode = "";
    if (typeof bytecodeData.result === "string") {
      deployedBytecode = bytecodeData.result;
    }

    // Extract source info from result array
    const sourceResult = Array.isArray(sourceData.result) ? sourceData.result[0] as Record<string, unknown> : null;

    return NextResponse.json({
      contractName: (sourceResult?.ContractName as string) || "",
      compiler: (sourceResult?.CompilerVersion as string) || "",
      optimization: sourceResult?.OptimizationUsed === "1",
      runs: parseInt(String(sourceResult?.Runs)) || 200,
      evmVersion: (sourceResult?.EVMVersion as string) || "default",
      creationCode,
      deployedBytecode,
      implementation: sourceResult?.Implementation || null,
      creator,
      creationTxHash,
    });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract info" },
      { status: 500 }
    );
  }
}
