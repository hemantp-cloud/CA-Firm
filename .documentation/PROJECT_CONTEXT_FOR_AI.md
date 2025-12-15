# CA FIRM MANAGEMENT SYSTEM - COMPLETE PROJECT CONTEXT

> **Purpose**: This document provides complete technical context for AI chat models (Claude, ChatGPT, Gemini, etc.) to understand and continue development on this project. It contains all essential information about the implemented features, database schema, API structure, and frontend architecture.

---

## 1. PROJECT OVERVIEW

### 1.1 What This Project Is
A **multi-tenant CA (Chartered Accountant) Firm Management System** that allows accounting firms to manage:
- Multiple user roles with hierarchical permissions
- Client management
- Service tracking (ITR filing, GST, Audits, etc.)
- Document storage and sharing
- Invoice generation and payment tracking
- Task management
- Activity logging

### 1.2 Who It's For
- **Firm Owners** (Super Admin) - Complete control over the firm
- **Admins** - Manage users, clients, services
- **Project Managers** (formerly called CAs) - Manage assigned clients and their services
- **Team Members** (formerly called Trainees) - Work on assigned client tasks
- **Clients** - End customers who view their services, documents, and invoices

### 1.3 Business Context
This is for an Indian Chartered Accountant (CA) firm that provides tax, audit, and compliance services to clients. The system helps track:
- Who is managing which client
- What services are being provided
- Document collection from clients
- Billing and payments

---

## 2. TECH STACK

### 2.1 Backend (API)
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | Web server framework |
| **TypeScript** | Type safety |
| **Prisma ORM** | Database ORM |
| **PostgreSQL** | Database (hosted on Supabase) |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcrypt/bcryptjs** | Password hashing |
| **Zod** | Input validation |
| **Multer** | File uploads |
| **PDFKit** | PDF generation for invoices |
| **Nodemailer + Resend** | Email sending (OTP, notifications) |
| **Pusher** | Real-time notifications (configured but not fully implemented) |

### 2.2 Frontend (Web)
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **TailwindCSS 4** | Styling |
| **Radix UI** | Headless UI components |
| **NextAuth.js v4** | Authentication |
| **React Hook Form + Zod** | Form handling and validation |
| **Axios** | HTTP client |
| **Recharts** | Charts and analytics |
| **Sonner** | Toast notifications |
| **Zustand** | State management |
| **Lucide React** | Icons |
| **date-fns** | Date formatting |

### 2.3 Project Structure
```
CA Firm Management/
├── apps/
│   ├── api/                    # Backend Express API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Database seeding
│   │   └── src/
│   │       ├── app.ts          # Express app setup
│   │       ├── server.ts       # Server entry point
│   │       ├── modules/        # Route modules
│   │       │   ├── auth/       # Authentication
│   │       │   ├── super-admin/
│   │       │   ├── admin/
│   │       │   ├── project-manager/
│   │       │   ├── team-member/
│   │       │   ├── client/
│   │       │   ├── documents/
│   │       │   ├── services/
│   │       │   ├── invoices/
│   │       │   └── ...
│   │       ├── shared/
│   │       │   ├── middleware/
│   │       │   │   └── auth.middleware.ts
│   │       │   └── utils/
│   │       │       └── prisma.ts
│   │       └── services/
│   │           ├── email.service.ts
│   │           └── auditLog.service.ts
│   │
│   └── web/                    # Next.js Frontend
│       ├── app/
│       │   ├── (auth)/         # Auth pages (login, etc.)
│       │   ├── super-admin/    # Super Admin portal
│       │   ├── (admin)/        # Admin portal
│       │   ├── (project-manager)/ # PM portal
│       │   ├── (team-member)/  # Team Member portal
│       │   └── (client)/       # Client portal
│       ├── components/
│       │   ├── ui/             # Reusable UI components
│       │   └── ...
│       └── lib/
│           └── api.ts          # Axios API client
│
├── .env                        # Environment variables
└── .documentation/             # Documentation files
```

---

## 3. DATABASE SCHEMA

### 3.1 Role Hierarchy (ENUM)
```
SUPER_ADMIN  →  Main firm owner (ONE per firm, cannot be deleted)
    ↓
ADMIN        →  Regular admin (manages everything except Super Admin)
    ↓
PROJECT_MANAGER  →  Was "CA" - Manages clients and their services
    ↓
TEAM_MEMBER  →  Was "TRAINEE" - Junior staff, works on assigned clients
    ↓
CLIENT       →  End customer
```

### 3.2 Core Models

#### **Firm** (Organization)
```prisma
model Firm {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  phone     String?
  address   String?
  gstin     String?
  pan       String?
  website   String?
  logo      String?
  
  // Relations to all users and entities
  superAdmin       SuperAdmin?
  admins           Admin[]
  projectManagers  ProjectManager[]
  teamMembers      TeamMember[]
  clients          Client[]
  services         Service[]
  documents        Document[]
  invoices         Invoice[]
}
```

#### **SuperAdmin** (Firm Owner - ONE per firm)
```prisma
model SuperAdmin {
  id          String    @id @default(uuid())
  firmId      String    @unique  // Only one per firm
  email       String    @unique
  password    String
  name        String
  phone       String?
  isActive    Boolean   @default(true)
  
  // Auth features
  emailVerified           Boolean
  mustChangePassword      Boolean
  twoFactorEnabled        Boolean
  otpCode                 String?
  otpExpiry               DateTime?
  failedLoginAttempts     Int
  lockedUntil             DateTime?
  
  // Cannot be soft deleted (firm owner)
  deletedAt   DateTime?  // Should always be null
}
```

#### **Admin**
```prisma
model Admin {
  id          String    @id @default(uuid())
  firmId      String
  createdBy   String    // SuperAdmin who created this
  email       String    @unique
  password    String
  name        String
  phone       String?
  isActive    Boolean   @default(true)
  
  // Same auth fields as SuperAdmin
  // Soft delete support
  deletedAt   DateTime?
  deletedBy   String?
}
```

#### **ProjectManager** (formerly CA)
```prisma
model ProjectManager {
  id            String    @id @default(uuid())
  firmId        String
  createdBy     String    // SuperAdmin or Admin who created
  createdByRole String    // "SUPER_ADMIN" or "ADMIN"
  email         String    @unique
  password      String
  name          String
  phone         String?
  pan           String?
  address       String?
  city          String?
  state         String?
  pincode       String?
  isActive      Boolean   @default(true)
  
  // Business
  gstin         String?
  commission    Decimal?  // Commission percentage
  
  // Relations
  managedClients    Client[]    // Clients managed by this PM
  services          Service[]   // Services handled
  
  // Soft delete
  deletedAt    DateTime?
  deletedBy    String?
}
```

#### **TeamMember** (formerly Trainee)
```prisma
model TeamMember {
  id            String    @id @default(uuid())
  firmId        String
  createdBy     String    // SuperAdmin, Admin, or PM
  createdByRole String    
  email         String    @unique
  password      String
  name          String
  phone         String?
  address       String?
  isActive      Boolean   @default(true)
  joiningDate   DateTime
  mentorId      String?   // Optional PM mentor
  
  // Relations
  tasks             Task[]
  documents         Document[]
  clientAssignments ClientAssignment[]
  
  // Soft delete
  deletedAt    DateTime?
  deletedBy    String?
}
```

#### **Client** (End Customer)
```prisma
model Client {
  id            String    @id @default(uuid())
  firmId        String
  managedBy     String?   // ProjectManager ID (optional)
  createdBy     String    // Who created this client
  createdByRole String    
  email         String    @unique
  password      String
  name          String
  phone         String?
  pan           String?
  aadhar        String?
  address       String?
  city          String?
  state         String?
  pincode       String?
  isActive      Boolean   @default(true)
  
  // Business
  gstin         String?
  companyName   String?
  
  // Relations
  projectManager    ProjectManager?    // Who manages this client
  services          Service[]
  documents         Document[]
  invoices          Invoice[]
  clientAssignments ClientAssignment[]
  
  // Soft delete
  deletedAt    DateTime?
  deletedBy    String?
}
```

#### **ClientAssignment** (Team Member ↔ Client mapping)
```prisma
model ClientAssignment {
  id           String   @id @default(uuid())
  teamMemberId String
  clientId     String
  assignedBy   String   // Who made the assignment
  notes        String?
  
  @@unique([teamMemberId, clientId])
}
```

### 3.3 Business Models

#### **Service**
```prisma
model Service {
  id               String        @id @default(uuid())
  firmId           String
  clientId         String
  projectManagerId String?
  title            String
  description      String?
  type             ServiceType   // Enum
  status           ServiceStatus // Enum
  dueDate          DateTime?
  completedAt      DateTime?
  feeAmount        Decimal?
  notes            String?
}

enum ServiceType {
  ITR_FILING, GST_REGISTRATION, GST_RETURN, TDS_RETURN,
  TDS_COMPLIANCE, ROC_FILING, AUDIT, BOOK_KEEPING,
  PAYROLL, CONSULTATION, OTHER
}

enum ServiceStatus {
  PENDING, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CANCELLED
}
```

#### **Task**
```prisma
model Task {
  id           String        @id @default(uuid())
  serviceId    String
  assignedToId String?       // TeamMember ID
  title        String
  description  String?
  status       ServiceStatus
  priority     Int           // 0=Low, 1=Medium, 2=High
  dueDate      DateTime?
  completedAt  DateTime?
}
```

#### **Document**
```prisma
model Document {
  id             String         @id @default(uuid())
  firmId         String
  clientId       String?        // Optional - for self-documents
  teamMemberId   String?        // Who uploaded
  serviceId      String?        // Linked to service
  uploadedById   String?
  uploadedByRole String?
  fileName       String
  fileType       String         // MIME type
  fileSize       BigInt
  storagePath    String
  documentType   DocumentType?  // Enum
  description    String?
  version        Int            @default(1)
  status         DocumentStatus // Enum
  uploadStatus   String         // "DRAFT" or "SUBMITTED"
  
  // Hide/Restore
  hiddenFrom     String[]
  isDeleted      Boolean
}

enum DocumentType {
  PAN_CARD, AADHAR_CARD, BANK_STATEMENT, FORM_16,
  FORM_26AS, GST_CERTIFICATE, INCORPORATION_CERTIFICATE,
  PARTNERSHIP_DEED, MOA_AOA, AUDIT_REPORT, BALANCE_SHEET,
  PROFIT_LOSS, TAX_RETURN, OTHER
}

enum DocumentStatus {
  PENDING, IN_PROGRESS, REVIEWING, APPROVED, REJECTED, CHANGES_REQUESTED
}
```

#### **Invoice**
```prisma
model Invoice {
  id            String        @id @default(uuid())
  firmId        String
  clientId      String
  serviceId     String?
  invoiceNumber String        @unique
  invoiceDate   DateTime
  dueDate       DateTime
  subtotal      Decimal
  taxRate       Decimal       @default(18.00)  // GST
  taxAmount     Decimal
  discount      Decimal       @default(0.00)
  totalAmount   Decimal
  status        InvoiceStatus
  notes         String?
  
  items    InvoiceItem[]
  payments Payment[]
}

enum InvoiceStatus {
  DRAFT, SENT, PAID, OVERDUE, CANCELLED
}
```

#### **Payment**
```prisma
model Payment {
  id             String        @id @default(uuid())
  invoiceId      String
  amount         Decimal
  paymentMethod  PaymentMethod // Enum
  paymentStatus  PaymentStatus // Enum
  paymentDate    DateTime
  transactionRef String?
  bankName       String?
  notes          String?
}

enum PaymentMethod {
  CASH, CHEQUE, UPI, NEFT, RTGS, CARD, BANK_TRANSFER
}

enum PaymentStatus {
  PENDING, COMPLETED, FAILED, REFUNDED
}
```

#### **ActivityLog**
```prisma
model ActivityLog {
  id         String   @id @default(uuid())
  firmId     String
  userId     String?
  userType   String?  // Role of user
  documentId String?
  action     String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType String   // User, Service, Invoice, Document, etc.
  entityId   String?
  entityName String?
  details    Json?
  ipAddress  String?
  userAgent  String?
}
```

---

## 4. AUTHENTICATION SYSTEM

### 4.1 Flow
1. **Login** (`POST /api/auth/login`)
   - User submits email + password
   - System validates credentials across all role tables
   - If 2FA enabled, OTP is sent via email
   - Returns `{ requiresOtp: true }` or JWT token

2. **OTP Verification** (`POST /api/auth/verify-otp`)
   - User submits email + OTP
   - Validates OTP against stored value
   - Returns JWT token on success

3. **JWT Token Structure**
   ```json
   {
     "userId": "uuid",
     "firmId": "uuid",
     "email": "user@example.com",
     "role": "ADMIN"
   }
   ```

4. **Token Usage**
   - Frontend stores token in localStorage
   - Sent as `Authorization: Bearer <token>` header
   - NextAuth session syncs with JWT for SSR

### 4.2 Password Features
- **Change Password** - Authenticated users can change their password
- **Forgot Password** - Sends reset link via email
- **Must Change Password** - Flag to force password change on first login

### 4.3 Middleware
```typescript
// Available middleware in auth.middleware.ts
authenticate           // Verify JWT, attach user to req
requireSuperAdmin      // Only SUPER_ADMIN
requireAdmin           // SUPER_ADMIN or ADMIN
requireProjectManager  // SUPER_ADMIN, ADMIN, or PROJECT_MANAGER
requireTeamMember      // Above + TEAM_MEMBER
requireClient          // Any authenticated user
requireOwnership       // Check if user owns the resource
```

---

## 5. API ENDPOINTS

### 5.1 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login with email/password |
| POST | `/verify-otp` | Verify OTP for 2FA |
| POST | `/resend-otp` | Resend OTP |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset with token |
| POST | `/change-password` | Change password (authenticated) |
| GET | `/me` | Get current user profile |
| POST | `/logout` | Logout (frontend clears token) |
| POST | `/google` | Google OAuth |

### 5.2 Super Admin (`/api/super-admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard stats |
| GET | `/users?role=X` | List users by role |
| POST | `/admins` | Create admin |
| GET | `/admins` | List all admins |
| GET | `/admins/:id` | Get admin details |
| PUT | `/admins/:id` | Update admin |
| DELETE | `/admins/:id` | Soft delete admin |
| DELETE | `/admins/:id/permanent` | Hard delete admin |
| PATCH | `/admins/:id/reactivate` | Reactivate admin |
| POST | `/project-managers` | Create PM |
| GET | `/project-managers` | List all PMs |
| PUT | `/project-managers/:id` | Update PM |
| DELETE | `/project-managers/:id` | Soft delete PM |
| POST | `/team-members` | Create team member |
| GET | `/team-members` | List all team members |
| PUT | `/team-members/:id` | Update team member |
| DELETE | `/team-members/:id` | Soft delete |
| POST | `/clients` | Create client |
| GET | `/clients` | List all clients |
| PUT | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Soft delete |
| GET | `/audit-logs` | Get activity logs |
| GET | `/documents/hierarchy` | Document hierarchy view |

### 5.3 Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard stats |
| PUT | `/profile` | Update own profile |
| POST | `/change-password` | Change own password |
| GET | `/clients` | List clients |
| POST | `/clients` | Create client |
| PUT | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Soft delete client |
| DELETE | `/clients/:id/permanent` | Hard delete |
| PATCH | `/clients/:id/reactivate` | Reactivate |
| GET | `/project-managers` | List PMs |
| POST | `/project-managers` | Create PM |
| PUT | `/project-managers/:id` | Update PM |
| DELETE | `/project-managers/:id` | Delete PM |
| GET | `/team-members` | List team members |
| POST | `/team-members` | Create team member |
| PUT | `/team-members/:id` | Update |
| DELETE | `/team-members/:id` | Delete |
| POST | `/team-members/:id/assign-clients` | Assign clients |
| POST | `/team-members/:id/unassign-clients` | Unassign clients |
| GET | `/services` | List services |
| POST | `/services` | Create service |
| PUT | `/services/:id` | Update service |
| DELETE | `/services/:id` | Delete service |
| GET | `/invoices` | List invoices |
| POST | `/invoices` | Create invoice |
| GET | `/documents` | List documents |
| GET | `/documents/hierarchy` | Document hierarchy |

### 5.4 Project Manager (`/api/project-manager`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard stats (own clients only) |
| GET | `/clients` | List managed clients |
| POST | `/clients` | Create client (assigns to self) |
| GET | `/clients/:id` | Get client details |
| PUT | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Soft delete client |
| GET | `/services` | List services for managed clients |
| POST | `/services` | Create service |
| PUT | `/services/:id` | Update service |
| GET | `/documents` | List documents |
| GET | `/client-documents` | Client document hierarchy |
| GET | `/invoices` | List invoices |
| GET | `/team-members` | List team members |
| POST | `/team-members` | Create team member |
| PUT | `/team-members/:id` | Update |
| DELETE | `/team-members/:id` | Delete |
| POST | `/team-members/:id/assign-clients` | Assign clients |
| GET | `/profile` | Get own profile |
| PUT | `/profile` | Update own profile |

### 5.5 Team Member (`/api/team-member`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Own dashboard |
| GET | `/clients` | List assigned clients |
| GET | `/services` | Services for assigned clients |
| GET | `/documents/hierarchy` | Document hierarchy |
| POST | `/documents/upload-self` | Upload self document |
| GET | `/documents/:id/download` | Download document |
| DELETE | `/documents/:id` | Delete own document |

### 5.6 Client (`/api/client`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard with services, docs, invoices |
| GET | `/services` | List own services |
| GET | `/services/:id` | Service details |
| GET | `/documents` | List documents |
| POST | `/documents` | Upload document |
| POST | `/documents/draft` | Upload as draft |
| POST | `/documents/submit` | Submit drafts |
| DELETE | `/documents/draft/:id` | Delete draft |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id` | Invoice details |
| GET | `/invoices/:id/pdf` | Download PDF |
| POST | `/payments` | Record payment |
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile |
| GET | `/documents/hierarchy` | Document hierarchy |
| GET | `/documents/:id/download` | Download |

---

## 6. FRONTEND PAGES

### 6.1 Authentication Pages (`/app/(auth)`)
- `/login` - Login form with email/password
- `/verify-otp` - OTP verification screen
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token
- `/change-password` - Force change password

### 6.2 Super Admin Portal (`/app/super-admin`)
- `/dashboard` - KPI cards, activity logs, user counts
- `/admins` - List, create, edit, delete admins
- `/admins/new` - Create admin form
- `/admins/[id]/edit` - Edit admin
- `/project-managers` - List, CRUD for PMs
- `/project-managers/new` - Create PM
- `/project-managers/[id]/edit` - Edit PM
- `/team-members` - List, CRUD for team members
- `/team-members/new` - Create
- `/team-members/[id]/edit` - Edit
- `/clients` - List, CRUD for clients
- `/clients/new` - Create
- `/clients/[id]/edit` - Edit
- `/documents` - Hierarchical document view
- `/audit-logs` - System activity logs
- `/settings` - System settings
- `/settings/firm` - Firm profile

### 6.3 Admin Portal (`/app/(admin)`)
- `/admin/dashboard` - KPI cards, quick actions
- `/admin/project-managers` - List, CRUD
- `/admin/project-managers/new`
- `/admin/project-managers/[id]`
- `/admin/project-managers/[id]/edit`
- `/admin/team-members` - List, CRUD
- `/admin/team-members/new`
- `/admin/team-members/[id]`
- `/admin/team-members/[id]/edit`
- `/admin/team-members/[id]/assign-clients`
- `/admin/client` - Client list
- `/admin/client/new`
- `/admin/client/[id]`
- `/admin/client/[id]/edit`
- `/admin/services` - Service list
- `/admin/services/new`
- `/admin/services/[id]`
- `/admin/services/[id]/edit`
- `/admin/invoices` - Invoice list
- `/admin/documents` - Document hierarchy
- `/admin/activity` - Activity logs
- `/admin/settings` - Settings
- `/admin/reports` - Reports (placeholder)

### 6.4 Project Manager Portal (`/app/(project-manager)`)
- `/project-manager/dashboard` - Own clients, services stats
- `/project-manager/clients` - Managed clients
- `/project-manager/clients/new`
- `/project-manager/clients/[id]`
- `/project-manager/clients/[id]/edit`
- `/project-manager/team-members` - Team members
- `/project-manager/team-members/new`
- `/project-manager/team-members/[id]`
- `/project-manager/team-members/[id]/edit`
- `/project-manager/team-members/[id]/assign-clients`
- `/project-manager/services` - Services for clients
- `/project-manager/services/new`
- `/project-manager/services/[id]`
- `/project-manager/services/[id]/edit`
- `/project-manager/documents` - Documents
- `/project-manager/client-documents` - Client doc hierarchy
- `/project-manager/invoices` - Invoices
- `/project-manager/profile` - Own profile
- `/project-manager/settings` - Settings

### 6.5 Team Member Portal (`/app/(team-member)`)
- `/team-member/dashboard` - Assigned clients, services
- `/team-member/clients` - Assigned clients list
- `/team-member/clients/[id]` - Client details
- `/team-member/services` - Services for assigned clients
- `/team-member/documents` - Document hierarchy
- `/team-member/settings` - Profile & password

### 6.6 Client Portal (`/app/(client)`)
- `/client/dashboard` - Services, docs, invoices overview
- `/client/services` - Service list with progress
- `/client/services/[id]` - Service details with timeline
- `/client/documents` - Document upload/download
- `/client/invoices` - Invoice list
- `/client/invoices/[id]` - Invoice details
- `/client/invoices/[id]/pay` - Payment page
- `/client/profile` - Profile & password

---

## 7. CURRENT IMPLEMENTATION STATUS

### ✅ FULLY IMPLEMENTED

#### Authentication
- [x] Email/Password login
- [x] OTP-based 2FA
- [x] JWT tokens
- [x] Password change
- [x] Forgot/Reset password
- [x] NextAuth.js integration
- [x] Role-based routing

#### User Management
- [x] CRUD for all roles (Super Admin, Admin, PM, TM, Client)
- [x] Soft delete (deactivate) users
- [x] Permanent delete users
- [x] Reactivate users
- [x] Assign clients to Team Members
- [x] Role hierarchy enforcement

#### Client Management
- [x] Full CRUD operations
- [x] PAN/Aadhar/GSTIN fields
- [x] Managed by Project Manager relation
- [x] Client assignments to Team Members

#### Services
- [x] CRUD for services
- [x] Service types (ITR, GST, Audit, etc.)
- [x] Service status tracking
- [x] Due date management
- [x] Fee amount tracking

#### Documents
- [x] File upload (Multer)
- [x] Hierarchical document view
- [x] Document types
- [x] Draft/Submit workflow
- [x] Role-based access
- [x] Download functionality

#### Invoices
- [x] Invoice creation
- [x] Invoice items
- [x] Tax calculation (GST)
- [x] Payment recording
- [x] PDF generation (PDFKit)

#### UI/UX
- [x] Responsive design
- [x] Dark mode support
- [x] Gradient headers
- [x] KPI dashboard cards
- [x] Quick action buttons
- [x] Status badges
- [x] Progress bars
- [x] Modern UI components

### ⚠️ PARTIALLY IMPLEMENTED

#### Tasks
- [x] Database model exists
- [ ] Task CRUD API endpoints
- [ ] Task assignment UI
- [ ] Task status tracking UI

#### Activity Logs
- [x] Database model exists
- [x] Basic logging on user creation/deletion
- [ ] Comprehensive action logging
- [ ] Log viewer in all portals (only Super Admin has it)

#### Notifications
- [x] Pusher configured
- [ ] Real-time notifications UI
- [ ] Email notifications for important events

### ❌ NOT IMPLEMENTED

#### Reports & Analytics
- [ ] Revenue reports
- [ ] Service completion analytics
- [ ] User productivity reports
- [ ] Export to Excel/PDF

#### Advanced Features
- [ ] Client-Team Member chat
- [ ] Calendar integration
- [ ] Deadline reminders
- [ ] Bulk operations (import/export)
- [ ] Client onboarding wizard
- [ ] Mobile app

#### Settings
- [ ] Firm settings (only placeholder exists)
- [ ] Email template customization
- [ ] Invoice template customization
- [ ] Role permission customization

#### Integrations
- [ ] Payment gateway (Razorpay/PayU)
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Cloud storage (S3/Google Cloud)

---

## 8. KNOWN ISSUES & LIMITATIONS

### Technical Debt
1. **Hydration Errors** - Needed `mounted` state for Radix DropdownMenu to fix SSR hydration mismatch
2. **Some Old Routes** - A few admin routes still have `/trainees` (legacy naming)
3. **File Storage** - Currently local storage, needs cloud migration

### Security Considerations
1. OTP codes stored in plain text in database (should be hashed)
2. File uploads need size/type validation improvements
3. Rate limiting not implemented

### Missing Validations
1. PAN format validation
2. Aadhar format validation
3. GSTIN format validation
4. Phone number format validation

---

## 9. ENVIRONMENT VARIABLES

```env
# Backend (.env in apps/api)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key"
RESEND_API_KEY="re_xxxxx"
FROM_EMAIL="noreply@yourfirm.com"
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ap2"

# Frontend (.env.local in apps/web)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## 10. HOW TO RUN

### Backend (API)
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev
npm run dev  # Runs on port 4000
```

### Frontend (Web)
```bash
cd apps/web
npm install
npm run dev  # Runs on port 3000
```

### Database
```bash
cd apps/api
npx prisma studio  # Opens database GUI
npx prisma db seed  # Seeds test data
```

---

## 11. DESIGN PATTERNS USED

### Backend
1. **Module-based routing** - Each feature has its own module folder
2. **Service layer** - Business logic separated from routes
3. **Middleware pattern** - Auth, validation, error handling
4. **Repository pattern** - Prisma as data access layer

### Frontend
1. **App Router** - Next.js 13+ file-based routing
2. **Route Groups** - `(admin)`, `(client)` for layouts
3. **Server Components** - For static parts
4. **Client Components** - For interactive parts
5. **Custom hooks** - For data fetching
6. **Composition** - Reusable UI components

### UI Conventions
1. **Gradient headers** - Each portal has unique color
2. **KPI Cards** - Dashboard stats with icons
3. **Quick Actions** - Colored action cards
4. **Status Badges** - Color-coded status indicators
5. **Tables with actions** - Dropdown menus for row actions

---

## 12. FUTURE DEVELOPMENT NOTES

### When Adding New Features
1. Create database model in `schema.prisma`
2. Run `npx prisma migrate dev`
3. Create API routes in `apps/api/src/modules/`
4. Add frontend pages in appropriate portal folder
5. Update this documentation

### Naming Conventions
- **Database**: snake_case for table names
- **Prisma Models**: PascalCase
- **API Routes**: kebab-case
- **React Components**: PascalCase
- **Files**: kebab-case or camelCase

### Color Themes by Portal
- **Super Admin**: Blue (`#3b82f6`)
- **Admin**: Blue/Gray
- **Project Manager**: Emerald/Green (`#10b981`)
- **Team Member**: Teal (`#14b8a6`)
- **Client**: Violet (`#8b5cf6`)

---

*Last Updated: December 12, 2025*
*Document Version: 1.0*
