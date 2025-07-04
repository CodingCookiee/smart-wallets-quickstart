import { useCallback, useMemo, useState } from "react";
import {
  useSmartAccountClient,
  useSendUserOperation,
  useUser,
  useSignerStatus,
  useChain,
} from "@account-kit/react";
import { encodeFunctionData, createWalletClient, custom } from "viem";
import {
  NFT_MINTABLE_ABI_PARSED,
  getNFTContractAddress,
} from "@/lib/constants";
import { useEIP7702SmartAccount } from "./useEIP7702SmartAccount";

export interface UseMintNFTParams {
  onSuccess?: () => void;
}
export interface UseMintReturn {
  isMinting: boolean;
  handleMint: () => void;
  transactionUrl?: string;
  error?: string;
  needsDelegation?: boolean;
}

export const useMint = ({ onSuccess }: UseMintNFTParams): UseMintReturn => {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string>();

  const { client } = useSmartAccountClient({});
  const eip7702 = useEIP7702SmartAccount();
  const user = useUser();
  const signerStatus = useSignerStatus();
  const { chain } = useChain();

  const handleSuccess = useCallback(() => {
    setIsMinting(false);
    setError(undefined);
    onSuccess?.();
  }, [onSuccess]);

  const handleError = (error: Error) => {
    console.error("Mint error:", error);
    setIsMinting(false);
    setError(error.message || "Failed to mint NFT");
  };

  const { sendUserOperationResult, sendUserOperation } = useSendUserOperation({
    client,
    waitForTxn: true,
    onError: handleError,
    onSuccess: handleSuccess,
    onMutate: () => {
      setIsMinting(true);
      setError(undefined);
    },
  });

  const handleMint = useCallback(async () => {
    setIsMinting(true);
    setError(undefined);

    try {
      if (!chain) {
        throw new Error("No chain selected");
      }

      // Check if wallet is on the correct chain for EOA transactions
      if (
        user?.type === "eoa" &&
        typeof window !== "undefined" &&
        (window as any).ethereum
      ) {
        try {
          const currentChainId = await (window as any).ethereum.request({
            method: "eth_chainId",
          });
          const currentChainIdDecimal = parseInt(currentChainId, 16);

          if (currentChainIdDecimal !== chain.id) {
            console.warn(
              `Wallet on chain ${currentChainIdDecimal}, but app expects chain ${chain.id}`
            );

            // Try to switch chain
            try {
              await (window as any).ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${chain.id.toString(16)}` }],
              });
              console.log("✅ Switched to correct chain");
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                // Chain not added to wallet, add it
                await (window as any).ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: `0x${chain.id.toString(16)}`,
                      chainName: chain.name,
                      nativeCurrency: chain.nativeCurrency,
                      rpcUrls: [chain.rpcUrls.default.http[0]],
                      blockExplorerUrls: chain.blockExplorers
                        ? [chain.blockExplorers.default.url]
                        : [],
                    },
                  ],
                });
                console.log("✅ Added and switched to chain");
              } else {
                throw new Error(`Please switch your wallet to ${chain.name}`);
              }
            }
          }
        } catch (chainError: any) {
          console.error("Chain check/switch error:", chainError);
          throw new Error(`Please switch your wallet to ${chain.name}`);
        }
      }

      const contractAddress = getNFTContractAddress(chain.id);

      // Priority 1: Use EIP-7702 Smart Account if available and delegated
      if (eip7702.client && eip7702.isSmartEOA) {
        console.log("🚀 Using EIP-7702 Smart Account");

        try {
          // If not delegated, delegate first
          if (!eip7702.isDelegated) {
            console.log("🔄 Account not delegated yet, delegating first...");
            await eip7702.delegateAccount();
          }

          // Now mint with the delegated smart account
          const uoHash = await eip7702.client.sendUserOperation({
            uo: {
              target: contractAddress,
              data: encodeFunctionData({
                abi: NFT_MINTABLE_ABI_PARSED,
                functionName: "mintTo",
                args: [await eip7702.client.getAddress()],
              }),
            },
          });

          console.log("📝 EIP-7702 User Operation Hash:", uoHash);
          const txHash = await eip7702.client.waitForUserOperationTransaction(
            uoHash
          );
          console.log("✅ EIP-7702 transaction completed:", txHash);
          console.log(
            "🎉 Your EOA now has smart account features at the same address!"
          );

          handleSuccess();
          return;
        } catch (eip7702Error: any) {
          console.error(
            "EIP-7702 transaction failed, falling back to regular EOA:",
            eip7702Error
          );
          // Continue to fallback EOA transaction
        }
      }
      // Priority 2: Use regular smart account client (for email/social logins)
      if (client) {
        console.log("Using regular smart account client for minting");
        sendUserOperation({
          uo: {
            target: contractAddress,
            data: encodeFunctionData({
              abi: NFT_MINTABLE_ABI_PARSED,
              functionName: "mintTo",
              args: [client.getAddress()],
            }),
          },
        });
        return;
      }

      // Priority 3: Fallback to regular EOA transaction (user pays gas)
      if (
        user &&
        user.type === "eoa" &&
        user.address &&
        typeof window !== "undefined" &&
        window.ethereum
      ) {
        console.log(
          "⚠️  Using fallback EOA transaction (user pays gas) - EIP-7702 unavailable"
        );
        const walletClient = createWalletClient({
          chain: chain,
          transport: custom(window.ethereum),
        });

        // Use the user address from Account Kit
        const userAddress = user.address;

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: NFT_MINTABLE_ABI_PARSED,
          functionName: "mintTo",
          args: [userAddress],
          account: userAddress,
        });

        console.log("✅ EOA transaction completed:", hash);
        handleSuccess();
        return;
      }

      throw new Error("No wallet connected or wallet not supported");
    } catch (err: any) {
      console.error("Mint error:", err);
      setIsMinting(false);
      setError(err.message || "Failed to mint NFT");
    }
  }, [client, eip7702, user, sendUserOperation, chain, handleSuccess]);

  const transactionUrl = useMemo(() => {
    if (!client?.chain?.blockExplorers || !sendUserOperationResult?.hash) {
      return undefined;
    }
    return `${client.chain.blockExplorers.default.url}/tx/${sendUserOperationResult.hash}`;
  }, [client, sendUserOperationResult?.hash]);

  return {
    isMinting,
    handleMint,
    transactionUrl,
    error,
    needsDelegation: eip7702.isSmartEOA && !eip7702.isDelegated,
  };
};
