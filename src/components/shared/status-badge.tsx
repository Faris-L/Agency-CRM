import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Lead: "outline",
  Active: "default",
  Inactive: "secondary",
  Planning: "outline",
  "In Progress": "default",
  Review: "secondary",
  Completed: "default",
  Todo: "outline",
  Doing: "default",
  Done: "secondary",
  Low: "outline",
  Medium: "secondary",
  High: "default",
  Pending: "outline",
  Paid: "default",
  Overdue: "destructive",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "outline"} className={cn(className)}>
      {status}
    </Badge>
  );
}
