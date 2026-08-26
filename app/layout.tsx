import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { ToastProvider } from "@/components/ui/Toast";
import { SplashOverlay } from "@/components/app-shell/SplashOverlay";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard-local",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "워크크",
  description: "산책이 기록이 되는 순간",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "워크크",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#faf8f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--bg)] text-[var(--ink)]">
        <ToastProvider>
          <div className="mx-auto w-full max-w-[480px] min-h-dvh flex flex-col relative bg-[var(--bg)]">
            {children}
          </div>
          <SplashOverlay />
        </ToastProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
