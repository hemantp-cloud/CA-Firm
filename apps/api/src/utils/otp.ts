/**
 * OTP (One-Time Password) utility functions
 * Used for 2FA authentication
 */

/**
 * Generates a 6-digit numeric OTP
 * @returns 6-digit string OTP (e.g., "123456")
 */
export function generateOTP(): string {
  // Generate random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Generates OTP expiry date (5 minutes from now)
 * @returns Date object representing expiry time
 */
export function generateOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  return expiry;
}

/**
 * Checks if OTP is still valid based on expiry date
 * @param expiry - The expiry date of the OTP
 * @returns true if OTP is still valid, false if expired
 */
export function isOTPValid(expiry: Date | null): boolean {
  if (!expiry) {
    return false;
  }
  const now = new Date();
  return now < expiry;
}

/**
 * Masks email address for privacy
 * Shows first 2 characters, then ***, then @domain
 * @param email - Email address to mask
 * @returns Masked email (e.g., "ad***@cafirm.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***@***';
  }

  const parts = email.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  // Validate that we have both localPart and domain
  if (!localPart || !domain) {
    return '***@***';
  }

  // Handle edge case where localPart is empty
  if (localPart.length === 0) {
    return `***@${domain}`;
  }

  // If localPart has 1-2 characters, show only first character
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  // Show first 2 characters, then ***, then domain
  const visibleChars = localPart.substring(0, 2);
  return `${visibleChars}***@${domain}`;
}

