import { parseAbi } from "viem";
import { arbitrumSepolia, sepolia } from "@account-kit/infra";

// Chain-specific contract addresses
export const NFT_CONTRACT_ADDRESSES = {
  [arbitrumSepolia.id]: "0x6D1BaA7951f26f600b4ABc3a9CF8F18aBf36fac1",
  [sepolia.id]: "0x6D1BaA7951f26f600b4ABc3a9CF8F18aBf36fac1", // Replace with actual Sepolia contract address
} as const;

export const NFT_MINTABLE_ABI_PARSED = parseAbi([
  "function mintTo(address recipient) returns (uint256)",
  "function baseURI() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
] as const);

// Helper function to get contract address for current chain
export const getNFTContractAddress = (chainId: number): string => {
  const address = NFT_CONTRACT_ADDRESSES[chainId as keyof typeof NFT_CONTRACT_ADDRESSES];
  if (!address) {
    throw new Error(`NFT contract not deployed on chain ${chainId}`);
  }
  return address;
};
