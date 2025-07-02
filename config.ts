import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
} from "@account-kit/react";
import { alchemy, arbitrumSepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";

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
// - External Wallets → Connects EOAs (user pays gas)

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
    transport: alchemy({ apiKey: API_KEY }),
    // Note: This quickstart is configured for Arbitrum Sepolia.
    chain: arbitrumSepolia,
    ssr: true, // more about ssr: https://www.alchemy.com/docs/wallets/react/ssr
    storage: cookieStorage, // more about persisting state with cookies: https://www.alchemy.com/docs/wallets/react/ssr#persisting-the-account-state
    enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    policyId: SPONSORSHIP_POLICY_ID,
    
    // ⚡ EIP-7702 Smart EOAs - ENABLED! 
    // This allows external wallets (EOAs) to gain smart account features
    // while keeping the same address. Provides gas sponsorship and more!
    sessionConfig: {
      eip7702: {
        enable: true, // ✅ Active - EOAs can now use smart account features
      },
    },
  },
  uiConfig
);

export const queryClient = new QueryClient();
