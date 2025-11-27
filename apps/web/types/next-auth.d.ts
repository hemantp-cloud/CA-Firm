import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      clientId: string | null
      firmId: string
    }
    accessToken?: string
    requiresTwoFactor?: boolean
    otpEmail?: string
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    clientId: string | null
    firmId: string
    token?: string
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    role: string
    clientId: string | null
    firmId: string
    mustChangePassword?: boolean
    accessToken?: string
    requiresTwoFactor?: boolean
    otpEmail?: string
    error?: string
  }
}
