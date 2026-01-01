# Multi-Purpose Document Strategy - Implementation Complete

## Overview

This document describes the complete implementation of the **Scalable Multi-Purpose Document Strategy** for the CA Firm Management application. This feature enables intelligent auto-matching of client documents to service slots based on configurable purposes.

---

## What Was Implemented

### 1. Database Schema Changes

**File:** `apps/api/prisma/schema.prisma`

Added `purposes` field to the `DocumentMaster` model:

```prisma
model DocumentMaster {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  category    String
  purposes    String[] @default([])  // ← NEW: Multiple purposes this document can serve
  description String?
  ...
}
```

---

### 2. Seed Data Update

**File:** `apps/api/prisma/seed-document-master.ts`

All 113 documents now include purposes arrays. Examples:

| Document | Purposes |
|----------|----------|
| Aadhar Card | Identity, Address Proof, KYC, Age Proof, Photo ID, DOB Proof |
| PAN Card | Identity, Tax, KYC, Name Proof, Financial |
| Bank Statements | Financial, Address Proof, Income Proof, Transaction Proof |
| Form 16 | Tax, Income Proof, Employment Proof, TDS |

---

### 3. API Endpoints

**File:** `apps/api/src/modules/project-manager/project-manager.routes.ts`

#### New Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/project-manager/document-master` | Get all documents with purposes for configuration |
| PUT | `/api/project-manager/document-master/:id` | Update purposes for a document |
| GET | `/api/project-manager/available-purposes` | Get list of all available purpose options |

#### Updated Endpoint:

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/api/project-manager/document-library` | Now includes `purposes` in response |

---

### 4. Document Master Configuration UI

**New File:** `apps/web/components/settings/DocumentMasterConfig.tsx`

Features:
- Searchable list of all document types
- Grouped by category
- Edit modal with purpose checkboxes
- Add custom purpose functionality
- Save changes to API

**Updated File:** `apps/web/app/(project-manager)/project-manager/settings/page.tsx`

Added new "Document Master" tab to Settings page.

---

### 5. Dynamic Purpose-Based Matching

**File:** `apps/web/components/services/RequestDocumentsDialog.tsx`

Replaced hardcoded `documentTypeToCategory` mapping with dynamic purpose-based matching:

#### Matching Priority:

1. **Exact Type Match:** `doc.documentType === slot.documentCode`
2. **OTHER Description Match:** `doc.documentType === "OTHER"` AND `doc.description` matches `slot.documentName`
3. **Purpose-Based Match:** `DocumentMaster[doc.documentType].purposes.includes(slot.category)`
4. **Filename Match:** `doc.fileName` contains `slot.documentName`
5. **No Match:** Shown in "Other Available" section

---

### 6. Custom Name for "Other" Documents

**File:** `apps/web/components/documents/DocumentTypeSearch.tsx`

When client selects "Other Document":
- Shows input: "What is this document?"
- Client enters custom name (e.g., "Rent Agreement")
- Custom name passed as `customName` in upload

**File:** `apps/api/src/modules/client/client.documents.routes.ts`

- Accepts `customName` parameter
- Stores in `description` field for OTHER documents
- Used for auto-matching

---

## How It Works

### Example Flow:

1. **PM Configures Aadhar Card:**
   - Opens Settings → Document Master
   - Clicks Edit on Aadhar Card
   - Selects: Identity, Address Proof, KYC, Age Proof, Photo ID
   - Saves

2. **Client Uploads Aadhar Card:**
   - Opens Documents → Upload
   - Searches "Aadhar" → Selects Aadhar Card
   - Uploads file
   - Document created with `documentType: AADHAR_CARD`, `category: Identity`

3. **PM Creates Service with "Address Proof" Slot:**
   - Creates ITR service
   - Adds document requirement: "Address Proof" (category: Address Proof)
   - Slot created with `category: Address Proof`

4. **PM Opens Request Documents Dialog:**
   - System loads document library with purposes
   - For "Address Proof" slot:
     - Checks Aadhar Card purposes: ["Identity", "Address Proof", ...]
     - "Address Proof" IS in purposes → MATCH!
   - Aadhar Card shown in "Same Category" section

5. **PM Links Document:**
   - Sees Aadhar Card suggested for Address Proof slot
   - Clicks Link → Document linked to slot

---

## Files Modified

| File | Type | Description |
|------|------|-------------|
| `apps/api/prisma/schema.prisma` | Modified | Added `purposes` field to DocumentMaster |
| `apps/api/prisma/seed-document-master.ts` | Modified | Added purposes arrays to all 113 documents |
| `apps/api/src/modules/project-manager/project-manager.routes.ts` | Modified | Added 3 new endpoints, updated 1 |
| `apps/api/src/modules/client/client.documents.routes.ts` | Modified | Accept customName, store in description |
| `apps/web/components/settings/DocumentMasterConfig.tsx` | New | Document Master configuration UI |
| `apps/web/app/(project-manager)/project-manager/settings/page.tsx` | Modified | Added Document Master tab |
| `apps/web/components/services/RequestDocumentsDialog.tsx` | Modified | Dynamic purpose-based matching |
| `apps/web/components/documents/DocumentTypeSearch.tsx` | Modified | Custom name input for Other documents |
| `apps/web/app/(client)/client/documents/page.tsx` | Modified | Pass customName during upload |

---

## Testing Guide

### Test 1: Configure Document Purposes

1. Login as PM
2. Go to Settings → Document Master
3. Click Edit on "Aadhar Card"
4. Add "Address Proof" to purposes (should already be there)
5. Click Save

### Test 2: Upload Document as Client

1. Login as Client
2. Go to Documents → Upload
3. Select "Aadhar Card"
4. Upload file
5. Verify document created

### Test 3: Verify Auto-Matching

1. Login as PM
2. Create service for the client
3. Add "Address Proof" document requirement
4. Click "Request Documents"
5. Verify Aadhar Card appears in "Same Category" section for Address Proof slot

### Test 4: Other Document with Custom Name

1. Login as Client
2. Go to Documents → Upload
3. Search, select "Can't find your document?"
4. Enter custom name: "Marriage Certificate"
5. Upload file
6. Verify document created with description: "Marriage Certificate"

---

## API Response Examples

### GET /api/project-manager/document-master

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "code": "AADHAR_CARD",
      "name": "Aadhar Card",
      "category": "Identity",
      "purposes": ["Identity", "Address Proof", "KYC", "Age Proof", "Photo ID", "DOB Proof"],
      "description": "...",
      "isActive": true
    }
  ]
}
```

### PUT /api/project-manager/document-master/:id

Request:
```json
{
  "purposes": ["Identity", "Address Proof", "KYC", "Age Proof"]
}
```

Response:
```json
{
  "success": true,
  "data": { "id": "...", "purposes": [...] },
  "message": "Document purposes updated successfully"
}
```

### GET /api/project-manager/available-purposes

```json
{
  "success": true,
  "data": [
    "Identity", "Photo ID", "Age Proof", "DOB Proof", "Name Proof", "KYC",
    "Address Proof", "Residence Proof", "Office Proof",
    "Financial", "Income Proof", "Bank Proof", "Tax", "TDS",
    "Business", "Corporate", "Legal", "Compliance", "Audit",
    ...
  ]
}
```

---

## Scalability Benefits

1. **No Hardcoding:** Purposes stored in database, not code
2. **PM Configurable:** No developer needed to add/change purposes
3. **Custom Purposes:** PMs can add custom purposes for unique needs
4. **Dynamic Matching:** Frontend fetches purposes from API
5. **Future-Proof:** Easy to add new document types with purposes

---

## Implementation Complete ✅

All 10 tasks from the implementation plan have been completed:

- [x] Task 1: Schema Update (add purposes field)
- [x] Task 2: Database Migration (db push)
- [x] Task 3: Update Seed File with purposes
- [x] Task 4: Add Document Master API endpoints
- [x] Task 5: Update document-library to return purposes
- [x] Task 6: Add Document Master tab to Settings
- [x] Task 7: Create DocumentMasterConfig component
- [x] Task 8: Update RequestDocumentsDialog matching
- [x] Task 9: Update DocumentTypeSearch for Other
- [x] Task 10: Update client upload API
