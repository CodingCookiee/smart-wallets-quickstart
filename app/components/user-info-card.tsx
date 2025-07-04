import { useState } from "react";
import { ExternalLink, Copy, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAddress } from "@/lib/utils";
import { useUser, useSmartAccountClient } from "@account-kit/react";
import { useEIP7702SmartAccount } from "@/app/hooks/useEIP7702SmartAccount";

export default function UserInfo() {
  const [isCopied, setIsCopied] = useState(false);
  const user = useUser();
  const { client } = useSmartAccountClient({});
  const eip7702 = useEIP7702SmartAccount();

  // Determine wallet type and capabilities
  const isEOA = user?.type === "eoa";
  const hasSmartFeatures = !!client;
  const isSmartEOA = isEOA && eip7702.isSmartEOA;

  // Set appropriate user display name
  const userEmail =
    user?.email ??
    (isSmartEOA ? "Smart EOA (EIP-7702)" : isEOA ? "External Wallet" : "anon");

  // Get the appropriate address - smart account or EOA
  const userAddress = client?.account?.address || user?.address || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(userAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          Your users are always in control of their non-custodial smart wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Email
          </p>
          <p className="font-medium">{userEmail}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-muted-foreground">
              {isSmartEOA
                ? "Smart EOA address"
                : client
                ? "Smart wallet address"
                : "Wallet address"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs py-1 px-2">
              {formatAddress(userAddress)}
            </Badge>
            <TooltipProvider>
              <Tooltip open={isCopied}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copied!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                if (userAddress) {
                  const explorerUrl =
                    client?.chain?.blockExplorers?.default?.url ||
                    "https://sepolia.etherscan.io";
                  window.open(
                    `${explorerUrl}/address/${userAddress}`,
                    "_blank"
                  );
                }
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* EIP-7702 Status Section */}
        {isEOA && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Smart Account Status
              </p>
              <Badge
                variant={
                  isSmartEOA
                    ? eip7702.isDelegated
                      ? "default"
                      : "secondary"
                    : "outline"
                }
              >
                {isSmartEOA
                  ? eip7702.isDelegated
                    ? "EIP-7702 Delegated"
                    : "EIP-7702 Created"
                  : "Standard EOA"}
              </Badge>
            </div>

            {isSmartEOA ? (
              <div className="space-y-2">
                {eip7702.isDelegated ? (
                  <div className="flex items-start gap-2 p-2 bg-green-50 rounded-md">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        ✅ Smart account features active
                      </p>
                      <p className="text-xs text-green-600/80">
                        Gas sponsorship, batching, and session keys available
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        🔄 Smart account created, delegation pending
                      </p>
                      <p className="text-xs text-blue-600/80">
                        Your first transaction will activate smart features
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-orange-600">
                  ⚠️ Standard EOA - You pay gas fees
                </p>
                <p className="text-xs text-muted-foreground">
                  {eip7702.isLoading
                    ? "Checking EIP-7702 support..."
                    : eip7702.errorType === "unsupported"
                    ? "Wallet doesn't support EIP-7702 yet"
                    : eip7702.errorType === "other" && eip7702.error
                    ? eip7702.error
                    : "Smart account features not available"}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
