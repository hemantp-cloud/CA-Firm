# CA Firm Management System
## Complete Project Documentation

**Version**: 1.0.0  
**Last Updated**: December 4, 2025  
**Developer**: Hemant Pandey

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Core Features](#core-features)
5. [Technology Stack](#technology-stack)
6. [Database Schema](#database-schema)
7. [Recent Enhancement: Trainee Management](#recent-enhancement-trainee-management)
8. [API Documentation](#api-documentation)
9. [Frontend Structure](#frontend-structure)
10. [Security & Authentication](#security--authentication)
11. [Getting Started](#getting-started)
12. [Common Workflows](#common-workflows)

---

## Executive Summary

The **CA Firm Management System** is a comprehensive SaaS platform designed for Chartered Accountant firms to manage their operations, clients, and business processes efficiently.

### Key Highlights
- **Multi-tenant Architecture** with secure data isolation
- **4-tier Role Hierarchy**: ADMIN → CA → TRAINEE → CLIENT
- **8 Core Modules**: Authentication, Client Management, Trainee Management, Services, Documents, Invoices, Activity Logging, Real-time Notifications
- **Modern Tech Stack**: Next.js 16, React 19, Express, PostgreSQL, Prisma
- **Recent Major Enhancement**: Complete Trainee Management System (Dec 2-3, 2025)

### Business Value
- ✅ Streamline CA firm operations
- ✅ Manage clients and services efficiently
- ✅ Delegate work to junior staff (trainees)
- ✅ Track documents and invoices
- ✅ Maintain compliance with activity logging
- ✅ Real-time notifications and updates

---

## System Architecture

### Architecture Pattern
```
┌─────────────────────────────────────────────────────────┐
│                    CA Firm Management System            │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼───────┐
│   Frontend     │                 │    Backend     │
│   Next.js 16   │ ◄──── HTTP ───► │   Express      │
│   React 19     │                 │   TypeScript   │
└────────────────┘                 └────────┬───────┘
                                            │
                                   ┌────────▼───────┐
                                   │   PostgreSQL   │
                                   │   + Prisma     │
                                   └────────────────┘
```

### Project Structure
```
CA Firm Management/
├── apps/
│   ├── api/                    # Backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── modules/        # 14 feature modules
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── utils/          # Helper functions
│   │   └── prisma/             # Database schema
│   │
│   └── web/                    # Frontend (Next.js)
│       ├── app/
│       │   ├── (auth)/         # Auth pages
│       │   ├── (admin)/        # Admin portal
│       │   ├── (ca)/           # CA portal
│       │   ├── (trainee)/      # Trainee portal (NEW)
│       │   └── (client)/       # Client portal
│       └── components/         # UI components
│
├── docker/                     # Docker config
└── Documentation files
```

---

## User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN (Super Administrator)                            │
│  ✓ Full system access                                   │
│  ✓ Create CA users, Trainees, Clients                   │
│  ✓ Permanent delete capability                          │
│  ✓ View all data and reports                            │
└─────────────────────────────────────────────────────────┘
                          ↓ manages
┌─────────────────────────────────────────────────────────┐
│  CA (Chartered Accountant)                              │
│  ✓ Create and manage Clients                            │
│  ✓ Create and manage Trainees                           │
│  ✓ Assign clients to trainees                           │
│  ✓ Manage services, documents, invoices                 │
│  ✓ 2FA enabled (OTP required)                           │
└─────────────────────────────────────────────────────────┘
                          ↓ manages
┌─────────────────────────────────────────────────────────┐
│  TRAINEE (Junior Staff) ⭐ NEW!                         │
│  ✓ View ONLY assigned clients                           │
│  ✓ Manage services for assigned clients                 │
│  ✓ Upload documents for assigned clients                │
│  ✗ Cannot create clients                                │
│  ✗ Cannot see unassigned clients                        │
└─────────────────────────────────────────────────────────┘
                          ↓ handles
┌─────────────────────────────────────────────────────────┐
│  CLIENT (End Customer)                                  │
│  ✓ View own services, documents, invoices               │
│  ✓ Upload documents                                     │
│  ✓ Google SSO available                                 │
│  ✗ No 2FA by default                                    │
└─────────────────────────────────────────────────────────┘
```

### Permission Matrix

| Feature | ADMIN | CA | TRAINEE | CLIENT |
|---------|-------|----|---------| -------|
| Create CA Users | ✅ | ❌ | ❌ | ❌ |
| Create Trainees | ✅ | ✅ | ❌ | ❌ |
| Create Clients | ✅ | ✅ | ❌ | ❌ |
| Assign Clients to Trainees | ✅ | ✅ | ❌ | ❌ |
| View All Clients | ✅ | ✅ | ❌ | ❌ |
| View Assigned Clients | ✅ | ✅ | ✅ | ❌ |
| Manage Services | ✅ | ✅ | ✅* | ❌ |
| Upload Documents | ✅ | ✅ | ✅* | ✅ |
| Create Invoices | ✅ | ✅ | ❌ | ❌ |
| View Activity Logs | ✅ | ✅ | ❌ | ❌ |
| Permanent Delete | ✅ | ❌ | ❌ | ❌ |

*Only for assigned clients

---

## Core Features

### 1. Authentication & Security 🔐

**Features**:
- Email/Password login with bcrypt hashing
- 2FA (OTP) for ADMIN and CA roles
- Google SSO for CLIENT role only
- Password reset via email
- Forced password change on first login
- Account lockout after 5 failed attempts (15-minute lockout)
- JWT token-based sessions

**Authentication Flow**:
```
User Login
    ↓
Validate Credentials
    ↓
If CA/ADMIN → Generate OTP → Send Email → Verify OTP
If CLIENT/TRAINEE → Generate JWT Token
    ↓
Redirect to Dashboard
```

### 2. Client Management 👥

**Features**:
- Create clients with company details (GSTIN, PAN)
- Commission tracking for CAs
- Activate/Deactivate clients
- Welcome email with temporary password
- Client assignment to trainees

### 3. Trainee Management ⭐ NEW!

**Features**:
- Create trainee users
- Assign specific clients to trainees
- Data isolation (trainees see only assigned clients)
- Dedicated trainee portal
- Manage trainee assignments
- Soft delete and permanent delete (ADMIN only)

**Implementation Date**: December 2-3, 2025

### 4. Service Management 💼

**Service Types**:
- ITR Filing
- GST Registration
- GST Return
- TDS Return
- Audit
- Book Keeping
- Payroll
- Consultation
- Other

**Service Status Flow**:
```
PENDING → IN_PROGRESS → UNDER_REVIEW → COMPLETED/CANCELLED
```

**Features**:
- Kanban board with drag-and-drop
- Due date tracking
- Fee management
- Service assignment

### 5. Document Management 📄

**Supported Files**: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG (max 10MB)

**Document Workflow**:
```
DRAFT → SUBMITTED → ASSIGNED → REVIEWING → APPROVED/REJECTED
```

**Features**:
- Version control
- Folder organization
- Hide/Restore (recycle bin)
- Permanent delete (ADMIN only)
- Document assignment

### 6. Invoice Management 💰

**Features**:
- Create invoices with line items
- Auto-numbering (INV-YYYY-XXXXX)
- GST calculation (18% default)
- PDF generation
- Email invoices
- Payment tracking

**Invoice Status**:
```
DRAFT → SENT → PAID/OVERDUE/CANCELLED
```

### 7. Activity Logging 📋

**Features**:
- Comprehensive audit trail
- IP address and user agent tracking
- Filter by action, entity, date range
- Export to Excel
- Compliance-ready

### 8. Real-time Notifications 🔔

**Features**:
- Server-Sent Events (SSE)
- Document upload notifications
- Service update notifications
- Invoice creation notifications
- User-specific notifications

---

## Technology Stack

### Frontend
```yaml
Framework: Next.js 16.0.4 (App Router)
React: 19.2.0
Language: TypeScript 5.x
Styling: Tailwind CSS 4.x
UI Components: Radix UI
Forms: React Hook Form + Zod
Charts: Recharts
Authentication: NextAuth.js 4.24.13
HTTP Client: Axios
Drag & Drop: @dnd-kit
Notifications: Sonner
Real-time: Pusher.js
Theme: next-themes
State: Zustand
```

### Backend
```yaml
Runtime: Node.js
Framework: Express 4.18.2
Language: TypeScript 5.3.3
Database ORM: Prisma 5.7.1
Database: PostgreSQL
Auth: JWT
Password: bcrypt 5.1.1
Email: Resend API 6.5.2
File Upload: Multer 2.0.2
PDF: PDFKit 0.17.2
Excel: ExcelJS 4.4.0
Real-time: Pusher 5.2.0
Validation: Zod 3.22.4
Google OAuth: google-auth-library 10.5.0
```

---

## Database Schema

### Key Models

#### User
```prisma
model User {
  id          String   @id @default(uuid())
  firmId      String
  clientId    String?  // NULL for ADMIN/CA
  email       String
  password    String?
  name        String
  role        Role     // ADMIN, CA, TRAINEE, CLIENT
  
  // 2FA
  twoFactorEnabled Boolean
  otpCode          String?
  otpExpiry        DateTime?
  
  // NEW: Trainee Relations
  traineeAssignments ClientAssignment[]
  clientAssignments  ClientAssignment[]
}
```

#### ClientAssignment (NEW)
```prisma
model ClientAssignment {
  id         String @id @default(uuid())
  traineeId  String
  clientId   String
  assignedBy String
  notes      String?
  
  trainee User @relation("TraineeAssignments")
  client  User @relation("ClientAssignments")
  
  @@unique([traineeId, clientId])
}
```

### Complete Schema
- **Firm**: CA firm details
- **User**: All users (4 roles)
- **Client**: CA partners
- **Service**: Work orders
- **Task**: Service tasks
- **Document**: File uploads
- **Invoice**: Billing
- **InvoiceItem**: Line items
- **Payment**: Payment records
- **ActivityLog**: Audit trail
- **Setting**: Firm settings
- **ClientAssignment**: Trainee-client mapping (NEW)

---

## Recent Enhancement: Trainee Management

### Overview
**Date**: December 2-3, 2025  
**Purpose**: Enable CA firms to manage junior staff and assign them specific clients

### What Was Built

#### Backend (~1,500 lines)
- ✅ `trainee.service.ts` - 11 functions
- ✅ `trainee.routes.ts` - 8 API endpoints
- ✅ `trainee.validation.ts` - Zod schemas
- ✅ Database migration

#### Frontend - CA Portal (~1,000 lines)
- ✅ Trainees list page
- ✅ Create trainee form
- ✅ Trainee detail page
- ✅ Client assignment page

#### Frontend - Trainee Portal (~1,200 lines)
- ✅ Custom layout (green theme)
- ✅ Dashboard
- ✅ My Clients (assigned only)
- ✅ Services management
- ✅ Documents management

#### UI Components (~500 lines)
- ✅ Checkbox component
- ✅ Tabs component
- ✅ Alert Dialog component

### Key Features
1. **Client Assignment System**
2. **Data Isolation** (DB, API, UI levels)
3. **Dedicated Portal** with custom theme
4. **Security** with role-based access
5. **Audit Trail** for all assignments

---

## API Documentation

### Authentication Endpoints
```
POST   /api/auth/login
POST   /api/auth/verify-otp
POST   /api/auth/google
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password
POST   /api/auth/logout
```

### Trainee Endpoints (NEW)
```
GET    /api/trainees
POST   /api/trainees
GET    /api/trainees/:id
PUT    /api/trainees/:id
DELETE /api/trainees/:id
DELETE /api/trainees/:id/permanent
POST   /api/trainees/:id/assign-clients
POST   /api/trainees/:id/unassign-clients
GET    /api/trainees/:id/clients
```

### Other Modules
- `/api/clients` - Client management
- `/api/services` - Service management
- `/api/documents` - Document management
- `/api/invoices` - Invoice management
- `/api/activity` - Activity logs
- `/api/sse/events` - Real-time notifications

---

## Frontend Structure

### Route Groups
```
app/
├── (auth)/              # Login, OTP, Password Reset
├── (admin)/admin/       # Admin Portal
│   ├── dashboard/
│   ├── ca/
│   ├── client/
│   ├── trainees/        ⭐ NEW
│   ├── services/
│   ├── documents/
│   └── invoices/
│
├── (ca)/ca/             # CA Portal
│   ├── dashboard/
│   ├── clients/
│   ├── trainees/        ⭐ NEW
│   ├── services/
│   └── documents/
│
├── (trainee)/trainee/   ⭐ NEW - Trainee Portal
│   ├── dashboard/
│   ├── clients/
│   ├── services/
│   └── documents/
│
└── (client)/client/     # Client Portal
    ├── dashboard/
    ├── services/
    ├── documents/
    └── invoices/
```

---

## Security & Authentication

### Security Features
- ✅ JWT tokens with expiry
- ✅ bcrypt password hashing
- ✅ 2FA with OTP (5-min expiry)
- ✅ Account lockout (5 attempts)
- ✅ Password reset tokens (1-hour)
- ✅ Google OAuth validation
- ✅ Role-based middleware
- ✅ Data isolation by role
- ✅ Prisma ORM (SQL injection prevention)
- ✅ Input validation with Zod
- ✅ CORS configuration
- ✅ Activity logging

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database
- npm or yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd "CA Firm Management"

# Install API dependencies
cd apps/api
npm install

# Install Web dependencies
cd ../web
npm install
```

### Environment Setup
Create `.env` files in `apps/api` and `apps/web` with required variables.

### Run Development
```bash
# Terminal 1: Start API
cd apps/api
npm run dev

# Terminal 2: Start Web
cd apps/web
npm run dev
```

### Default Credentials
```
ADMIN:
Email: admin@cafirm.com
Password: Admin@123
2FA: Enabled

CA:
Email: ca@cafirm.com
Password: CA@123
2FA: Enabled
```

---

## Common Workflows

### Create and Assign Trainee
```
1. CA logs in → /ca/trainees
2. Click "Add Trainee"
3. Fill form (Name, Email, Phone)
4. Submit → Trainee receives welcome email
5. Navigate to /ca/trainees/[id]/assign-clients
6. Select clients to assign
7. Submit → ClientAssignment created
8. Trainee can now access assigned clients
```

### Trainee Daily Work
```
1. Trainee logs in → /trainee/dashboard
2. View assigned clients → /trainee/clients
3. Click on client → View details
4. Manage services → Update status
5. Upload documents → Submit for review
6. CA receives notification
```

### Create Invoice
```
1. CA logs in → /ca/invoices
2. Click "Create Invoice"
3. Select Client and Service
4. Add line items
5. Submit → Invoice created
6. Click "Send Invoice" → Email sent
7. Track payment status
```

---

## Project Statistics

### Codebase
- **Total Files**: 200+
- **Lines of Code**: ~50,000+
- **API Endpoints**: 50+
- **Frontend Pages**: 40+

### Recent Enhancement
- **Development Time**: 2 days
- **Files Created**: 20+
- **Lines Added**: ~5,000

---

## Support & Contact

**Developer**: Hemant Pandey  
**Version**: 1.0.0  
**Last Updated**: December 4, 2025

For questions or issues, refer to:
- PROJECT_OVERVIEW.md
- QUICK_REFERENCE.md
- TESTING_CHECKLIST.md

---

**End of Documentation**
