import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Masks email address for privacy
 * Shows first 2 characters, then ***, then @domain
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email
  }

  const [localPart, domain] = email.split('@')
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`
  }

  const visibleChars = localPart.substring(0, 2)
  return `${visibleChars}***@${domain}`
}
