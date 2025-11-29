import nodemailer from 'nodemailer';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@cafirm.com';
const FIRM_NAME = process.env.FIRM_NAME || 'CA Firm Management';

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Check if email configuration is provided
const isEmailEnabled = !!SMTP_USER && !!SMTP_PASS;

// Initialize NodeMailer transporter
let transporter: nodemailer.Transporter | null = null;

if (isEmailEnabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log('📧 Email service initialized with NodeMailer');
} else {
  console.warn('⚠️  SMTP credentials not set. Emails will be logged to console.');
}

/**
 * Mock email sender for development mode
 */
async function mockSendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  console.log('='.repeat(80));
  console.log('📧 EMAIL (MOCK MODE - Not Actually Sent)');
  console.log('='.repeat(80));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`From: ${EMAIL_FROM}`);
  console.log('-'.repeat(80));
  console.log('HTML Content:');
  console.log('-'.repeat(80));
  // Strip HTML tags for console output (basic version)
  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  console.log(textContent);
  console.log('='.repeat(80));
  console.log('To enable real email sending, set SMTP_USER and SMTP_PASS in your .env file');
  console.log('='.repeat(80));
}

/**
 * Send email using NodeMailer or mock mode
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (isEmailEnabled && transporter) {
    try {
      await transporter.sendMail({
        from: `"${FIRM_NAME}" <${EMAIL_FROM}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      // Fallback to mock if sending fails
      console.log('⚠️  Falling back to mock email due to error');
      await mockSendEmail(to, subject, html);
      throw error;
    }
  } else {
    await mockSendEmail(to, subject, html);
  }
}

/**
 * Base email template wrapper
 */
function getEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 30px -30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      color: #4b5563;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #1e40af;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background-color: #1e3a8a;
    }
    .otp-code {
      background-color: #f3f4f6;
      border: 2px dashed #1e40af;
      padding: 20px;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #1e40af;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #1e40af;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${FIRM_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated email from ${FIRM_NAME}.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send OTP email for 2FA authentication
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  userName: string
): Promise<void> {
  const content = `
    <h2>Your One-Time Password (OTP)</h2>
    <p>Hello ${userName},</p>
    <p>You have requested to log in to your account. Please use the following OTP to complete your login:</p>
    
    <div class="otp-code">${otp}</div>
    
    <div class="warning-box">
      <strong>Important:</strong> This OTP is valid for 5 minutes only. Do not share this code with anyone.
    </div>
    
    <p>If you did not request this OTP, please ignore this email or contact support immediately.</p>
    
    <p>Best regards,<br>${FIRM_NAME} Team</p>
  `;

  await sendEmail(
    email,
    `Your OTP Code - ${FIRM_NAME}`,
    getEmailTemplate(content, 'OTP Code')
  );
}

/**
 * Send welcome email when account is created
 */
export async function sendWelcomeEmail(
  email: string,
  tempPassword: string,
  userName: string,
  role: string
): Promise<void> {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';

  const content = `
    <h2>Welcome to ${FIRM_NAME}!</h2>
    <p>Hello ${userName},</p>
    <p>Your account has been successfully created. We're excited to have you on board!</p>
    
    <div class="info-box">
      <strong>Account Details:</strong><br>
      Email: ${email}<br>
      Role: ${role}
    </div>
    
    <p>Your temporary password is:</p>
    <div class="otp-code" style="font-size: 24px; letter-spacing: 2px;">${tempPassword}</div>
    
    <div class="warning-box">
      <strong>Security Notice:</strong> Please log in and change your password immediately after your first login.
    </div>
    
    <p>
      <a href="${loginUrl}" class="button">Log In Now</a>
    </p>
    
    <p>If you did not request this account, please contact support immediately.</p>
    
    <p>Best regards,<br>${FIRM_NAME} Team</p>
  `;

  await sendEmail(
    email,
    `Welcome to ${FIRM_NAME}!`,
    getEmailTemplate(content, 'Welcome')
  );
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName: string
): Promise<void> {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>You have requested to reset your password. Click the button below to reset it:</p>
    
    <p>
      <a href="${resetLink}" class="button">Reset Password</a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #1e40af;">${resetLink}</p>
    
    <div class="warning-box">
      <strong>Important:</strong> This link is valid for 1 hour only. If you did not request a password reset, please ignore this email.
    </div>
    
    <p>Best regards,<br>${FIRM_NAME} Team</p>
  `;

  await sendEmail(
    email,
    `Reset Your Password - ${FIRM_NAME}`,
    getEmailTemplate(content, 'Password Reset')
  );
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  email: string,
  userName: string,
  invoiceNumber: string,
  invoiceId: string,
  amount: number,
  dueDate: string
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const invoiceUrl = `${frontendUrl}/invoices/${invoiceId}`;
  const pdfUrl = `${frontendUrl}/api/invoices/${invoiceId}/pdf`;

  const content = `
    <h2>Invoice ${invoiceNumber}</h2>
    <p>Hello ${userName},</p>
    <p>Your invoice has been generated and is ready for payment.</p>
    
    <div class="info-box">
      <strong>Invoice Details:</strong><br>
      Invoice Number: ${invoiceNumber}<br>
      Amount: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}<br>
      Due Date: ${dueDate}
    </div>
    
    <p>
      <a href="${invoiceUrl}" class="button">View Invoice</a>
      <a href="${pdfUrl}" class="button" style="margin-left: 10px;">Download PDF</a>
    </p>
    
    <p>Please make payment before the due date to avoid any late fees.</p>
    
    <p>Best regards,<br>${FIRM_NAME} Team</p>
  `;

  await sendEmail(
    email,
    `Invoice ${invoiceNumber} - ${FIRM_NAME}`,
    getEmailTemplate(content, 'Invoice')
  );
}

/**
 * Send service status update email
 */
export async function sendServiceStatusUpdateEmail(
  email: string,
  userName: string,
  serviceTitle: string,
  oldStatus: string,
  newStatus: string,
  serviceId: string
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const serviceUrl = `${frontendUrl}/services/${serviceId}`;

  const content = `
    <h2>Service Status Updated</h2>
    <p>Hello ${userName},</p>
    <p>The status of your service has been updated.</p>
    
    <div class="info-box">
      <strong>Service:</strong> ${serviceTitle}<br>
      <strong>Previous Status:</strong> ${oldStatus}<br>
      <strong>New Status:</strong> <strong style="color: #1e40af;">${newStatus}</strong>
    </div>
    
    <p>
      <a href="${serviceUrl}" class="button">View Service</a>
    </p>
    
    <p>Best regards,<br>${FIRM_NAME} Team</p>
  `;

  await sendEmail(
    email,
    `Service Status Updated: ${serviceTitle} - ${FIRM_NAME}`,
    getEmailTemplate(content, 'Service Update')
  );
}
