# CA Firm Management System - Quick Reference Guide

## 🚀 Quick Start

### Running the Application

```bash
# Terminal 1: Start Backend API
cd apps/api
npm run dev
# Runs on: http://localhost:5000

# Terminal 2: Start Frontend
cd apps/web
npm run dev
# Runs on: http://localhost:3000
```

### Default Credentials

```
ADMIN User:
Email: admin@cafirm.com
Password: Admin@123
2FA: Enabled (OTP sent to email)

Test CA User:
Email: ca@cafirm.com
Password: CA@123
2FA: Enabled

Test Client:
Email: client@cafirm.com
Password: Client@123
2FA: Disabled

Test Trainee:
Email: trainee@cafirm.com
Password: Trainee@123
2FA: Disabled
```

---

## 📋 System Overview at a Glance

### User Roles (Hierarchy)
```
ADMIN (Super Admin)
  ↓ manages
CA (Chartered Accountant)
  ↓ manages
TRAINEE (Junior Staff)
  ↓ handles
CLIENT (End Customer)
```

### Core Modules
1. **Authentication** - Login, OTP, Password Reset, Google SSO
2. **Client Management** - Create/manage clients (by CA/Admin)
3. **Trainee Management** - Create/assign trainees (by CA/Admin)
4. **Service Management** - ITR, GST, TDS, Audit, etc.
5. **Document Management** - Upload, review, approve documents
6. **Invoice Management** - Create, send, track invoices
7. **Activity Logging** - Audit trail for all actions
8. **Real-time Notifications** - SSE for live updates

---

## 🎯 Common Tasks

### For ADMIN

#### Create a CA User
```
1. Login → /admin/dashboard
2. Navigate to /admin/ca
3. Click "Add CA"
4. Fill form: Name, Email, Phone, Commission %
5. Submit → CA receives welcome email
```

#### Create a Trainee
```
1. Login → /admin/dashboard
2. Navigate to /admin/trainees
3. Click "Add Trainee"
4. Fill form: Name, Email, Phone, PAN, Aadhar
5. Submit → Trainee receives welcome email
```

#### View Activity Logs
```
1. Login → /admin/dashboard
2. Navigate to /admin/activity
3. Filter by: Action, Entity, Date Range
4. Export to Excel if needed
```

---

### For CA

#### Create a Client
```
1. Login → /ca/dashboard
2. Navigate to /ca/clients
3. Click "Add Client"
4. Fill form: Company Name, Contact Person, Email, GSTIN, PAN
5. Submit → Client receives welcome email with temp password
```

#### Assign Client to Trainee
```
1. Login → /ca/dashboard
2. Navigate to /ca/trainees
3. Click on trainee name
4. Click "Assign Clients"
5. Select clients from checkbox list
6. Click "Save Assignments"
```

#### Create a Service
```
1. Login → /ca/dashboard
2. Navigate to /ca/services
3. Click "Add Service"
4. Select Client and Service Type
5. Fill: Title, Description, Due Date, Fee
6. Submit → Service created with status "PENDING"
```

#### Update Service Status (Kanban)
```
1. Navigate to /ca/services
2. Toggle to "Kanban View"
3. Drag service card to new column:
   - Pending
   - In Progress
   - Under Review
   - Completed
4. Status updates automatically
```

#### Create Invoice
```
1. Navigate to /ca/invoices
2. Click "Create Invoice"
3. Select Client and Service
4. Add line items:
   - Description, Quantity, Unit Price, Tax Rate
5. Add discount (optional)
6. Submit → Invoice auto-numbered (INV-2025-00001)
7. Click "Send Invoice" → Email sent to client
```

---

### For TRAINEE

#### View Assigned Clients
```
1. Login → /trainee/dashboard
2. Navigate to /trainee/clients
3. See ONLY assigned clients
4. Click on client to view details
```

#### Manage Service for Client
```
1. Navigate to /trainee/services
2. Filter by client (only assigned clients shown)
3. Click on service
4. Update status
5. Add notes
6. Save changes
```

#### Upload Document for Client
```
1. Navigate to /trainee/documents
2. Click "Upload Document"
3. Select client (only assigned clients)
4. Choose file (drag & drop or click)
5. Select document type (PAN, Aadhar, etc.)
6. Add description
7. Click "Upload"
8. Click "Submit for Review" when ready
```

---

### For CLIENT

#### View Services
```
1. Login → /client/dashboard
2. Navigate to /client/services
3. See all your services
4. View status and progress
```

#### Upload Document
```
1. Navigate to /client/documents
2. Click "Upload Document"
3. Select file
4. Choose document type
5. Add description
6. Upload
7. Submit for review
```

#### View Invoices
```
1. Navigate to /client/invoices
2. See all invoices
3. Click to view details
4. Download PDF
5. Make payment (if enabled)
```

---

## 🔐 Authentication Flows

### Email/Password Login (CA/ADMIN)
```
Enter email/password
  ↓
Validate credentials
  ↓
Generate OTP → Send email
  ↓
Redirect to /verify-otp
  ↓
Enter 6-digit OTP
  ↓
Verify OTP
  ↓
Generate JWT token
  ↓
Redirect to /ca/dashboard or /admin/dashboard
```

### Email/Password Login (CLIENT/TRAINEE)
```
Enter email/password
  ↓
Validate credentials
  ↓
Generate JWT token (no OTP)
  ↓
Redirect to /client/dashboard or /trainee/dashboard
```

### First Login (All Users)
```
Login with temp password
  ↓
Redirect to /change-password
  ↓
Enter current password, new password, confirm
  ↓
Password changed
  ↓
Continue to OTP (if CA/ADMIN) or Dashboard (if CLIENT/TRAINEE)
```

### Forgot Password
```
Click "Forgot Password"
  ↓
Enter email
  ↓
Receive reset link via email
  ↓
Click link → /reset-password?token=xxx
  ↓
Enter new password
  ↓
Password reset
  ↓
Redirect to /login
```

---

## 📊 Dashboard KPIs

### ADMIN Dashboard
- Total CAs
- Total Clients
- Total Trainees
- Active Services
- Pending Services
- Revenue This Month
- Overdue Invoices

### CA Dashboard
- Total Clients
- Total Trainees
- Active Services
- Pending Services
- Revenue This Month
- Overdue Invoices

### TRAINEE Dashboard
- Assigned Clients
- Active Services
- Pending Services
- Documents Uploaded

### CLIENT Dashboard
- Active Services
- Pending Services
- Pending Invoices
- Documents Uploaded

---

## 🗂️ Document Types

### Supported Document Types
- PAN_CARD
- AADHAR_CARD
- BANK_STATEMENT
- FORM_16
- FORM_26AS
- GST_CERTIFICATE
- INCORPORATION_CERTIFICATE
- PARTNERSHIP_DEED
- MOA_AOA
- AUDIT_REPORT
- BALANCE_SHEET
- PROFIT_LOSS
- TAX_RETURN
- OTHER

### File Upload Limits
- **Max Size**: 10 MB
- **Allowed Types**: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG

### Document Workflow
```
DRAFT (uploaded, not submitted)
  ↓
SUBMITTED (client confirms upload)
  ↓
ASSIGNED (CA assigns to trainee/self)
  ↓
REVIEWING (under review)
  ↓
APPROVED / REJECTED / CHANGES_REQUESTED
```

---

## 💼 Service Types

### Available Service Types
- ITR_FILING (Income Tax Return)
- GST_REGISTRATION
- GST_RETURN
- TDS_RETURN
- TDS_COMPLIANCE
- ROC_FILING
- AUDIT
- BOOK_KEEPING
- PAYROLL
- CONSULTATION
- OTHER

### Service Status Flow
```
PENDING
  ↓
IN_PROGRESS
  ↓
UNDER_REVIEW
  ↓
COMPLETED / CANCELLED
```

---

## 💰 Invoice Management

### Invoice Number Format
```
INV-YYYY-XXXXX

Examples:
INV-2025-00001
INV-2025-00002
```

### Invoice Status Flow
```
DRAFT (created, not sent)
  ↓
SENT (emailed to client)
  ↓
PAID (payment received)
  ↓
OVERDUE (past due date, not paid)
  ↓
CANCELLED (cancelled)
```

### GST Calculation
```
Subtotal: ₹10,000
Discount: ₹500
After Discount: ₹9,500
GST @ 18%: ₹1,710
Total: ₹11,210
```

---

## 🔔 Real-time Notifications (SSE)

### Notification Types
- Document uploaded
- Service status changed
- Invoice created
- Invoice sent
- Payment received
- Client assigned to trainee

### How to Enable
```typescript
// Frontend: Connect to SSE
const eventSource = new EventSource('/api/sse/events');

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Show toast notification
  toast.success(notification.message);
};
```

---

## 📧 Email Templates

### Welcome Email (New User)
```
Subject: Welcome to [Firm Name]

Dear [Name],

Your account has been created.

Login URL: https://firm.com/login
Email: [email]
Temporary Password: [password]

Please change your password on first login.

Best regards,
[Firm Name]
```

### OTP Email
```
Subject: Your Login OTP

Dear [Name],

Your OTP for login is: [6-digit OTP]

This OTP is valid for 5 minutes.

Best regards,
[Firm Name]
```

### Invoice Email
```
Subject: Invoice [INV-2025-00001] from [Firm Name]

Dear [Client Name],

Please find attached your invoice.

Invoice Number: [INV-2025-00001]
Amount: ₹[total]
Due Date: [date]

[Download PDF Button]

Best regards,
[Firm Name]
```

---

## 🛠️ Troubleshooting

### Issue: Cannot Login
**Solution**:
1. Check email/password are correct
2. Check if account is active
3. Check if account is locked (wait 15 minutes)
4. Try "Forgot Password"

### Issue: OTP Not Received
**Solution**:
1. Check spam folder
2. Wait 1 minute
3. Click "Resend OTP"
4. Check email configuration in backend

### Issue: Trainee Cannot See Client
**Solution**:
1. Check if client is assigned to trainee
2. Navigate to /ca/trainees/[id]/assign-clients
3. Assign the client
4. Trainee should refresh page

### Issue: Document Upload Fails
**Solution**:
1. Check file size (max 10 MB)
2. Check file type (PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG)
3. Check internet connection
4. Try again

### Issue: Invoice PDF Not Generating
**Solution**:
1. Check if all required fields are filled
2. Check backend logs for errors
3. Ensure PDFKit is installed
4. Check file permissions

---

## 📱 Mobile Access

### Responsive Design
- ✅ Mobile-friendly layouts
- ✅ Touch-friendly buttons
- ✅ Collapsible sidebar
- ✅ Optimized for tablets

### Recommended Browsers
- Chrome (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari (Desktop & Mobile)
- Edge (Desktop)

---

## 🔒 Security Best Practices

### For Admins
- ✅ Use strong passwords (min 8 chars, uppercase, lowercase, number, special char)
- ✅ Enable 2FA for all CA and ADMIN users
- ✅ Regularly review activity logs
- ✅ Deactivate users who leave the firm
- ✅ Use HTTPS in production

### For Users
- ✅ Change temporary password immediately
- ✅ Don't share passwords
- ✅ Logout after use
- ✅ Report suspicious activity

---

## 📞 Support

### Getting Help
1. Check this Quick Reference Guide
2. Check PROJECT_OVERVIEW.md for detailed documentation
3. Check TESTING_CHECKLIST.md for testing procedures
4. Contact system administrator

### Reporting Bugs
1. Note the error message
2. Note steps to reproduce
3. Take screenshot if possible
4. Report to developer

---

## 🎓 Training Resources

### For New Users
1. **Quick Start Video** (to be created)
2. **User Manual** (to be created)
3. **FAQ** (to be created)

### For Developers
1. **README.md** - Setup instructions
2. **PROJECT_OVERVIEW.md** - Complete documentation
3. **YESTERDAY_ENHANCEMENT_SUMMARY.md** - Recent changes
4. **Prisma Schema** - Database reference

---

## 📊 Keyboard Shortcuts

### Global
- `Ctrl + K` - Search (if implemented)
- `Ctrl + /` - Help (if implemented)

### Forms
- `Tab` - Next field
- `Shift + Tab` - Previous field
- `Enter` - Submit form
- `Esc` - Close dialog

---

## 🎨 UI Color Codes

### Role-Based Themes
```
Admin Portal:   #3b82f6 (Blue)
CA Portal:      #3b82f6 (Blue)
Trainee Portal: #16a34a (Green)
Client Portal:  #8b5cf6 (Purple)
```

### Status Colors
```
Active/Success:  #10b981 (Green)
Pending:         #f59e0b (Orange)
In Progress:     #3b82f6 (Blue)
Completed:       #10b981 (Green)
Cancelled/Error: #ef4444 (Red)
```

---

## 📈 Performance Tips

### For Best Performance
- ✅ Use filters to limit data displayed
- ✅ Export large datasets to Excel instead of viewing in browser
- ✅ Close unused browser tabs
- ✅ Clear browser cache if experiencing issues
- ✅ Use modern browsers (Chrome, Firefox, Edge)

---

## 🚀 Future Features (Planned)

### Short-term
- [ ] Payment gateway integration
- [ ] WhatsApp notifications
- [ ] Mobile app
- [ ] Advanced reporting

### Long-term
- [ ] AI-powered tax suggestions
- [ ] Video consultation
- [ ] E-signature for documents

---

**Last Updated**: December 4, 2025  
**Version**: 1.0.0  
**For**: CA Firm Management System
