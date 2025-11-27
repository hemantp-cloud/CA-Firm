import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        token: { label: "Token", type: "text" }, // For OTP-verified logins
      },
      async authorize(credentials) {
        // If token is provided, this is an OTP-verified login
        if (credentials?.token) {
          try {
            console.log("NextAuth authorize: Token-based login (OTP verified)")
            // Verify token with backend and get user info
            const response = await axios.get(`${API_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${credentials.token}`,
              },
            })

            if (response.data.success && response.data.data) {
              const user = response.data.data
              const userObject = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                clientId: user.clientId || null,
                firmId: user.firmId,
                mustChangePassword: user.mustChangePassword || false,
                accessToken: credentials.token,
              }

              console.log("NextAuth authorize: Token-based login successful", {
                id: userObject.id,
                email: userObject.email,
                role: userObject.role,
              })

              return userObject
            } else {
              throw new Error("Invalid token")
            }
          } catch (error: any) {
            console.error("NextAuth authorize: Token verification failed", error)
            throw new Error(error.response?.data?.message || "Token verification failed")
          }
        }

        // Regular email/password login
        if (!credentials?.email || !credentials?.password) {
          console.error("NextAuth authorize: Email and password are required")
          throw new Error("Email and password are required")
        }

        try {
          console.log("NextAuth authorize: Attempting login for", credentials.email)
          const response = await axios.post(`${API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          })

          console.log("NextAuth authorize: API response received", {
            success: response.data.success,
            requiresTwoFactor: response.data.requiresTwoFactor,
            hasUser: !!response.data.data?.user,
            hasToken: !!response.data.data?.token,
          })

          if (response.data.success) {
            // Check if 2FA is required
            if (response.data.requiresTwoFactor) {
              console.log("NextAuth authorize: 2FA required, returning null")
              // Return null to indicate 2FA is needed (frontend will handle redirect)
              return null
            }

            const { user, token } = response.data.data

            if (!user || !token) {
              console.error("NextAuth authorize: Missing user or token in response")
              throw new Error("Invalid response from authentication server")
            }

            // Build user object from backend response
            const userObject = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              clientId: user.clientId || null,
              firmId: user.firmId,
              mustChangePassword: user.mustChangePassword || false,
              accessToken: token,
            }

            console.log("NextAuth authorize: Returning user object", {
              id: userObject.id,
              email: userObject.email,
              role: userObject.role,
              firmId: userObject.firmId,
              clientId: userObject.clientId,
            })

            return userObject
          } else {
            console.error("NextAuth authorize: Login failed", response.data.message)
            throw new Error(response.data.message || "Authentication failed")
          }
        } catch (error: any) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "Authentication failed"
          console.error("NextAuth authorize: Error occurred", message, error)
          throw new Error(message)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - add all user fields to token
      if (user) {
        console.log("NextAuth jwt callback: User exists, adding to token", {
          id: user.id,
          email: user.email,
          role: (user as any).role,
          clientId: (user as any).clientId,
        })
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || ""
        token.clientId = (user as any).clientId || null
        token.firmId = (user as any).firmId || ""
        token.mustChangePassword = (user as any).mustChangePassword || false
        token.accessToken = (user as any).accessToken || (user as any).token || ""
      }

      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          console.log("NextAuth jwt callback: Google OAuth detected")

          // Get the Google ID token from the account
          const googleToken = account.id_token

          if (!googleToken) {
            console.error("NextAuth jwt callback: No Google token found")
            return token
          }

          // Call backend Google auth endpoint
          const response = await axios.post(`${API_URL}/auth/google`, {
            credential: googleToken,
          })

          if (response.data.success) {
            // Check if 2FA is required
            if (response.data.requiresTwoFactor) {
              console.log("NextAuth jwt callback: 2FA required for Google auth")
              // Return token with a flag indicating 2FA is needed
              token.requiresTwoFactor = true
              token.otpEmail = response.data.email
              return token
            }

            const { user, token: backendToken } = response.data.data

            if (user && backendToken) {
              // Update token with user data from backend
              token.id = user.id
              token.email = user.email
              token.name = user.name
              token.role = user.role || ""
              token.clientId = user.clientId || null
              token.firmId = user.firmId || ""
              token.mustChangePassword = user.mustChangePassword || false
              token.accessToken = backendToken

              console.log("NextAuth jwt callback: Google auth successful", {
                id: token.id,
                email: token.email,
                role: token.role,
              })
            }
          } else {
            console.error("NextAuth jwt callback: Google auth failed", response.data.message)
          }
        } catch (error: any) {
          console.error("NextAuth jwt callback: Google OAuth error", error)
          const message =
            error.response?.data?.message ||
            error.message ||
            "Google authentication failed"
          // Don't throw - let the user see the error
          token.error = message
        }
      }

      return token
    },
    async session({ session, token }) {
      // Copy all fields from token to session.user
      if (session.user) {
        session.user.id = (token.id as string) || ""
        session.user.email = (token.email as string) || ""
        session.user.name = (token.name as string) || ""
        session.user.role = (token.role as string) || ""
        session.user.clientId = (token.clientId as string | null) || null
        session.user.firmId = (token.firmId as string) || ""
        session.accessToken = (token.accessToken as string) || ""

        // Include 2FA flag if present
        if (token.requiresTwoFactor) {
          session.requiresTwoFactor = true
          session.otpEmail = token.otpEmail as string | undefined
        }

        // Include mustChangePassword
        (session.user as any).mustChangePassword = (token.mustChangePassword as boolean) || false
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirects
      // This is called after successful sign-in

      // If url is provided and is relative, use it
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // If url is absolute and same origin, use it
      if (new URL(url).origin === baseUrl) {
        return url
      }

      // Default: redirect to home (frontend will handle role-based routing)
      return baseUrl
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend JWT expiry)
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
