import { useCallback, useEffect, useState } from "react";
import { useUser, useChain } from "@account-kit/react";
import { createModularAccountV2Client } from "@account-kit/smart-contracts";
import { alchemy } from "@account-kit/infra";
import { WalletClientSigner } from "@aa-sdk/core";
import { createWalletClient, custom } from "viem";

interface EIP7702SmartAccountClient {
  client: any | null;
  isLoading: boolean;
  isSmartEOA: boolean;
  isDelegated: boolean;
  error: string | null;
  errorType: "unsupported" | "not_delegated" | "other" | null;
  delegateAccount: () => Promise<void>;
}

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!;
const POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID!;

export const useEIP7702SmartAccount = (): EIP7702SmartAccountClient => {
  const [client, setClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "unsupported" | "not_delegated" | "other" | null
  >(null);
  const [isSmartEOA, setIsSmartEOA] = useState(false);
  const [isDelegated, setIsDelegated] = useState(false);

  const user = useUser();
  const { chain } = useChain();

  const checkDelegationStatus = useCallback(
    async (smartAccountClient: any, originalAddress: string) => {
      try {
        // Check if the EOA has been delegated by checking if it has code
        const walletClient = createWalletClient({
          chain: chain!,
          transport: custom((window as any).ethereum),
        });

        const code = await walletClient.getCode({
          address: originalAddress as `0x${string}`,
        });
        const hasDelegated = code && code !== "0x";

        console.log(
          "EOA delegation status:",
          hasDelegated ? "Delegated" : "Not delegated"
        );
        console.log("Code at address:", code);

        setIsDelegated(!!hasDelegated);
        return !!hasDelegated;
      } catch (err) {
        console.error("Failed to check delegation status:", err);
        setIsDelegated(false);
        return false;
      }
    },
    [chain]
  );

  const delegateAccount = useCallback(async () => {
    if (!client || !user?.address) {
      throw new Error("No client or user address available");
    }

    setIsLoading(true);
    try {
      console.log("🔄 Delegating EOA to smart account...");

      // The first transaction will automatically delegate the EOA
      // We'll do a simple self-transfer to trigger delegation
      const uoHash = await client.sendUserOperation({
        uo: {
          target: user.address,
          data: "0x", // Empty data for self-transfer
          value: 0n, // No value transfer
        },
      });

      console.log("📝 Delegation User Operation Hash:", uoHash);
      const txHash = await client.waitForUserOperationTransaction(uoHash);
      console.log("✅ Delegation transaction completed:", txHash);

      // Check delegation status after transaction
      await checkDelegationStatus(client, user.address);

      console.log("🎉 EOA successfully delegated to smart account!");
    } catch (err: any) {
      console.error("Failed to delegate account:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, user?.address, checkDelegationStatus]);

  const createEIP7702Client = useCallback(async () => {
    if (
      !user ||
      user.type !== "eoa" ||
      !chain ||
      typeof window === "undefined"
    ) {
      setClient(null);
      setIsSmartEOA(false);
      setIsDelegated(false);
      setError(null);
      setErrorType(null);
      return;
    }

    // Only proceed if we have a user address (wallet is connected)
    if (!user.address) {
      console.log("⏳ Waiting for wallet connection...");
      setClient(null);
      setIsSmartEOA(false);
      setIsDelegated(false);
      setError(null);
      setErrorType(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // Use the user address from the Account Kit user object
      const originalEOAAddress = user.address;
      console.log("Chain:", chain.name);
      console.log("Creating client for address:", originalEOAAddress);

      // Create wallet client with explicit account for EIP-7702
      const walletClient = createWalletClient({
        account: originalEOAAddress,
        chain: chain,
        transport: custom((window as any).ethereum),
      });

      // Check if wallet supports EIP-7702 authorization
      const supportsSignAuthorization =
        typeof (walletClient as any).signAuthorization === "function";
      console.log(
        "Wallet supports signAuthorization:",
        supportsSignAuthorization
      );

      if (!supportsSignAuthorization) {
        setError("Wallet does not support EIP-7702 authorization signatures");
        setErrorType("unsupported");
        setClient(null);
        setIsSmartEOA(false);
        setIsDelegated(false);
        return;
      }

      // Create WalletClientSigner for EIP-7702 with explicit account
      const signer = new WalletClientSigner(walletClient, "external");

      // Verify signer has the correct address
      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);

      if (
        !signerAddress ||
        signerAddress.toLowerCase() !== originalEOAAddress.toLowerCase()
      ) {
        throw new Error(
          `Signer address mismatch. Expected: ${originalEOAAddress}, Got: ${signerAddress}`
        );
      }

      // Create Modular Account V2 client with EIP-7702 mode
      const smartAccountClient = await createModularAccountV2Client({
        mode: "7702", // 🔑 This enables EIP-7702 delegation
        transport: alchemy({ apiKey: API_KEY }),
        chain: chain,
        signer,
        policyId: POLICY_ID, // Enable gas sponsorship
      });

      const smartAccountAddress = await smartAccountClient.getAddress();

      console.log("🎉 EIP-7702 Smart Account created!");
      console.log("Original EOA address:", originalEOAAddress);
      console.log("Smart Account address:", smartAccountAddress);

      // Check if this is actually EIP-7702 (same address) or traditional smart account
      const isActuallyEIP7702 =
        smartAccountAddress.toLowerCase() === originalEOAAddress.toLowerCase();

      if (isActuallyEIP7702) {
        console.log(
          "✅ TRUE EIP-7702: Smart features at your original EOA address!"
        );
        setClient(smartAccountClient);
        setIsSmartEOA(true);
        setError(null);
        setErrorType(null);

        // Check if already delegated
        await checkDelegationStatus(smartAccountClient, originalEOAAddress);
      } else {
        console.warn(
          "⚠️  NOT EIP-7702: Created traditional smart account with new address"
        );
        console.warn(
          "This means your wallet doesn't support EIP-7702 authorization signatures"
        );
        setClient(null);
        setIsSmartEOA(false);
        setIsDelegated(false);
        setError(
          "Wallet does not support EIP-7702 - created traditional smart account instead"
        );
        setErrorType("unsupported");
      }
    } catch (err: any) {
      console.error("Failed to create EIP-7702 Smart Account:", err);

      // Check if it's a wallet support issue
      if (
        err.message.includes("signAuthorization") ||
        err.message.includes("authorization")
      ) {
        setError("Wallet does not support EIP-7702 authorization signatures");
        setErrorType("unsupported");
      } else {
        setError(err.message || "Failed to create smart account");
        setErrorType("other");
      }

      setClient(null);
      setIsSmartEOA(false);
      setIsDelegated(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, chain, checkDelegationStatus]);

  useEffect(() => {
    createEIP7702Client();
  }, [createEIP7702Client]);

  return {
    client,
    isLoading,
    isSmartEOA,
    isDelegated,
    error,
    errorType,
    delegateAccount,
  };
};
