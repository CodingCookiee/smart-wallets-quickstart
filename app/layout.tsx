import { config } from "@/config";
import { cookieToInitialState } from "@account-kit/core";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Account Kit Quickstart",
  description: "Account Kit Quickstart NextJS Template",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Persist state across pages with proper error handling
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  
  let initialState;
  try {
    initialState = cookieToInitialState(config, cookieHeader ?? undefined);
  } catch (error) {
    console.warn("Failed to parse initial state from cookies:", error);
    initialState = undefined;
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
