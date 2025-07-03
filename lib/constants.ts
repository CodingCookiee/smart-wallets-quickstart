import { parseAbi } from "viem";
import { arbitrumSepolia, sepolia } from "@account-kit/infra";

// Chain-specific contract addresses
export const NFT_CONTRACT_ADDRESSES = {
  [arbitrumSepolia.id]: "0x6D1BaA7951f26f600b4ABc3a9CF8F18aBf36fac1",
  [sepolia.id]: "0x6D1BaA7951f26f600b4ABc3a9CF8F18aBf36fac1",
} as const;

export const NFT_MINTABLE_ABI_PARSED = parseAbi([
  "function mintTo(address recipient) returns (uint256)",
  "function baseURI() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
] as const);

// Helper function to get contract address for current chain
export const getNFTContractAddress = (chainId: number): string => {
  const address =
    NFT_CONTRACT_ADDRESSES[chainId as keyof typeof NFT_CONTRACT_ADDRESSES];
  if (!address) {
    // Fallback to Arbitrum Sepolia if chain not supported
    console.warn(
      `NFT contract not found for chain ${chainId}, using Arbitrum Sepolia fallback`
    );
    return NFT_CONTRACT_ADDRESSES[arbitrumSepolia.id];
  }
  return address;
};

// Export supported chain IDs for reference
export const SUPPORTED_CHAIN_IDS = Object.keys(NFT_CONTRACT_ADDRESSES).map(
  Number
);
