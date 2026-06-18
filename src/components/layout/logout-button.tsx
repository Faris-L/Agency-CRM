"use client";

import { signOut } from "@/actions/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await signOut();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Signing out…
        </>
      ) : (
        "Sign out"
      )}
    </Button>
  );
}
