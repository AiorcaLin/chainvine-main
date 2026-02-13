import { ethers } from "ethers";
import { CHAINS, KNOWN_CONTRACTS } from "./constants";
import { withRetry } from "./rpc";
import {
  getRpcUrl,
  getExplorerUrl,
  getExplorerTokenUrl,
  getAVAXCExplorerBytecodeUrl,
} from "@/utils/chainServices";
import type { ContractBasicInfo, ContractFile } from "@/types/blockchain";
import * as cheerio from "cheerio";
import { WEBSITE_URL } from "@/utils/constants";

function findContractInfo(address: string): {
  labels?: string[];
  projectName?: string;
} {
  const lowerAddress = address.toLowerCase();
  for (const [addr, info] of Object.entries(KNOWN_CONTRACTS)) {
    if (addr.toLowerCase() === lowerAddress) {
      return info;
    }
  }
  return {};
}

export async function checkContractOnChains(
  address: string
): Promise<{ [key: string]: ContractBasicInfo | undefined }> {
  const result: { [key: string]: ContractBasicInfo | undefined } = {};

  // Get contract label information
  const contractInfo = findContractInfo(address);

  Object.keys(CHAINS).forEach((chainName) => {
    result[chainName] = { exists: false };
  });

  await Promise.all(
    Object.entries(CHAINS).map(async ([chainName, chainInfo]) => {
      try {
        const provider = new ethers.JsonRpcProvider(getRpcUrl(chainName));

        // 1. First check if the contract exists using RPC
        const code = await provider.getCode(address);
        if (code === "0x") {
          result[chainName] = { exists: false };
          return;
        }

        // 2. Get basic network information, balance, and labels
        const [network, balance, labels] = await Promise.all([
          provider.getNetwork(),
          provider.getBalance(address),
          fetchContractLabels(address, chainName),
        ]);

        result[chainName] = {
          exists: true,
          chainId: network.chainId,
          balance: balance.toString(),
          ...labels, // Add label information
        };

        // 3. Check contract type and get information
        try {
          const contract = new ethers.Contract(
            address,
            [
              // ERC165
              "function supportsInterface(bytes4) view returns (bool)",
              // General interface
              "function name() view returns (string)",
              "function symbol() view returns (string)",
              "function decimals() view returns (uint8)",
              "function totalSupply() view returns (uint256)",
              "function owner() view returns (address)",
              "function getOwner() view returns (address)",
              // NFT specific interface
              "function balanceOf(address) view returns (uint256)",
              "function ownerOf(uint256) view returns (address)",
              "function uri(uint256) view returns (string)",
            ],
            provider
          );

          let decimals: number | undefined = undefined;

          // Check contract interfaces
          let isERC721 = false;
          let isERC1155 = false;

          try {
            [isERC721, isERC1155] = await Promise.all([
              contract.supportsInterface("0x80ac58cd").catch(() => false),
              contract.supportsInterface("0xd9b67a26").catch(() => false),
            ]);
          } catch (e) {}

          // Only try to get decimals if not an NFT contract
          if (!isERC721 && !isERC1155) {
            try {
              const rawDecimals = await contract.decimals();
              decimals = Number(rawDecimals);
              result[chainName]!.decimals = decimals;
            } catch (error) {
              // Skip error logging for known Permit2 contract
              if (!contractInfo.labels?.includes("Permit2")) {
              }
            }
          }

          const [name, symbol, totalSupply, owner] = await Promise.all([
            contract.name().catch(() => null),
            contract.symbol().catch(() => null),
            contract.totalSupply().catch(() => null),
            contract.owner().catch(() => contract.getOwner().catch(() => null)),
          ]);

          // Set contract type
          if (isERC721 || isERC1155) {
            result[chainName]!.contractType = isERC721 ? "ERC721" : "ERC1155";
          } else if (name || symbol || decimals !== undefined || totalSupply) {
            result[chainName]!.contractType = "ERC20";
          }

          // Save contract information
          if (name) result[chainName]!.name = name;
          if (symbol) result[chainName]!.symbol = symbol;
          if (decimals !== undefined) result[chainName]!.decimals = decimals;
          if (totalSupply)
            result[chainName]!.totalSupply = totalSupply.toString();
          if (owner) result[chainName]!.owner = owner;

          // Check proxy contract
          try {
            const implementationResult = await getImplementationAddress(
              address,
              chainName
            );
            if (implementationResult.address) {
              result[chainName] = {
                ...result[chainName],
                implementation: implementationResult.address,
                isProxy: true,
                proxyType: implementationResult.type || "Proxy Contract",
              } as ContractBasicInfo;

              const implContract = new ethers.Contract(
                implementationResult.address,
                [
                  "function name() view returns (string)",
                  "function symbol() view returns (string)",
                  "function decimals() view returns (uint8)",
                  "function totalSupply() view returns (uint256)",
                ],
                provider
              );

              try {
                if (result[chainName]!.decimals === undefined) {
                  try {
                    const rawImplDecimals = await implContract.decimals();
                    const implDecimals = Number(rawImplDecimals);
                    if (implDecimals !== undefined) {
                      result[chainName]!.decimals = implDecimals;
                    }
                  } catch (e) {
                    console.error("Failed to get implementation decimals:", e);
                  }
                }

                const [name, symbol, totalSupply] = await Promise.all([
                  implContract.name().catch(() => null),
                  implContract.symbol().catch(() => null),
                  implContract.totalSupply().catch(() => null),
                ]);

                if (name) result[chainName]!.name = name;
                if (symbol) result[chainName]!.symbol = symbol;
                if (totalSupply)
                  result[chainName]!.totalSupply = totalSupply.toString();
              } catch (e) {
                console.error("Failed to get implementation contract info:", e);
              }
            }
          } catch (e) {
            console.error("Failed to check proxy status:", e);
          }
        } catch (error) {
          console.error(`Failed to check ${chainName}:`, error);
          result[chainName] = { exists: false };
        }
      } catch (error) {
        console.error(`Failed to check ${chainName}:`, error);
        result[chainName] = { exists: false };
      }
    })
  );

  return result;
}

async function fetchContractLabels(
  address: string,
  chain: string
): Promise<{ labels?: string[]; projectName?: string }> {
  return KNOWN_CONTRACTS[address.toLowerCase()] || {};
}

export async function getImplementationAddress(
  proxyAddress: string,
  chain: string
): Promise<{ address: string | null; type: string | null }> {
  try {
    const provider = new ethers.JsonRpcProvider(getRpcUrl(chain), undefined, {
      staticNetwork: true,
    });

    // 1. Check EIP-1967 proxy
    const EIP1967_IMPLEMENTATION_SLOT =
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    let implementation = await provider.getStorage(
      proxyAddress,
      EIP1967_IMPLEMENTATION_SLOT
    );
    if (
      implementation &&
      implementation !== "0x" &&
      implementation !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return {
        address: ethers.getAddress("0x" + implementation.slice(-40)),
        type: "EIP-1967 Proxy",
      };
    }

    // 2. Check UUPS proxy
    const UUPS_BEACON_SLOT =
      "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";
    implementation = await provider.getStorage(proxyAddress, UUPS_BEACON_SLOT);
    if (
      implementation &&
      implementation !== "0x" &&
      implementation !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return {
        address: ethers.getAddress("0x" + implementation.slice(-40)),
        type: "UUPS Proxy",
      };
    }

    // 3. Check transparent proxy
    const TRANSPARENT_PROXY_SLOT =
      "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
    implementation = await provider.getStorage(
      proxyAddress,
      TRANSPARENT_PROXY_SLOT
    );
    if (
      implementation &&
      implementation !== "0x" &&
      implementation !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return {
        address: ethers.getAddress("0x" + implementation.slice(-40)),
        type: "Transparent Proxy",
      };
    }

    // 4. Check beacon proxy
    const BEACON_IMPLEMENTATION_SLOT =
      "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
    const beaconAddress = await provider.getStorage(
      proxyAddress,
      BEACON_IMPLEMENTATION_SLOT
    );
    if (
      beaconAddress &&
      beaconAddress !== "0x" &&
      beaconAddress !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const beacon = new ethers.Contract(
        ethers.getAddress("0x" + beaconAddress.slice(-40)),
        ["function implementation() view returns (address)"],
        provider
      );
      try {
        const beaconImpl = await beacon.implementation();
        if (
          beaconImpl &&
          beaconImpl !== "0x0000000000000000000000000000000000000000"
        ) {
          return {
            address: beaconImpl,
            type: "Beacon Proxy",
          };
        }
      } catch (e) {
        console.log("Failed to get beacon implementation");
      }
    }

    // 5. Try to call contract methods directly
    const proxyContract = new ethers.Contract(
      proxyAddress,
      [
        "function implementation() view returns (address)",
        "function getImplementation() view returns (address)",
        "function masterCopy() view returns (address)",
        "function getProxyImplementation() view returns (address)",
      ],
      provider
    );

    for (const method of [
      "implementation",
      "getImplementation",
      "masterCopy",
      "getProxyImplementation",
    ]) {
      try {
        const impl = await proxyContract[method]();
        if (impl && impl !== "0x0000000000000000000000000000000000000000") {
          return {
            address: impl,
            type: "Generic Proxy",
          };
        }
      } catch (e) {
        continue;
      }
    }

    return { address: null, type: null };
  } catch (error) {
    return { address: null, type: null };
  }
}

export async function fetchCreationCodeFromExplorer(
  chain: string,
  address: string
): Promise<string> {
  const urls =
    chain.toLowerCase() === "avalanche"
      ? [getAVAXCExplorerBytecodeUrl(address)]
      : [getExplorerTokenUrl(chain, address), getExplorerUrl(chain, address)];

  // Try different CORS proxies
  const corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://proxy.cors.sh/",
    "https://cors-anywhere.herokuapp.com/",
    "https://cors.bridged.cc/",
    "https://cors-proxy.htmldriven.com/?url=",
    "https://cors.eu.org/",
    "https://yacdn.org/proxy/",
    "https://cors-proxy.fringe.zone/",
    "https://cors.streamlit.app/",
    "https://crossorigin.me/",
    "https://thingproxy.freeboard.io/fetch/",
  ];

  // Add more headers
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    Origin: `https://${WEBSITE_URL}`,
    Referer: `https://${WEBSITE_URL}`,
    DNT: "1",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
  };

  for (const explorerUrl of urls) {
    try {
      let html = "";
      let proxySuccess = false;

      // Try each proxy until one works
      for (const proxy of corsProxies) {
        try {
          // console.log(`Trying proxy: ${proxy}`);
          const proxyUrl = proxy + encodeURIComponent(explorerUrl);

          const response = await fetch(proxyUrl, {
            headers,
            mode: "cors",
            credentials: "omit",
            redirect: "follow",
            referrerPolicy: "no-referrer-when-downgrade",
          });

          if (response.ok) {
            const text = await response.text();
            // Validate the returned content
            if (
              text &&
              !text.includes("Access Denied") &&
              !text.includes("Too Many Requests")
            ) {
              html = text;
              proxySuccess = true;
              //console.log(`Successfully fetched with proxy: ${proxy}`);
              //await delay(1);
              //await delay(1000);
              break;
            } else {
              //console.log(`Invalid response from proxy: ${proxy}`);
              // await delay(1);
            }
          } else {
            //console.log(`Failed with proxy ${proxy}: ${response.status}`);
            //await delay(1);
          }
        } catch (proxyError) {
          //console.warn(`Error with proxy ${proxy}:`, proxyError);
          continue;
        }
      }

      if (!proxySuccess) {
        continue; // Try next URL if all proxies failed
      }

      const $ = cheerio.load(html);
      //console.log("html:", html);
      let creationCode = "";

      // avalanche chain
      if (chain.toLowerCase() === "avalanche") {
        // find the div contains "Contract Creation Code"
        $('div:contains("Contract Creation Code")').each((_, element) => {
          // find the next pre tag
          const preElement = $(element).nextAll("pre").first();
          const text = preElement.text().trim();
          //console.log("Found text:", text);
          if (text && text.match(/^[0-9a-fA-F]+$/)) {
            creationCode = text;
            //console.log("Found creation code:", creationCode);
          }
        });
      } else {
        // other chains
        const text = $("#verifiedbytecode2").text().trim();
        if (text && text.match(/^[0-9a-fA-F]+$/)) {
          creationCode = text;
        }
      }

      if (creationCode) {
        return creationCode.startsWith("0x")
          ? creationCode
          : "0x" + creationCode;
      }
      // If no creation code found, continue to next URL
    } catch (error) {
      console.error("Error fetching creation code:", error);
      continue; // Try next URL if error occurred
    }
  }

  // Return empty string if all attempts failed
  return "";
}
