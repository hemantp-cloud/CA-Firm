# Multi-Purpose Document Strategy - Brainstorm

**Date:** December 30, 2025  
**Problem:** Documents can serve multiple purposes, but current system uses 1:1 mapping

---

## Problem Statement

### Current Limitation
```
Document Type → Single Category (1:1 mapping)

Example:
  Aadhar Card → "Identity"
  PAN Card → "Tax"
  Bank Statement → "Financial"
```

### Real-World Reality
```
Document Type → Multiple Purposes (1:Many mapping)

Example:
  Aadhar Card → [Identity, Address Proof, Photo ID, Age Proof, KYC, DOB Proof]
  PAN Card → [Identity, Tax ID, KYC, Name Proof]
  Passport → [Identity, Address Proof, Photo ID, Age Proof, Travel, DOB Proof]
  Bank Statement → [Financial, Address Proof, Income Proof]
  Driving License → [Identity, Address Proof, Photo ID, Age Proof]
  Utility Bill → [Address Proof Only]
```

### Impact on Auto-Matching
```
Scenario:
  PM creates slot: "Provide Address Proof"
  Client has uploaded: Aadhar Card (categorized as "Identity")
  
Current System: ❌ No match (different categories)
Expected: ✅ Should match (Aadhar IS valid address proof)
```

---

## Proposed Solution: Purpose-Based Document System

### Core Concept

**Replace single "Category" with multiple "Purposes/Tags"**

```typescript
// NEW: Document Purpose Mapping
const DOCUMENT_PURPOSES: Record<string, string[]> = {
  // Identity Documents
  'AADHAR_CARD': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF', 'KYC', 'DOB_PROOF'],
  'PAN_CARD': ['IDENTITY', 'TAX_ID', 'KYC', 'NAME_PROOF'],
  'PASSPORT': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF', 'DOB_PROOF', 'TRAVEL'],
  'VOTER_ID': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF'],
  'DRIVING_LICENSE': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF'],
  
  // Financial Documents
  'BANK_STATEMENT': ['FINANCIAL', 'ADDRESS_PROOF', 'INCOME_PROOF'],
  'CANCELLED_CHEQUE': ['FINANCIAL', 'BANK_DETAILS'],
  'SALARY_SLIP': ['FINANCIAL', 'INCOME_PROOF', 'EMPLOYMENT_PROOF'],
  'ITR_COPY': ['TAX', 'INCOME_PROOF', 'FINANCIAL'],
  
  // Address Documents
  'UTILITY_BILL': ['ADDRESS_PROOF'],
  'RENT_AGREEMENT': ['ADDRESS_PROOF', 'RESIDENCE_PROOF'],
  'ELECTRICITY_BILL': ['ADDRESS_PROOF'],
  'GAS_BILL': ['ADDRESS_PROOF'],
  
  // Business Documents  
  'GST_CERTIFICATE': ['BUSINESS', 'TAX', 'KYC'],
  'INCORPORATION_CERT': ['BUSINESS', 'IDENTITY', 'KYC'],
  'PARTNERSHIP_DEED': ['BUSINESS', 'LEGAL'],
  
  // Photos
  'PASSPORT_PHOTO': ['PHOTO_ID', 'KYC'],
  
  // Signature
  'SIGNATURE_SPECIMEN': ['KYC', 'BANK_REQUIREMENT'],
}
```

---

## Implementation Approach

### Option A: Add Purpose Tags to Documents (Recommended ⭐)

**Schema Change:**
```prisma
model Document {
  // ... existing fields
  documentType    String?
  category        String?       // Keep for backward compatibility
  purposes        String[]      // NEW: Array of purpose tags
}
```

**Auto-Populate Purposes on Upload:**
```typescript
// When document is uploaded, auto-set purposes based on documentType
const purposes = DOCUMENT_PURPOSES[documentType] || ['OTHER'];
await prisma.document.create({
  data: {
    ...documentData,
    purposes: purposes,
  }
});
```

**Smart Matching in PM Link Dropdown:**
```typescript
// Slot requires ADDRESS_PROOF
const requiredPurpose = slot.requiredPurpose; // 'ADDRESS_PROOF'

// Find all documents that have this purpose
const matchingDocs = clientDocs.filter(doc => 
  doc.purposes.includes(requiredPurpose)
);

// Results: Aadhar, Passport, Voter ID, Bank Statement, Utility Bill, etc.
```

---

### Option B: Slot-Level Purpose Requirement

**Enhanced Document Slot:**
```prisma
model ServiceDocumentSlot {
  // ... existing fields
  documentName     String       // "Address Proof of Director"
  requiredPurpose  String?      // "ADDRESS_PROOF" ← NEW
  acceptedTypes    String[]     // ["AADHAR_CARD", "PASSPORT", ...] ← NEW
}
```

**PM Creates Slot with Purpose:**
```
Slot Name: "Address Proof of Director"
Required Purpose: ADDRESS_PROOF
Accepted Document Types: (auto-populated or manually selected)
  ☑️ Aadhar Card
  ☑️ Passport
  ☑️ Voter ID
  ☑️ Driving License
  ☑️ Bank Statement
  ☑️ Utility Bill
  ☑️ Rent Agreement
```

**Auto-Matching Logic:**
```typescript
const isMatch = (doc, slot) => {
  // Option 1: Check by purpose
  if (slot.requiredPurpose) {
    return DOCUMENT_PURPOSES[doc.documentType]?.includes(slot.requiredPurpose);
  }
  
  // Option 2: Check by accepted types
  if (slot.acceptedTypes?.length > 0) {
    return slot.acceptedTypes.includes(doc.documentType);
  }
  
  // Fallback: Name/category matching
  return doc.documentType === slot.documentName.toUpperCase().replace(/\s/g, '_');
};
```

---

## Recommended Implementation Plan

### Phase 1: Add Document Purpose Knowledge Base
1. Create `DOCUMENT_PURPOSES` constant file
2. Add to both backend and frontend
3. No schema changes needed initially

### Phase 2: Update Auto-Matching Logic
1. Modify `findMatchingDoc()` in RequestDocumentsDialog
2. Use purpose-based matching instead of category-based
3. Show "All valid documents" for slot purpose

### Phase 3: Update Slot Creation
1. Add "Required Purpose" dropdown in PM slot creation
2. Auto-suggest document types based on purpose
3. Allow PM to customize accepted types

### Phase 4: (Optional) Schema Enhancement
1. Add `purposes[]` field to Document model
2. Add `requiredPurpose` to ServiceDocumentSlot
3. Migrate existing data

---

## UI/UX Changes

### Client View (Self-Upload)
```
┌────────────────────────────────────────────────┐
│ 🔍 What type of document is this?              │
│ ┌──────────────────────────────────────────┐   │
│ │ Search... e.g., "Aadhar Card"             │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ Selected: Aadhar Card                          │
│                                                │
│ This document can be used as:                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ✓ Identity Proof                          │   │
│ │ ✓ Address Proof                           │   │
│ │ ✓ Photo ID                                │   │
│ │ ✓ Age Proof                               │   │
│ │ ✓ KYC Document                            │   │
│ └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### PM View (Link Dropdown)
```
┌────────────────────────────────────────────────┐
│ Link Document for: Address Proof               │
│                                                │
│ ⭐ MATCHING DOCUMENTS (can be used as          │
│    Address Proof):                             │
│ ┌──────────────────────────────────────────┐   │
│ │ 📄 aadhar_card.pdf                        │   │
│ │    Type: Aadhar Card                      │   │
│ │    ✓ Valid for: Address Proof             │   │
│ │                                            │   │
│ │ 📄 bank_statement_dec.pdf                 │   │
│ │    Type: Bank Statement                   │   │
│ │    ✓ Valid for: Address Proof             │   │
│ │                                            │   │
│ │ 📄 electricity_bill.pdf                   │   │
│ │    Type: Utility Bill                     │   │
│ │    ✓ Valid for: Address Proof             │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ 📁 OTHER DOCUMENTS:                            │
│ ┌──────────────────────────────────────────┐   │
│ │ 📄 pan_card.pdf (Identity/Tax)            │   │
│ │ 📄 form_16.pdf (Tax)                      │   │
│ └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

---

## Quick Win Implementation (No Schema Change)

We can implement this TODAY just by:

1. **Create `documentPurposes.ts` config file**
2. **Update matching logic to use purpose-aware matching**
3. **Update PM dropdown to group by "Valid for this purpose" vs "Other"**

### Files to Create/Modify:
```
NEW:  apps/web/lib/documentPurposes.ts
NEW:  apps/api/src/shared/config/documentPurposes.ts

MODIFY: apps/web/components/services/RequestDocumentsDialog.tsx
        - Update getGroupedDocsForSlot() to use purpose matching
```

---

## Sample Purpose Configuration

```typescript
// documentPurposes.ts

export const DOCUMENT_PURPOSES: Record<string, string[]> = {
  // === Identity Documents ===
  'AADHAR_CARD': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF', 'KYC', 'DOB_PROOF'],
  'PAN_CARD': ['IDENTITY', 'TAX', 'KYC', 'NAME_PROOF', 'FINANCIAL'],
  'PASSPORT': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF', 'DOB_PROOF', 'TRAVEL', 'KYC'],
  'VOTER_ID': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF'],
  'DRIVING_LICENSE': ['IDENTITY', 'ADDRESS_PROOF', 'PHOTO_ID', 'AGE_PROOF'],
  'DSC': ['IDENTITY', 'DIGITAL_SIGNATURE'],
  
  // === Financial Documents ===
  'BANK_STATEMENT': ['FINANCIAL', 'ADDRESS_PROOF', 'INCOME_PROOF', 'BANK_DETAILS'],
  'CANCELLED_CHEQUE': ['FINANCIAL', 'BANK_DETAILS', 'KYC'],
  'SALARY_SLIP': ['FINANCIAL', 'INCOME_PROOF', 'EMPLOYMENT_PROOF'],
  'FORM_16': ['TAX', 'INCOME_PROOF', 'EMPLOYMENT_PROOF'],
  'FORM_26AS': ['TAX', 'INCOME_PROOF', 'TAX_CREDIT'],
  'ITR_COPY': ['TAX', 'INCOME_PROOF', 'FINANCIAL'],
  'BALANCE_SHEET': ['FINANCIAL', 'BUSINESS', 'AUDIT'],
  'PROFIT_LOSS': ['FINANCIAL', 'BUSINESS', 'AUDIT'],
  
  // === Address Proof Only ===
  'UTILITY_BILL': ['ADDRESS_PROOF'],
  'ELECTRICITY_BILL': ['ADDRESS_PROOF'],
  'GAS_BILL': ['ADDRESS_PROOF'],
  'TELEPHONE_BILL': ['ADDRESS_PROOF'],
  'RENT_AGREEMENT': ['ADDRESS_PROOF', 'RESIDENCE_PROOF', 'LEGAL'],
  'PROPERTY_TAX_RECEIPT': ['ADDRESS_PROOF', 'PROPERTY_OWNERSHIP'],
  
  // === Business Documents ===
  'GST_CERTIFICATE': ['BUSINESS', 'TAX', 'KYC', 'REGISTRATION'],
  'GSTIN_CERTIFICATE': ['BUSINESS', 'TAX', 'KYC', 'REGISTRATION'],
  'INCORPORATION_CERT': ['BUSINESS', 'IDENTITY', 'KYC', 'LEGAL'],
  'MOA_AOA': ['BUSINESS', 'LEGAL', 'REGISTRATION'],
  'PARTNERSHIP_DEED': ['BUSINESS', 'LEGAL', 'IDENTITY'],
  'LLP_AGREEMENT': ['BUSINESS', 'LEGAL', 'IDENTITY'],
  'FSSAI_LICENSE': ['BUSINESS', 'LICENSE', 'FOOD_BUSINESS'],
  'TRADE_LICENSE': ['BUSINESS', 'LICENSE', 'REGISTRATION'],
  'SHOP_EST_LICENSE': ['BUSINESS', 'LICENSE', 'REGISTRATION'],
  
  // === Tax Documents ===
  'GST_RETURN': ['TAX', 'GST', 'COMPLIANCE'],
  'TDS_CERTIFICATE': ['TAX', 'TDS', 'INCOME_PROOF'],
  'TDS_CHALLAN': ['TAX', 'TDS', 'PAYMENT_PROOF'],
  
  // === Photos/Signatures ===
  'PASSPORT_PHOTO': ['PHOTO_ID', 'KYC'],
  'SIGNATURE_SPECIMEN': ['KYC', 'BANK_REQUIREMENT', 'IDENTITY'],
  
  // === Fallback ===
  'OTHER': ['OTHER', 'MISCELLANEOUS'],
};

// Reverse lookup: Get all document types that serve a purpose
export const getDocTypesForPurpose = (purpose: string): string[] => {
  return Object.entries(DOCUMENT_PURPOSES)
    .filter(([_, purposes]) => purposes.includes(purpose))
    .map(([docType, _]) => docType);
};

// Check if a document type serves a specific purpose
export const canServeAsPurpose = (docType: string, purpose: string): boolean => {
  const purposes = DOCUMENT_PURPOSES[docType] || DOCUMENT_PURPOSES['OTHER'];
  return purposes.includes(purpose);
};

// Get all purposes a document type can serve
export const getPurposesForDocType = (docType: string): string[] => {
  return DOCUMENT_PURPOSES[docType] || DOCUMENT_PURPOSES['OTHER'];
};
```

---

## Decision Required

**Which approach should we implement?**

| Option | Effort | Benefit | Recommendation |
|--------|--------|---------|----------------|
| A. Purpose config + smart matching | Low | High | ⭐ Implement First |
| B. Schema changes (purposes array) | Medium | Very High | Phase 2 |
| C. Slot accepts multiple doc types | Medium | High | Phase 3 |

**My Recommendation:** Start with **Option A** - it requires NO database changes and can be deployed immediately to solve the core problem.

---

## Next Steps

1. [ ] Create `documentPurposes.ts` configuration
2. [ ] Update `findMatchingDoc()` to use purpose-aware matching  
3. [ ] Update `getGroupedDocsForSlot()` to show "Valid for this purpose"
4. [ ] Test with real scenario (Aadhar as Address Proof)
5. [ ] (Future) Add slot purpose specification in PM create flow
