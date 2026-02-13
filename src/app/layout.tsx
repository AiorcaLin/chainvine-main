import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ChainVine - Smart Contract Security Platform",
  description: "AI-powered smart contract vulnerability scanning platform",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgb(var(--card))',
                color: 'rgb(var(--foreground))',
                borderRadius: '8px',
                border: '1px solid rgb(var(--border))',
              },
              error: {
                style: {
                  background: 'rgb(var(--card))',
                  color: 'rgb(var(--foreground))',
                  border: '1px solid rgb(var(--border))',
                },
                iconTheme: {
                  primary: '#F48771',
                  secondary: 'rgb(var(--card))',
                },
                duration: 4000,
              },
              success: {
                style: {
                  background: 'rgb(var(--card))',
                  color: 'rgb(var(--foreground))',
                  border: '1px solid rgb(var(--border))',
                },
                iconTheme: {
                  primary: 'rgb(var(--accent))',
                  secondary: 'rgb(var(--card))',
                },
                duration: 4000,
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
