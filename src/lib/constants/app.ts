export const CLIENT_STATUSES = ["Lead", "Active", "Inactive"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "Review",
  "Completed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["Todo", "Doing", "Done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const INVOICE_STATUSES = ["Pending", "Paid", "Overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const CURRENCY = "USD";
export const CURRENCY_SYMBOL = "$";

export const APP_NAME = "Studioflow";
