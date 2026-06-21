"use client";

import { DollarSign, FileCheck, TrendingUp, Wallet } from "lucide-react";
import {
  RevenueByMonthChart,
  RevenueTrendChart,
} from "@/components/dashboard/revenue-charts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CURRENCY_SYMBOL } from "@/lib/constants/app";
import type { RevenuePageData } from "@/lib/queries/revenue";

type RevenueViewProps = RevenuePageData;

function formatCurrency(value: number) {
  return `${CURRENCY_SYMBOL}${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function RevenueView({
  stats,
  revenueByMonth,
  profitableClients,
}: RevenueViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        description="Track your agency's financial performance and client profitability."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description="All paid invoices"
          icon={DollarSign}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          description="Paid this month"
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Revenue"
          value={formatCurrency(stats.pendingRevenue)}
          description="Pending & overdue"
          icon={Wallet}
        />
        <StatCard
          title="Paid Invoices"
          value={stats.paidInvoiceCount}
          description="Total paid count"
          icon={FileCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueByMonthChart data={revenueByMonth} />
        <RevenueTrendChart data={revenueByMonth} />
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b px-4 py-4">
          <h2 className="text-lg font-semibold">Most Profitable Clients</h2>
          <p className="text-sm text-muted-foreground">
            Ranked by total paid invoice revenue
          </p>
        </div>

        {profitableClients.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No paid invoices yet — revenue data will appear here.
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1fr_auto] gap-4 border-b px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
              <span>Client</span>
              <span className="text-right">Total Revenue</span>
            </div>
            <ul className="divide-y">
              {profitableClients.map((client) => (
                <li
                  key={client.name}
                  className="grid gap-2 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
                >
                  <p className="font-medium">{client.name}</p>
                  <p className="font-semibold text-primary sm:text-right">
                    {formatCurrency(client.totalRevenue)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
