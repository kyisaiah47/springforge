import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { OnboardingProvider } from "@/lib/onboarding/onboarding-provider";
import { RealtimeProvider } from "@/lib/realtime/realtime-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/lib/monitoring/error-boundary";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit - Developer Productivity Suite",
  description:
    "All-in-one developer productivity suite with automated standups, PR insights, retrospectives, and coding challenges",
  keywords: [
    "developer productivity",
    "automated standups",
    "pull request management",
    "retrospectives",
    "coding challenges",
    "GitHub integration",
    "Slack integration",
    "team collaboration",
  ],
  authors: [{ name: "Orbit Team" }],
  creator: "Orbit",
  publisher: "Orbit",
  icons: {
    icon: "/orbit-favicon.svg",
    shortcut: "/orbit-favicon.svg",
    apple: "/orbit-favicon.svg",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <RealtimeProvider>
                <OnboardingProvider>
                  {children}
                  <Toaster />
                </OnboardingProvider>
              </RealtimeProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
