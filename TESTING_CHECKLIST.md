# CA Firm Management System - Testing Checklist

## Prerequisites
- [ ] Backend API running on `http://localhost:5000` (or configured port)
- [ ] Frontend running on `http://localhost:3000`
- [ ] Database seeded with:
  - [ ] One Firm record
  - [ ] One CA user: `admin@cafirm.com` / `Admin@123` (2FA enabled)
- [ ] Environment variables configured:
  - [ ] `RESEND_API_KEY` (for email testing)
  - [ ] `EMAIL_FROM`
  - [ ] `FRONTEND_URL`
  - [ ] `JWT_SECRET`
  - [ ] Database connection string

---

## CA Flow (Super Admin)

### Authentication
- [ ] **Login with admin@cafirm.com / Admin@123**
  - [ ] Email and password fields work
  - [ ] Form validation shows errors for empty fields
  - [ ] Loading state shows during submission
  - [ ] Redirects to `/verify-otp` page
  - [ ] Email stored in sessionStorage

- [ ] **Receive OTP Email**
  - [ ] Check email inbox for OTP code
  - [ ] Email has professional branding
  - [ ] OTP is 6 digits
  - [ ] Email shows masked email address

- [ ] **Enter OTP and Verify**
  - [ ] 6 input boxes for OTP digits
  - [ ] Auto-focus moves to next input
  - [ ] Paste support works (paste full OTP)
  - [ ] Shows masked email "Code sent to ad***@cafirm.com"
  - [ ] Resend OTP button works (60-second countdown)
  - [ ] Auto-submits when all 6 digits entered
  - [ ] On success: redirects to `/ca/dashboard`
  - [ ] Token stored in localStorage
  - [ ] NextAuth session established

- [ ] **CA Dashboard**
  - [ ] KPI cards display correctly:
    - [ ] Total Clients
    - [ ] Total Users
    - [ ] Active Services
    - [ ] Pending Services
    - [ ] Revenue This Month
    - [ ] Overdue Invoices
  - [ ] Charts render:
    - [ ] Services by Status (Pie chart)
    - [ ] Revenue Trend (Line chart)
    - [ ] Services by Type (Bar chart)
  - [ ] Recent Activity section shows logs
  - [ ] Quick Actions buttons work

### Client Management
- [ ] **Create New Client**
  - [ ] Navigate to `/ca/clients`
  - [ ] Click "Add Client" button
  - [ ] Fill form:
    - [ ] Company Name (required)
    - [ ] Contact Person Name (required)
    - [ ] Email (required, becomes login)
    - [ ] Phone (optional)
    - [ ] Address (optional)
    - [ ] GSTIN (optional)
    - [ ] PAN (optional)
  - [ ] Submit form
  - [ ] Success message appears
  - [ ] Client appears in clients list
  - [ ] **Check Email**: Welcome email sent to client email with temp password
  - [ ] Email contains login credentials
  - [ ] Email has professional branding

### User Management
- [ ] **Create New User under Client**
  - [ ] Navigate to `/ca/users`
  - [ ] Click "Add User" button
  - [ ] Fill form:
    - [ ] Name (required)
    - [ ] Email (required)
    - [ ] Phone (optional)
    - [ ] Role: Select CLIENT or USER
    - [ ] Client: Select client (if USER role)
    - [ ] PAN (for USER role)
    - [ ] Aadhar (for USER role)
    - [ ] Address (optional)
  - [ ] Submit form
  - [ ] Success message appears
  - [ ] User appears in users list
  - [ ] **Check Email**: Welcome email sent with temp password
  - [ ] Email contains role information

### Service Management
- [ ] **Create New Service for User**
  - [ ] Navigate to `/ca/services`
  - [ ] Click "Add Service" button
  - [ ] Fill form:
    - [ ] Select Client (required)
    - [ ] Select User (filtered by client)
    - [ ] Service Type (required)
    - [ ] Service Name (required)
    - [ ] Description (optional)
    - [ ] Financial Year (optional)
    - [ ] Period (optional)
    - [ ] Due Date (required)
    - [ ] Amount (optional)
    - [ ] Internal Notes (optional)
  - [ ] Submit form
  - [ ] Service appears in services list

- [ ] **Update Service Status via Kanban**
  - [ ] Navigate to `/ca/services`
  - [ ] Toggle to "Kanban View"
  - [ ] See 4 columns: Pending, In Progress, Under Review, Completed
  - [ ] Drag service card from one column to another
  - [ ] Status updates automatically
  - [ ] Card moves to new column
  - [ ] Activity log created for status change
  - [ ] **Check Email**: Service status update email sent to user (if configured)

### Document Management
- [ ] **Upload Document**
  - [ ] Navigate to document upload area (service details or documents page)
  - [ ] Use DocumentUpload component
  - [ ] Drag and drop file OR click to select
  - [ ] File type validation works (PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG)
  - [ ] File size validation works (max 10MB)
  - [ ] Image preview shows for image files
  - [ ] Select document type from dropdown
  - [ ] Add description (optional)
  - [ ] Click "Upload Document"
  - [ ] Progress indicator shows
  - [ ] Success message appears
  - [ ] Document appears in documents list
  - [ ] Activity log created for upload

### Invoice Management
- [ ] **Create Invoice**
  - [ ] Navigate to invoices page or use InvoiceForm component
  - [ ] Fill form:
    - [ ] Select Client (required)
    - [ ] Select User (required)
    - [ ] Select Service (optional)
    - [ ] Invoice Date (required)
    - [ ] Due Date (required)
    - [ ] Add line items:
      - [ ] Description (required)
      - [ ] Quantity (required)
      - [ ] Unit Price (required)
      - [ ] Tax Rate (default 18%)
    - [ ] Add multiple items
    - [ ] Remove items
    - [ ] Discount (optional)
    - [ ] Notes (optional)
  - [ ] Verify totals calculate correctly:
    - [ ] Subtotal
    - [ ] Discount
    - [ ] GST
    - [ ] Total
  - [ ] Submit form
  - [ ] Invoice created with auto-generated number (INV-YYYY-XXXXX)
  - [ ] Invoice appears in invoices list

- [ ] **Generate Invoice PDF**
  - [ ] Navigate to invoice details page
  - [ ] Click "Download PDF" button
  - [ ] PDF downloads with correct filename
  - [ ] PDF contains:
    - [ ] Firm letterhead
    - [ ] Client details
    - [ ] Invoice number, date, due date
    - [ ] Line items table
    - [ ] Subtotal, GST, Total
    - [ ] Bank details (if configured)
    - [ ] Terms and conditions

- [ ] **Send Invoice**
  - [ ] On invoice details page
  - [ ] Click "Send Invoice" button
  - [ ] Invoice status changes to "SENT"
  - [ ] **Check Email**: Invoice email sent to user
  - [ ] Email contains invoice details and payment link

### Activity Logs
- [ ] **View Activity Logs**
  - [ ] Navigate to `/ca/activity`
  - [ ] Activity logs table displays
  - [ ] See logs for:
    - [ ] Login actions
    - [ ] Client creation
    - [ ] User creation
    - [ ] Service updates
    - [ ] Document uploads
    - [ ] Invoice creation
  - [ ] Filters work:
    - [ ] Filter by Action
    - [ ] Filter by Entity
    - [ ] Filter by Date Range
    - [ ] Search functionality
  - [ ] Pagination works
  - [ ] **Export to Excel**
    - [ ] Click "Export to Excel" button
    - [ ] Excel file downloads
    - [ ] File contains all filtered data
    - [ ] Headers are correct

### Logout
- [ ] **Logout**
  - [ ] Click user dropdown in header
  - [ ] Click "Logout"
  - [ ] Token cleared from localStorage
  - [ ] NextAuth session cleared
  - [ ] Redirected to `/login`
  - [ ] Activity log created for logout

---

## CLIENT Flow (Sub-Agent)

### Authentication
- [ ] **Login with Client Email / Temp Password**
  - [ ] Use email from welcome email
  - [ ] Use temporary password from welcome email
  - [ ] Login form works
  - [ ] Redirects to `/change-password` (mustChangePassword: true)

- [ ] **Change Password (First Login)**
  - [ ] Current password field
  - [ ] New password field with strength indicator
  - [ ] Confirm password field
  - [ ] Password requirements displayed:
    - [ ] At least 8 characters
    - [ ] One uppercase letter
    - [ ] One lowercase letter
    - [ ] One number
    - [ ] One special character
  - [ ] Cannot navigate away without changing password
  - [ ] Submit form
  - [ ] Password changed successfully
  - [ ] Redirects to `/verify-otp` (2FA enabled for CLIENT)

- [ ] **Receive OTP Email**
  - [ ] Check email inbox
  - [ ] OTP received

- [ ] **Enter OTP and Verify**
  - [ ] Enter OTP
  - [ ] Verify successfully
  - [ ] Redirects to `/client/dashboard`

- [ ] **Client Dashboard**
  - [ ] KPI cards display:
    - [ ] Total Users (their customers)
    - [ ] Active Services
    - [ ] Pending Services
    - [ ] Pending Invoices
  - [ ] Recent Users list shows
  - [ ] Recent Services status shows

### User Management
- [ ] **Create New User under Themselves**
  - [ ] Navigate to `/client/users`
  - [ ] Click "Add User" button
  - [ ] Form auto-sets:
    - [ ] Role: USER (read-only)
    - [ ] Client: Current client (read-only)
  - [ ] Fill form:
    - [ ] Name (required)
    - [ ] Email (required)
    - [ ] Phone (optional)
    - [ ] PAN (optional)
    - [ ] Aadhar (optional)
    - [ ] Address (optional)
  - [ ] Submit form
  - [ ] User created successfully
  - [ ] User appears in users list
  - [ ] **Check Email**: Welcome email sent to new user

### Service Management
- [ ] **View Their Users' Services**
  - [ ] Navigate to `/client/services`
  - [ ] Only see services belonging to their users
  - [ ] Can filter by user, status, type
  - [ ] Can view service details
  - [ ] Cannot edit services (CA only)

### Document Management
- [ ] **Upload Document for User**
  - [ ] Navigate to documents page or service details
  - [ ] Upload document using DocumentUpload component
  - [ ] Document associated with correct user
  - [ ] Document appears in documents list

### Invoice Management
- [ ] **View Invoices**
  - [ ] Navigate to `/client/invoices`
  - [ ] Only see invoices for their users
  - [ ] Can view invoice details
  - [ ] Can download invoice PDF
  - [ ] Cannot create invoices (CA only)

### Logout
- [ ] **Logout**
  - [ ] Click logout
  - [ ] Session cleared
  - [ ] Redirected to `/login`
  - [ ] Activity log created

---

## USER Flow (End Customer)

### Authentication
- [ ] **Login with User Email / Temp Password**
  - [ ] Use email from welcome email
  - [ ] Use temporary password
  - [ ] Login form works
  - [ ] Redirects to `/change-password` (mustChangePassword: true)

- [ ] **Change Password (First Login)**
  - [ ] Change password form works
  - [ ] Password requirements validated
  - [ ] Submit successfully
  - [ ] Redirects to `/user/dashboard` (no 2FA for USER by default)

- [ ] **User Dashboard**
  - [ ] KPI cards display:
    - [ ] Active Services
    - [ ] Pending Services
    - [ ] Pending Invoices
  - [ ] Recent services list
  - [ ] Quick actions available

### Service Management
- [ ] **View Own Services**
  - [ ] Navigate to `/user/services`
  - [ ] Only see own services
  - [ ] Can view service details
  - [ ] Can see service status
  - [ ] Cannot edit services

### Document Management
- [ ] **Upload Document**
  - [ ] Navigate to documents page
  - [ ] Upload document
  - [ ] Document associated with own account
  - [ ] Document appears in documents list

### Invoice Management
- [ ] **View and Pay Invoice**
  - [ ] Navigate to `/user/invoices`
  - [ ] Only see own invoices
  - [ ] View invoice details
  - [ ] Download invoice PDF
  - [ ] Make payment (if payment flow implemented)
  - [ ] Payment status updates

### Profile Management
- [ ] **Update Profile**
  - [ ] Navigate to `/user/profile`
  - [ ] View current profile information
  - [ ] Edit profile fields:
    - [ ] Name
    - [ ] Phone
    - [ ] Address
  - [ ] Save changes
  - [ ] Profile updated successfully
  - [ ] Changes reflected immediately

### Logout
- [ ] **Logout**
  - [ ] Click logout
  - [ ] Session cleared
  - [ ] Redirected to `/login`
  - [ ] Activity log created

---

## Additional Test Cases

### Forgot Password Flow
- [ ] **Request Password Reset**
  - [ ] Navigate to `/forgot-password`
  - [ ] Enter email address
  - [ ] Click "Send Reset Link"
  - [ ] Success message shows (generic, doesn't reveal if email exists)
  - [ ] **Check Email**: Password reset email received
  - [ ] Email contains reset link with token

- [ ] **Reset Password**
  - [ ] Click reset link from email
  - [ ] Redirects to `/reset-password?token=xxx`
  - [ ] New password field with strength indicator
  - [ ] Confirm password field
  - [ ] Password requirements displayed
  - [ ] Submit form
  - [ ] Password reset successfully
  - [ ] Redirects to `/login?reset=success`
  - [ ] Can login with new password

- [ ] **Expired Reset Token**
  - [ ] Use expired token (older than 1 hour)
  - [ ] Error message shows "Invalid or expired reset link"
  - [ ] Cannot reset password

### Google SSO
- [ ] **Google SSO for CLIENT**
  - [ ] On login page, click "Sign in with Google"
  - [ ] Google OAuth popup appears
  - [ ] Select Google account
  - [ ] Grant permissions
  - [ ] Redirects to `/verify-otp` (2FA still required)
  - [ ] Enter OTP
  - [ ] Redirects to `/client/dashboard`
  - [ ] Activity log created

- [ ] **Google SSO for USER**
  - [ ] On login page, click "Sign in with Google"
  - [ ] Google OAuth popup appears
  - [ ] Select Google account
  - [ ] Grant permissions
  - [ ] Redirects to `/user/dashboard` (no 2FA)
  - [ ] Activity log created

- [ ] **Google SSO for CA (Should Fail)**
  - [ ] Try to login with Google as CA user
  - [ ] Error message: "CA cannot use Google login"
  - [ ] Must use email/password

### Error Scenarios

- [ ] **Invalid Credentials**
  - [ ] Enter wrong email
  - [ ] Error message: "Invalid email or password"
  - [ ] Enter wrong password
  - [ ] Error message: "Invalid email or password"
  - [ ] Failed login attempt logged

- [ ] **Account Locked After 5 Failed Attempts**
  - [ ] Enter wrong password 5 times
  - [ ] Account locked message appears
  - [ ] Account locked for 15 minutes
  - [ ] Cannot login even with correct password
  - [ ] After 15 minutes, can login again
  - [ ] Activity log shows account lock

- [ ] **Expired OTP Error**
  - [ ] Request OTP
  - [ ] Wait more than 5 minutes
  - [ ] Enter OTP
  - [ ] Error message: "OTP expired. Please request a new one."
  - [ ] Can click "Resend OTP"

- [ ] **Invalid OTP**
  - [ ] Enter wrong OTP code
  - [ ] Error message: "Invalid OTP code"
  - [ ] Can retry or resend

### Role-Based Route Protection

- [ ] **CA Routes Protection**
  - [ ] As CLIENT user, try to access `/ca/dashboard`
  - [ ] Redirected to `/client/dashboard` or 403 error
  - [ ] As USER, try to access `/ca/dashboard`
  - [ ] Redirected to `/user/dashboard` or 403 error

- [ ] **CLIENT Routes Protection**
  - [ ] As USER, try to access `/client/dashboard`
  - [ ] Redirected to `/user/dashboard` or 403 error
  - [ ] As CA, can access `/client/dashboard` (if allowed)

- [ ] **USER Routes Protection**
  - [ ] As CLIENT, try to access `/user/dashboard`
  - [ ] Redirected to `/client/dashboard` or 403 error
  - [ ] As CA, try to access `/user/dashboard`
  - [ ] Redirected to `/ca/dashboard` or 403 error

- [ ] **Unauthenticated Access**
  - [ ] Logout or clear tokens
  - [ ] Try to access any protected route
  - [ ] Redirected to `/login`
  - [ ] Cannot access protected data

### Data Isolation

- [ ] **CLIENT Data Isolation**
  - [ ] As CLIENT, only see their own users
  - [ ] Cannot see other clients' users
  - [ ] Cannot see other clients' services
  - [ ] Cannot see other clients' invoices

- [ ] **USER Data Isolation**
  - [ ] As USER, only see own services
  - [ ] Cannot see other users' services
  - [ ] Cannot see other users' documents
  - [ ] Cannot see other users' invoices

- [ ] **CA Full Access**
  - [ ] As CA, can see all clients
  - [ ] Can see all users
  - [ ] Can see all services
  - [ ] Can see all invoices
  - [ ] Can access all activity logs

---

## Email Testing Checklist

For each email type, verify:
- [ ] Email is received in inbox (not spam)
- [ ] Email has professional HTML formatting
- [ ] Firm branding/logo appears
- [ ] Links work correctly
- [ ] Content is accurate
- [ ] No broken images or styling issues
- [ ] Mobile-responsive design

### Email Types to Test:
1. [ ] Welcome Email (with temp password)
2. [ ] OTP Email
3. [ ] Password Reset Email
4. [ ] Invoice Sent Email
5. [ ] Service Status Update Email

---

## Performance Testing

- [ ] **Page Load Times**
  - [ ] Dashboard loads in < 2 seconds
  - [ ] Data tables load in < 3 seconds
  - [ ] PDF generation completes in < 5 seconds

- [ ] **Concurrent Users**
  - [ ] Multiple users can login simultaneously
  - [ ] No data conflicts
  - [ ] Activity logs created for all actions

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Notes

- Record any bugs or issues found during testing
- Note any missing features or improvements needed
- Document any performance issues
- Keep track of email delivery times
- Verify all activity logs are being created correctly

---

## Test Completion

- [ ] All CA Flow tests passed
- [ ] All CLIENT Flow tests passed
- [ ] All USER Flow tests passed
- [ ] All additional test cases passed
- [ ] All email tests passed
- [ ] All error scenarios handled correctly
- [ ] All role-based protections working
- [ ] Ready for production deployment

**Tested By:** _________________  
**Date:** _________________  
**Version:** _________________

