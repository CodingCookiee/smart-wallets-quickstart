import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
} from "@account-kit/react";
import { alchemy, arbitrumSepolia, sepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { Chain } from "viem";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
if (!API_KEY) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_API_KEY is not set");
}
const PROJECT_ID = process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID;
if (!PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_PROJECT_ID is not set");
}

const SPONSORSHIP_POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID;
if (!SPONSORSHIP_POLICY_ID) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_POLICY_ID is not set");
}

// ✅ ALCHEMY SIGNER (EMBEDDED WALLETS) - ALREADY IMPLEMENTED!
// The following authentication methods all use Alchemy Signer under the hood:
// - Email OTP/Magic Link → Creates smart accounts with gas sponsorship
// - Social Login (Google, Facebook, etc.) → Creates smart accounts with gas sponsorship  
// - Passkey Authentication → Creates smart accounts with gas sponsorship
// - External Wallets → Connects EOAs (user pays gas until EIP-7702 is live)

// 🌐 SUPPORTED NETWORKS
const supportedChains: Chain[] = [
  arbitrumSepolia, 
  sepolia,         
];

// Get default chain from environment or use Arbitrum Sepolia
const getDefaultChain = () => {
  const chainEnv = process.env.NEXT_PUBLIC_DEFAULT_CHAIN;
  switch (chainEnv) {
    case 'sepolia':
      return sepolia;
    case 'arbitrum-sepolia':
      return arbitrumSepolia;
    default:
      return arbitrumSepolia; // Default fallback
  }
};

const DEFAULT_CHAIN = getDefaultChain();

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline", // Options: "outline", "linear", "filled", "flat"
  auth: {
    sections: [
      // Section 1: Email authentication (powered by Alchemy Signer)
      [{ type: "email" }],
      // Section 2: Passkey and Social authentication (powered by Alchemy Signer)
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
        // Additional social providers (uncomment to enable):
        // { type: "social", authProviderId: "github", mode: "popup" },
        // { type: "social", authProviderId: "twitter", mode: "popup" },
      ],
      // Section 3: External wallets (EOAs - user pays gas)
      ...(typeof window !== "undefined" && PROJECT_ID
        ? [
            [
              {
                type: "external_wallets" as const,
                walletConnect: {
                  projectId: PROJECT_ID,
                  showQrModal: false,
                },
              },
            ],
          ]
        : []),
    ],
    addPasskeyOnSignup: false, // Set to true to automatically prompt for passkey after signup
  },
};

export const config = createConfig(
  {
    // 🚀 Multi-network support - Use API key for automatic routing
    transport: alchemy({ apiKey: API_KEY }),
    
    // Set default chain (Arbitrum Sepolia or Ethereum Sepolia)
    chain: DEFAULT_CHAIN,
    
    ssr: false, // Disable SSR to fix chain loading issues
    storage: cookieStorage, // more about persisting state with cookies: https://www.alchemy.com/docs/wallets/react/ssr#persisting-the-account-state
    enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    policyId: SPONSORSHIP_POLICY_ID,
  },
  uiConfig
);

export const queryClient = new QueryClient();
