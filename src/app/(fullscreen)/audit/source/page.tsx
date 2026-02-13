"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import SourcePreview from "@/components/audit/SourcePreview";
import type { ContractFile } from "@/types/blockchain";
import { getChainId } from "@/utils/chainServices";
import { ChainVineLogo } from "@/components/Icons";
import { fetchCreationCodeFromExplorer } from "@/utils/blockchain";

interface ContractSource {
  files: ContractFile[];
  settings: any;
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  implementationAddress?: string;
  implementationInfo?: {
    contractName: string;
    compiler: string;
    optimization: boolean;
    runs: number;
    evmVersion: string;
    creator?: string;
    creationTxHash?: string;
  };
  creationCode?: string;
  deployedBytecode?: string;
  creator?: string;
  creationTxHash?: string;
  abi?: any[];
  implementationAbi?: any[];
}

function SourceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sourceData, setSourceData] = useState<ContractSource | null>(null);
  const [loading, setLoading] = useState(true);

  const address = searchParams.get("address");
  const chain = searchParams.get("chain");
  const implementation = searchParams.get("implementation");
  const tokenName = searchParams.get("tokenName");

  const chainId = chain ? getChainId(chain) : undefined;

  const handleStartAnalysis = () => {
    if (address && chain) {
      router.push(`/audit/analyze?address=${address}&chain=${chain}`);
    } else {
      toast.error("Missing address or chain information");
    }
  };

  useEffect(() => {
    const fetchSource = async () => {
      if (!address || !chain) {
        toast.error("Missing address or chain");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/source?address=${address}&chain=${chain}`
        );
        const data = await response.json();

        if (data.error) {
          toast.error(data.error);
          return;
        }

        const contractResponse = await fetch(
          `/api/contract-info?address=${address}&chain=${chain}`
        );
        const contractData = await contractResponse.json();
        // // console.log("creation code:", contractData.creationCode);
        if (contractData && contractData.creationCode == "") {
          // console.log("11\n");
          // console.log("chain:", chain);
          // console.log("address:", address);
          contractData.creationCode = await fetchCreationCodeFromExplorer(
            chain,
            address
          );
          //console.log("creation code2:", contractData.creationCode);
          if (contractData.creationCode === "") {
            contractData.creationCode =
              "api not found, you need to view the contract on the blockchain explorer manually";
          }
        }

        let implementationInfo;
        if (implementation) {
          try {
            const implResponse = await fetch(
              `/api/contract-info?address=${implementation}&chain=${chain}`
            );
            if (implResponse.ok) {
              implementationInfo = await implResponse.json();
              if (implementationInfo && implementationInfo.creationCode == "") {
                implementationInfo.creationCode =
                  await fetchCreationCodeFromExplorer(chain, implementation);
                //console.log("imp creation code2:", implementationInfo.creationCode);
                if (implementationInfo.creationCode === "") {
                  implementationInfo.creationCode =
                    "api not found, you need to view the contract on the blockchain explorer manually";
                }
              }
            } else {
              const errorData = await implResponse.json();
              console.error(
                "Failed to fetch implementation contract info:",
                errorData
              );
            }
          } catch (error) {
            console.error("Error fetching implementation info:", error);
          }
        }

        let filteredFiles = [...data.files];

        setSourceData({
          files: filteredFiles,
          settings: data.settings,
          contractName: data.contractName,
          compiler: data.compiler,
          optimization: data.optimization,
          runs: data.runs,
          abi: data.abi,
          implementationAbi: data.implementationAbi,
          implementationAddress: implementation || undefined,
          implementationInfo: implementationInfo || undefined,
          creationCode: contractData.creationCode,
          deployedBytecode: contractData.deployedBytecode,
          creator: contractData.creator,
          creationTxHash: contractData.creationTxHash,
        });
      } catch (error) {
        console.error("Error:", error);
        if (!(error instanceof Response && error.status === 404)) {
          toast.error("Failed to fetch source code");
        }
        setSourceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer rotating halo */}
            <div
              className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 
                          rounded-full animate-spin"
            />

            {/* Inner pulse effect */}
            <div
              className="absolute inset-2 border-2 border-accent/50 rounded-full 
                          animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
            />

            {/* Logo */}
            <div
              className="absolute inset-3 bg-card rounded-full flex items-center justify-center
                          border border-accent/20"
            >
              <ChainVineLogo size={40} className="text-accent animate-bounce-slow" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-medium text-foreground">
              Loading Source Code
            </h3>
            <p className="text-sm text-muted">
              Fetching contract files from blockchain...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!sourceData) {
    return (
      <div className="fixed inset-0 bg-card flex items-center justify-center">
        <div className="text-foreground text-center">
          <p className="text-lg mb-2">No source code found</p>
          <p className="text-sm text-muted">
            This contract may not exist on {chain} or its source code is not
            verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SourcePreview
      files={sourceData.files}
      onAnalyze={handleStartAnalysis}
      contractName={sourceData.contractName}
      compiler={sourceData.compiler}
      optimization={sourceData.optimization}
      runs={sourceData.runs}
      chainId={chainId || undefined}
      address={address || undefined}
      implementationAddress={implementation || undefined}
      implementationInfo={sourceData.implementationInfo}
      evmVersion={sourceData.settings?.evmVersion}
      tokenName={tokenName || undefined}
      creationCode={sourceData.creationCode}
      deployedBytecode={sourceData.deployedBytecode}
      abi={sourceData.abi}
      implementationAbi={sourceData.implementationAbi}
      creator={sourceData.creator}
      creationTxHash={sourceData.creationTxHash}
    />
  );
}

export default function SourcePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-card flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Outer rotating halo */}
              <div className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 rounded-full animate-spin" />
              {/* Inner pulse effect */}
              <div className="absolute inset-2 border-2 border-accent/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              {/* Logo */}
              <div className="absolute inset-3 bg-card rounded-full flex items-center justify-center border border-accent/20">
                <ChainVineLogo size={32} className="text-accent animate-bounce-slow" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-foreground">
                Loading Source Code
              </h3>
              <p className="text-sm text-muted">
                Fetching contract files from blockchain...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <SourceContent />
    </Suspense>
  );
}
