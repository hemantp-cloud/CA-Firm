/**
 * Email utility functions
 * Re-export from email service for backward compatibility
 */
export {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInvoiceEmail,
  sendServiceStatusUpdateEmail,
} from '../services/email.service';

