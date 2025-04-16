import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/Header"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { Toaster } from "@/components/ui/toaster"
import MobileNavigation from "@/components/layout/MobileNavigation"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
  title: "Социальная сеть",
  description: "Социальная сеть с постами и чатом",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 container mx-auto px-4 py-4 max-w-5xl">{children}</main>
              <MobileNavigation />
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'