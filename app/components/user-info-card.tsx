import { useState } from "react";
import { ExternalLink, Copy } from "lucide-react";
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

export default function UserInfo() {
  const [isCopied, setIsCopied] = useState(false);
  const user = useUser();
  const { client } = useSmartAccountClient({});
  
  // Determine wallet type and capabilities
  const isEOA = user?.type === 'eoa';
  const hasSmartFeatures = !!client;
  const isSmartEOA = isEOA && hasSmartFeatures;
  
  // Set appropriate user display name
  const userEmail = user?.email ?? 
    (isSmartEOA ? 'Smart EOA (EIP-7702)' : 
     isEOA ? 'External Wallet' : "anon");
  
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
              {isSmartEOA ? "Smart EOA address" : 
               client ? "Smart wallet address" : "Wallet address"}
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
                  const explorerUrl = client?.chain?.blockExplorers?.default?.url || "https://sepolia.arbiscan.io";
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
      </CardContent>
    </Card>
  );
}
