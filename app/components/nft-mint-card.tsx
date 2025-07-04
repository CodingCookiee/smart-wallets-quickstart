import { useState, useEffect } from "react";
import {
  ExternalLink,
  Loader2,
  PlusCircle,
  ImageIcon,
  CheckCircle,
  Info,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useReadNFTData } from "@/app/hooks/useReadNFTData";
import { useMint } from "@/app/hooks/useMintNFT";
import { useSmartAccountClient, useUser, useChain } from "@account-kit/react";
import { useEIP7702SmartAccount } from "@/app/hooks/useEIP7702SmartAccount";
import { getNFTContractAddress } from "@/lib/constants";

export default function NftMintCard() {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);

  const { client } = useSmartAccountClient({});
  const user = useUser();
  const { chain } = useChain();
  const eip7702 = useEIP7702SmartAccount();

  // Determine wallet type and capabilities
  const isEOA = user?.type === "eoa";
  const hasSmartFeatures = !!client; // True for both smart accounts and EIP-7702 Smart EOAs
  const isSmartEOA = isEOA && eip7702.isSmartEOA; // EIP-7702 enabled EOA
  const isPureEOA = isEOA && !hasSmartFeatures; // Traditional EOA without smart features

  // Get contract address for current chain - fallback to arbitrum sepolia
  const contractAddress = chain
    ? getNFTContractAddress(chain.id)
    : getNFTContractAddress(421614);

  const { uri, count, isLoadingCount, refetchCount } = useReadNFTData({
    contractAddress,
    ownerAddress: client?.account?.address || user?.address,
  });

  const { isMinting, handleMint, error, transactionUrl, needsDelegation } =
    useMint({
      onSuccess: () => {
        refetchCount();
      },
    });

  // Reset success animation when new transaction appears
  useEffect(() => {
    if (transactionUrl) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [transactionUrl]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="mb-2">
              Mint an NFT {hasSmartFeatures && "with no gas fees"}
              {isSmartEOA && " (Smart EOA)"}
            </CardTitle>
            <CardDescription>
              {isEOA &&
                "Mint using your external wallet. You'll pay gas fees until EIP-7702 is live."}
              {!isEOA &&
                "Users can mint, trade, and swap with no gas fees or signing through gas sponsorship. Try it out."}
            </CardDescription>
          </div>
          <Badge
            className="ml-2 px-4 py-2 flex items-center justify-center whitespace-nowrap text-lg font-semibold"
            variant="outline"
          >
            {isLoadingCount ? "..." : count ?? 0} NFTs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary/40" />
              </div>
            </div>
          )}
          <div className="aspect-[4/3] md:aspect-[16/9] w-full relative">
            <Image
              src={uri ?? ""}
              alt="NFT Image"
              fill
              className={cn(
                "object-cover transition-opacity duration-500",
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsImageLoading(false)}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="font-semibold text-lg text-white">
              Smart Wallet Quickstart NFT
            </h3>
            <p className="text-sm opacity-90 text-white">
              Demo collection • Gas-free minting
            </p>
          </div>
        </div>

        {/* EIP-7702 Status */}
        {isSmartEOA && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-600">
                  <strong>EIP-7702 Smart EOA:</strong>{" "}
                  {eip7702.isDelegated
                    ? "Delegated & Ready"
                    : "Created but not delegated"}
                </p>
                {!eip7702.isDelegated && (
                  <p className="text-xs text-blue-500 mt-1">
                    Your first transaction will delegate your EOA to enable
                    smart features.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delegation needed warning */}
        {needsDelegation && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-600">
                <strong>Delegation Required:</strong> Your EOA needs to be
                delegated first to enable smart features. This will happen
                automatically on your first transaction.
              </p>
            </div>
          </div>
        )}

        {/* Regular EOA info */}
        {isEOA && !isSmartEOA && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-600">
                <strong>Standard EOA:</strong>{" "}
                {eip7702.error ||
                  "EIP-7702 not available. You'll pay gas fees for transactions."}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 break-words overflow-hidden">
              Error: {error}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
          <Button
            className="w-full sm:w-auto gap-2 relative overflow-hidden group"
            size="lg"
            onClick={handleMint}
            disabled={isMinting || eip7702.isLoading}
          >
            <span
              className={cn(
                "flex items-center gap-2 transition-transform duration-300",
                isMinting ? "translate-y-10" : ""
              )}
            >
              <PlusCircle className="h-[18px] w-[18px]" />
              {needsDelegation ? "Delegate & Mint NFT" : "Mint New NFT"}
            </span>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-transform duration-300",
                isMinting ? "translate-y-0" : "translate-y-10"
              )}
            >
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              {needsDelegation ? "Delegating..." : "Minting..."}
            </span>
          </Button>

          <div className="flex-1"></div>

          {transactionUrl && (
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "gap-2 w-full sm:w-auto relative overflow-hidden transition-all duration-500",
                "border-green-400 text-green-700 hover:bg-green-50",
                "animate-in fade-in duration-700"
              )}
            >
              <Link
                href={transactionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {showSuccess ? (
                  <>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-10"
                      style={{
                        animation: "sweep 1.5s ease-out",
                      }}
                    />
                    <span className="relative z-10">Successful mint!</span>
                    <CheckCircle className="h-4 w-4 relative z-10" />
                    <style jsx>{`
                      @keyframes sweep {
                        0% {
                          transform: translateX(-100%);
                          opacity: 0;
                        }
                        50% {
                          opacity: 0.2;
                        }
                        100% {
                          transform: translateX(100%);
                          opacity: 0;
                        }
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <span>View Transaction</span>
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
