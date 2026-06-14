import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "MeetFlow — AI Meeting Intelligence",
    template: "%s | MeetFlow",
  },
  description:
    "Your AI Meeting Co-Founder. Transform meetings into actionable intelligence with AI-powered notes, summaries, and action items.",
  keywords: ["meeting intelligence", "AI meetings", "meeting notes", "action items", "meeting summary"],
  openGraph: {
    title: "MeetFlow — AI Meeting Intelligence",
    description: "Your AI Meeting Co-Founder",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            theme="system"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
