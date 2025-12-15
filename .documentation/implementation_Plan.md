📚 COMPLETE IMPLEMENTATION STRATEGY DOCUMENT
CA Firm Management System - Service Workflow Enhancement
Document Version: 1.0
Date: December 13, 2025
Purpose: Full Implementation Blueprint

TABLE OF CONTENTS
PART A: PROJECT FOUNDATION
├── A1. Project Overview
├── A2. Tech Stack
├── A3. Current Implementation Status
├── A4. Role Hierarchy & Permissions
└── A5. Known Issues & Technical Debt

PART B: CA FIRM DOMAIN KNOWLEDGE
├── B1. Regulatory Bodies in India
├── B2. Complete Service Catalog
├── B3. Service Type Details
├── B4. Document Requirements per Service
├── B5. Master Compliance Calendar
└── B6. Financial Year & Assessment Year Concept

PART C: SERVICE WORKFLOW DESIGN
├── C1. Service Origin Points
├── C2. Service Lifecycle (12 Statuses)
├── C3. Status Transition Rules
├── C4. Status Update Strategies
├── C5. Action → Status Mapping
├── C6. Role-wise Action Permissions
└── C7. Real-World Workflow Examples

PART D: RELATIONSHIP & ASSIGNMENT DESIGN
├── D1. Client-PM Relationship (Many-to-Many)
├── D2. Service Assignment System
├── D3. Delegation System with Chain Tracking
├── D4. Client-TM Assignment (Existing)
└── D5. Complete Relationship Diagram

PART E: DATABASE SCHEMA CHANGES
├── E1. New Models to Create
├── E2. Models to Modify
├── E3. New Enums to Add
├── E4. Enums to Expand
├── E5. Complete Schema Code
└── E6. Migration Strategy

PART F: API ENDPOINTS
├── F1. Client-PM Assignment APIs
├── F2. Service Request APIs
├── F3. Service Assignment APIs
├── F4. Service Action APIs
├── F5. Service Status History APIs
├── F6. Task Management APIs
└── F7. Complete API Reference

PART G: FRONTEND IMPLEMENTATION
├── G1. New Pages to Create
├── G2. Pages to Modify
├── G3. New Components
├── G4. Action Dialogs
├── G5. Status Timeline Component
└── G6. Portal-wise UI Changes

PART H: IMPLEMENTATION PHASES
├── H1. Phase-wise Breakdown
├── H2. Dependencies
├── H3. Estimated Effort
└── H4. Testing Strategy

PART I: FUTURE ENHANCEMENTS
├── I1. Communication Thread
├── I2. Document Checklist
├── I3. Time Tracking
├── I4. Notifications
└── I5. Reports & Analytics

PART A: PROJECT FOUNDATION
A1. Project Overview
AspectDetailsProject NameCA Firm Management SystemTypeMulti-tenant SaaS ApplicationPurposeComplete management system for Indian CA firmsCurrent Status~85% implementedWhat's MissingEnhanced Service Workflow (this implementation)
Core Modules:
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM MODULES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │    User      │  │   Client     │  │   Service    │  │   Document   │   │
│   │  Management  │  │  Management  │  │  Management  │  │  Management  │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │   Invoice    │  │    Task      │  │   Activity   │  │   Reports    │   │
│   │  Management  │  │  Management  │  │    Logs      │  │  & Analytics │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

A2. Tech Stack
Backend:
TechnologyPurposeVersionNode.jsRuntimeLatest LTSExpress.jsWeb Framework4.xTypeScriptType Safety5.xPrisma ORMDatabase ORMLatestPostgreSQLDatabase15+ (Supabase)JWTAuthenticationjsonwebtokenbcrypt/bcryptjsPassword HashingLatestZodInput ValidationLatestMulterFile UploadsLatestPDFKitPDF GenerationLatestNodemailer + ResendEmail ServiceLatestPusherReal-time (configured)Latest
Frontend:
TechnologyPurposeVersionNext.jsReact Framework16 (App Router)ReactUI Library19TypeScriptType Safety5.xTailwindCSSStyling4Radix UIHeadless ComponentsLatestNextAuth.jsAuthenticationv4React Hook FormForm HandlingLatestZodForm ValidationLatestAxiosHTTP ClientLatestRechartsChartsLatestZustandState ManagementLatestSonnerToast NotificationsLatestLucide ReactIconsLatestdate-fnsDate FormattingLatest
Project Structure:
CA Firm Management/
├── .documentation/
│   ├── PROJECT_CONTEXT_FOR_AI.md
│   ├── structure.txt
│   └── ADMIN_PORTAL_IMPLEMENTATION.md
│
├── apps/
│   ├── api/                          # Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── seed.ts               # Seeding script
│   │   │   └── migrations/           # Migration history
│   │   ├── scripts/                  # Utility scripts
│   │   └── src/
│   │       ├── app.ts                # Express app setup
│   │       ├── server.ts             # Entry point
│   │       ├── modules/              # 15 API route modules
│   │       │   ├── auth/
│   │       │   ├── super-admin/
│   │       │   ├── admin/
│   │       │   ├── project-manager/
│   │       │   ├── team-member/
│   │       │   ├── client/
│   │       │   ├── services/
│   │       │   ├── documents/
│   │       │   ├── invoices/
│   │       │   ├── tasks/
│   │       │   ├── analytics/
│   │       │   ├── activity/
│   │       │   ├── activity-log/
│   │       │   └── sse/
│   │       ├── shared/
│   │       │   ├── middleware/
│   │       │   └── utils/
│   │       └── services/
│   │           ├── email.service.ts
│   │           └── auditLog.service.ts
│   │
│   └── web/                          # Frontend
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── page.tsx              # Landing page
│       │   ├── api/auth/             # NextAuth
│       │   ├── (auth)/               # Auth pages (5)
│       │   ├── super-admin/          # SA Portal (12+ pages)
│       │   ├── (admin)/              # Admin Portal (15+ pages)
│       │   ├── (project-manager)/    # PM Portal (15+ pages)
│       │   ├── (team-member)/        # TM Portal (8+ pages)
│       │   └── (client)/             # Client Portal (10+ pages)
│       ├── components/
│       │   ├── ui/                   # 15 UI components
│       │   ├── layout/
│       │   ├── auth/
│       │   ├── providers/
│       │   ├── charts/
│       │   ├── services/
│       │   ├── documents/
│       │   ├── invoices/
│       │   ├── clients/
│       │   ├── tasks/
│       │   └── marketing/
│       └── lib/
│           ├── api.ts                # Axios client
│           ├── auth.ts
│           └── utils.ts
│
├── .env
└── .env.example

A3. Current Implementation Status
✅ FULLY IMPLEMENTED:
ModuleFeaturesStatusAuthenticationLogin, OTP 2FA, JWT, Password Reset, Change Password, NextAuth integration✅ CompleteUser ManagementCRUD for all 5 roles, Soft Delete, Hard Delete, Reactivate✅ CompleteRole HierarchyMiddleware enforcement (requireSuperAdmin, requireAdmin, requireProjectManager, etc.)✅ CompleteClient ManagementFull CRUD, PAN/Aadhar/GSTIN fields, Managed by PM relation✅ CompleteClient-TM AssignmentAssign Team Members to Clients (Many-to-Many via ClientAssignment)✅ CompleteServicesBasic CRUD, 11 types, 5 statuses, due dates, fee amounts✅ Complete (Basic)DocumentsUpload, Download, Draft/Submit workflow, Document types, Role-based access, Hierarchical view✅ CompleteInvoicesCRUD, Invoice items, GST calculations, Payment recording, PDF generation✅ CompleteActivity LogsBasic logging on user creation/deletion (Super Admin view only)✅ Complete (Basic)Portal LayoutsAll 5 portals with themed sidebars, dark mode, mobile responsive✅ CompleteUI Components15 Radix-based components (Button, Input, Card, Table, Dialog, etc.)✅ Complete
⚠️ PARTIALLY IMPLEMENTED:
ModuleWhat ExistsWhat's MissingTasksDatabase model existsCRUD API, Assignment, Status tracking, UIActivity LogsBasic logging, SA view onlyComprehensive logging, All portal viewsNotificationsPusher configuredReal-time UI, Email notificationsServicesBasic CRUD, 11 types, 5 statusesWorkflow, Assignment, Delegation, Requests
❌ NOT IMPLEMENTED (TO BUILD):
FeatureDescriptionPriorityService RequestsClient-initiated service requests🔥 HighClient-PM Many-to-ManyMultiple PMs per client🔥 HighService AssignmentAssign service to PM/TM🔥 HighService DelegationChain delegation with audit🔥 HighService Status HistoryFull audit trail🔥 HighEnhanced Service Workflow12 status lifecycle🔥 HighService ActionsAction-based status updates🔥 HighTask ManagementComplete CRUD, assignment, UI🔥 HighService CommunicationMessaging between Client ↔ Firm🟡 MediumDocument ChecklistRequired docs per service type🟡 MediumTime TrackingLog time spent on services🟡 MediumCompliance CalendarAuto-create recurring services🟡 MediumReports & AnalyticsRevenue, Productivity, Export🟡 MediumPayment GatewayRazorpay/PayU integration🟢 LowSMS/WhatsAppNotifications🟢 LowCloud StorageS3/Google Cloud🟢 Low

A4. Role Hierarchy & Permissions
5 User Roles:
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROLE HIERARCHY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FIRM SIDE (Internal Users)                                                │
│   ══════════════════════════                                                │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1. SUPER_ADMIN (Firm Owner)                                        │   │
│   │  ─────────────────────────────                                      │   │
│   │  • ONE per firm (cannot be deleted)                                 │   │
│   │  • FULL CONTROL - NO RESTRICTIONS                                   │   │
│   │  • Can do ANYTHING, see EVERYTHING                                  │   │
│   │  • Can create: Admin, PM, TM, Client                                │   │
│   │  • Portal: /super-admin/*                                           │   │
│   │  • Theme: Blue (#3b82f6)                                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  2. ADMIN (Regular Admin)                                           │   │
│   │  ────────────────────────                                           │   │
│   │  • Created by Super Admin                                           │   │
│   │  • FULL CONTROL - NO RESTRICTIONS (same as SA)                      │   │
│   │  • Can create: PM, TM, Client                                       │   │
│   │  • Cannot delete/manage Super Admin                                 │   │
│   │  • Portal: /admin/*                                                 │   │
│   │  • Theme: Blue/Gray                                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  3. PROJECT_MANAGER (formerly "CA")                                 │   │
│   │  ──────────────────────────────────                                 │   │
│   │  • Created by Super Admin or Admin                                  │   │
│   │  • SCOPED ACCESS (own clients/services)                             │   │
│   │  • Can create: TM, Client (assigned to self)                        │   │
│   │  • Manages assigned clients                                         │   │
│   │  • Portal: /project-manager/*                                       │   │
│   │  • Theme: Emerald/Green (#10b981)                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  4. TEAM_MEMBER (formerly "TRAINEE")                                │   │
│   │  ───────────────────────────────────                                │   │
│   │  • Created by Super Admin, Admin, or PM                             │   │
│   │  • LIMITED ACCESS (assigned clients/services/tasks only)            │   │
│   │  • Cannot create anyone                                             │   │
│   │  • Works on assigned items                                          │   │
│   │  • Portal: /team-member/*                                           │   │
│   │  • Theme: Teal (#14b8a6)                                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   CLIENT SIDE (External User)                                               │
│   ═══════════════════════════                                               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  5. CLIENT (End Customer)                                           │   │
│   │  ────────────────────────                                           │   │
│   │  • Created by Super Admin, Admin, or PM                             │   │
│   │  • SELF ACCESS (own services/docs/invoices only)                    │   │
│   │  • Can request services (NEW - to be implemented)                   │   │
│   │  • Can upload documents, pay invoices                               │   │
│   │  • Portal: /client/*                                                │   │
│   │  • Theme: Violet (#8b5cf6)                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Who Can Create Whom:
CreatorCan CreateSUPER_ADMINAdmin, Project Manager, Team Member, ClientADMINProject Manager, Team Member, ClientPROJECT_MANAGERTeam Member, Client (auto-assigned to self)TEAM_MEMBERNobodyCLIENTNobody
CRITICAL PERMISSION RULE:
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   SUPER ADMIN + ADMIN = GOD MODE                                          ║
║                                                                           ║
║   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                     │ ║
║   │   • NO RESTRICTIONS whatsoever                                      │ ║
║   │   • Can do ANYTHING on any data                                     │ ║
║   │   • Can see EVERYTHING in the system                                │ ║
║   │   • Can access ALL services, clients, documents                     │ ║
║   │   • Can override ANY assignment or delegation                       │ ║
║   │   • Can work on ANY service (not just assigned)                     │ ║
║   │   • Can approve/reject ANY request                                  │ ║
║   │   • Can create invoices for ANY client                              │ ║
║   │   • Can view ALL audit logs and history                             │ ║
║   │                                                                     │ ║
║   │   DO NOT PUT ANY RESTRICTIONS ON SUPER ADMIN OR ADMIN               │ ║
║   │                                                                     │ ║
║   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

A5. Known Issues & Technical Debt
Security Issues:
IssueCurrent StateRequired FixOTP StoragePlain text in databaseHash with bcryptRate LimitingNot implementedAdd express-rate-limitFile ValidationBasic onlyStrict size/type validation
Missing Validations:
FieldCurrentRequiredPANNo validation/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/AadharNo validation/^[2-9]{1}[0-9]{11}$/GSTINNo validation/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/PhoneNo validation/^[6-9]\d{9}$/
Legacy Issues:
IssueLocationFix RequiredOld route namingSome /trainees routesRename to /team-membersHydration errorsRadix DropdownMenuAdd mounted state checkFile storageLocal onlyMigrate to S3/Cloud

PART B: CA FIRM DOMAIN KNOWLEDGE
B1. Regulatory Bodies in India
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INDIAN REGULATORY BODIES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BODY          │ FULL NAME                    │ SERVICES             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITD           │ Income Tax Department        │ ITR, TDS, Advance Tax│   │
│  │  GST Council   │ Goods & Services Tax Council │ GST Registration,    │   │
│  │                │                              │ Returns, Refunds     │   │
│  │  MCA           │ Ministry of Corporate Affairs│ ROC Filing, Company  │   │
│  │                │                              │ Compliance           │   │
│  │  EPFO          │ Employees' Provident Fund    │ PF Compliance        │   │
│  │                │ Organisation                 │                      │   │
│  │  ESIC          │ Employees' State Insurance   │ ESI Compliance       │   │
│  │                │ Corporation                  │                      │   │
│  │  RBI           │ Reserve Bank of India        │ FEMA, Foreign        │   │
│  │                │                              │ Remittance           │   │
│  │  CBIC          │ Central Board of Indirect    │ Customs, Import/     │   │
│  │                │ Taxes & Customs              │ Export               │   │
│  │  SEBI          │ Securities and Exchange      │ Listed Company       │   │
│  │                │ Board of India               │ Compliance           │   │
│  │  State Govt    │ Various State Authorities    │ Professional Tax,    │   │
│  │                │                              │ Shop Act, etc.       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

B2. Complete Service Catalog
Category 1: INCOME TAX SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INCOME TAX SERVICES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1.1 ITR FILING (Income Tax Return)                                         │
│  ───────────────────────────────────                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ITR TYPE   │ WHO FILES                      │ KEY FEATURES         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-1      │ Salaried (Income ≤ ₹50L)       │ Salary, 1 House,     │   │
│  │  (Sahaj)    │ Resident Individual            │ Interest Income      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-2      │ Individuals with Capital Gains │ Capital Gains,       │   │
│  │             │ Foreign Income, Multiple House │ Foreign Assets       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-3      │ Individuals with Business/     │ Business Income,     │   │
│  │             │ Profession Income              │ Partnership Share    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-4      │ Presumptive Taxation           │ 44AD (Business),     │   │
│  │  (Sugam)    │ (Small Business/Profession)    │ 44ADA (Profession)   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-5      │ Partnership Firms, LLPs,       │ Firm/LLP Income      │   │
│  │             │ AOPs, BOIs                     │                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-6      │ Companies (except Sec 11)      │ Corporate Income     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITR-7      │ Trusts, Political Parties,     │ Exempt Income        │   │
│  │             │ Charitable Institutions        │ Reporting            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Due Dates:                                                                 │
│  • July 31 - Non-audit individuals                                         │
│  • October 31 - Audit cases                                                 │
│  • November 30 - Transfer Pricing cases                                     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1.2 TDS SERVICES (Tax Deducted at Source)                                  │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RETURN    │ PURPOSE                        │ DUE DATE              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  24Q       │ TDS on Salary                  │ Quarterly (31st of    │   │
│  │            │                                │ next month after Q)   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  26Q       │ TDS on Non-Salary Payments     │ Jul 31, Oct 31,       │   │
│  │            │ (Interest, Commission, etc.)   │ Jan 31, May 31        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  27Q       │ TDS on Payments to NRIs        │ Same as 26Q           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  27EQ      │ TCS (Tax Collected at Source)  │ Same as 26Q           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1.3 ADVANCE TAX                                                            │
│  ───────────────                                                            │
│                                                                             │
│  Who: Tax liability > ₹10,000 in a year                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  INSTALLMENT    │ DUE DATE      │ CUMULATIVE %                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  1st            │ June 15       │ 15%                               │   │
│  │  2nd            │ September 15  │ 45%                               │   │
│  │  3rd            │ December 15   │ 75%                               │   │
│  │  4th            │ March 15      │ 100%                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1.4 TAX PLANNING & ADVISORY                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  • Investment advice (80C, 80D, 80E, etc.)                                  │
│  • HRA optimization                                                         │
│  • Capital gain planning                                                    │
│  • Salary restructuring                                                     │
│  • Business structure optimization                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Category 2: GST SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GST SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  2.1 GST REGISTRATION                                                       │
│  ────────────────────                                                       │
│                                                                             │
│  Who Needs:                                                                 │
│  • Turnover > ₹40L (goods) / ₹20L (services)                                │
│  • Interstate suppliers (any turnover)                                      │
│  • E-commerce operators                                                     │
│  • Casual taxable persons                                                   │
│                                                                             │
│  Registration Types:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Regular      │ Normal business, full compliance                    │   │
│  │  Composition  │ Small business, 1-6% tax, quarterly return          │   │
│  │  Casual       │ Temporary registration for events                   │   │
│  │  Non-Resident │ Foreign businesses                                  │   │
│  │  SEZ          │ Special Economic Zone units                         │   │
│  │  Input Service│ ISD for distributing ITC                            │   │
│  │  Distributor  │                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  2.2 GST RETURNS                                                            │
│  ───────────────                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RETURN   │ PURPOSE                  │ DUE DATE     │ WHO FILES     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  GSTR-1   │ Outward Supplies (Sales) │ 11th Monthly │ Regular       │   │
│  │  GSTR-3B  │ Summary + Tax Payment    │ 20th Monthly │ Regular       │   │
│  │  GSTR-4   │ Composition Return       │ 18th Qtrly   │ Composition   │   │
│  │  GSTR-9   │ Annual Return            │ Dec 31       │ Regular       │   │
│  │  GSTR-9C  │ Reconciliation Statement │ Dec 31       │ >₹5Cr TO      │   │
│  │  GSTR-2A  │ Auto-drafted Purchases   │ Auto         │ View only     │   │
│  │  GSTR-2B  │ ITC Statement            │ Auto         │ View only     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Monthly Calendar:                                                          │
│  • 1st-10th: Prepare GSTR-1 data                                            │
│  • 11th: GSTR-1 Due                                                         │
│  • 11th-19th: Reconcile GSTR-2B, Prepare GSTR-3B                            │
│  • 20th: GSTR-3B Due + Tax Payment                                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  2.3 GST COMPLIANCE SERVICES                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Service              │ Description                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ITC Reconciliation   │ Match purchases with GSTR-2B                │   │
│  │  E-Way Bill           │ Generate for goods movement > ₹50,000       │   │
│  │  E-Invoicing          │ Mandatory for turnover > ₹5Cr               │   │
│  │  GST Audit            │ For turnover > ₹5Cr (GSTR-9C)               │   │
│  │  LUT Filing           │ Letter of Undertaking for exporters         │   │
│  │  Refund Claims        │ Export refund, Inverted duty refund         │   │
│  │  Amendment            │ Registration amendments                     │   │
│  │  Cancellation         │ GST cancellation on business closure        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Category 3: ROC/MCA COMPLIANCE
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ROC/MCA COMPLIANCE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  3.1 COMPANY INCORPORATION                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  Types:                                                                     │
│  • Private Limited Company                                                  │
│  • Public Limited Company                                                   │
│  • One Person Company (OPC)                                                 │
│  • Limited Liability Partnership (LLP)                                      │
│  • Section 8 Company (NGO)                                                  │
│                                                                             │
│  Process:                                                                   │
│  1. DSC (Digital Signature Certificate)                                     │
│  2. DIN (Director Identification Number)                                    │
│  3. Name Approval (RUN/Spice+)                                              │
│  4. MOA/AOA Drafting                                                        │
│  5. Incorporation Filing                                                    │
│  6. Certificate of Incorporation                                            │
│  7. PAN & TAN Application                                                   │
│  8. GST Registration                                                        │
│                                                                             │
│  Timeline: 7-15 days                                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  3.2 ANNUAL ROC FILINGS                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  FORM      │ PURPOSE                    │ DUE DATE                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  AOC-4     │ Financial Statements       │ 30 days from AGM          │   │
│  │  MGT-7/7A  │ Annual Return              │ 60 days from AGM          │   │
│  │  ADT-1     │ Auditor Appointment        │ 15 days from AGM          │   │
│  │  DIR-3 KYC │ Director KYC               │ September 30              │   │
│  │  DPT-3     │ Deposit Return             │ June 30                   │   │
│  │  MSME-1    │ MSME Outstanding           │ Half-yearly               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  3.3 EVENT-BASED FILINGS                                                    │
│  ───────────────────────                                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  EVENT                      │ FORM     │ TIMELINE                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Director Appointment       │ DIR-12   │ 30 days                    │   │
│  │  Director Resignation       │ DIR-12   │ 30 days                    │   │
│  │  Share Transfer             │ SH-4     │ 60 days                    │   │
│  │  Increase in Capital        │ SH-7     │ 30 days                    │   │
│  │  Change in Registered Office│ INC-22   │ 30 days                    │   │
│  │  Change in Directors        │ DIR-12   │ 30 days                    │   │
│  │  Charge Creation            │ CHG-1    │ 30 days                    │   │
│  │  Charge Modification        │ CHG-1    │ 30 days                    │   │
│  │  Charge Satisfaction        │ CHG-4    │ 30 days                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Category 4: AUDIT SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUDIT SERVICES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  4.1 STATUTORY AUDIT                                                        │
│  ───────────────────                                                        │
│  • Mandatory for all companies                                              │
│  • LLPs above threshold                                                     │
│  • Due: Before AGM (within 6 months of FY end)                              │
│  • Deliverables: Audit Report, Audited Financials, CARO Report              │
│                                                                             │
│  4.2 TAX AUDIT (Section 44AB)                                               │
│  ────────────────────────────                                               │
│  • Business turnover > ₹1Cr (₹10Cr if 95%+ digital)                         │
│  • Profession turnover > ₹50L                                               │
│  • Due: September 30                                                        │
│  • Forms: 3CA/3CB (Audit Report), 3CD (Statement of Particulars)            │
│                                                                             │
│  4.3 GST AUDIT                                                              │
│  ─────────────                                                              │
│  • Turnover > ₹5Cr                                                          │
│  • Due: December 31                                                         │
│  • Form: GSTR-9C (Reconciliation Statement)                                 │
│                                                                             │
│  4.4 INTERNAL AUDIT                                                         │
│  ─────────────────                                                          │
│  • Companies above threshold                                                │
│  • Banks, NBFCs                                                             │
│  • Frequency: Quarterly/Half-yearly/Annual                                  │
│  • Deliverables: Internal Audit Report, Management Letter                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Category 5: PAYROLL & HR COMPLIANCE
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PAYROLL & HR COMPLIANCE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5.1 PAYROLL PROCESSING                                                     │
│  ──────────────────────                                                     │
│  • Monthly salary calculation                                               │
│  • TDS calculation                                                          │
│  • Payslip generation                                                       │
│  • Bank upload file                                                         │
│  • Salary register                                                          │
│                                                                             │
│  5.2 PF COMPLIANCE (EPFO)                                                   │
│  ────────────────────────                                                   │
│  • Monthly contribution: 12% employee + 12% employer                        │
│  • Due: 15th of following month                                             │
│  • Form: ECR (Electronic Challan cum Return)                                │
│  • Annual: Form 3A, Form 6A                                                 │
│                                                                             │
│  5.3 ESI COMPLIANCE (ESIC)                                                  │
│  ─────────────────────────                                                  │
│  • Establishments with 10+ employees                                        │
│  • Wages ≤ ₹21,000                                                          │
│  • Contribution: 3.25% employer + 0.75% employee                            │
│  • Due: 15th of following month                                             │
│                                                                             │
│  5.4 PROFESSIONAL TAX                                                       │
│  ────────────────────                                                       │
│  • State-level tax                                                          │
│  • Varies by state (Maharashtra, Karnataka, etc.)                           │
│  • Monthly/Annual based on state                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Category 6: OTHER SPECIALIZED SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OTHER SPECIALIZED SERVICES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  6.1 FEMA COMPLIANCE                                                        │
│  ───────────────────                                                        │
│  • FC-GPR: Foreign investment reporting                                     │
│  • FC-TRS: Transfer of shares to non-resident                               │
│  • ODI: Overseas Direct Investment                                          │
│  • ECB: External Commercial Borrowing                                       │
│                                                                             │
│  6.2 STARTUP SERVICES                                                       │
│  ────────────────────                                                       │
│  • DPIIT Registration (Startup India)                                       │
│  • 80IAC Certification (Tax exemption)                                      │
│  • Angel Tax Exemption (Section 56(2)(viib))                                │
│  • Seed Fund Application                                                    │
│                                                                             │
│  6.3 TRADEMARK & IP                                                         │
│  ─────────────────                                                          │
│  • Trademark Registration                                                   │
│  • Trademark Renewal (every 10 years)                                       │
│  • Copyright Registration                                                   │
│  • Patent Filing                                                            │
│                                                                             │
│  6.4 IMPORT/EXPORT                                                          │
│  ────────────────                                                           │
│  • IEC Registration (Import Export Code)                                    │
│  • DGFT Filings (Export incentive claims)                                   │
│  • Customs Compliance                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

B3. Current ServiceType Enum (11 Types)
prismaenum ServiceType {
  ITR_FILING          // Income Tax Return Filing
  GST_REGISTRATION    // GST Registration
  GST_RETURN          // GST Return Filing (GSTR-1, 3B, etc.)
  TDS_RETURN          // TDS Return Filing (24Q, 26Q, etc.)
  TDS_COMPLIANCE      // TDS Compliance Services
  ROC_FILING          // ROC/MCA Filings
  AUDIT               // Audit Services
  BOOK_KEEPING        // Book Keeping
  PAYROLL             // Payroll Processing
  CONSULTATION        // General Consultation
  OTHER               // Other Services
}
Proposed Additional Types (For Future):
prisma// Can be added later:
COMPANY_INCORPORATION
PF_COMPLIANCE
ESI_COMPLIANCE
PROFESSIONAL_TAX
FEMA_COMPLIANCE
TRADEMARK
IMPORT_EXPORT
STARTUP_SERVICES
TAX_PLANNING
INTERNAL_AUDIT
```

---

## B4. Document Requirements per Service Type
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 DOCUMENT REQUIREMENTS BY SERVICE TYPE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ITR-1 (Salaried Individual)                                                │
│  ────────────────────────────                                               │
│  ☑️ PAN Card                                                                │
│  ☑️ Aadhar Card                                                             │
│  ☑️ Form 16 (from employer)                                                 │
│  ☑️ Bank Statements (all accounts)                                          │
│  ☑️ Investment Proofs:                                                      │
│     • 80C (PPF, ELSS, LIC, etc.)                                            │
│     • 80D (Health Insurance)                                                │
│     • 80E (Education Loan)                                                  │
│  ☑️ Home Loan Certificate (if applicable)                                   │
│  ☑️ Rent Receipts (if HRA claimed)                                          │
│  ☑️ Previous Year ITR (for reference)                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ITR-3 (Business/Profession)                                                │
│  ───────────────────────────                                                │
│  ☑️ All documents from ITR-1                                                │
│  ☑️ Profit & Loss Account                                                   │
│  ☑️ Balance Sheet                                                           │
│  ☑️ GST Returns (all months)                                                │
│  ☑️ Bank Statements (all business accounts)                                 │
│  ☑️ Stock Statement (if applicable)                                         │
│  ☑️ Fixed Asset Register                                                    │
│  ☑️ Loan Documents                                                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ITR-6 (Company)                                                            │
│  ───────────────                                                            │
│  ☑️ Audited Financial Statements                                            │
│  ☑️ Tax Audit Report (3CD)                                                  │
│  ☑️ GST Returns (all months)                                                │
│  ☑️ TDS Returns (all quarters)                                              │
│  ☑️ Board Resolution                                                        │
│  ☑️ Previous Year ITR                                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  GST Registration                                                           │
│  ────────────────                                                           │
│  ☑️ PAN Card                                                                │
│  ☑️ Aadhar Card                                                             │
│  ☑️ Passport Photo                                                          │
│  ☑️ Business Address Proof:                                                 │
│     • Electricity Bill / Rent Agreement                                     │
│     • NOC from landlord                                                     │
│  ☑️ Bank Statement (cancelled cheque)                                       │
│  ☑️ Constitution Document:                                                  │
│     • Partnership Deed / LLP Agreement                                      │
│     • MOA/AOA (for companies)                                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  GST Return                                                                 │
│  ──────────                                                                 │
│  ☑️ Sales Register (with HSN)                                               │
│  ☑️ Purchase Register (with GSTIN)                                          │
│  ☑️ Credit/Debit Notes                                                      │
│  ☑️ RCM Details                                                             │
│  ☑️ HSN Summary                                                             │
│  ☑️ Previous month return (for reference)                                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  TDS Return                                                                 │
│  ──────────                                                                 │
│  ☑️ TAN                                                                     │
│  ☑️ Deductee PAN details                                                    │
│  ☑️ Payment details with dates                                              │
│  ☑️ TDS Challan details                                                     │
│  ☑️ Previous quarter return                                                 │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Tax Audit                                                                  │
│  ─────────                                                                  │
│  ☑️ Books of Accounts                                                       │
│  ☑️ Bank Statements (all accounts, full year)                               │
│  ☑️ Stock Records                                                           │
│  ☑️ Fixed Asset Register                                                    │
│  ☑️ Loan Documents                                                          │
│  ☑️ Expense Vouchers                                                        │
│  ☑️ TDS/TCS Certificates                                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ROC Annual Filing                                                          │
│  ─────────────────                                                          │
│  ☑️ Audited Financial Statements                                            │
│  ☑️ Director Details                                                        │
│  ☑️ Shareholding Pattern                                                    │
│  ☑️ Minutes of AGM                                                          │
│  ☑️ Minutes of Board Meetings                                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Company Incorporation                                                      │
│  ─────────────────────                                                      │
│  ☑️ DIN (Digital Signature)                                                 │
│  ☑️ DSC                                                                     │
│  ☑️ Name Approval                                                           │
│  ☑️ MOA/AOA Draft                                                           │
│  ☑️ Director ID Proof (PAN, Aadhar)                                         │
│  ☑️ Director Address Proof                                                  │
│  ☑️ Registered Office Proof                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## B5. Master Compliance Calendar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ANNUAL COMPLIANCE CALENDAR                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  APRIL                                                                      │
│  ═════                                                                      │
│  • 30th: Annual PF Return (Form 3A)                                         │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  MAY                                                                        │
│  ═══                                                                        │
│  • 31st: TDS Q4 Return (24Q, 26Q)                                           │
│  • 15th: Form 16 TDS Certificate (for employees)                            │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  JUNE                                                                       │
│  ════                                                                       │
│  • 15th: Advance Tax - 1st Installment (15%)                                │
│  • 30th: DPT-3 (Deposit Return)                                             │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  JULY                                                                       │
│  ════                                                                       │
│  • 31st: ITR (Non-audit individual)                                         │
│  • 31st: TDS Q1 Return                                                      │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  AUGUST                                                                     │
│  ══════                                                                     │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  SEPTEMBER                                                                  │
│  ═════════                                                                  │
│  • 15th: Advance Tax - 2nd Installment (45%)                                │
│  • 30th: Tax Audit Report                                                   │
│  • 30th: DIR-3 KYC (Director KYC)                                           │
│  • 30th: AGM Deadline (Private Ltd Company)                                 │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  OCTOBER                                                                    │
│  ═══════                                                                    │
│  • 31st: ITR (Audit cases)                                                  │
│  • 31st: TDS Q2 Return                                                      │
│  • 30th: AOC-4 (if AGM on Sep 30)                                           │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  NOVEMBER                                                                   │
│  ════════                                                                   │
│  • 30th: ITR (Transfer Pricing cases)                                       │
│  • 30th: MGT-7 (if AGM on Sep 30)                                           │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  DECEMBER                                                                   │
│  ════════                                                                   │
│  • 15th: Advance Tax - 3rd Installment (75%)                                │
│  • 31st: GSTR-9 (Annual Return)                                             │
│  • 31st: GSTR-9C (Reconciliation, >₹5Cr)                                    │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  JANUARY                                                                    │
│  ═══════                                                                    │
│  • 31st: TDS Q3 Return                                                      │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  FEBRUARY                                                                   │
│  ════════                                                                   │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
│  MARCH                                                                      │
│  ═════                                                                      │
│  • 15th: Advance Tax - 4th Installment (100%)                               │
│  • 31st: End of Financial Year                                              │
│  • GST: GSTR-1 (11th), GSTR-3B (20th)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## B6. Financial Year & Assessment Year
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FINANCIAL YEAR vs ASSESSMENT YEAR                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FINANCIAL YEAR (FY)                                                        │
│  ═══════════════════                                                        │
│  • Period: April 1 to March 31                                              │
│  • When income is EARNED                                                    │
│  • Example: FY 2024-25 = April 1, 2024 to March 31, 2025                    │
│                                                                             │
│  ASSESSMENT YEAR (AY)                                                       │
│  ════════════════════                                                       │
│  • Period: Following year                                                   │
│  • When income is ASSESSED (tax filed)                                      │
│  • Example: AY 2025-26 = For income earned in FY 2024-25                    │
│                                                                             │
│  RELATIONSHIP:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Financial Year    │  Assessment Year   │  ITR Due Date             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  FY 2024-25        │  AY 2025-26        │  July 31, 2025            │   │
│  │  (Apr 24 - Mar 25) │                    │  (Non-audit)              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  FY 2023-24        │  AY 2024-25        │  July 31, 2024            │   │
│  │  (Apr 23 - Mar 24) │                    │  (Non-audit)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  WHY THIS MATTERS FOR THE SYSTEM:                                           │
│  • Every service should track financialYear and assessmentYear              │
│  • Helps in filtering services by year                                      │
│  • Important for compliance calendar                                        │
│  • Required for ITR, TDS, GST Annual Return                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART C: SERVICE WORKFLOW DESIGN

## C1. Service Origin Points
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SERVICE ORIGIN POINTS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  There are FOUR ways a service can originate:                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. CLIENT-INITIATED REQUEST (NEW - To Implement)                   │   │
│  │  ─────────────────────────────────────────────────                  │   │
│  │                                                                     │   │
│  │  Client logs in → Requests service → Selects type → Submits        │   │
│  │                                          ↓                          │   │
│  │                             PM/Admin receives notification          │   │
│  │                                          ↓                          │   │
│  │                             Reviews & Approves/Rejects              │   │
│  │                                          ↓                          │   │
│  │                             If Approved → Service Created           │   │
│  │                                                                     │   │
│  │  Use Case:                                                          │   │
│  │  • Client knows they need ITR filing                                │   │
│  │  • Client wants new GST registration                                │   │
│  │  • Client has specific requirement                                  │   │
│  │                                                                     │   │
│  │  Frequency: ~20-30% of services                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  2. FIRM-INITIATED (Existing - Enhanced)                            │   │
│  │  ───────────────────────────────────────                            │   │
│  │                                                                     │   │
│  │  Super Admin/Admin/PM creates service directly                      │   │
│  │                    ↓                                                │   │
│  │  No approval needed (direct creation)                               │   │
│  │                    ↓                                                │   │
│  │  Assigns to PM/TM                                                   │   │
│  │                    ↓                                                │   │
│  │  Work begins                                                        │   │
│  │                                                                     │   │
│  │  Use Case:                                                          │   │
│  │  • Firm knows client's compliance needs                             │   │
│  │  • Proactive service creation                                       │   │
│  │  • New client onboarding                                            │   │
│  │                                                                     │   │
│  │  Frequency: ~70-80% of services                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  3. RECURRING/SCHEDULED (Future Enhancement)                        │   │
│  │  ───────────────────────────────────────────                        │   │
│  │                                                                     │   │
│  │  System auto-creates based on schedule                              │   │
│  │                                                                     │   │
│  │  Examples:                                                          │   │
│  │  • Monthly GST Return (auto-create on 1st of month)                 │   │
│  │  • Quarterly TDS Return (auto-create after quarter end)             │   │
│  │  • Annual ITR (auto-create in April for all clients)                │   │
│  │                                                                     │   │
│  │  Implementation: Later phase                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  4. COMPLIANCE CALENDAR TRIGGER (Future Enhancement)                │   │
│  │  ───────────────────────────────────────────────────                │   │
│  │                                                                     │   │
│  │  System checks due dates → Creates reminder → Converts to service   │   │
│  │                                                                     │   │
│  │  Example:                                                           │   │
│  │  • July 15: System alerts "ITR deadline in 15 days for 50 clients" │   │
│  │  • Admin bulk-creates services for all pending clients              │   │
│  │                                                                     │   │
│  │  Implementation: Later phase                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## C2. Service Lifecycle (12 Statuses)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    12 SERVICE STATUSES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  #   STATUS               MEANING                          PHASE            │
│  ─── ──────────────────── ──────────────────────────────── ───────────      │
│                                                                             │
│  1   PENDING              Service created, not assigned    Creation         │
│                           Waiting for assignment                            │
│                                                                             │
│  2   ASSIGNED             Assigned to PM/TM                Assignment       │
│                           Work not yet started                              │
│                                                                             │
│  3   IN_PROGRESS          Work actively being done         Execution        │
│                           Tasks being executed                              │
│                                                                             │
│  4   WAITING_FOR_CLIENT   Need client input/documents      Execution        │
│                           Blocked on client action                          │
│                                                                             │
│  5   ON_HOLD              Temporarily paused               Execution        │
│                           Internal or external reason                       │
│                                                                             │
│  6   UNDER_REVIEW         Submitted for quality check      Review           │
│                           TM completed, PM reviewing                        │
│                                                                             │
│  7   CHANGES_REQUESTED    Reviewer found issues            Review           │
│                           Need modifications                                │
│                                                                             │
│  8   COMPLETED            All work done, approved          Completion       │
│                           Ready to deliver                                  │
│                                                                             │
│  9   DELIVERED            Sent to client                   Delivery         │
│                           Deliverables shared                               │
│                                                                             │
│  10  INVOICED             Invoice generated                Billing          │
│                           Waiting for payment                               │
│                                                                             │
│  11  CLOSED               Fully done, paid                 Final            │
│                           Service archived                                  │
│                                                                             │
│  12  CANCELLED            Service cancelled                Final            │
│                           Can happen at any stage                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Flow:
```
                              ┌──────────────────────────────────────┐
                              │         SERVICE LIFECYCLE            │
                              └──────────────────────────────────────┘

                                        SERVICE CREATED
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                    1. PENDING                           │
                    │                                                         │
                    │   • Just created                                        │
                    │   • No one assigned yet                                 │
                    │   • Waiting for assignment                              │
                    │                                                         │
                    └────────────────────────┬────────────────────────────────┘
                                             │
                                             │ "Assign to..."
                                             ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                    2. ASSIGNED                          │
                    │                                                         │
                    │   • Assigned to PM or TM                                │
                    │   • Work not started                                    │
                    │   • Can be delegated                                    │
                    │                                                         │
                    └────────────────────────┬────────────────────────────────┘
                                             │
                                             │ "Start Work"
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           3. IN_PROGRESS                                    │
│                                                                             │
│   • Work actively being done                                                │
│   • Tasks being created/completed                                           │
│   • Documents being collected                                               │
│                                                                             │
└───────────────────┬─────────────────┬──────────────────┬────────────────────┘
                    │                 │                  │
    "Request Docs"  │    "Put on Hold"│   "Submit Review"│
                    ▼                 ▼                  │
┌─────────────────────────┐  ┌─────────────────────┐     │
│                         │  │                     │     │
│ 4. WAITING_FOR_CLIENT   │  │    5. ON_HOLD       │     │
│                         │  │                     │     │
│ • Need client input     │  │ • Temporarily paused│     │
│ • Blocked on client     │  │ • Any reason        │     │
│                         │  │                     │     │
└───────────┬─────────────┘  └──────────┬──────────┘     │
            │                           │                │
            └───────────┬───────────────┘                │
                        │                                │
            "Resume Work"                                │
                        │                                │
                        └────► Back to IN_PROGRESS ◄─────┤
                                                         │
                                                         │
                                                         ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                  6. UNDER_REVIEW                        │
                    │                                                         │
                    │   • TM submitted for review                             │
                    │   • PM checking quality                                 │
                    │   • Verifying work                                      │
                    │                                                         │
                    └───────────────────┬────────────────┬────────────────────┘
                                        │                │
                    "Request Changes"   │    "Approve"   │
                                        ▼                │
                    ┌─────────────────────────────────┐  │
                    │                                 │  │
                    │     7. CHANGES_REQUESTED        │  │
                    │                                 │  │
                    │   • Issues found                │  │
                    │   • Need modifications          │  │
                    │                                 │  │
                    └─────────────┬───────────────────┘  │
                                  │                      │
                    "Start Fixing"│                      │
                                  │                      │
                                  └────► IN_PROGRESS     │
                                                         │
                                                         │
                                                         ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                    8. COMPLETED                         │
                    │                                                         │
                    │   • All work finished                                   │
                    │   • Quality approved                                    │
                    │   • Ready to deliver                                    │
                    │                                                         │
                    └────────────────────────┬────────────────────────────────┘
                                             │
                                             │ "Deliver to Client"
                                             ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                    9. DELIVERED                         │
                    │                                                         │
                    │   • Deliverables sent to client                         │
                    │   • Client notified                                     │
                    │   • Documents shared                                    │
                    │                                                         │
                    └────────────────────────┬────────────────────────────────┘
                                             │
                                             │ "Generate Invoice" (AUTO)
                                             ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                   10. INVOICED                          │
                    │                                                         │
                    │   • Invoice generated                                   │
                    │   • Sent to client                                      │
                    │   • Waiting for payment                                 │
                    │                                                         │
                    └────────────────────────┬────────────────────────────────┘
                                             │
                                             │ "Record Payment" / Payment Received (AUTO)
                                             ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                    11. CLOSED                           │
                    │                                                         │
                    │   ✅ FINAL STATUS                                       │
                    │   • Service fully completed                             │
                    │   • Payment received                                    │
                    │   • All documentation done                              │
                    │   • No more changes allowed                             │
                    │                                                         │
                    └─────────────────────────────────────────────────────────┘


                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                   12. CANCELLED                         │
                    │                                                         │
                    │   ✅ FINAL STATUS                                       │
                    │   • Service cancelled                                   │
                    │   • Can happen from ANY status (except CLOSED)          │
                    │   • Reason must be logged                               │
                    │                                                         │
                    │   Reasons:                                              │
                    │   • Client requested cancellation                       │
                    │   • Client not responding                               │
                    │   • Duplicate service                                   │
                    │   • Not required anymore                                │
                    │                                                         │
                    └─────────────────────────────────────────────────────────┘
```

---

## C3. Status Transition Rules
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STATUS TRANSITION MATRIX                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FROM STATUS             →  CAN MOVE TO                                     │
│  ────────────────────────────────────────────────────────────────────       │
│                                                                             │
│  1.  PENDING             →  ASSIGNED, CANCELLED                             │
│                                                                             │
│  2.  ASSIGNED            →  IN_PROGRESS, PENDING (unassign), CANCELLED      │
│                                                                             │
│  3.  IN_PROGRESS         →  WAITING_FOR_CLIENT, ON_HOLD, UNDER_REVIEW,      │
│                             COMPLETED (if PM doing self), CANCELLED         │
│                                                                             │
│  4.  WAITING_FOR_CLIENT  →  IN_PROGRESS, ON_HOLD, CANCELLED                 │
│                                                                             │
│  5.  ON_HOLD             →  IN_PROGRESS, WAITING_FOR_CLIENT, CANCELLED      │
│                                                                             │
│  6.  UNDER_REVIEW        →  CHANGES_REQUESTED, COMPLETED, CANCELLED         │
│                                                                             │
│  7.  CHANGES_REQUESTED   →  IN_PROGRESS, CANCELLED                          │
│                                                                             │
│  8.  COMPLETED           →  DELIVERED, CANCELLED                            │
│                                                                             │
│  9.  DELIVERED           →  INVOICED, CANCELLED                             │
│                                                                             │
│  10. INVOICED            →  CLOSED, CANCELLED                               │
│                                                                             │
│  11. CLOSED              →  NOTHING (Final Status)                          │
│                                                                             │
│  12. CANCELLED           →  NOTHING (Final Status)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## C4. Status Update Strategies
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STATUS UPDATE STRATEGIES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  There are THREE ways status can be updated:                                │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│  1. AUTOMATIC (System triggers based on events)                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  EVENT                              →  STATUS CHANGE                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Service created                    →  PENDING (auto)               │   │
│  │  First assignment made              →  PENDING → ASSIGNED (auto)    │   │
│  │  Invoice generated for service      →  DELIVERED → INVOICED (auto)  │   │
│  │  Full payment received              →  INVOICED → CLOSED (auto)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│  2. MANUAL (User explicitly changes status - BACKUP OPTION)                 │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  • Status dropdown on service detail page                                   │
│  • Shows only valid next statuses                                           │
│  • Requires reason for some transitions                                     │
│  • Available only to SA/Admin (for overrides)                               │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│  3. ACTION-BASED (Primary Method - RECOMMENDED)                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  User performs ACTION → Status changes as RESULT                            │
│                                                                             │
│  Example:                                                                   │
│  Instead of: "Change status to ASSIGNED"                                    │
│  User does:  "Assign to Amit (TM)" → Status becomes ASSIGNED                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ACTION BUTTONS ON SERVICE PAGE                                     │   │
│  │  ──────────────────────────────                                     │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   Assign    │  │   Start     │  │  Request    │                  │   │
│  │  │     to      │  │   Work      │  │  Documents  │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   Put on    │  │  Submit for │  │   Mark      │                  │   │
│  │  │    Hold     │  │   Review    │  │  Complete   │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                     │   │
│  │  Buttons shown dynamically based on current status                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## C5. Complete Action → Status Mapping
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ACTION → STATUS MAPPING                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER ACTION                      CURRENT STATUS    NEW STATUS              │
│  ────────────────────────────────────────────────────────────────────       │
│                                                                             │
│  📌 ASSIGNMENT ACTIONS:                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  "Assign to PM/TM"                PENDING        →  ASSIGNED                │
│  "Delegate to another PM/TM"      ASSIGNED       →  ASSIGNED (same status,  │
│                                                     new assignee)           │
│  "Delegate"                       IN_PROGRESS    →  IN_PROGRESS (same)      │
│  "Unassign"                       ASSIGNED       →  PENDING                 │
│                                                                             │
│  📌 WORK START ACTIONS:                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  "Start Work"                     ASSIGNED       →  IN_PROGRESS             │
│  "Resume Work"                    ON_HOLD        →  IN_PROGRESS             │
│  "Resume Work" (docs received)    WAITING_FOR_   →  IN_PROGRESS             │
│                                   CLIENT                                    │
│  "Start Fixing Changes"           CHANGES_       →  IN_PROGRESS             │
│                                   REQUESTED                                 │
│                                                                             │
│  📌 PAUSE ACTIONS:                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  "Request Documents from Client"  IN_PROGRESS    →  WAITING_FOR_CLIENT      │
│  "Mark as Waiting for Client"     IN_PROGRESS    →  WAITING_FOR_CLIENT      │
│  "Put on Hold"                    IN_PROGRESS    →  ON_HOLD                 │
│  "Put on Hold"                    WAITING_FOR_   →  ON_HOLD                 │
│                                   CLIENT                                    │
│                                                                             │
│  📌 REVIEW ACTIONS:                                                         │
│  ──────────────────                                                         │
│                                                                             │
│  "Submit for Review"              IN_PROGRESS    →  UNDER_REVIEW            │
│  "Approve Work"                   UNDER_REVIEW   →  COMPLETED               │
│  "Request Changes"                UNDER_REVIEW   →  CHANGES_REQUESTED       │
│                                                                             │
│  📌 COMPLETION ACTIONS:                                                     │
│  ─────────────────────                                                      │
│                                                                             │
│  "Mark as Complete"               IN_PROGRESS    →  COMPLETED               │
│  (if PM doing work themselves,    (bypass        (direct to                 │
│   no TM involved)                  review)        complete)                 │
│                                                                             │
│  "Deliver to Client"              COMPLETED      →  DELIVERED               │
│  (upload deliverables, notify)                                              │
│                                                                             │
│  📌 BILLING ACTIONS:                                                        │
│  ──────────────────                                                         │
│                                                                             │
│  "Generate Invoice"               DELIVERED      →  INVOICED (auto)         │
│  "Record Payment (Full)"          INVOICED       →  CLOSED (auto)           │
│  "Record Payment (Partial)"       INVOICED       →  INVOICED (same)         │
│                                                                             │
│  📌 CLOSURE ACTIONS:                                                        │
│  ──────────────────                                                         │
│                                                                             │
│  "Close Service"                  INVOICED       →  CLOSED                  │
│  "Cancel Service"                 ANY (except    →  CANCELLED               │
│                                   CLOSED)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## C6. Role-wise Action Permissions
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROLE-WISE ACTION PERMISSIONS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ACTION                        │ SA │ ADM │ PM  │ TM  │ CLIENT              │
│  ──────────────────────────────┼────┼─────┼─────┼─────┼────────             │
│                                                                             │
│  📌 ASSIGNMENT:                                                             │
│  Assign to any PM              │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│  Assign to any TM              │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│  Delegate (re-assign)          │ ✅ │ ✅  │ ✅  │ ✅  │ ❌                   │
│  Unassign                      │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│                                                                             │
│  📌 WORK ACTIONS:                                                           │
│  Start Work (any service)      │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Start Work (assigned)         │ ✅ │ ✅  │ ✅  │ ✅  │ ❌                   │
│  Resume Work (any)             │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Resume Work (assigned)        │ ✅ │ ✅  │ ✅  │ ✅  │ ❌                   │
│  Put on Hold (any)             │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Put on Hold (assigned)        │ ✅ │ ✅  │ ✅  │ ✅  │ ❌                   │
│  Request Documents (any)       │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Request Documents (assigned)  │ ✅ │ ✅  │ ✅  │ ✅  │ ❌                   │
│                                                                             │
│  📌 REVIEW ACTIONS:                                                         │
│  Submit for Review (assigned)  │ ✅ │ ✅  │ ✅  │ ✅  │ ❌                   │
│  Approve Work (any)            │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Approve Work (own client)     │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│  Request Changes (any)         │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Request Changes (own client)  │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│                                                                             │
│  📌 COMPLETION:                                                             │
│  Mark Complete (any)           │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Mark Complete (own)           │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│  Deliver to Client (any)       │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Deliver to Client (own)       │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│                                                                             │
│  📌 BILLING:                                                                │
│  Generate Invoice (any)        │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Generate Invoice (own client) │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│  Record Payment (any)          │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Record Payment (own client)   │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│                                                                             │
│  📌 CLOSURE:                                                                │
│  Close Service (any)           │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Close Service (own)           │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│  Cancel Service (any)          │ ✅ │ ✅  │ ❌  │ ❌  │ ❌                   │
│  Cancel Service (own)          │ ✅ │ ✅  │ ✅  │ ❌  │ ❌                   │
│                                                                             │
│  📌 CLIENT ACTIONS:                                                         │
│  Upload Documents              │ ❌ │ ❌  │ ❌  │ ❌  │ ✅                   │
│  View Service Progress         │ ✅ │ ✅  │ ✅  │ ✅  │ ✅ (own)            │
│  Pay Invoice                   │ ❌ │ ❌  │ ❌  │ ❌  │ ✅                   │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────       │
│  KEY:                                                                       │
│  SA/Admin = NO RESTRICTIONS (can do anything on any service)                │
│  PM = Scoped to own clients/services                                        │
│  TM = Only assigned services                                                │
│  Client = Only own services                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## C7. Real-World Workflow Example
```
┌─────────────────────────────────────────────────────────────────────────────┐
│        EXAMPLE: ITR Filing for Client "ABC Corp" (FY 2024-25)               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DAY 1 (01-Jun-2025) - SERVICE CREATED                                      │
│  ─────────────────────────────────────                                      │
│  • Client ABC Corp requests ITR Filing service (via portal)                 │
│  • ServiceRequest created with status: PENDING                              │
│  • PM Rajesh gets notified                                                  │
│  • Rajesh reviews and clicks "Approve"                                      │
│  • Service created with status: PENDING                                     │
│                                                                             │
│  📋 Status: PENDING                                                         │
│  📝 Log: "Service created from client request. Approved by Rajesh (PM)"     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 1 (Same day) - ASSIGNMENT                                              │
│  ─────────────────────────────────                                          │
│  • Rajesh clicks "Assign to..." → Selects Amit (TM)                         │
│  • Assignment created with delegation level: 1                              │
│                                                                             │
│  📋 Status: PENDING → ASSIGNED                                              │
│  👤 Assignee: Amit (Team Member)                                            │
│  📝 Log: "Assigned to Amit (TM) by Rajesh (PM)"                             │
│  📝 Assignment: Level 1, Type: INITIAL                                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 2 (02-Jun-2025) - WORK STARTS                                          │
│  ────────────────────────────────────                                       │
│  • Amit clicks "Start Work"                                                 │
│  • Creates checklist for required documents                                 │
│  • Sends document request to client                                         │
│                                                                             │
│  📋 Status: ASSIGNED → IN_PROGRESS                                          │
│  📝 Log: "Work started by Amit (TM)"                                        │
│  📝 Checklist: Form 16 (pending), Bank Statements (pending), etc.           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 2 (Same day) - WAITING FOR CLIENT                                      │
│  ────────────────────────────────────                                       │
│  • Amit clicks "Request Documents"                                          │
│  • Selects: Form 16, Bank Statements, Investment Proofs                     │
│  • Client gets email notification                                           │
│                                                                             │
│  📋 Status: IN_PROGRESS → WAITING_FOR_CLIENT                                │
│  📝 Log: "Waiting for documents: Form 16, Bank Statements"                  │
│  📧 Email sent to client                                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 5 (05-Jun-2025) - DOCUMENTS RECEIVED                                   │
│  ────────────────────────────────────────                                   │
│  • Client uploads all documents via portal                                  │
│  • Amit gets notified                                                       │
│  • Amit clicks "Resume Work"                                                │
│                                                                             │
│  📋 Status: WAITING_FOR_CLIENT → IN_PROGRESS                                │
│  📝 Log: "Documents received. Work resumed by Amit (TM)"                    │
│  📎 Documents: Form 16 ✓, Bank Statements ✓, Investment Proofs ✓            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 6 (06-Jun-2025) - DELEGATION                                           │
│  ───────────────────────────────────                                        │
│  • Amit is sick, needs to delegate                                          │
│  • Amit clicks "Delegate" → Selects Priya (TM)                              │
│                                                                             │
│  📋 Status: IN_PROGRESS (no change)                                         │
│  👤 Assignee: Amit → Priya (TM)                                             │
│  📝 Log: "Delegated to Priya (TM) by Amit (TM). Reason: Sick leave"         │
│  📝 Assignment: Level 2, Type: DELEGATION                                   │
│  📝 Chain: Rajesh(PM) → Amit(TM) → Priya(TM)                                 │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 8 (08-Jun-2025) - SUBMIT FOR REVIEW                                    │
│  ───────────────────────────────────────                                    │
│  • Priya completes ITR computation                                          │
│  • Priya clicks "Submit for Review"                                         │
│  • Uploads: ITR Computation Sheet, Draft ITR                                │
│                                                                             │
│  📋 Status: IN_PROGRESS → UNDER_REVIEW                                      │
│  📝 Log: "Submitted for review by Priya (TM)"                               │
│  📎 Files: ITR_Computation.xlsx, Draft_ITR.pdf                              │
│  👀 Reviewer: Rajesh (PM)                                                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 9 (09-Jun-2025) - CHANGES REQUESTED                                    │
│  ───────────────────────────────────────                                    │
│  • Rajesh reviews, finds HRA calculation error                              │
│  • Rajesh clicks "Request Changes"                                          │
│  • Adds feedback: "HRA calculation incorrect. Recalculate."                 │
│                                                                             │
│  📋 Status: UNDER_REVIEW → CHANGES_REQUESTED                                │
│  📝 Log: "Changes requested by Rajesh (PM)"                                 │
│  📝 Feedback: "HRA calculation incorrect. Please recalculate with rent      │
│               receipts. Also add 80C deductions."                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 9 (Same day) - FIXING                                                  │
│  ────────────────────────────                                               │
│  • Priya sees feedback                                                      │
│  • Priya clicks "Start Fixing"                                              │
│                                                                             │
│  📋 Status: CHANGES_REQUESTED → IN_PROGRESS                                 │
│  📝 Log: "Started fixing changes by Priya (TM)"                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 10 (10-Jun-2025) - RESUBMIT                                            │
│  ───────────────────────────────                                            │
│  • Priya fixes issues                                                       │
│  • Priya clicks "Submit for Review" again                                   │
│                                                                             │
│  📋 Status: IN_PROGRESS → UNDER_REVIEW                                      │
│  📝 Log: "Resubmitted for review by Priya (TM)"                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 10 (Same day) - APPROVED                                               │
│  ────────────────────────────                                               │
│  • Rajesh reviews again                                                     │
│  • All looks good                                                           │
│  • Rajesh clicks "Approve"                                                  │
│                                                                             │
│  📋 Status: UNDER_REVIEW → COMPLETED                                        │
│  📝 Log: "Approved by Rajesh (PM). Ready to file."                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 11 (11-Jun-2025) - DELIVERED                                           │
│  ────────────────────────────────                                           │
│  • Rajesh files ITR on income tax portal                                    │
│  • Gets acknowledgment (ITR-V)                                              │
│  • Rajesh clicks "Deliver to Client"                                        │
│  • Uploads: ITR-V, Computation Sheet                                        │
│  • Adds message: "Your ITR has been filed successfully"                     │
│                                                                             │
│  📋 Status: COMPLETED → DELIVERED                                           │
│  📝 Log: "Delivered to client by Rajesh (PM)"                               │
│  📎 Deliverables: ITR-V_Acknowledgment.pdf, Computation_Final.pdf           │
│  📧 Client notified                                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 12 (12-Jun-2025) - INVOICED                                            │
│  ───────────────────────────────                                            │
│  • Rajesh clicks "Generate Invoice"                                         │
│  • Invoice created: ₹5,000 + 18% GST = ₹5,900                               │
│  • Invoice sent to client                                                   │
│                                                                             │
│  📋 Status: DELIVERED → INVOICED (auto)                                     │
│  📝 Log: "Invoice #INV-2025-0042 generated. Amount: ₹5,900"                 │
│  💰 Invoice: INV-2025-0042                                                  │
│  📧 Invoice emailed to client                                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DAY 15 (15-Jun-2025) - CLOSED                                              │
│  ────────────────────────────                                               │
│  • Client pays via UPI                                                      │
│  • Rajesh clicks "Record Payment"                                           │
│  • Enters: ₹5,900, UPI, Transaction Ref                                     │
│                                                                             │
│  📋 Status: INVOICED → CLOSED (auto on full payment)                        │
│  📝 Log: "Payment received. Service closed by Rajesh (PM)"                  │
│  💰 Payment: ₹5,900 via UPI                                                 │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════    │
│  ✅ SERVICE COMPLETED SUCCESSFULLY                                          │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  TOTAL TIMELINE: 15 days                                                    │
│  STATUS CHANGES: 12                                                         │
│  DELEGATION CHAIN: Rajesh → Amit → Priya                                    │
│  REVIEW CYCLES: 2 (1 change request)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART D: RELATIONSHIP & ASSIGNMENT DESIGN

## D1. Client-PM Relationship (Many-to-Many) - NEW
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIENT-PM RELATIONSHIP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT DESIGN (One-to-One) - TO BE CHANGED                                │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│  ┌──────────────┐         managedBy         ┌──────────────┐               │
│  │   Client     │ ─────────────────────────▶│     PM       │               │
│  │  (ABC Corp)  │     (Single PM only)      │  (Rajesh)    │               │
│  └──────────────┘                           └──────────────┘               │
│                                                                             │
│  Problem: Only ONE PM can manage a client                                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  NEW DESIGN (Many-to-Many) - TO IMPLEMENT                                   │
│  ════════════════════════════════════════                                   │
│                                                                             │
│  ┌──────────────┐      ClientPMAssignment    ┌──────────────┐               │
│  │   Client     │◄──────────────────────────▶│  Rajesh PM   │               │
│  │  (ABC Corp)  │   role: "PRIMARY"          └──────────────┘               │
│  │              │   role: "ITR_HANDLER"                                     │
│  │              │                            ┌──────────────┐               │
│  │              │◄──────────────────────────▶│  Suresh PM   │               │
│  │              │   role: "GST_HANDLER"      └──────────────┘               │
│  │              │                                                           │
│  │              │                            ┌──────────────┐               │
│  │              │◄──────────────────────────▶│  Mahesh PM   │               │
│  └──────────────┘   role: "AUDIT_HANDLER"    └──────────────┘               │
│                                                                             │
│  Benefits:                                                                  │
│  • Multiple PMs can manage same client                                      │
│  • Each PM can have a specific role                                         │
│  • Full audit trail of assignments                                          │
│  • No restrictions                                                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ASSIGNMENT DETAILS TRACKED:                                                │
│  ════════════════════════════                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ClientPMAssignment                                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • clientId         - Which client                                  │   │
│  │  • projectManagerId - Which PM                                      │   │
│  │  • role             - PRIMARY, ITR_HANDLER, GST_HANDLER, etc.       │   │
│  │  • assignedBy       - Who made this assignment                      │   │
│  │  • assignedByRole   - SA, ADMIN, or PM                              │   │
│  │  • assignedAt       - When assigned                                 │   │
│  │  • isActive         - Is assignment active                          │   │
│  │  • removedAt        - If removed, when                              │   │
│  │  • removedBy        - If removed, by whom                           │   │
│  │  • removalReason    - Why removed                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D2. Service Assignment System - NEW
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE ASSIGNMENT SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KEY PRINCIPLE:                                                             │
│  ══════════════                                                             │
│  • Any PM can work on any service (no restriction)                          │
│  • PM doesn't need to be client's manager                                   │
│  • Service can be assigned to PM or directly to TM                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SERVICE ASSIGNMENT FLOW:                                                   │
│  ════════════════════════                                                   │
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   Service   │                                                            │
│  │   Created   │                                                            │
│  │  (PENDING)  │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │ SA/Admin/PM clicks "Assign to..."                                 │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     ASSIGNMENT OPTIONS                               │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  Option A: Assign to Project Manager                                 │   │
│  │  ────────────────────────────────────                                │   │
│  │  • Select any PM from firm                                           │   │
│  │  • PM becomes responsible                                            │   │
│  │  • PM can delegate to TM later                                       │   │
│  │                                                                      │   │
│  │  Option B: Assign to Team Member (Skip PM)                           │   │
│  │  ──────────────────────────────────────────                          │   │
│  │  • Select any TM from firm                                           │   │
│  │  • TM does the work                                                  │   │
│  │  • Review goes to creating PM/Admin                                  │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  SERVICE ASSIGNMENT TRACKING:                                               │
│  ════════════════════════════                                               │
│                                                                             │
│  Two fields on Service model:                                               │
│  • currentAssigneeId   - Who is currently responsible                       │
│  • currentAssigneeType - "PROJECT_MANAGER" or "TEAM_MEMBER"                 │
│                                                                             │
│  Full history in ServiceAssignment table:                                   │
│  • Every assignment/reassignment logged                                     │
│  • With timestamps, who assigned, reason                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D3. Delegation System with Chain Tracking - NEW
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DELEGATION SYSTEM                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KEY PRINCIPLES:                                                            │
│  ═══════════════                                                            │
│  • Anyone can delegate to anyone (PM→TM, PM→PM, TM→TM)                      │
│  • Chain delegation allowed (A→B→C→D)                                       │
│  • Full audit trail maintained                                              │
│  • Delegation level tracked (1, 2, 3...)                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  DELEGATION CHAIN EXAMPLE:                                                  │
│  ═════════════════════════                                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ASSIGNMENT #1 (Initial)                                            │   │
│  │  ─────────────────────────                                          │   │
│  │  Assignee: Rajesh (PM)                                              │   │
│  │  Assigned By: Admin                                                 │   │
│  │  Type: INITIAL                                                      │   │
│  │  Level: 1                                                           │   │
│  │  Date: 01-Dec-2025 10:00 AM                                         │   │
│  │  Status: DELEGATED ──────────────────────────────────┐              │   │
│  └──────────────────────────────────────────────────────│──────────────┘   │
│                                                         │                  │
│                                                         ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ASSIGNMENT #2 (Delegation)                                         │   │
│  │  ──────────────────────────                                         │   │
│  │  Assignee: Amit (TM)                                                │   │
│  │  Assigned By: Rajesh (PM)                                           │   │
│  │  Type: DELEGATION                                                   │   │
│  │  Level: 2                                                           │   │
│  │  Reason: "PM busy with audit work"                                  │   │
│  │  Previous Assignment: #1                                            │   │
│  │  Date: 02-Dec-2025 11:30 AM                                         │   │
│  │  Status: DELEGATED ──────────────────────────────────┐              │   │
│  └──────────────────────────────────────────────────────│──────────────┘   │
│                                                         │                  │
│                                                         ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ASSIGNMENT #3 (Re-Delegation)                                      │   │
│  │  ─────────────────────────────                                      │   │
│  │  Assignee: Priya (TM)                                               │   │
│  │  Assigned By: Amit (TM)                                             │   │
│  │  Type: DELEGATION                                                   │   │
│  │  Level: 3                                                           │   │
│  │  Reason: "Amit on sick leave"                                       │   │
│  │  Previous Assignment: #2                                            │   │
│  │  Date: 05-Dec-2025 09:00 AM                                         │   │
│  │  Status: ACTIVE ← Currently working                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  DELEGATION CHAIN: Admin → Rajesh (PM) → Amit (TM) → Priya (TM)             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ASSIGNMENT TYPES:                                                          │
│  ════════════════                                                           │
│  • INITIAL       - First assignment                                         │
│  • DELEGATION    - Delegated by current assignee                            │
│  • RE_ASSIGNMENT - Reassigned by SA/Admin/PM (override)                     │
│  • TAKE_BACK     - Original assigner takes back                             │
│                                                                             │
│  ASSIGNMENT STATUSES:                                                       │
│  ═══════════════════                                                        │
│  • ACTIVE    - Currently working on this                                    │
│  • DELEGATED - Delegated to someone else                                    │
│  • COMPLETED - Completed the work                                           │
│  • REVOKED   - Assignment revoked by authority                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D4. Client-TM Assignment (Existing)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIENT-TM ASSIGNMENT (Already Exists)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  This is DIFFERENT from Service Delegation                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  CLIENT ASSIGNMENT (Existing - via ClientAssignment table)          │   │
│  │  ─────────────────────────────────────────────────────────          │   │
│  │                                                                     │   │
│  │  "Which Team Members can ACCESS this Client's data?"                │   │
│  │                                                                     │   │
│  │  ┌─────────────┐                                                    │   │
│  │  │   CLIENT    │                                                    │   │
│  │  │  (ABC Corp) │                                                    │   │
│  │  └──────┬──────┘                                                    │   │
│  │         │ assigned to                                               │   │
│  │         ▼                                                           │   │
│  │  ┌─────────────┐    ┌─────────────┐                                 │   │
│  │  │  Amit (TM)  │    │ Priya (TM)  │                                 │   │
│  │  └─────────────┘    └─────────────┘                                 │   │
│  │                                                                     │   │
│  │  • Amit & Priya can VIEW ABC Corp's details                         │   │
│  │  • They can see ABC Corp's services, documents                      │   │
│  │  • But they are NOT assigned to DO specific work                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  vs.                                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  SERVICE DELEGATION (New - via ServiceAssignment table)             │   │
│  │  ─────────────────────────────────────────────────────              │   │
│  │                                                                     │   │
│  │  "Which Team Member will WORK ON this specific Service?"            │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────┐             │   │
│  │  │  Service: ITR Filing for ABC Corp                  │             │   │
│  │  │  Delegated to: Amit (TM) ← AMIT WILL DO THE WORK   │             │   │
│  │  └────────────────────────────────────────────────────┘             │   │
│  │                                                                     │   │
│  │  • Amit has specific service to complete                            │   │
│  │  • Amit is responsible for this service                             │   │
│  │  • Amit must submit for review                                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BOTH COEXIST - They serve different purposes                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D5. Complete Relationship Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE RELATIONSHIP MAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           ┌───────────────┐                                 │
│                           │     FIRM      │                                 │
│                           └───────┬───────┘                                 │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────┐                   │
│         │                         │                     │                   │
│         ▼                         ▼                     ▼                   │
│  ┌─────────────┐           ┌─────────────┐       ┌─────────────┐           │
│  │ SUPER ADMIN │           │   ADMIN 1   │       │   ADMIN 2   │           │
│  └─────────────┘           └─────────────┘       └─────────────┘           │
│         │                         │                     │                   │
│         └─────────────────────────┼─────────────────────┘                   │
│                                   │ creates/manages                         │
│                                   ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PROJECT MANAGERS                                │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │  │
│  │  │  Rajesh PM  │    │  Suresh PM  │    │  Mahesh PM  │              │  │
│  │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │  │
│  └─────────┼──────────────────┼──────────────────┼──────────────────────┘  │
│            │                  │                  │                          │
│            │ ClientPMAssignment (Many-to-Many)   │                          │
│            ▼                  ▼                  ▼                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         CLIENTS                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │  Client: ABC Corp                                           │    │  │
│  │  │  ├── Managed by: Rajesh (PRIMARY), Suresh (GST_HANDLER)     │    │  │
│  │  │  │                                                          │    │  │
│  │  │  │  ┌────────────────────────────────────────────────────┐  │    │  │
│  │  │  │  │  Services                                          │  │    │  │
│  │  │  │  │                                                    │  │    │  │
│  │  │  │  │  Service 1: ITR Filing                             │  │    │  │
│  │  │  │  │  ├── Assigned PM: Rajesh                           │  │    │  │
│  │  │  │  │  ├── Delegated to: Amit (TM)                       │  │    │  │
│  │  │  │  │  └── Status: IN_PROGRESS                           │  │    │  │
│  │  │  │  │                                                    │  │    │  │
│  │  │  │  │  Service 2: GST Return                             │  │    │  │
│  │  │  │  │  ├── Assigned PM: Suresh                           │  │    │  │
│  │  │  │  │  ├── Delegated to: Priya (TM)                      │  │    │  │
│  │  │  │  │  └── Status: WAITING_FOR_CLIENT                    │  │    │  │
│  │  │  │  │                                                    │  │    │  │
│  │  │  │  └────────────────────────────────────────────────────┘  │    │  │
│  │  │  │                                                          │    │  │
│  │  │  │  ClientAssignment (TM Access)                            │    │  │
│  │  │  │  ├── Amit (TM) - Can view ABC Corp                       │    │  │
│  │  │  │  └── Priya (TM) - Can view ABC Corp                      │    │  │
│  │  │  │                                                          │    │  │
│  │  │  └──────────────────────────────────────────────────────────┘    │  │
│  │  │                                                                  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│  │
│  │  │  │  Client: XYZ Ltd                                            ││  │
│  │  │  │  ├── Managed by: Mahesh (PRIMARY)                           ││  │
│  │  │  │  │  ...                                                     ││  │
│  │  │  └─────────────────────────────────────────────────────────────┘│  │
│  │  │                                                                  │  │
│  └──┴──────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      TEAM MEMBERS                                    │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │  │
│  │  │  Amit (TM)  │    │  Priya (TM) │    │  Rahul (TM) │              │  │
│  │  │             │    │             │    │             │              │  │
│  │  │ Working on: │    │ Working on: │    │ Working on: │              │  │
│  │  │ - ITR ABC   │    │ - GST ABC   │    │ - ROC XYZ   │              │  │
│  │  └─────────────┘    └─────────────┘    └─────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

PART E: DATABASE SCHEMA CHANGES
E1. New Models to Create
1. ClientPMAssignment
prisma// Many-to-Many: Client ↔ Project Manager
model ClientPMAssignment {
  id                  String    @id @default(uuid())
  firmId              String
  clientId            String
  projectManagerId    String
  
  // Assignment Details
  role                String?   // "PRIMARY", "SECONDARY", "ITR_HANDLER", "GST_HANDLER", "AUDIT_HANDLER", etc.
  notes               String?
  
  // Who Made This Assignment
  assignedBy          String    // User ID
  assignedByRole      String    // "SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"
  assignedByName      String    // For display in logs
  
  // Timestamps
  assignedAt          DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Status
  isActive            Boolean   @default(true)
  
  // Removal Tracking
  removedAt           DateTime?
  removedBy           String?
  removedByRole       String?
  removedByName       String?
  removalReason       String?
  
  // Relations
  firm                Firm              @relation(fields: [firmId], references: [id])
  client              Client            @relation(fields: [clientId], references: [id])
  projectManager      ProjectManager    @relation(fields: [projectManagerId], references: [id])
  
  // Constraints
  @@unique([clientId, projectManagerId])
  @@index([firmId])
  @@index([clientId])
  @@index([projectManagerId])
  @@index([isActive])
}
2. ServiceRequest
prisma// Client-initiated service requests
model ServiceRequest {
  id                    String            @id @default(uuid())
  firmId                String
  clientId              String
  
  // Request Details
  serviceType           ServiceType
  title                 String
  description           String?
  urgency               RequestUrgency    @default(NORMAL)
  preferredDueDate      DateTime?
  
  // Financial Year
  financialYear         String?           // "2024-25"
  assessmentYear        String?           // "2025-26"
  
  // Status
  status                RequestStatus     @default(PENDING)
  
  // Review
  reviewedBy            String?
  reviewedByRole        String?
  reviewedByName        String?
  reviewedAt            DateTime?
  rejectionReason       String?
  approvalNotes         String?
  
  // Fee Quote (set during approval)
  quotedFee             Decimal?          @db.Decimal(10, 2)
  
  // Conversion to Service
  convertedToServiceId  String?           @unique
  
  // Timestamps
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  // Relations
  firm                  Firm              @relation(fields: [firmId], references: [id])
  client                Client            @relation(fields: [clientId], references: [id])
  convertedService      Service?          @relation(fields: [convertedToServiceId], references: [id])
  attachments           RequestAttachment[]
  
  @@index([firmId])
  @@index([clientId])
  @@index([status])
}

// Attachments for service requests
model RequestAttachment {
  id              String          @id @default(uuid())
  requestId       String
  fileName        String
  fileType        String
  fileSize        BigInt
  storagePath     String
  uploadedAt      DateTime        @default(now())
  
  request         ServiceRequest  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  @@index([requestId])
}
3. ServiceAssignment
prisma// Tracks all assignments and delegations
model ServiceAssignment {
  id                    String    @id @default(uuid())
  firmId                String
  serviceId             String
  
  // Who Is Assigned
  assigneeId            String    // PM or TM ID
  assigneeType          String    // "PROJECT_MANAGER" or "TEAM_MEMBER"
  assigneeName          String    // For display
  
  // Who Assigned/Delegated
  assignedBy            String    // User ID
  assignedByType        String    // "SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"
  assignedByName        String    // For display
  
  // Delegation Chain Tracking
  delegationLevel       Int       @default(1)    // 1 = First, 2 = Re-delegated, etc.
  previousAssignmentId  String?                  // Link to previous assignment
  delegationReason      String?                  // Why delegated
  
  // Assignment Type
  assignmentType        String    // "INITIAL", "DELEGATION", "RE_ASSIGNMENT", "TAKE_BACK"
  
  // Status
  status                String    @default("ACTIVE")  // "ACTIVE", "COMPLETED", "DELEGATED", "REVOKED"
  
  // Timestamps
  assignedAt            DateTime  @default(now())
  acceptedAt            DateTime?                // When assignee accepted
  completedAt           DateTime?                // When assignee completed
  
  // Revocation
  revokedAt             DateTime?
  revokedBy             String?
  revokedByName         String?
  revocationReason      String?
  
  // Relations
  firm                  Firm      @relation(fields: [firmId], references: [id])
  service               Service   @relation(fields: [serviceId], references: [id])
  previousAssignment    ServiceAssignment?  @relation("DelegationChain", fields: [previousAssignmentId], references: [id])
  nextAssignments       ServiceAssignment[] @relation("DelegationChain")
  
  @@index([firmId])
  @@index([serviceId])
  @@index([assigneeId])
  @@index([status])
}
4. ServiceStatusHistory
prisma// Audit trail of all status changes
model ServiceStatusHistory {
  id              String        @id @default(uuid())
  firmId          String
  serviceId       String
  
  // Status Change
  fromStatus      ServiceStatus?  // NULL for initial creation
  toStatus        ServiceStatus
  
  // What Action Triggered This
  action          String        // "CREATE", "ASSIGN", "START_WORK", "SUBMIT_REVIEW", etc.
  
  // Who Changed
  changedBy       String
  changedByType   String        // "SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SYSTEM"
  changedByName   String
  
  // Details
  reason          String?       // Why status changed
  notes           String?       // Additional notes
  metadata        Json?         // Any additional data
  
  // Timestamp
  changedAt       DateTime      @default(now())
  
  // Relations
  firm            Firm          @relation(fields: [firmId], references: [id])
  service         Service       @relation(fields: [serviceId], references: [id])
  
  @@index([serviceId])
  @@index([changedAt])
}

E2. Models to Modify
1. Client Model (Remove managedBy)
prismamodel Client {
  id              String    @id @default(uuid())
  firmId          String
  
  // REMOVE THESE TWO LINES:
  // managedBy       String?
  // projectManager  ProjectManager?  @relation(fields: [managedBy], references: [id])
  
  // ... rest of existing fields ...
  
  // ADD THIS NEW RELATION:
  pmAssignments   ClientPMAssignment[]
  serviceRequests ServiceRequest[]
  
  // ... existing relations ...
}
2. Service Model (Add New Fields)
prismamodel Service {
  id                  String          @id @default(uuid())
  firmId              String
  clientId            String
  projectManagerId    String?         // Keep for backward compatibility
  
  // EXISTING FIELDS (keep all):
  title               String
  description         String?
  type                ServiceType
  status              ServiceStatus   // Will use expanded enum
  dueDate             DateTime?
  completedAt         DateTime?
  feeAmount           Decimal?        @db.Decimal(10, 2)
  notes               String?
  
  // NEW FIELDS TO ADD:
  
  // Service Origin
  origin              ServiceOrigin   @default(FIRM_CREATED)
  serviceRequestId    String?         @unique   // If from client request
  
  // Financial Year
  financialYear       String?         // "2024-25"
  assessmentYear      String?         // "2025-26"
  
  // Current Assignment (Quick Access)
  currentAssigneeId   String?         // PM or TM ID
  currentAssigneeType String?         // "PROJECT_MANAGER" or "TEAM_MEMBER"
  currentAssigneeName String?         // For quick display
  
  // Creation Tracking
  createdBy           String?
  createdByRole       String?
  createdByName       String?
  
  // Work Dates
  startDate           DateTime?       // When work actually started
  
  // Internal Notes (Not visible to client)
  internalNotes       String?
  
  // Timestamps
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  // EXISTING RELATIONS (keep all):
  firm                Firm            @relation(fields: [firmId], references: [id])
  client              Client          @relation(fields: [clientId], references: [id])
  projectManager      ProjectManager? @relation(fields: [projectManagerId], references: [id])
  tasks               Task[]
  documents           Document[]
  invoices            Invoice[]
  
  // NEW RELATIONS TO ADD:
  serviceRequest      ServiceRequest?
  assignments         ServiceAssignment[]
  statusHistory       ServiceStatusHistory[]
  
  @@index([firmId])
  @@index([clientId])
  @@index([status])
  @@index([type])
  @@index([currentAssigneeId])
}
3. ProjectManager Model (Add Relation)
prismamodel ProjectManager {
  // ... existing fields ...
  
  // ADD THIS NEW RELATION:
  clientAssignments   ClientPMAssignment[]
  serviceAssignments  ServiceAssignment[]
  
  // ... existing relations ...
}

E3. New Enums to Add
prisma// Service Origin
enum ServiceOrigin {
  CLIENT_REQUEST    // Client requested via portal
  FIRM_CREATED      // SA/Admin/PM created directly
  RECURRING         // Auto-created from schedule (future)
  COMPLIANCE        // Compliance calendar triggered (future)
}

// Service Request Status
enum RequestStatus {
  PENDING           // Awaiting review
  UNDER_REVIEW      // Being reviewed
  APPROVED          // Approved, converting to Service
  REJECTED          // Rejected with reason
  CANCELLED         // Cancelled by client
  CONVERTED         // Successfully converted to Service
}

// Request Urgency
enum RequestUrgency {
  LOW
  NORMAL
  HIGH
  URGENT
}

E4. Enums to Expand
ServiceStatus (5 → 12)
prisma// CURRENT (5 statuses):
enum ServiceStatus {
  PENDING
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
  CANCELLED
}

// NEW (12 statuses):
enum ServiceStatus {
  // Creation Phase
  PENDING               // Just created, not assigned
  
  // Assignment Phase
  ASSIGNED              // Assigned to PM/TM, work not started
  
  // Execution Phase
  IN_PROGRESS           // Work actively being done
  WAITING_FOR_CLIENT    // Waiting for client input/documents
  ON_HOLD               // Temporarily paused
  
  // Review Phase
  UNDER_REVIEW          // Submitted for quality check
  CHANGES_REQUESTED     // Reviewer found issues
  
  // Completion Phase
  COMPLETED             // All work done, approved
  DELIVERED             // Sent to client
  
  // Billing Phase
  INVOICED              // Invoice generated
  
  // Final States
  CLOSED                // Fully done, paid
  CANCELLED             // Cancelled
}
```

---

## E5. Complete Schema Code

I'll provide this in the Antigravity prompt as it's quite long.

---

## E6. Migration Strategy
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MIGRATION STRATEGY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Add New Models & Enums                                             │
│  ═══════════════════════════════                                            │
│  • Add ServiceOrigin, RequestStatus, RequestUrgency enums                   │
│  • Add ClientPMAssignment model                                             │
│  • Add ServiceRequest model                                                 │
│  • Add RequestAttachment model                                              │
│  • Add ServiceAssignment model                                              │
│  • Add ServiceStatusHistory model                                           │
│                                                                             │
│  STEP 2: Modify Service Model                                               │
│  ═════════════════════════════                                              │
│  • Add new fields (origin, financialYear, currentAssigneeId, etc.)          │
│  • Keep existing fields                                                     │
│  • Add new relations                                                        │
│                                                                             │
│  STEP 3: Expand ServiceStatus Enum                                          │
│  ════════════════════════════════                                           │
│  • Add new statuses: ASSIGNED, WAITING_FOR_CLIENT, ON_HOLD,                 │
│    CHANGES_REQUESTED, DELIVERED, INVOICED, CLOSED                           │
│  • Keep existing: PENDING, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CANCELLED  │
│                                                                             │
│  STEP 4: Migrate Client-PM Relationship                                     │
│  ═══════════════════════════════════════                                    │
│  • For each Client with managedBy set:                                      │
│    - Create ClientPMAssignment record                                       │
│    - Set role = "PRIMARY"                                                   │
│  • Then remove managedBy field from Client model                            │
│                                                                             │
│  STEP 5: Modify ProjectManager & Client Models                              │
│  ═════════════════════════════════════════════                              │
│  • Add new relations                                                        │
│  • Remove managedBy from Client                                             │
│                                                                             │
│  COMMANDS:                                                                  │
│  ═════════                                                                  │
│  1. npx prisma migrate dev --name add_service_workflow_models               │
│  2. Run data migration script for existing Client-PM relationships          │
│  3. npx prisma migrate dev --name remove_managed_by_field                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

PART F: API ENDPOINTS
[Continued in next section due to length...]

This document is getting very long. Let me provide a summary and then the implementation prompt.

📋 SUMMARY: WHAT WE'RE IMPLEMENTING
Core Features:
#FeatureDescription1Client-PM Many-to-ManyMultiple PMs per client via ClientPMAssignment2Service RequestsClient can request services, PM/Admin approves3Service AssignmentAssign service to any PM/TM4Chain DelegationPM→TM→TM with full audit trail512 Service StatusesComplete lifecycle tracking6Action-Based Status UpdatesClick action → status changes7Status HistoryFull audit log of all changes8Task ManagementComplete the existing Task model
Database Changes:
TypeItemsNew ModelsClientPMAssignment, ServiceRequest, RequestAttachment, ServiceAssignment, ServiceStatusHistoryModified ModelsClient (remove managedBy), Service (add fields), ProjectManager (add relations)New EnumsServiceOrigin, RequestStatus, RequestUrgencyExpanded EnumsServiceStatus (5 → 12)
Permission Rules:
RoleAccess LevelSuper AdminNO RESTRICTIONS - Can do anythingAdminNO RESTRICTIONS - Can do anythingProject ManagerScoped to own clients/servicesTeam MemberOnly assigned services/tasksClientOnly own services

✅ FINAL CONFIRMATION
Is this COMPLETE and CORRECT?
I have covered:

✅ Project Foundation (Tech stack, current status)
✅ Role Hierarchy (5 roles, permissions)
✅ CA Firm Domain Knowledge (Services, Documents, Calendar)
✅ Service Workflow (12 statuses, transitions)
✅ Status Update Strategies (Action-based)
✅ Client-PM Many-to-Many relationship
✅ Service Assignment & Delegation
✅ Chain Delegation with Audit
✅ Database Schema Changes
✅ Real-world Examples