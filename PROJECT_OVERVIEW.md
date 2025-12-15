# CA Firm Management System - Complete Project Overview

## 📋 Table of Contents
1. [Project Summary](#project-summary)
2. [System Architecture](#system-architecture)
3. [User Roles & Hierarchy](#user-roles--hierarchy)
4. [Core Features](#core-features)
5. [Recent Major Enhancement: Trainee Management System](#recent-major-enhancement-trainee-management-system)
6. [Technology Stack](#technology-stack)
7. [Database Schema](#database-schema)
8. [API Modules](#api-modules)
9. [Frontend Structure](#frontend-structure)
10. [Authentication & Security](#authentication--security)
11. [Key Workflows](#key-workflows)
12. [Testing & Quality Assurance](#testing--quality-assurance)

---

## 📊 Project Summary

The **CA Firm Management System** is a comprehensive, cloud-based SaaS platform designed specifically for Chartered Accountant (CA) firms to manage their operations, clients, and business processes efficiently. The system supports a multi-tiered role hierarchy and provides specialized portals for each user type.

### Key Highlights:
- **Multi-tenant Architecture**: Secure data isolation for each CA firm
- **Role-Based Access Control**: 4 distinct user roles (ADMIN, CA, TRAINEE, CLIENT)
- **Real-time Updates**: Server-Sent Events (SSE) for live notifications
- **Document Management**: Secure upload, storage, and workflow management
- **Service Tracking**: Kanban-style service status management
- **Invoice Management**: Complete billing and payment tracking
- **Activity Logging**: Comprehensive audit trail for compliance

---

## 🏗️ System Architecture

### Architecture Pattern
- **Frontend**: Next.js 16 with App Router (React 19)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens
- **Real-time**: Server-Sent Events (SSE) for notifications
- **Email**: Resend API for transactional emails
- **File Storage**: Local file system with organized folder structure

### Project Structure
```
CA Firm Management/
├── apps/
│   ├── api/                    # Backend API (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── admin/      # Admin operations
│   │   │   │   ├── ca/         # CA operations
│   │   │   │   ├── client/     # Client operations
│   │   │   │   ├── trainee/    # Trainee operations (NEW)
│   │   │   │   ├── documents/  # Document management
│   │   │   │   ├── services/   # Service management
│   │   │   │   ├── invoices/   # Invoice management
│   │   │   │   ├── activity-log/ # Activity tracking
│   │   │   │   └── sse/        # Real-time notifications
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── utils/          # Helper functions
│   │   └── prisma/             # Database schema & migrations
│   │
│   └── web/                    # Frontend (Next.js)
│       ├── app/
│       │   ├── (auth)/         # Authentication pages
│       │   ├── (admin)/        # Admin portal
│       │   ├── (ca)/           # CA portal
│       │   ├── (client)/       # Client portal
│       │   └── (trainee)/      # Trainee portal (NEW)
│       ├── components/         # Reusable UI components
│       ├── lib/                # Utilities & API client
│       └── contexts/           # React contexts
│
├── docker/                     # Docker configuration
├── README.md                   # Project documentation
└── TESTING_CHECKLIST.md        # Comprehensive testing guide
```

---

## 👥 User Roles & Hierarchy

### Role Hierarchy (Top to Bottom)

#### 1. **ADMIN** (Super Administrator)
- **Purpose**: Manages the entire CA firm
- **Access**: Full system access
- **Capabilities**:
  - Create and manage CA users
  - Create and manage Trainees
  - Create and manage Clients
  - View all data across the firm
  - Access all reports and analytics
  - Manage firm settings
  - Permanent delete operations

#### 2. **CA** (Chartered Accountant / Partner)
- **Purpose**: Senior professionals who bring in clients
- **Access**: Manage their clients and trainees
- **Capabilities**:
  - Create and manage Clients
  - Create and manage Trainees
  - Assign Clients to Trainees
  - View and manage all services
  - Create invoices
  - Upload and manage documents
  - View activity logs
  - Access analytics dashboard

#### 3. **TRAINEE** (Junior Staff / Assistant)
- **Purpose**: Handle assigned clients under CA supervision
- **Access**: Limited to assigned clients only
- **Capabilities**:
  - View assigned clients only
  - Manage services for assigned clients
  - Upload documents for assigned clients
  - View invoices for assigned clients
  - Cannot create new clients
  - Cannot assign other trainees

#### 4. **CLIENT** (End Customer)
- **Purpose**: End users who receive CA services
- **Access**: View their own data only
- **Capabilities**:
  - View their services
  - Upload documents
  - View invoices
  - Make payments
  - Update profile
  - View service status

### Role Transition (Historical Context)
The system underwent a major role refactoring:
- **Old**: `CLIENT` role → **New**: `CA` role
- **Old**: `USER` role → **New**: `CLIENT` role
- **New Addition**: `TRAINEE` role (introduced in recent enhancement)

---

## 🎯 Core Features

### 1. **Authentication & Security**
- **Email/Password Login** with OTP verification
- **Google SSO** (for CLIENT role only)
- **Two-Factor Authentication (2FA)** for CA and ADMIN
- **Password Reset** via email
- **Account Lockout** after 5 failed attempts (15-minute lockout)
- **Forced Password Change** on first login
- **JWT Token-based** session management
- **Activity Logging** for all actions

### 2. **Client Management**
- Create and manage client records
- Store client details (Company, Contact, GSTIN, PAN, etc.)
- Commission tracking for CAs
- Client activation/deactivation
- Client assignment to trainees

### 3. **Service Management**
- **Service Types**: ITR Filing, GST Registration, GST Return, TDS Return, Audit, Book Keeping, Payroll, Consultation, etc.
- **Service Status**: Pending, In Progress, Under Review, Completed, Cancelled
- **Kanban Board**: Drag-and-drop service status updates
- **Due Date Tracking**: Monitor service deadlines
- **Service Assignment**: Link services to specific clients
- **Fee Management**: Track service fees and billing

### 4. **Document Management**
- **Upload Documents**: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG (max 10MB)
- **Document Types**: PAN Card, Aadhar, Bank Statement, Form 16, GST Certificate, Audit Report, etc.
- **Document Workflow**:
  - Draft → Submit → Assign → Review → Approve/Reject
- **Version Control**: Track document versions
- **Folder Organization**: Auto-organized by client and document type
- **Hide/Restore**: Recycle bin pattern for soft deletes
- **Permanent Delete**: Admin-only hard delete

### 5. **Invoice Management**
- **Create Invoices**: Line items, quantities, tax rates
- **Auto-numbering**: INV-YYYY-XXXXX format
- **GST Calculation**: Automatic tax computation
- **Invoice Status**: Draft, Sent, Paid, Overdue, Cancelled
- **PDF Generation**: Professional invoice PDFs
- **Email Invoices**: Send invoices to clients
- **Payment Tracking**: Record payments with multiple methods

### 6. **Activity Logging**
- **Comprehensive Audit Trail**: All user actions logged
- **Log Types**: CREATE, UPDATE, DELETE, LOGIN, UPLOAD, SUBMIT, ASSIGN, etc.
- **Filters**: By action, entity, date range
- **Export**: Excel export for reporting
- **IP Tracking**: Record IP addresses and user agents

### 7. **Dashboard & Analytics**
- **KPI Cards**: Total Clients, Active Services, Revenue, Overdue Invoices
- **Charts**: Services by Status (Pie), Revenue Trend (Line), Services by Type (Bar)
- **Recent Activity**: Real-time activity feed
- **Quick Actions**: Shortcuts to common tasks

### 8. **Real-time Notifications**
- **Server-Sent Events (SSE)**: Live updates without polling
- **Notification Types**: Document uploads, service updates, invoice creation
- **User-specific**: Notifications filtered by role and permissions

---

## 🆕 Recent Major Enhancement: Trainee Management System

### Overview
**Implementation Date**: December 2-3, 2025  
**Purpose**: Enable CA firms to manage junior staff (trainees) and assign them specific clients to handle

### What Was Built

#### 1. **Database Schema Updates**
- Added `TRAINEE` role to the `Role` enum
- Created `ClientAssignment` model for trainee-client relationships
- Added relations to `User` model for trainee assignments

#### 2. **Backend API (Trainee Module)**

**File**: `apps/api/src/modules/trainee/trainee.service.ts`

**Key Functions**:
- `listTrainees()` - Get all trainees in the firm
- `getTraineeById()` - Get trainee details with assigned clients
- `createTrainee()` - Create new trainee with auto-generated password
- `updateTrainee()` - Update trainee information
- `softDeleteTrainee()` - Deactivate trainee (soft delete)
- `permanentDeleteTrainee()` - Hard delete trainee (ADMIN only)
- `assignClientsToTrainee()` - Assign multiple clients to a trainee
- `unassignClientsFromTrainee()` - Remove client assignments
- `getAssignedClients()` - Get all clients assigned to a trainee
- `getTraineesForClient()` - Get all trainees assigned to a client

**File**: `apps/api/src/modules/trainee/trainee.routes.ts`

**API Endpoints**:
```
GET    /api/trainees                    # List all trainees
POST   /api/trainees                    # Create trainee
GET    /api/trainees/:id                # Get trainee by ID
PUT    /api/trainees/:id                # Update trainee
DELETE /api/trainees/:id                # Soft delete trainee
DELETE /api/trainees/:id/permanent      # Hard delete (ADMIN only)
POST   /api/trainees/:id/assign-clients # Assign clients
POST   /api/trainees/:id/unassign-clients # Unassign clients
GET    /api/trainees/:id/clients        # Get assigned clients
```

#### 3. **Frontend - CA Portal (Trainee Management)**

**Pages Created**:

1. **Trainees List** (`/ca/trainees`)
   - View all trainees in the firm
   - Search and filter trainees
   - Create new trainee
   - View trainee details
   - Deactivate/reactivate trainees

2. **Trainee Detail Page** (`/ca/trainees/[id]`)
   - View trainee contact information
   - View assigned clients
   - Manage client assignments
   - View trainee activity

3. **Assign Clients Page** (`/ca/trainees/[id]/assign-clients`)
   - Multi-select client assignment
   - Checkbox-based selection
   - Bulk assign/unassign clients
   - View current assignments

4. **Create Trainee Form** (`/ca/trainees/create`)
   - Name, Email, Phone
   - PAN, Aadhar (optional)
   - Address (optional)
   - Auto-generate temporary password
   - Send welcome email

#### 4. **Frontend - Trainee Portal**

**Layout**: `apps/web/app/(trainee)/layout.tsx`
- Custom sidebar with green theme
- Navigation: Dashboard, My Clients, Services, Documents
- User profile section
- Logout functionality

**Pages Created**:

1. **Trainee Dashboard** (`/trainee/dashboard`)
   - KPI cards: Assigned Clients, Active Services, Pending Services
   - Recent services list
   - Quick actions

2. **My Clients** (`/trainee/clients`)
   - View only assigned clients
   - Client details and contact info
   - Filter and search clients

3. **Client Detail** (`/trainee/clients/[id]`)
   - View client information
   - View client services
   - View client documents
   - View client invoices

4. **Services** (`/trainee/services`)
   - View services for assigned clients only
   - Filter by status, type
   - Update service status
   - Add notes

5. **Documents** (`/trainee/documents`)
   - View documents for assigned clients
   - Upload new documents
   - Download documents
   - Document workflow management

#### 5. **Admin Portal Updates**

**Pages Created**:

1. **Admin Trainees List** (`/admin/trainees`)
   - View all trainees across the firm
   - Create new trainee
   - Edit trainee details
   - Deactivate/reactivate
   - Permanent delete (ADMIN only)

2. **Admin Trainee Detail** (`/admin/trainees/[id]`)
   - Full trainee information
   - Assigned clients list
   - Activity history
   - Manage assignments

3. **Assign Clients** (`/admin/trainees/[id]/assign-clients`)
   - Same functionality as CA portal
   - Admin can assign any client to any trainee

#### 6. **UI Components Created**

**File**: `apps/web/components/ui/checkbox.tsx`
- Radix UI Checkbox component
- Used in client assignment multi-select
- Accessible and keyboard-navigable

**File**: `apps/web/components/ui/tabs.tsx`
- Radix UI Tabs component
- Used for organizing trainee information

**File**: `apps/web/components/ui/alert-dialog.tsx`
- Confirmation dialogs for delete operations
- Used in trainee management

### Key Features of Trainee System

#### Client Assignment Workflow
1. CA/Admin creates a trainee
2. Trainee receives welcome email with credentials
3. CA/Admin assigns specific clients to the trainee
4. Trainee logs in and sees only assigned clients
5. Trainee manages services/documents for assigned clients
6. CA/Admin can reassign clients at any time

#### Data Isolation
- Trainees can ONLY see data for their assigned clients
- Trainees cannot see other trainees' clients
- Trainees cannot create new clients
- Trainees cannot assign other trainees

#### Permission Model
```
ADMIN:
  ✓ Create/Edit/Delete Trainees
  ✓ Assign any client to any trainee
  ✓ View all trainee data
  ✓ Permanent delete trainees

CA:
  ✓ Create/Edit Trainees
  ✓ Assign their clients to trainees
  ✓ View their trainees
  ✓ Soft delete trainees

TRAINEE:
  ✓ View assigned clients only
  ✓ Manage services for assigned clients
  ✓ Upload documents for assigned clients
  ✗ Cannot create clients
  ✗ Cannot assign other trainees
  ✗ Cannot see unassigned clients
```

### Technical Implementation Details

#### Database Relationships
```prisma
model User {
  // ... other fields
  
  // Trainee Assignment Relations
  traineeAssignments ClientAssignment[] @relation("TraineeAssignments")
  clientAssignments  ClientAssignment[] @relation("ClientAssignments")
  assignmentsMade    ClientAssignment[] @relation("AssignmentsMade")
}

model ClientAssignment {
  id         String   @id @default(uuid())
  traineeId  String   // User with TRAINEE role
  clientId   String   // User with CLIENT role
  assignedBy String   // ADMIN or CA who made the assignment
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  trainee        User @relation("TraineeAssignments", ...)
  client         User @relation("ClientAssignments", ...)
  assignedByUser User @relation("AssignmentsMade", ...)

  @@unique([traineeId, clientId]) // Prevent duplicates
}
```

#### API Authorization
- All trainee endpoints check user role (ADMIN or CA)
- Trainee portal endpoints filter data by assigned clients
- Client assignment prevents duplicate assignments
- Soft delete preserves data integrity

#### Frontend State Management
- Zustand for global state
- React Query for server state (if implemented)
- Local state for forms and UI

---

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 16.0.4 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Authentication**: NextAuth.js 4.24.13
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit
- **Notifications**: Sonner (toast notifications)
- **Real-time**: Pusher.js (SSE client)
- **Theme**: next-themes (dark mode support)

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Language**: TypeScript 5.3.3
- **Database ORM**: Prisma 5.7.1
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **Email**: Resend API 6.5.2
- **File Upload**: Multer 2.0.2
- **PDF Generation**: PDFKit 0.17.2
- **Excel Export**: ExcelJS 4.4.0
- **Real-time**: Pusher 5.2.0 (SSE)
- **Validation**: Zod 3.22.4
- **Google OAuth**: google-auth-library 10.5.0

### DevOps & Tools
- **Containerization**: Docker
- **Version Control**: Git
- **Package Manager**: npm
- **Development**: nodemon, ts-node
- **Database Tools**: Prisma Studio

---

## 🗄️ Database Schema

### Core Models

#### Firm
- Represents the CA firm
- One firm per installation (can be extended for multi-tenancy)
- Stores firm details, logo, GSTIN, PAN

#### User
- All users (ADMIN, CA, TRAINEE, CLIENT)
- Email/password or Google SSO
- 2FA support (OTP)
- Account lockout mechanism
- Password reset tokens
- Relations: firm, client (for CLIENT role), services, documents, invoices

#### Client (formerly called "Client" in old schema)
- Represents CA partners who bring clients
- Stores commission percentage
- Relations: firm, users (CLIENT role), services, invoices

#### Service
- Represents work orders/services
- Types: ITR, GST, TDS, Audit, etc.
- Status: Pending, In Progress, Under Review, Completed, Cancelled
- Relations: firm, user (CLIENT), client (CA), tasks, documents, invoices

#### Document
- File uploads with metadata
- Document types: PAN, Aadhar, Bank Statement, etc.
- Workflow: Draft → Submitted → Assigned → Approved/Rejected
- Soft delete with recycle bin
- Relations: firm, user, service, assignedToUser

#### Invoice
- Billing and invoicing
- Auto-generated invoice numbers
- Line items with GST calculation
- Status: Draft, Sent, Paid, Overdue, Cancelled
- Relations: firm, user, client, service, items, payments

#### ActivityLog
- Audit trail for all actions
- Stores action, entity type, entity ID, details (JSON)
- IP address and user agent tracking
- Relations: firm, user, document

#### ClientAssignment (NEW)
- Maps trainees to clients
- Prevents duplicate assignments
- Tracks who made the assignment
- Relations: trainee (User), client (User), assignedBy (User)

### Enums
- **Role**: ADMIN, CA, TRAINEE, CLIENT
- **ServiceStatus**: PENDING, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CANCELLED
- **ServiceType**: ITR_FILING, GST_REGISTRATION, GST_RETURN, TDS_RETURN, AUDIT, etc.
- **InvoiceStatus**: DRAFT, SENT, PAID, OVERDUE, CANCELLED
- **DocumentType**: PAN_CARD, AADHAR_CARD, BANK_STATEMENT, FORM_16, etc.
- **DocumentStatus**: PENDING, IN_PROGRESS, REVIEWING, APPROVED, REJECTED, CHANGES_REQUESTED
- **PaymentMethod**: CASH, CHEQUE, UPI, NEFT, RTGS, CARD, BANK_TRANSFER
- **PaymentStatus**: PENDING, COMPLETED, FAILED, REFUNDED

---

## 🔌 API Modules

### 1. **auth** - Authentication
- Login (email/password)
- OTP verification
- Google SSO
- Password reset
- Change password
- Logout

### 2. **admin** - Admin Operations
- Create CA users
- Create Clients
- View all data
- Manage firm settings
- Permanent delete operations

### 3. **ca** - CA Operations
- Create Clients
- Create Trainees
- Assign Clients to Trainees
- Manage services
- Create invoices
- View analytics

### 4. **client** - Client Operations
- View their services
- Upload documents
- View invoices
- Update profile

### 5. **trainee** - Trainee Operations (NEW)
- List trainees
- Create trainee
- Update trainee
- Delete trainee
- Assign/unassign clients
- Get assigned clients

### 6. **documents** - Document Management
- Upload documents
- List documents
- Download documents
- Update document status
- Assign documents to users
- Hide/restore documents
- Permanent delete (ADMIN only)

### 7. **services** - Service Management
- Create services
- Update service status
- List services (filtered by role)
- Kanban board updates
- Service analytics

### 8. **invoices** - Invoice Management
- Create invoices
- Generate PDF
- Send invoice email
- Record payments
- Update invoice status

### 9. **activity-log** - Activity Logging
- Log all user actions
- Filter logs by action, entity, date
- Export logs to Excel

### 10. **sse** - Real-time Notifications
- Server-Sent Events endpoint
- Push notifications to clients
- Document upload notifications
- Service update notifications

---

## 🎨 Frontend Structure

### Route Groups

#### (auth) - Authentication Pages
- `/login` - Login page
- `/verify-otp` - OTP verification
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/change-password` - Forced password change

#### (admin) - Admin Portal
- `/admin/dashboard` - Admin dashboard
- `/admin/ca` - Manage CA users
- `/admin/client` - Manage Clients
- `/admin/trainees` - Manage Trainees (NEW)
- `/admin/services` - All services
- `/admin/documents` - All documents
- `/admin/invoices` - All invoices
- `/admin/activity` - Activity logs
- `/admin/reports` - Reports & analytics
- `/admin/settings` - Firm settings

#### (ca) - CA Portal
- `/ca/dashboard` - CA dashboard
- `/ca/clients` - Manage Clients
- `/ca/trainees` - Manage Trainees (NEW)
- `/ca/services` - Manage services
- `/ca/documents` - Document management
- `/ca/invoices` - Invoice management
- `/ca/activity` - Activity logs

#### (client) - Client Portal
- `/client/dashboard` - Client dashboard
- `/client/services` - View services
- `/client/documents` - Upload/view documents
- `/client/invoices` - View invoices
- `/client/profile` - Update profile

#### (trainee) - Trainee Portal (NEW)
- `/trainee/dashboard` - Trainee dashboard
- `/trainee/clients` - View assigned clients
- `/trainee/clients/[id]` - Client details
- `/trainee/services` - Manage services for assigned clients
- `/trainee/documents` - Document management for assigned clients

### Shared Components
- `components/ui/` - Reusable UI components (buttons, inputs, cards, etc.)
- `components/forms/` - Form components
- `components/layouts/` - Layout components
- `contexts/` - React contexts (AuthContext, etc.)
- `lib/` - Utilities and API client

---

## 🔐 Authentication & Security

### Authentication Flow

#### 1. **Email/Password Login**
```
User enters email/password
  ↓
Backend validates credentials
  ↓
If 2FA enabled (CA/ADMIN):
  - Generate OTP
  - Send OTP email
  - Redirect to /verify-otp
  ↓
If 2FA disabled (CLIENT/TRAINEE):
  - Generate JWT token
  - Return token
  - Redirect to dashboard
```

#### 2. **OTP Verification**
```
User enters 6-digit OTP
  ↓
Backend validates OTP
  ↓
If valid:
  - Generate JWT token
  - Clear OTP from database
  - Redirect to dashboard
  ↓
If invalid:
  - Show error
  - Allow retry or resend
```

#### 3. **Google SSO**
```
User clicks "Sign in with Google"
  ↓
Google OAuth popup
  ↓
User grants permissions
  ↓
Backend receives Google token
  ↓
Validate token with Google
  ↓
Find or create user
  ↓
If CA role: Reject (CA cannot use Google login)
If CLIENT/TRAINEE: Generate JWT and login
```

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Signed with secret key
- **Account Lockout**: 5 failed attempts = 15-minute lockout
- **OTP Expiry**: OTPs expire after 5 minutes
- **Password Reset**: Tokens expire after 1 hour
- **CORS**: Configured for frontend domain only
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Prevention**: React auto-escaping
- **Activity Logging**: All actions logged with IP and user agent

---

## 🔄 Key Workflows

### 1. **Client Onboarding (by CA)**
```
1. CA logs in → /ca/dashboard
2. Navigate to /ca/clients
3. Click "Add Client"
4. Fill form: Name, Email, Phone, GSTIN, PAN, etc.
5. Submit form
6. Backend creates Client record
7. Backend sends welcome email with temp password
8. Client receives email
9. Client logs in with temp password
10. Client forced to change password
11. Client enters OTP (if 2FA enabled)
12. Client redirected to /client/dashboard
```

### 2. **Trainee Assignment (by CA)**
```
1. CA logs in → /ca/dashboard
2. Navigate to /ca/trainees
3. Click "Add Trainee"
4. Fill form: Name, Email, Phone, PAN, Aadhar
5. Submit form
6. Backend creates Trainee user
7. Backend sends welcome email
8. Navigate to /ca/trainees/[id]/assign-clients
9. Select clients to assign
10. Submit assignment
11. Backend creates ClientAssignment records
12. Trainee can now see assigned clients
```

### 3. **Service Management (by CA)**
```
1. CA logs in → /ca/services
2. Click "Add Service"
3. Select Client and Service Type
4. Fill details: Title, Description, Due Date, Fee
5. Submit form
6. Service created with status "PENDING"
7. CA drags service to "IN_PROGRESS" on Kanban board
8. Backend updates status
9. Activity log created
10. Client receives notification (if SSE enabled)
11. CA drags to "COMPLETED"
12. Service marked complete
```

### 4. **Document Upload (by Client)**
```
1. Client logs in → /client/documents
2. Click "Upload Document"
3. Select file (drag & drop or click)
4. Choose document type (PAN, Aadhar, etc.)
5. Add description (optional)
6. Click "Upload"
7. Backend saves file to storage
8. Document status: "DRAFT"
9. Client clicks "Submit for Review"
10. Document status: "SUBMITTED"
11. CA receives notification
12. CA assigns document to Trainee
13. Trainee reviews and approves/rejects
14. Client receives notification
```

### 5. **Invoice Creation (by CA)**
```
1. CA logs in → /ca/invoices
2. Click "Create Invoice"
3. Select Client and Service
4. Add line items:
   - Description
   - Quantity
   - Unit Price
   - Tax Rate
5. Add discount (optional)
6. System calculates totals
7. Submit invoice
8. Invoice created with auto-generated number
9. Click "Send Invoice"
10. Backend generates PDF
11. Backend sends email to client
12. Invoice status: "SENT"
13. Client makes payment
14. CA records payment
15. Invoice status: "PAID"
```

---

## ✅ Testing & Quality Assurance

### Testing Checklist
A comprehensive testing checklist is available in `TESTING_CHECKLIST.md` covering:

#### CA Flow
- Authentication (Login, OTP, 2FA)
- Client Management
- User Management
- Service Management (Kanban)
- Document Management
- Invoice Management
- Activity Logs
- Logout

#### CLIENT Flow
- Authentication
- Password Change (First Login)
- Dashboard
- Service Viewing
- Document Upload
- Invoice Viewing
- Profile Management

#### TRAINEE Flow (NEW)
- Authentication
- Dashboard
- View Assigned Clients
- Manage Services for Assigned Clients
- Upload Documents
- View Invoices

#### Additional Test Cases
- Forgot Password Flow
- Google SSO
- Error Scenarios (Invalid credentials, expired OTP, etc.)
- Role-Based Route Protection
- Data Isolation
- Email Testing
- Performance Testing
- Browser Compatibility

### Quality Metrics
- **Code Coverage**: Not yet measured (recommend Jest + React Testing Library)
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint configured
- **Code Review**: Manual review process
- **User Acceptance Testing**: Ongoing

---

## 📈 Recent Development Timeline

### December 2-3, 2025: Trainee Management System
- ✅ Database schema updates (ClientAssignment model)
- ✅ Backend API module (trainee.service.ts, trainee.routes.ts)
- ✅ CA Portal: Trainee management pages
- ✅ Admin Portal: Trainee management pages
- ✅ Trainee Portal: Complete portal with dashboard, clients, services, documents
- ✅ Client assignment workflow
- ✅ Data isolation and permissions
- ✅ UI components (Checkbox, Tabs, Alert Dialog)
- ✅ Testing and bug fixes

### November 29, 2025: Role Refactoring
- ✅ Renamed CLIENT → CA
- ✅ Renamed USER → CLIENT
- ✅ Updated all references across codebase
- ✅ Database migration
- ✅ Updated documentation

### November 28, 2025: Admin Dashboard & Authentication
- ✅ Admin dashboard UI
- ✅ Role-based guards (RequireAuth, RequireAdmin)
- ✅ OTP verification fixes
- ✅ Login flow improvements

### November 27, 2025: Client Management & Auth Flow
- ✅ Client creation and management
- ✅ Authentication flow refinements
- ✅ Password change flow
- ✅ Session management

---

## 🚀 Future Enhancements (Potential)

### Short-term
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] WhatsApp notifications
- [ ] Mobile app (React Native)
- [ ] Advanced reporting (custom date ranges, filters)
- [ ] Bulk operations (bulk invoice creation, bulk client import)

### Medium-term
- [ ] Multi-firm support (true multi-tenancy)
- [ ] Client portal mobile app
- [ ] Advanced analytics (ML-based insights)
- [ ] Integration with accounting software (Tally, QuickBooks)
- [ ] E-signature for documents

### Long-term
- [ ] AI-powered tax suggestions
- [ ] Automated compliance reminders
- [ ] Client self-service portal enhancements
- [ ] Video consultation integration
- [ ] Blockchain-based document verification

---

## 📝 Development Best Practices

### Code Organization
- **Modular Architecture**: Each feature in its own module
- **Separation of Concerns**: Routes, Services, Validation separated
- **DRY Principle**: Reusable components and utilities
- **Type Safety**: TypeScript for both frontend and backend

### API Design
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Consistent Response Format**: `{ success, data, message, error }`
- **Error Handling**: Try-catch blocks with meaningful error messages
- **Validation**: Zod schemas for input validation
- **Authorization**: Role-based middleware

### Frontend Patterns
- **Component Composition**: Small, reusable components
- **Custom Hooks**: Reusable logic extraction
- **Context API**: Global state management
- **Form Handling**: React Hook Form + Zod
- **Loading States**: Skeleton loaders and spinners
- **Error Boundaries**: Graceful error handling

### Database Best Practices
- **Indexes**: Strategic indexing for performance
- **Relations**: Proper foreign keys and cascades
- **Migrations**: Version-controlled schema changes
- **Seeding**: Test data for development
- **Soft Deletes**: Preserve data integrity

---

## 🎓 Learning Resources

### For New Developers
1. **Next.js Documentation**: https://nextjs.org/docs
2. **Prisma Documentation**: https://www.prisma.io/docs
3. **TypeScript Handbook**: https://www.typescriptlang.org/docs
4. **Radix UI**: https://www.radix-ui.com/docs
5. **Tailwind CSS**: https://tailwindcss.com/docs

### Project-Specific
1. **README.md**: Setup instructions
2. **TESTING_CHECKLIST.md**: Testing guide
3. **prisma/schema.prisma**: Database schema reference
4. **API Documentation**: (Consider adding Swagger/OpenAPI)

---

## 📞 Support & Contact

For questions or issues:
- **Developer**: Hemant Pandey
- **Project Repository**: (Add Git repository URL)
- **Documentation**: This file and README.md

---

## 📄 License

(To be specified)

---

**Last Updated**: December 4, 2025  
**Version**: 1.0.0  
**Status**: Active Development
