import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: BRAND.productName,
  description: `${BRAND.productName} — school administration by ${BRAND.companyName}`,
  icons: {
    icon: BRAND.logoIcon,
    shortcut: BRAND.logoIcon,
    apple: BRAND.logoIcon,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
