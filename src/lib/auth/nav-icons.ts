import {
  CheckSquare,
  Columns3,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  TrendingUp,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/clients": Users,
  "/projects": FolderKanban,
  "/kanban": Columns3,
  "/tasks": CheckSquare,
  "/invoices": FileText,
  "/revenue": TrendingUp,
  "/team": UsersRound,
  "/profile": User,
  "/billing": CreditCard,
  "/settings": Settings,
};

export function getNavIcon(href: string): LucideIcon {
  return NAV_ICONS[href] ?? LayoutDashboard;
}
