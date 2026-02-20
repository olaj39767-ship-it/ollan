

import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Geist } from 'next/font/google'
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Script from "next/script";
import ClientLayout from "./components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ollanpharmacy.ng"),
  title: {
    default: "Ollan Pharmacy | Buy Genuine Drugs & Groceries Online in Ibadan",
    template: "%s | Ollan Pharmacy - Trusted Healthcare Since 1985"
  },
  description: "Shop trusted medications, wellness products, and groceries at Ollan Pharmacy - Ibadan's most reliable online pharmacy and supermarket. Fast delivery, affordable prices, expert pharmacist support since 1985. Licensed by PCN.",
  keywords: [
    "Pharmacy in ibadan", 
    "Buy drugs online in ibadan", 
    "Online pharmacy Nigeria", 
    "Ibadan pharmacy delivery"
  ],
  authors: [{ name: "Ollan Pharmacy Team" }],
  creator: "Ollan Pharmacy Nigeria Limited",
  publisher: "Ollan Pharmacy Nigeria Limited",
  category: "Healthcare & Pharmacy",
  classification: "Healthcare Services",
  
  verification: {
    google: "r5-hh0PGASGqnNbQHVfxvJvac_4zvgH0TXOl7IlB2i0",
  },
  
  // PWA-specific metadata
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ollan Pharmacy",
  },
  
  openGraph: {
    title: "Ollan Pharmacy | Buy Genuine Drugs & Groceries Online in Ibadan, Nigeria",
    description: "Shop trusted medications, wellness products, and groceries at Ollan Pharmacy - Ibadan's reliable online pharmacy and supermarket, fast delivery, affordable prices and expert support since 1985",
    url: "https://www.ollanpharmacy.ng",
    siteName: "Ollan Pharmacy",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ollan Pharmacy - Trusted Healthcare Since 1985",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ollan Pharmacy | Buy Genuine Drugs & Groceries Online in Ibadan",
    description: "Your trusted online pharmacy and supermarket in Ibadan, Nigeria",
    images: ["/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="r5-hh0PGASGqnNbQHVfxvJvac_4zvgH0TXOl7IlB2i0" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Ollan Pharmacy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ollan Pharmacy" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0066cc" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0066cc" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        
        {/* iOS Safari specific */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-title" content="Ollan Pharmacy" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Service Worker Registration */}
        <Script 
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('Service Worker registered successfully:', registration);
                  })
                  .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                  });
              }
            `
          }}
        />
        
        <Script 
          id="remove-extension-attributes"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.removeAttribute('data-bybit-channel-name');
              document.documentElement.removeAttribute('data-bybit-is-default-wallet');
            `
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}