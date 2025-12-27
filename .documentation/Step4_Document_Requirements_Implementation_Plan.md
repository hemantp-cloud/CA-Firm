# Step 4: Document Requirements Checklist - Complete Implementation Plan

## 📋 Overview

This document contains the complete implementation plan for **Step 4: Required Documents** in the "Add New Service" page (`/project-manager/services/new`).

**Date Created**: December 19, 2024  
**Status**: Ready for Implementation

---

## 🎯 Goals

1. Provide a comprehensive document selection system for each service
2. Support both System Services and Custom Services
3. Allow users to mark documents as Required/Optional
4. Enable adding custom documents on-the-fly
5. Show summary of selected documents before service creation

---

## 📊 Key Features Summary

| # | Feature | Description |
|---|---------|-------------|
| 1 | **No Checkbox Restriction** | All checkboxes freely editable (check/uncheck any document) |
| 2 | **Universal Document Library** | Master list of ALL possible Indian taxation documents |
| 3 | **Search Functionality** | Search documents like client search in Step 1 |
| 4 | **Suggested Documents** | Pre-checked documents for System Services |
| 5 | **Custom Document Input** | "+ Add Custom Document" option |
| 6 | **Required/Optional Toggle** | Mark selected documents as Required or Optional |
| 7 | **Selection Summary** | Real-time summary of all selected documents |
| 8 | **Client Portal Display** | Required/Optional sections visible to client |

---

## 🏗️ Database Schema Changes

### A. New Table: `document_master` (Universal Document Library)

```sql
CREATE TABLE "document_master" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,                    -- e.g., "PAN Card", "Form 16"
    "code" TEXT NOT NULL UNIQUE,             -- e.g., "PAN_CARD", "FORM_16"
    "category" TEXT NOT NULL,                -- "Identity", "Financial", "Tax", "Business"
    "description" TEXT,                      -- Optional description
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "document_master_pkey" PRIMARY KEY ("id")
);
```

### B. Updated Table: `service_document_mapping` (Service-Specific Documents)

```sql
CREATE TABLE "service_document_mapping" (
    "id" TEXT NOT NULL,
    "serviceTypeId" TEXT,                    -- FK to service_type_master
    "serviceSubTypeId" TEXT,                 -- FK to service_sub_type (optional)
    "documentMasterId" TEXT NOT NULL,        -- FK to document_master
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,  -- Pre-marked as required
    "displayOrder" INTEGER DEFAULT 0,
    "firmId" TEXT,                           -- null = system, firmId = custom
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "service_document_mapping_pkey" PRIMARY KEY ("id")
);
```

### C. Service Table Update: Store Selected Documents

When creating a service, store selected documents in the `service` record:

```typescript
// In services table, add/update:
{
  requiredDocuments: [
    { 
      documentId: "doc_id_1",  // null if custom
      name: "PAN Card", 
      category: "Identity",
      isRequired: true,        // Required or Optional
      isCustom: false          // From library or custom-added
    },
    { 
      documentId: null,
      name: "Property Sale Deed",  // Custom document
      category: "Custom",
      isRequired: false,
      isCustom: true
    }
  ]
}
```

---

## 📚 Universal Document Library (Seed Data)

All documents that should be in the system database:

### Identity Documents
| Code | Name | Description |
|------|------|-------------|
| PAN_CARD | PAN Card | Permanent Account Number card |
| AADHAR_CARD | Aadhar Card | Unique Identification Number |
| PASSPORT | Passport | For NRI/foreign income cases |
| VOTER_ID | Voter ID Card | Identity proof |
| DRIVING_LICENSE | Driving License | Identity proof |
| DSC | Digital Signature Certificate | For e-filing |

### Financial Documents
| Code | Name | Description |
|------|------|-------------|
| BANK_STATEMENTS | Bank Statements (all accounts) | All savings/current accounts |
| BANK_STATEMENTS_BUSINESS | Bank Statements (Business) | Business account statements |
| CANCELLED_CHEQUE | Cancelled Cheque | For bank verification |
| PROFIT_LOSS | Profit & Loss Account | For business income |
| BALANCE_SHEET | Balance Sheet | For business income |
| CASH_FLOW | Cash Flow Statement | For companies |
| STOCK_STATEMENT | Stock Statement | Inventory details |
| FIXED_ASSET_REGISTER | Fixed Asset Register | Asset details |
| LOAN_DOCUMENTS | Loan Documents | All loan agreements |
| HOME_LOAN_CERTIFICATE | Home Loan Interest Certificate | Section 24/80EE |
| EDUCATION_LOAN_CERTIFICATE | Education Loan Interest Certificate | Section 80E |
| PROPERTY_DOCUMENTS | Property Documents | For property transactions |
| RENT_RECEIPTS | Rent Receipts | For HRA exemption |
| RENT_AGREEMENT | Rent Agreement | For HRA exemption |

### Tax Documents
| Code | Name | Description |
|------|------|-------------|
| FORM_16 | Form 16 (from employer) | TDS certificate for salary |
| FORM_16A | Form 16A | TDS on non-salary income |
| FORM_26AS | Form 26AS | Annual Tax Statement |
| AIS | Annual Information Statement | Income & transaction details |
| PREVIOUS_ITR | Previous Year ITR | For reference |
| ITR_ACKNOWLEDGMENT | ITR Acknowledgment | Previous filing proof |
| INVESTMENT_PROOFS_80C | Investment Proofs (80C) | PPF, ELSS, LIC, NSC, etc. |
| INVESTMENT_PROOFS_80D | Health Insurance Premium (80D) | Medical insurance receipts |
| INVESTMENT_PROOFS_80E | Education Loan Interest (80E) | Education loan certificate |
| INVESTMENT_PROOFS_80G | Donation Receipts (80G) | Charitable donations |
| TDS_CERTIFICATES | TDS Certificates | All TDS certificates |
| ADVANCE_TAX_CHALLANS | Advance Tax Challans | Self-assessment tax paid |
| GST_RETURNS | GST Returns (all months) | GSTR-1, GSTR-3B |
| TDS_CHALLANS | TDS Challan Details | Payments made |

### Business Documents
| Code | Name | Description |
|------|------|-------------|
| INCORPORATION_CERTIFICATE | Certificate of Incorporation | Company registration |
| MOA_AOA | MOA / AOA | Memorandum & Articles |
| PARTNERSHIP_DEED | Partnership Deed | For partnership firms |
| LLP_AGREEMENT | LLP Agreement | For LLPs |
| GSTIN_CERTIFICATE | GSTIN Certificate | GST registration |
| TRADE_LICENSE | Trade License | Business license |
| SHOP_ESTABLISHMENT | Shop & Establishment Certificate | Registration proof |
| UDYAM_CERTIFICATE | Udyam Registration Certificate | MSME registration |
| BOARD_RESOLUTION | Board Resolution | For company decisions |
| AGM_MINUTES | AGM Minutes | Annual General Meeting |
| DIRECTOR_DETAILS | Director KYC Details | DIR-3 KYC |
| SHAREHOLDER_DETAILS | Shareholding Pattern | Ownership details |

### Professional Documents
| Code | Name | Description |
|------|------|-------------|
| PROFESSIONAL_RECEIPTS | Professional Receipts | Fee receipts |
| CLIENT_CONTRACTS | Client Contracts/Agreements | Service agreements |
| FREELANCE_INVOICES | Freelance Invoices | For freelancers |

### Capital Gains Documents
| Code | Name | Description |
|------|------|-------------|
| STOCK_TRADING_STATEMENT | Stock Trading Statement | From broker |
| MUTUAL_FUND_STATEMENT | Mutual Fund Statement | CAS statement |
| PROPERTY_SALE_DEED | Property Sale Deed | For property sale |
| PROPERTY_PURCHASE_DEED | Property Purchase Deed | For property purchase |
| CAPITAL_GAIN_STATEMENT | Capital Gain Statement | Computation sheet |
| COST_INFLATION_INDEX | Cost Inflation Index Details | For indexed cost |

### Other Documents
| Code | Name | Description |
|------|------|-------------|
| ELECTRICITY_BILL | Electricity Bill | Address proof |
| NOC_LANDLORD | NOC from Landlord | For office address |
| PHOTOS | Passport Size Photos | For registrations |
| SIGNATURE_SPECIMEN | Signature Specimen | For bank/registration |

---

## 🗂️ Service-Document Mapping (Pre-Suggestions)

### ITR-1 (Sahaj) - Salaried Individual
| Document | Required? |
|----------|-----------|
| PAN Card | ✅ Required |
| Aadhar Card | ✅ Required |
| Form 16 | ✅ Required |
| Bank Statements | ✅ Required |
| Form 26AS / AIS | ✅ Required |
| Investment Proofs (80C) | Optional |
| Health Insurance Premium (80D) | Optional |
| Education Loan Interest (80E) | Optional |
| Rent Receipts | Optional |
| Home Loan Certificate | Optional |
| Previous Year ITR | Optional |

### ITR-2 - Capital Gains/Foreign Income
| Document | Required? |
|----------|-----------|
| All ITR-1 documents | ✅ Required |
| Stock Trading Statement | ✅ Required |
| Mutual Fund Statement | ✅ Required |
| Capital Gain Statement | ✅ Required |
| Property Sale/Purchase Deed | Optional |
| Foreign Income Documents | Optional |

### ITR-3 - Business/Profession
| Document | Required? |
|----------|-----------|
| PAN Card | ✅ Required |
| Aadhar Card | ✅ Required |
| Profit & Loss Account | ✅ Required |
| Balance Sheet | ✅ Required |
| Bank Statements (Business) | ✅ Required |
| GST Returns | ✅ Required |
| Form 26AS / AIS | ✅ Required |
| Stock Statement | Optional |
| Fixed Asset Register | Optional |
| Loan Documents | Optional |
| TDS Certificates | Optional |
| Previous Year ITR | Optional |

### ITR-4 (Sugam) - Presumptive Taxation
| Document | Required? |
|----------|-----------|
| PAN Card | ✅ Required |
| Aadhar Card | ✅ Required |
| Bank Statements | ✅ Required |
| Turnover Summary | ✅ Required |
| GST Returns (if registered) | Optional |
| Previous Year ITR | Optional |

### GST Registration
| Document | Required? |
|----------|-----------|
| PAN Card | ✅ Required |
| Aadhar Card | ✅ Required |
| Passport Photo | ✅ Required |
| Business Address Proof | ✅ Required |
| NOC from Landlord | ✅ Required |
| Cancelled Cheque | ✅ Required |
| Partnership Deed / MOA AOA | Optional |

### GST Return (GSTR-1, GSTR-3B)
| Document | Required? |
|----------|-----------|
| Sales Register (with HSN) | ✅ Required |
| Purchase Register (with GSTIN) | ✅ Required |
| Credit/Debit Notes | Optional |
| E-way Bills | Optional |
| Bank Statement | Optional |

### TDS Return
| Document | Required? |
|----------|-----------|
| TAN | ✅ Required |
| Deductee PAN Details | ✅ Required |
| Payment Details with Dates | ✅ Required |
| TDS Challan Details | ✅ Required |
| Form 16/16A copies | Optional |

### Company Incorporation
| Document | Required? |
|----------|-----------|
| DSC (all directors) | ✅ Required |
| Director PAN Cards | ✅ Required |
| Director Aadhar Cards | ✅ Required |
| Registered Office Proof | ✅ Required |
| NOC from Landlord | ✅ Required |
| Passport Photos | ✅ Required |
| Utility Bill | Optional |

### ROC Annual Filing (AOC-4, MGT-7)
| Document | Required? |
|----------|-----------|
| Audited Financial Statements | ✅ Required |
| Director Details | ✅ Required |
| Shareholding Pattern | ✅ Required |
| AGM Minutes | ✅ Required |
| Board Resolution | Optional |
| Auditor Appointment Letter | Optional |

---

## 🖥️ Frontend Implementation

### A. UI Components Structure

```
Step 4: Required Documents
├── SuggestedDocumentsSection (only for System Services)
│   └── DocumentRow[] (pre-checked based on service type)
├── UniversalLibrarySection
│   ├── SearchInput
│   ├── DocumentsByCategory
│   │   ├── Identity Documents
│   │   ├── Financial Documents
│   │   ├── Tax Documents
│   │   ├── Business Documents
│   │   └── Other Documents
│   └── CustomDocumentsSection
│       ├── CustomDocumentRow[] (user-added)
│       └── AddCustomDocumentButton
└── SelectionSummarySection (only when ≥1 document selected)
    └── SelectedDocumentRow[]
```

### B. State Management

```typescript
// State for Step 4
interface DocumentSelectionState {
  // From Universal Library
  selectedDocuments: {
    documentId: string;
    name: string;
    category: string;
    isRequired: boolean;  // Required or Optional toggle
    isCustom: false;
  }[];
  
  // Custom Documents (not saved to DB)
  customDocuments: {
    id: string;          // Temporary ID (uuid)
    name: string;
    isRequired: boolean;
    isCustom: true;
  }[];
  
  // Search
  searchQuery: string;
  
  // All available documents (from API)
  universalLibrary: DocumentMaster[];
  
  // Suggested for current service (from API)
  suggestedDocuments: ServiceDocumentMapping[];
}
```

### C. UI Flow

#### Scenario 1: System Service Selected (e.g., ITR-1)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ④ Required Documents                                                        │
│  Select documents needed for this service                                    │
│                                                                              │
│  ┌─ SUGGESTED FOR ITR-1 (Sahaj) ────────────────────────────────────────────┐│
│  │                              [Select] [Required/Optional]                ││
│  │ ☑️ PAN Card                    ✓      [ Required ▼ ]     [Identity]     ││
│  │ ☑️ Aadhar Card                 ✓      [ Required ▼ ]     [Identity]     ││
│  │ ☑️ Form 16                     ✓      [ Required ▼ ]     [Tax]          ││
│  │ ☑️ Bank Statements             ✓      [ Required ▼ ]     [Financial]    ││
│  │ ☑️ Form 26AS / AIS             ✓      [ Required ▼ ]     [Tax]          ││
│  │ ☐ Investment Proofs (80C)                                [Tax]          ││
│  │ ☐ Health Insurance (80D)                                 [Tax]          ││
│  │ ☐ Rent Receipts                                          [Financial]    ││
│  │ ☐ Home Loan Certificate                                  [Financial]    ││
│  │ ☐ Previous Year ITR                                      [Tax]          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─ ADD MORE DOCUMENTS ─────────────────────────────────────────────────────┐│
│  │ 🔍 [ Search documents...                                       ]         ││
│  │                                                                           ││
│  │ ── Other Identity Documents ──                                            ││
│  │ ☐ Passport                                                   [Identity] ││
│  │ ☐ Digital Signature Certificate                              [Identity] ││
│  │                                                                           ││
│  │ ── Other Financial Documents ──                                           ││
│  │ ☐ Profit & Loss Account                                      [Financial]││
│  │ ☐ Balance Sheet                                              [Financial]││
│  │ ☐ Stock Statement                                            [Financial]││
│  │ ... (more documents from universal library)                               ││
│  │                                                                           ││
│  │ ┌─ CUSTOM DOCUMENTS ────────────────────────────────────────────────────┐││
│  ││ (No custom documents added)                                            │││
│  │└────────────────────────────────────────────────────────────────────────┘││
│  │                                                                           ││
│  │ [+ Add Custom Document]                                                   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─ ✅ SELECTED DOCUMENTS (5) ──────────────────────────────────────────────┐│
│  │                                                                           ││
│  │  📄 PAN Card                 [Identity]              🔴 Required         ││
│  │  📄 Aadhar Card              [Identity]              🔴 Required         ││
│  │  📄 Form 16                  [Tax]                   🔴 Required         ││
│  │  📄 Bank Statements          [Financial]             🔴 Required         ││
│  │  📄 Form 26AS / AIS          [Tax]                   🔴 Required         ││
│  │                                                                           ││
│  │  Client will see: 5 Required, 0 Optional documents                       ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Scenario 2: Custom Service Selected

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ④ Required Documents                                                        │
│  Select documents needed for this service                                    │
│                                                                              │
│  ┌─ SELECT DOCUMENTS FROM LIBRARY ──────────────────────────────────────────┐│
│  │ 🔍 [ Search documents...                                       ]         ││
│  │                                                                           ││
│  │ ── Identity Documents ──                                                  ││
│  │ ☐ PAN Card                                                   [Identity] ││
│  │ ☐ Aadhar Card                                                [Identity] ││
│  │ ☐ Passport                                                   [Identity] ││
│  │ ☐ Digital Signature Certificate                              [Identity] ││
│  │                                                                           ││
│  │ ── Financial Documents ──                                                 ││
│  │ ☐ Bank Statements                                            [Financial]││
│  │ ☐ Profit & Loss Account                                      [Financial]││
│  │ ☐ Balance Sheet                                              [Financial]││
│  │ ☐ Stock Statement                                            [Financial]││
│  │ ... (all documents from universal library)                                ││
│  │                                                                           ││
│  │ ┌─ CUSTOM DOCUMENTS ────────────────────────────────────────────────────┐││
│  ││ (No custom documents added)                                            │││
│  │└────────────────────────────────────────────────────────────────────────┘││
│  │                                                                           ││
│  │ [+ Add Custom Document]                                                   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  (No summary shown - no documents selected yet)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### D. Add Custom Document Flow

```
1. User clicks [+ Add Custom Document]

2. Input appears:
   ┌─ ADD CUSTOM DOCUMENT ────────────────────────────────────────┐
   │ Document Name: [ _________________________________ ]         │
   │                                              [Cancel] [Add]  │
   └──────────────────────────────────────────────────────────────┘

3. After adding "Property Sale Deed":
   ┌─ CUSTOM DOCUMENTS ───────────────────────────────────────────┐
   │ ☑️ Property Sale Deed    [ Required ▼ ]  [Custom]  [× Remove]│
   └──────────────────────────────────────────────────────────────┘

4. Custom document appears in Summary:
   ┌─ ✅ SELECTED DOCUMENTS (6) ──────────────────────────────────┐
   │  📄 PAN Card                 [Identity]      🔴 Required     │
   │  📄 Aadhar Card              [Identity]      🔴 Required     │
   │  ...                                                         │
   │  📄 Property Sale Deed       [Custom]        ⚪ Optional     │
   └──────────────────────────────────────────────────────────────┘
```

### E. Required/Optional Toggle

```typescript
// Dropdown options
const requirementOptions = [
  { value: 'required', label: 'Required', color: 'red' },
  { value: 'optional', label: 'Optional', color: 'gray' }
];

// Only enabled when document is checked
// Default: 
//   - Suggested documents with isMandatory=true → Required
//   - All other documents → Optional
```

---

## 🔌 API Endpoints

### 1. GET `/api/document-master` - Universal Library
```typescript
// Response
{
  success: true,
  data: [
    {
      id: "doc_123",
      name: "PAN Card",
      code: "PAN_CARD",
      category: "Identity",
      description: "Permanent Account Number card"
    },
    // ... all documents
  ]
}
```

### 2. GET `/api/service-config/suggested-documents?serviceTypeId=xxx`
```typescript
// Response - Documents pre-mapped to this service type
{
  success: true,
  data: [
    {
      documentId: "doc_123",
      documentName: "PAN Card",
      category: "Identity",
      isMandatory: true
    },
    {
      documentId: "doc_456",
      documentName: "Form 16",
      category: "Tax",
      isMandatory: true
    },
    // ... suggested documents for this service
  ]
}
```

### 3. POST `/api/services` - Create Service (Updated)
```typescript
// Request body includes selected documents
{
  clientId: "...",
  serviceTypeId: "...",
  // ... other fields
  
  requiredDocuments: [
    {
      documentMasterId: "doc_123",  // null if custom
      name: "PAN Card",
      category: "Identity",
      isRequired: true,
      isCustom: false
    },
    {
      documentMasterId: null,
      name: "Property Sale Deed",
      category: "Custom",
      isRequired: false,
      isCustom: true
    }
  ]
}
```

---

## 📱 Client Portal Display

When client views the service, documents are shown in two sections:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 Documents Required for: ITR-1 Filing (AY 2025-26)                        │
│                                                                              │
│  ┌─ 🔴 REQUIRED DOCUMENTS ──────────────────────────────────────────────────┐│
│  │  These documents must be submitted                                       ││
│  │                                                                           ││
│  │  ⬜ PAN Card                                           [Upload]          ││
│  │  ⬜ Aadhar Card                                        [Upload]          ││
│  │  ⬜ Form 16                                            [Upload]          ││
│  │  ⬜ Bank Statements                                    [Upload]          ││
│  │  ⬜ Form 26AS / AIS                                    [Upload]          ││
│  │                                                                           ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─ ⚪ OPTIONAL DOCUMENTS ──────────────────────────────────────────────────┐│
│  │  Submit if applicable to your case                                       ││
│  │                                                                           ││
│  │  ⬜ Home Loan Certificate                              [Upload]          ││
│  │  ⬜ Rent Receipts                                      [Upload]          ││
│  │  ⬜ Property Sale Deed                                 [Upload]          ││
│  │                                                                           ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Steps

### Phase 1: Database Setup
- [ ] Create `document_master` table with Prisma schema
- [ ] Create seed script with all universal documents
- [ ] Update `service_document_mapping` table
- [ ] Create seed script for service-document mappings
- [ ] Run migrations

### Phase 2: API Development
- [ ] Create `GET /api/document-master` endpoint
- [ ] Create `GET /api/service-config/suggested-documents` endpoint
- [ ] Update `POST /api/services` to accept `requiredDocuments`
- [ ] Update service model to store document requirements

### Phase 3: Frontend - Step 4 UI
- [ ] Create `DocumentSelectionSection` component
- [ ] Create `SuggestedDocuments` component
- [ ] Create `UniversalLibrary` component with search
- [ ] Create `CustomDocumentInput` component
- [ ] Create `DocumentRow` component with Required/Optional toggle
- [ ] Create `SelectionSummary` component
- [ ] Integrate with service creation form

### Phase 4: Client Portal
- [ ] Update client service view to show Required/Optional sections
- [ ] Display documents for upload with proper categorization

### Phase 5: Testing
- [ ] Test System Service flow
- [ ] Test Custom Service flow
- [ ] Test search functionality
- [ ] Test custom document addition
- [ ] Test Required/Optional toggle
- [ ] Test client portal display

---

## ✅ Acceptance Criteria

1. **Checkbox Freedom**: All document checkboxes can be freely checked/unchecked
2. **System Service**: Shows suggested documents (pre-checked) + full library
3. **Custom Service**: Shows only universal library (nothing pre-checked)
4. **Search**: Can search documents by name
5. **Custom Documents**: Can add custom documents (not saved to DB)
6. **Required/Optional**: Can mark each selected document as Required or Optional
7. **Summary**: Shows selected documents only when ≥1 document selected
8. **Client View**: Shows Required and Optional sections separately

---

## 🔗 Related Files

- **Frontend**: `apps/web/app/(project-manager)/project-manager/services/new/page.tsx`
- **API**: `apps/api/src/modules/service-config/service-config.routes.ts`
- **Database**: `apps/api/prisma/schema.prisma`
- **Seed**: `apps/api/prisma/seed-service-config.ts`

---

**Document Version**: 1.0  
**Last Updated**: December 19, 2024
