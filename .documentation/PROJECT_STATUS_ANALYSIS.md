# CA FIRM MANAGEMENT SYSTEM - PROJECT STATUS ANALYSIS

> **Purpose**: This document provides a comprehensive analysis of the current project status, implementation state, and readiness for the Enhanced Service Workflow feature. Created for AI context continuity.
>
> **Created**: December 12, 2025
> **Last Updated**: December 12, 2025

---

## TABLE OF CONTENTS

1. [Role Hierarchy & Permissions](#1-role-hierarchy--permissions)
2. [Current Service Model](#2-current-service-model)
3. [Current Task Model](#3-current-task-model)
4. [Implementation Status](#4-implementation-status)
5. [API Endpoints Summary](#5-api-endpoints-summary)
6. [Frontend Portals](#6-frontend-portals)
7. [Next Implementation: Enhanced Service Workflow](#7-next-implementation-enhanced-service-workflow)

---

## 1. ROLE HIERARCHY & PERMISSIONS

### 1.1 Role Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROLE HIERARCHY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────┐                                                         │
│  │  SUPER_ADMIN   │  ← Firm Owner (ONE per firm)                           │
│  │                │  • Cannot be deleted                                   │
│  │  Can create:   │  • Admins, PMs, Team Members, Clients                  │
│  │  Permissions:  │  • FULL CONTROL over everything                        │
│  └───────┬────────┘                                                         │
│          │                                                                  │
│  ┌───────▼────────┐                                                         │
│  │     ADMIN      │  ← Regular Admin                                        │
│  │                │  • Created by Super Admin                              │
│  │  Can create:   │  • PMs, Team Members, Clients                          │
│  │  Permissions:  │  • Everything except managing Super Admin              │
│  └───────┬────────┘                                                         │
│          │                                                                  │
│  ┌───────▼────────────────┐                                                 │
│  │   PROJECT_MANAGER      │  ← Was "CA" (Chartered Accountant)              │
│  │                        │  • Created by Super Admin or Admin             │
│  │  Can create:           │  • Team Members, Clients (assigned to self)    │
│  │  Permissions:          │  • Manage assigned clients & their services    │
│  └───────┬────────────────┘                                                 │
│          │                                                                  │
│  ┌───────▼────────────────┐                                                 │
│  │     TEAM_MEMBER        │  ← Was "TRAINEE" (Junior Staff)                 │
│  │                        │  • Created by SA, Admin, or PM                 │
│  │  Can create:           │  • Nothing                                     │
│  │  Permissions:          │  • View assigned clients, upload docs          │
│  └────────────────────────┘                                                 │
│                                                                             │
│  ┌────────────────────────┐                                                 │
│  │        CLIENT          │  ← End Customer                                 │
│  │                        │  • Created by SA, Admin, or PM                 │
│  │  Can create:           │  • Nothing (can request services - NOT YET)    │
│  │  Permissions:          │  • View own services, docs, invoices           │
│  └────────────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Who Can Create Whom

| Creator | Can Create |
|---------|------------|
| **SUPER_ADMIN** | Admin, Project Manager, Team Member, Client |
| **ADMIN** | Project Manager, Team Member, Client |
| **PROJECT_MANAGER** | Team Member, Client (assigns to self) |
| **TEAM_MEMBER** | Nothing |
| **CLIENT** | Nothing |

### 1.3 Separate Database Tables

Each role has its **own dedicated table** in the database:

| Role | Table Name | Key Fields |
|------|------------|------------|
| SUPER_ADMIN | `super_admins` | firmId (unique - 1 per firm), email, password, name |
| ADMIN | `admins` | firmId, createdBy (SuperAdmin ID), email, password |
| PROJECT_MANAGER | `project_managers` | firmId, createdBy, createdByRole, managedClients relation |
| TEAM_MEMBER | `team_members` | firmId, createdBy, createdByRole, clientAssignments |
| CLIENT | `clients` | firmId, managedBy (PM ID), createdBy, createdByRole |

### 1.4 Authentication Middleware

Available middleware functions in `auth.middleware.ts`:

```typescript
authenticate           // Verify JWT, attach user to req
requireSuperAdmin      // Only SUPER_ADMIN
requireAdmin           // SUPER_ADMIN or ADMIN
requireProjectManager  // SUPER_ADMIN, ADMIN, or PROJECT_MANAGER
requireTeamMember      // Above + TEAM_MEMBER
requireClient          // Any authenticated user
requireOwnership       // Check if user owns the resource
```

---

## 2. CURRENT SERVICE MODEL

### 2.1 Service Schema

```prisma
model Service {
  id                String        @id @default(uuid())
  firmId            String        // Link to Firm
  clientId          String        // Client who this service is FOR
  projectManagerId  String?       // PM assigned to manage (optional)
  title             String
  description       String?
  type              ServiceType   // Enum (11 types)
  status            ServiceStatus // Enum (5 statuses)
  dueDate           DateTime?
  completedAt       DateTime?
  feeAmount         Decimal?      @db.Decimal(10, 2)
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  firm           Firm            @relation(...)
  client         Client          @relation(...)
  projectManager ProjectManager? @relation(...)
  tasks          Task[]
  documents      Document[]
  invoices       Invoice[]
}
```

### 2.2 ServiceType Enum (11 Types)

```typescript
enum ServiceType {
  ITR_FILING           // Income Tax Return Filing
  GST_REGISTRATION     // GST Registration
  GST_RETURN           // GST Return Filing
  TDS_RETURN           // TDS Return Filing
  TDS_COMPLIANCE       // TDS Compliance
  ROC_FILING           // Registrar of Companies Filing
  AUDIT                // Audit Services
  BOOK_KEEPING         // Book Keeping
  PAYROLL              // Payroll Processing
  CONSULTATION         // General Consultation
  OTHER                // Other Services
}
```

### 2.3 ServiceStatus Enum (5 Statuses)

```typescript
enum ServiceStatus {
  PENDING        // Just created, work not started
  IN_PROGRESS    // Work has started
  UNDER_REVIEW   // Being reviewed by PM/Admin
  COMPLETED      // Successfully completed
  CANCELLED      // Cancelled/Stopped
}
```

### 2.4 Current Service Creation Flow

| Role | Can Create Services? | Via API Endpoint | Notes |
|------|---------------------|------------------|-------|
| **SUPER_ADMIN** | ✅ YES | Uses Admin routes | Full access |
| **ADMIN** | ✅ YES | `POST /api/admin/services` | Can assign to any client |
| **PROJECT_MANAGER** | ✅ YES | `POST /api/project-manager/services` | Only for managed clients |
| **TEAM_MEMBER** | ❌ NO | — | Read-only access |
| **CLIENT** | ❌ NO | — | **Cannot request services** |

### 2.5 What's Missing in Service Model

1. **Service Request Feature** - Client cannot request services
2. **Team Member Assignment** - No `assignedToTeamMemberId` field
3. **Delegation Workflow** - PM cannot delegate to Team Member
4. **Request → Service Conversion** - No approval workflow

---

## 3. CURRENT TASK MODEL

### 3.1 Task Schema

```prisma
model Task {
  id           String        @id @default(uuid())
  serviceId    String        // Links to a Service
  assignedToId String?       // Team Member assigned
  title        String
  description  String?
  status       ServiceStatus // Reuses ServiceStatus enum
  priority     Int           @default(0) // 0=Low, 1=Medium, 2=High
  dueDate      DateTime?
  completedAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relations
  service    Service     @relation(...)
  assignedTo TeamMember? @relation(...)
}
```

### 3.2 Task Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| **Database Model** | ✅ EXISTS | Schema defined in `schema.prisma` |
| **Task CRUD API** | ⚠️ PLACEHOLDER | Returns empty array with TODO comment |
| **Task Assignment UI** | ❌ NOT IMPLEMENTED | No frontend pages |
| **Task Status Tracking** | ❌ NOT IMPLEMENTED | No UI components |

### 3.3 Current Tasks Route (Placeholder)

```typescript
// apps/api/src/modules/tasks/tasks.routes.ts (31 lines only)
router.get('/', async (_req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Services endpoint - to be implemented with new schema',
  });
});
```

---

## 4. IMPLEMENTATION STATUS

### 4.1 Fully Implemented Features ✅

| Module | Features |
|--------|----------|
| **Authentication** | Email/Password login, OTP 2FA, JWT tokens, Password Reset, Change Password, NextAuth.js integration, Role-based routing |
| **User Management** | Full CRUD for all 5 roles, Soft delete (deactivate), Hard delete (permanent), Reactivate, Role hierarchy enforcement |
| **Client Management** | Full CRUD, PAN/Aadhar/GSTIN fields, Managed by Project Manager relation, Client assignments to Team Members |
| **Services** | CRUD operations, 11 service types, 5 status values, Due date management, Fee amount tracking |
| **Documents** | File upload (Multer), Hierarchical document view, 14 document types, Draft/Submit workflow, Role-based access, Download functionality |
| **Invoices** | Invoice creation, Invoice items, GST tax calculation (18%), Payment recording, PDF generation (PDFKit) |
| **Activity Logs** | Basic logging on user creation/deletion, Super Admin view |
| **UI/UX** | Responsive design, Dark mode support, Gradient headers, KPI dashboard cards, Quick action buttons, Status badges, Modern UI components |

### 4.2 Partially Implemented Features ⚠️

| Module | What Works | What's Missing |
|--------|------------|----------------|
| **Tasks** | Database model exists | CRUD API, Assignment UI, Status tracking UI |
| **Activity Logs** | Basic logging | Comprehensive logging, Log viewer in all portals |
| **Notifications** | Pusher configured | Real-time notification UI, Email notifications |
| **Generic /api/services** | Route exists | Actual implementation (placeholder only) |

### 4.3 Not Implemented Features ❌

| Feature Category | Missing Features |
|------------------|------------------|
| **Service Workflow** | Service Requests (Client-initiated), Service Assignment (PM → TM), Request approval workflow |
| **Reports & Analytics** | Revenue reports, Service completion analytics, User productivity, Export to Excel/PDF |
| **Communication** | Client-Team Member chat, In-app messaging |
| **Calendar** | Calendar integration, Deadline reminders, Event scheduling |
| **Bulk Operations** | Import/Export CSV/Excel, Bulk status updates |
| **Settings** | Firm settings (placeholder exists), Email/Invoice template customization, Role permission customization |
| **Integrations** | Payment gateway (Razorpay/PayU), SMS notifications, WhatsApp, Cloud storage (S3) |

---

## 5. API ENDPOINTS SUMMARY

### 5.1 API Route Modules (15 Total)

```
apps/api/src/modules/
├── auth/                  # Authentication routes
├── super-admin/           # Super Admin routes (923 lines)
├── admin/                 # Admin routes (2240 lines - LARGEST)
├── project-manager/       # Project Manager routes (996 lines)
├── team-member/           # Team Member routes (603 lines)
├── client/                # Client routes (536 lines)
├── services/              # Generic services (31 lines - PLACEHOLDER)
├── tasks/                 # Task routes (placeholder)
├── documents/             # Document routes + admin/ca variants
├── invoices/              # Invoice routes
├── analytics/             # Analytics routes
├── activity/              # Activity routes
├── activity-log/          # Activity log routes
├── clients/               # Generic clients module
└── sse/                   # Server-Sent Events
```

### 5.2 Services Endpoints by Role

| Role | Method | Endpoint | Description |
|------|--------|----------|-------------|
| **Admin** | GET | `/api/admin/services` | List all services with filters (clientId, type, status, dateFrom, dateTo) |
| **Admin** | POST | `/api/admin/services` | Create service for any client |
| **Admin** | GET | `/api/admin/services/:id` | Get service by ID with client, PM, tasks, documents |
| **Admin** | PATCH | `/api/admin/services/:id/status` | Update service status |
| **PM** | GET | `/api/project-manager/services` | Get services for managed clients |
| **PM** | POST | `/api/project-manager/services` | Create service (auto-assigned to self) |
| **TM** | GET | `/api/team-member/services` | Get services for assigned clients |
| **Client** | GET | `/api/client/services` | Get own services |
| **Client** | GET | `/api/client/services/:id` | Get own service details |
| **Generic** | GET | `/api/services` | PLACEHOLDER - returns empty array |

### 5.3 Admin Service Creation Payload

```json
POST /api/admin/services
{
  "clientId": "uuid",
  "type": "ITR_FILING",
  "title": "ITR Filing FY 2024-25",
  "description": "Income tax return filing",
  "dueDate": "2025-07-31",
  "feeAmount": 5000,
  "notes": "Optional notes",
  "projectManagerId": "uuid (optional)"
}
```

### 5.4 PM Service Creation Payload

```json
POST /api/project-manager/services
{
  "userId": "client-uuid",       // Client ID
  "type": "GST_RETURN",
  "title": "GST Return Q3",
  "description": "Quarterly GST return",
  "financialYear": "2024-25",
  "period": "Q3",
  "dueDate": "2025-01-20",
  "feeAmount": 2000,
  "notes": "Optional notes"
}
```

---

## 6. FRONTEND PORTALS

### 6.1 Portal Layouts and Theme Colors

| Portal | Route Group | Theme Color | Icon Component |
|--------|-------------|-------------|----------------|
| **Super Admin** | `/super-admin/*` | Purple/Pink gradient (`from-purple-500 to-pink-500`) | Crown emoji 👑 |
| **Admin** | `/admin/*` | Blue (`#3b82f6`) | Shield icon |
| **Project Manager** | `/project-manager/*` | Green/Emerald (`#10b981`, `bg-green-600`) | Building2 icon |
| **Team Member** | `/team-member/*` | Teal (`#14b8a6`, `bg-teal-600`) | UserCircle icon |
| **Client** | `/client/*` | Violet (`#8b5cf6`, `bg-violet-600`) | UserCircle icon |

### 6.2 Portal Navigation Items

**Super Admin Portal:**
- Dashboard, Admins, Project Managers, Team Members, Clients, Documents, Audit Logs, Settings

**Admin Portal:**
- Dashboard, Project Managers, Team Members, Clients, Services, Documents, Invoices, Reports, Activity Logs, Settings

**Project Manager Portal:**
- Dashboard, Clients, Team Members, Services, Documents, Invoices, Settings

**Team Member Portal:**
- Dashboard, My Clients, Services, Documents, Settings

**Client Portal:**
- Dashboard, My Services, My Documents, My Invoices, Profile

### 6.3 UI Components Available

Located in `apps/web/components/ui/`:

```
alert-dialog.tsx    # Confirmation dialogs
badge.tsx           # Status badges
button.tsx          # Button component
card.tsx            # Card container
checkbox.tsx        # Checkbox input
dialog.tsx          # Modal dialogs
dropdown-menu.tsx   # Dropdown menus
input.tsx           # Input fields
label.tsx           # Form labels
select.tsx          # Select dropdowns
sheet.tsx           # Slide-over panels
table.tsx           # Data tables
tabs.tsx            # Tab navigation
textarea.tsx        # Text areas
theme-toggle.tsx    # Dark mode toggle
```

---

## 7. NEXT IMPLEMENTATION: ENHANCED SERVICE WORKFLOW

### 7.1 Overview

The Enhanced Service Workflow will enable:
1. **Client-Initiated Requests** - Clients can request services
2. **Firm-Initiated Services** - SA/Admin/PM can create services directly
3. **Assignment Workflow** - Assign services to PM, delegate to Team Member
4. **Status Tracking** - Complete lifecycle tracking

### 7.2 Core Principle

| Initiation Type | Flow |
|-----------------|------|
| **Client-Initiated** | Client raises request → Firm reviews → Approves → Converts to Service |
| **Firm-Initiated** | SA/Admin/PM creates Service directly → No approval needed |

### 7.3 Required Database Changes

#### New Model: ServiceRequest

```prisma
model ServiceRequest {
  id            String              @id @default(uuid())
  firmId        String
  clientId      String              // Client who requested
  type          ServiceType
  title         String
  description   String?
  urgency       RequestUrgency      @default(NORMAL)
  status        RequestStatus       @default(PENDING)
  
  // Approval/Rejection
  reviewedBy    String?             // User ID who reviewed
  reviewedByRole String?            // Role of reviewer
  reviewedAt    DateTime?
  rejectionReason String?
  
  // Conversion
  convertedToServiceId String?      // Link to Service after approval
  convertedAt   DateTime?
  
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
}

enum RequestUrgency {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum RequestStatus {
  PENDING       // Waiting for review
  UNDER_REVIEW  // Being reviewed
  APPROVED      // Approved, converted to Service
  REJECTED      // Rejected with reason
  CANCELLED     // Cancelled by client
}
```

#### Service Model Enhancement

```prisma
model Service {
  // ... existing fields ...
  
  // NEW: Assignment to Team Member
  assignedToTeamMemberId String?
  assignedToTeamMember   TeamMember? @relation("AssignedServices", ...)
  assignedAt             DateTime?
  
  // NEW: Request origin tracking
  originatedFromRequest  Boolean     @default(false)
  serviceRequestId       String?
  
  // NEW: Priority
  priority               Int         @default(0) // 0=Low, 1=Medium, 2=High, 3=Urgent
}
```

### 7.4 Required API Endpoints

#### For Client:
```
POST   /api/client/service-requests          # Create new request
GET    /api/client/service-requests          # List own requests
GET    /api/client/service-requests/:id      # Get request details
DELETE /api/client/service-requests/:id      # Cancel request (if pending)
```

#### For Firm (SA/Admin/PM):
```
GET    /api/admin/service-requests           # List all requests
GET    /api/admin/service-requests/:id       # Get request details
PATCH  /api/admin/service-requests/:id/approve   # Approve & convert
PATCH  /api/admin/service-requests/:id/reject    # Reject with reason
```

#### For Service Assignment:
```
PATCH  /api/admin/services/:id/assign-pm         # Assign to PM
PATCH  /api/admin/services/:id/assign-team-member # Assign to TM
PATCH  /api/project-manager/services/:id/delegate # PM delegates to TM
```

### 7.5 Required Frontend Pages

#### Client Portal (New):
- `/client/service-requests` - List requests
- `/client/service-requests/new` - Create request form
- `/client/service-requests/[id]` - Request details

#### Admin Portal (New):
- `/admin/service-requests` - List pending requests
- `/admin/service-requests/[id]` - Review request (approve/reject)
- `/admin/services/[id]/assign` - Assignment page

#### Project Manager Portal (New):
- `/project-manager/service-requests` - List requests for managed clients
- `/project-manager/services/[id]/delegate` - Delegate to Team Member

### 7.6 Implementation Order

1. **Phase 1: Database Schema**
   - Add ServiceRequest model
   - Add new fields to Service model
   - Run migration

2. **Phase 2: Backend API**
   - Service Request CRUD endpoints
   - Approval/Rejection logic
   - Assignment endpoints

3. **Phase 3: Frontend - Client Portal**
   - Service request form
   - Request listing page
   - Request status tracking

4. **Phase 4: Frontend - Firm Portals**
   - Request review pages (Admin, PM)
   - Assignment UI
   - Status update UI

5. **Phase 5: Notifications**
   - Email on request creation
   - Email on approval/rejection
   - Email on assignment

---

## APPENDIX: KNOWN ISSUES & TECHNICAL DEBT

### Technical Issues
1. **Hydration Errors** - Fixed with `mounted` state for Radix DropdownMenu
2. **Legacy Naming** - Some routes still reference `/trainees` (old naming)
3. **File Storage** - Currently local, needs cloud migration

### Security Considerations
1. OTP codes stored in plain text (should be hashed)
2. File uploads need size/type validation improvements
3. Rate limiting not implemented

### Missing Validations
1. PAN format validation (XXXXX0000X)
2. Aadhar format validation (12 digits)
3. GSTIN format validation (15 chars)
4. Phone number format validation (10 digits)

---

*Document Version: 1.0*
*Created: December 12, 2025*
*Author: AI Assistant (Antigravity)*
