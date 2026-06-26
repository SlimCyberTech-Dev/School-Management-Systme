import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { OrganizationJsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { rootMetadata } from "@/lib/seo";
import { themeInitScript } from "@/lib/theme";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata = rootMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-UG" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className={`${inter.variable} ${display.variable} min-h-screen font-sans antialiased`}>
        <OrganizationJsonLd />
        <Providers>
          <ScrollProgressBar />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppFab />
          </div>
        </Providers>
      </body>
    </html>
  );
}
