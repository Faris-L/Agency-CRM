"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { CURRENCY_SYMBOL } from "@/lib/constants/app";
import type { RevenueMonth } from "@/lib/queries/dashboard";

type RevenueChartsProps = {
  data: RevenueMonth[];
};

const CHART_COLOR = "oklch(0.511 0.262 276.966)";

function formatCurrency(value: number) {
  return `${CURRENCY_SYMBOL}${value.toLocaleString("en-US")}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-primary">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export function RevenueByMonthChart({ data }: RevenueChartsProps) {
  const hasData = data.some((item) => item.revenue > 0);

  return (
    <ChartCard
      title="Revenue by Month"
      description="Paid invoices grouped by month"
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${CURRENCY_SYMBOL}${value}`}
              className="fill-muted-foreground"
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="revenue" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          No paid invoices yet
        </div>
      )}
    </ChartCard>
  );
}

export function RevenueTrendChart({ data }: RevenueChartsProps) {
  const hasData = data.some((item) => item.revenue > 0);

  return (
    <ChartCard title="Revenue Trend" description="Six-month revenue trajectory">
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${CURRENCY_SYMBOL}${value}`}
              className="fill-muted-foreground"
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={CHART_COLOR}
              strokeWidth={2}
              dot={{ fill: CHART_COLOR, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          No paid invoices yet
        </div>
      )}
    </ChartCard>
  );
}

export function TaskCompletionMetric({
  rate,
  completed,
  total,
}: {
  rate: number;
  completed: number;
  total: number;
}) {
  return (
    <ChartCard
      title="Task Completion Rate"
      description={`${completed} of ${total} tasks completed`}
    >
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative flex size-36 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-muted"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={CHART_COLOR}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${rate} ${100 - rate}`}
            />
          </svg>
          <span className="absolute text-3xl font-bold">{rate}%</span>
        </div>
      </div>
    </ChartCard>
  );
}
