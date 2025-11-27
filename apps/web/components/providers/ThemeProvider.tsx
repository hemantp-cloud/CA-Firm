"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

interface ThemeProviderWrapperProps {
  children: React.ReactNode
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

