"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Loader2, LogOut, Moon, Sun, User } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/hooks/use-mounted";
import { getVisibleNavItems, type NavPermissions } from "@/lib/auth/nav";
import { getNavIcon } from "@/lib/auth/nav-icons";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  fullName?: string | null;
  email?: string | null;
  permissions: NavPermissions;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserMenu({ fullName, email, permissions }: UserMenuProps) {
  const displayName = fullName?.trim() || email || "User";
  const initials = getInitials(displayName);
  const userMenuItems = getVisibleNavItems(permissions, "user-menu");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "max-w-[200px] gap-2 pl-1",
            )}
            aria-label="Open user menu"
          >
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden truncate sm:inline">{displayName}</span>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => router.push("/profile")}
            >
              <span className="font-medium">{displayName}</span>
              {email ? (
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              ) : null}
            </button>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User />
          Profile
        </DropdownMenuItem>
        {userMenuItems.map((item) => {
          const Icon = getNavIcon(item.href);
          return (
            <DropdownMenuItem
              key={item.href}
              onClick={() => router.push(item.href)}
            >
              <Icon />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuItem
          disabled={!mounted}
          onClick={() =>
            mounted && setTheme(theme === "dark" ? "light" : "dark")
          }
        >
          {mounted && theme === "dark" ? <Sun /> : <Moon />}
          {mounted && theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={handleSignOut}
        >
          {isSigningOut ? (
            <Loader2 className="animate-spin" />
          ) : (
            <LogOut />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
