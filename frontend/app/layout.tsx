import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Layout from '@/components/Layout'
import Providers from '@/components/Providers'
import AuthProvider from '../src/lib/auth-context'
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Resume Processing System",
  description: "Upload and process resumes with AI-powered parsing and candidate management.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default`}>
        <AuthProvider>
          <Providers>
            <Layout>
              {children}
            </Layout>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
