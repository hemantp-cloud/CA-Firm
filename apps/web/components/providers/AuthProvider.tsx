"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"

interface AuthProviderProps {
  children: React.ReactNode
}

// Inner component to sync token to localStorage
function TokenSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.accessToken) {
      // Sync token to localStorage so Axios can use it
      localStorage.setItem("token", session.accessToken)
    } else {
      // Clear token if no session
      localStorage.removeItem("token")
    }
  }, [session])

  return null
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <TokenSync />
      {children}
    </SessionProvider>
  )
}

