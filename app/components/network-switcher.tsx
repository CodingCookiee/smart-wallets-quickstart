"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Network } from "lucide-react";
import { useSmartAccountClient } from "@account-kit/react";
import { arbitrumSepolia, sepolia } from "@account-kit/infra";

const networks = [
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chain: arbitrumSepolia,
    rpcUrl: "https://arb-sepolia.g.alchemy.com/v2/OwiruqKJWcO4FRxPBu-7a"
  },
  {
    id: 'ethereum-sepolia', 
    name: 'Ethereum Sepolia',
    chain: sepolia,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/OwiruqKJWcO4FRxPBu-7a"
  }
];

export default function NetworkSwitcher() {
  const { client } = useSmartAccountClient({});
  const [isLoading, setIsLoading] = useState(false);
  
  const currentNetwork = networks.find(n => n.chain.id === client?.chain?.id) || networks[0];

  const handleNetworkSwitch = async (network: typeof networks[0]) => {
    if (network.chain.id === client?.chain?.id) return;
    
    setIsLoading(true);
    try {
      // Request wallet to switch networks (for external wallets)
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chain.id.toString(16)}` }],
        });
      }
      // Note: For smart accounts, network switching is handled automatically
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!client) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
          <Network className="h-4 w-4" />
          <span className="hidden sm:inline">{currentNetwork.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => handleNetworkSwitch(network)}
            className={network.chain.id === currentNetwork.chain.id ? "bg-muted" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{network.name}</span>
              <span className="text-xs text-muted-foreground">
                {network.chain.id === currentNetwork.chain.id && "✓ Active"}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
