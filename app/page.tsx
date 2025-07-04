"use client";

import { useSignerStatus, useUser } from "@account-kit/react";
import { useEffect, useState } from "react";
import UserInfoCard from "./components/user-info-card";
import NftMintCard from "./components/nft-mint-card";
import LoginCard from "./components/login-card";
import Header from "./components/header";
// import LearnMore from "./components/learn-more";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const signerStatus = useSignerStatus();
  const user = useUser();
  
  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-8 h-full">
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if user is connected via external wallet or smart account
  const isUserConnected = signerStatus.isConnected || (user && user.type === 'eoa');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <div className="bg-bg-main bg-cover bg-center bg-no-repeat h-[calc(100vh-4rem)]">
        <main className="container mx-auto px-4 py-8 h-full">
          {isUserConnected ? (
            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-8">
                <UserInfoCard />
                {/* <LearnMore /> */}
              </div>
              <NftMintCard />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full pb-[4rem]">
              <LoginCard />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
