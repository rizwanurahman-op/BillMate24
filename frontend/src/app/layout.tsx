import type { Metadata } from "next";
import { Inter, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { LanguageSync } from "@/components/app/language-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoMalayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-malayalam",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BillMate24",
  description: "Advanced Ledger & Smart Billing Solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoMalayalam.variable} font-sans antialiased`} suppressHydrationWarning>
        <LanguageSync />
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
