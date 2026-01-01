# Document Linking and Category-Based Filtering Implementation

## Overview
This document describes the implementation of the category-based document linking and two-step upload selection feature for the CA Firm Management System.

---

## Implementation Summary

### 1. Backend Changes

#### `document-slots.service.ts` - New Functions Added

**`getDocumentMasterLibrary()`**
- Fetches all active documents from `DocumentMaster` table
- Groups documents by category (12 categories)
- Sorts categories in predefined order
- Returns structured data for frontend two-step selection

**`getCategoryHints()`**
- Returns category-specific hints/examples for UI display
- Examples: "Identity: PAN Card, Aadhaar, Passport, Voter ID, DSC..."

#### `document-slots.routes.ts` - New Endpoint

**`GET /api/document-slots/document-library`**
- Returns DocumentMaster library grouped by category
- Includes category hints for UI
- Authenticated endpoint

---

### 2. Frontend Changes

#### `RequestDocumentsDialog.tsx` - Category-Based Filtering

**Changes Made:**
1. Added `documentTypeToCategory` mapping (26+ document types → categories)
2. Updated `findMatchingDoc()` function for category-based matching
3. Added `getFilteredDocsForSlot()` function to filter client documents by slot's category
4. Updated `PopoverContent` to display only filtered documents
5. Expanded category selection dropdown to 12 categories

**How Filtering Works:**
```
Slot Category: "Identity"
→ Filter client documents where documentType maps to "Identity"
→ Show: PAN_CARD, AADHAR_CARD, PASSPORT, VOTER_ID, DSC, PASSPORT_PHOTO
→ Hide: BANK_STATEMENT (Financial), FORM_16 (Tax), etc.
```

---

#### `ClientDocumentSlots.tsx` - Slot-Based Upload Improvements

**Changes Made:**
1. Added `uploadSlotCategory` state to track category
2. Updated upload button to set category when opening modal
3. Upload dialog now shows category info
4. Document type is auto-set from slot name (converted to code format)

---

#### `client/documents/page.tsx` - Two-Step Upload Selection

**Changes Made:**
1. Removed hardcoded `DOCUMENT_TYPES` array (14 items)
2. Added interfaces for DocumentMaster data
3. Added `documentLibrary` state to fetch from API
4. Added `fetchDocumentLibrary()` function
5. Updated upload modal with two-step selection:
   - Step 1: Select Category (12 options)
   - Step 2: Select Document (filtered by category)
6. Added category hints below selection
7. Updated validation to require both category and document

---

#### `services/new/page.tsx` - Custom Document Category Selection

**Changes Made:**
1. Added `customDocumentCategory` state
2. Updated `addCustomDocument()` function to use selected category
3. Updated UI with category dropdown (12 categories)
4. Reset category to "Other" after adding document

---

## 12 Document Categories

| Category | Example Documents |
|----------|-------------------|
| Identity | PAN Card, Aadhaar, Passport, Voter ID, DSC |
| Financial | Bank Statements, Balance Sheet, P&L |
| Tax | Form 16, Form 26AS, AIS/TIS, ITR |
| GST | GSTR Returns, GSTIN Certificate |
| Business | Incorporation Certificate, MOA/AOA |
| Capital Gains | Demat Statement, MF Statement |
| Professional | Fee Receipts, Client Contracts |
| Address Proof | Electricity Bill, NOC from Landlord |
| Foreign/NRI | Foreign Income Docs, FEMA |
| Payroll | Salary Register, PF/ESI Challans |
| Import/Export | IEC Certificate, Shipping Bill |
| Other | Power of Attorney, Affidavit |

---

## Data Flow

### Before Implementation (Bug)
```
1. Service created with slots (category: "Identity")
2. Client uploads document (type: "OTHER" - no matching type)
3. PM opens Request Documents
4. Link dropdown shows ALL client documents
5. No category-based filtering → confusion
```

### After Implementation (Fixed)
```
1. Service created with slots (category: "Identity")
2. Client uploads document:
   - Select Category: "Identity"
   - Select Document: "PAN Card"
   - documentType saved as "PAN_CARD"
3. PM opens Request Documents
4. Link dropdown shows ONLY Identity documents
5. Category-based filtering → accurate matching ✅
```

---

## API Response Format

### GET /api/document-slots/document-library

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Identity",
        "documents": [
          { "id": "...", "code": "PAN_CARD", "name": "PAN Card", "description": "..." },
          { "id": "...", "code": "AADHAR_CARD", "name": "Aadhaar Card", "description": "..." }
        ]
      },
      {
        "category": "Financial",
        "documents": [...]
      }
    ],
    "hints": {
      "Identity": "PAN Card, Aadhaar, Passport, Voter ID, DSC...",
      "Financial": "Bank Statements, Balance Sheet, P&L, Loan Documents..."
    }
  }
}
```

---

## Testing Checklist

- [ ] **Client Documents Page**: Two-step upload works
- [ ] **Service Detail Page**: Slot-based upload auto-fills category
- [ ] **Request Documents Dialog**: Filtered documents by category
- [ ] **Service Creation**: Custom documents get proper category
- [ ] **Document Linking**: Only matching documents appear
- [ ] **API**: Document library endpoint returns data

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/api/src/modules/document-slots/document-slots.service.ts` | Added `getDocumentMasterLibrary()`, `getCategoryHints()` |
| `apps/api/src/modules/document-slots/document-slots.routes.ts` | Added `/document-library` endpoint |
| `apps/web/components/services/RequestDocumentsDialog.tsx` | Category filtering, expanded categories |
| `apps/web/components/services/ClientDocumentSlots.tsx` | Category tracking in upload |
| `apps/web/app/(client)/client/documents/page.tsx` | Two-step upload selection |
| `apps/web/app/(project-manager)/project-manager/services/new/page.tsx` | Custom document category selection |

---

## Date Completed
December 27, 2025
