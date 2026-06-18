import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME } from "@/lib/constants/app";
import { fontMono, fontSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Agency CRM`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Manage clients, projects, tasks, invoices, and team activity from one premium dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
