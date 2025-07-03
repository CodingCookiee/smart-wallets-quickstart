import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogout, useSignerStatus, useUser } from "@account-kit/react";
import Image from "next/image";
import NetworkSwitcher from "./network-switcher";

export default function Header() {
  const { logout } = useLogout();
  const { isConnected } = useSignerStatus();
  const user = useUser();
  
  // Check if user is connected via external wallet or smart account
  const isUserConnected = isConnected || (user && user.type === 'eoa');

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/smart-wallets.svg"
            alt="Smart Wallets"
            width={200}
            height={26}
            className="h-6 w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* {isUserConnected &&  */}
          <NetworkSwitcher/>
           {/* } */}
          {isUserConnected && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
