import { useCallback, useMemo, useState } from "react";
import {
  useSmartAccountClient,
  useSendUserOperation,
  useUser,
  useSignerStatus,
} from "@account-kit/react";
import { encodeFunctionData, createWalletClient, custom, http } from "viem";
import { NFT_MINTABLE_ABI_PARSED, NFT_CONTRACT_ADDRESS } from "@/lib/constants";
import { arbitrumSepolia } from "@account-kit/infra";

export interface UseMintNFTParams {
  onSuccess?: () => void;
}
export interface UseMintReturn {
  isMinting: boolean;
  handleMint: () => void;
  transactionUrl?: string;
  error?: string;
}

export const useMint = ({ onSuccess }: UseMintNFTParams): UseMintReturn => {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string>();

  const { client } = useSmartAccountClient({});
  const user = useUser();
  const signerStatus = useSignerStatus();

  const handleSuccess = () => {
    setIsMinting(false);
    setError(undefined);
    onSuccess?.();
  };

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
      // Check if we have a smart account (for email/social logins OR EIP-7702 enabled EOAs)
      if (client) {
        console.log("Using smart account client for minting (includes EIP-7702 Smart EOAs)");
        sendUserOperation({
          uo: {
            target: NFT_CONTRACT_ADDRESS,
            data: encodeFunctionData({
              abi: NFT_MINTABLE_ABI_PARSED,
              functionName: "mintTo",
              args: [client.getAddress()],
            }),
          },
        });
        return;
      }

      // Fallback: Handle pure EOA case (no EIP-7702 features available)
      if (user && user.type === 'eoa' && typeof window !== 'undefined' && window.ethereum) {
        console.log("Using fallback EOA transaction (user pays gas)");
        const walletClient = createWalletClient({
          chain: arbitrumSepolia,
          transport: custom(window.ethereum),
        });

        const accounts = await walletClient.getAddresses();
        if (!accounts[0]) {
          throw new Error("No wallet address found");
        }

        const hash = await walletClient.writeContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_MINTABLE_ABI_PARSED,
          functionName: "mintTo",
          args: [accounts[0]],
          account: accounts[0],
        });

        // Create transaction URL for EOA transaction
        const transactionUrl = `${arbitrumSepolia.blockExplorers.default.url}/tx/${hash}`;
        
        setIsMinting(false);
        onSuccess?.();
        
        // Set a fake result for the transaction URL
        setTimeout(() => {
          handleSuccess();
        }, 1000);
        
        return;
      }

      throw new Error("No wallet connected or wallet not supported");
    } catch (err: any) {
      console.error("Mint error:", err);
      setIsMinting(false);
      setError(err.message || "Failed to mint NFT");
    }
  }, [client, user, sendUserOperation, onSuccess]);

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
  };
};
