# 🧪 Complete E2E Testing Guide: Service Creation to Execution

## Overview
This guide provides a complete step-by-step walkthrough for testing the Document Management workflow from service creation to completion.

---

# 🎭 ACTORS

| Role | Portal URL | Purpose |
|------|-----------|---------|
| **Project Manager (PM)** | `http://localhost:3000/project-manager` | Creates services, requests documents, reviews & approves |
| **Client** | `http://localhost:3000/client` | Uploads documents, views status |

---

# 📊 COMPLETE TESTING FLOW

## PHASE 1: PM Creates a New Service

### Step 1.1: Login as Project Manager
```
URL: http://localhost:3000/login
Credentials: Use PM credentials
Expected: Redirect to /project-manager/dashboard
```

### Step 1.2: Navigate to Create Service
```
Action: Click "Services" in sidebar → Click "Create Service" button
URL: http://localhost:3000/project-manager/services/new
```

### Step 1.3: Complete Service Creation Wizard

#### Step 1: Select Client
```
✅ Test: Search for client by name
✅ Test: Select client from dropdown
✅ Verify: Client details appear
```

#### Step 2: Select Service Type
```
✅ Test: Select Service Category (e.g., "Income Tax")
✅ Test: Select Service Type (e.g., "Individual ITR Filing")
✅ Test: Select Sub-Type if applicable
✅ Verify: Title auto-populates
```

#### Step 3: Configure Details
```
✅ Test: Financial Year selection
✅ Test: Assessment Year selection
✅ Test: Due Date selection
✅ Test: Fee Amount entry
✅ Test: Priority selection (LOW/NORMAL/HIGH/URGENT)
```

#### Step 4: Select Documents (KEY TESTING AREA)
```
Document Library:
✅ Test: Browse categories (Identity, Financial, Tax, GST, etc.)
✅ Test: Search documents by name
✅ Test: Filter by category
✅ Test: Select documents from library
✅ Test: Toggle Required/Optional status

Custom Documents:
✅ Test: Click "Add Custom Document"
✅ Test: Enter document name
✅ NEW: Test: Select Category (12 options available)
✅ Test: Click "Add Document"
✅ Verify: Custom document appears with selected category

Validation:
✅ Check: Mandatory documents auto-selected
✅ Check: Category badge shows correct category
✅ Check: Custom badge shows for custom documents
```

### Step 1.4: Submit Service
```
Action: Click "Create Service"
Expected: 
  - Success toast notification
  - Redirect to service detail page
  - Service status: "Draft" or "Active"
```

---

## PHASE 2: PM Requests Documents from Client

### Step 2.1: Navigate to Service Detail
```
URL: http://localhost:3000/project-manager/services/[serviceId]
```

### Step 2.2: Open Request Documents Dialog
```
Action: Click "Request Documents" button
Expected: 
  - Dialog opens showing all document slots
  - Each slot shows: Name, Category badge, Action dropdown
```

### Step 2.3: Configure Document Actions (KEY TESTING AREA)

#### For Each Document Slot:
```
Action Dropdown Options:
├── REQUEST: Ask client to upload
├── LINK: Link existing document from client repository  
└── SKIP: Skip this document

✅ Test: Change action from REQUEST to LINK
✅ Test: Change action from REQUEST to SKIP
```

#### Testing LINK Functionality (MAIN FIX)
```
Pre-condition: Client should have some documents uploaded already

1. Select "Link" for a document slot
2. Click the document selector button
3. ✅ NEW TEST: Verify ONLY documents matching the slot's CATEGORY appear
   - Example: For "PAN Card" slot (Identity category)
   - Should show: PAN Card, Aadhaar, Passport documents
   - Should NOT show: Bank Statements, Form 16, etc.
4. ✅ Verify: Document type label shown below filename
5. ✅ Test: Click to select a document
6. ✅ Verify: Selected document shows in the button
```

#### Testing Custom Document Addition
```
1. Expand "Add More Documents" section
2. Enter document name (e.g., "Rent Agreement")
3. ✅ NEW TEST: Select Category from dropdown (12 options)
4. Toggle "Mandatory" checkbox if needed
5. Click "Add"
6. ✅ Verify: Document appears in list with correct category
```

### Step 2.4: Set Deadline and Notes
```
✅ Test: Set global deadline date
✅ Test: Enter message for client
```

### Step 2.5: Submit Request
```
Action: Click "Send Request" button
Payload includes:
  - Linked document IDs
  - Requested documents list
  - Skipped documents list
  - Deadline and notes

Expected:
  - Success toast notification
  - Service status changes to "Waiting for Client"
  - Dialog closes
```

---

## PHASE 3: Client Views and Uploads Documents

### Step 3.1: Login as Client
```
URL: http://localhost:3000/login
Credentials: Use Client credentials
Expected: Redirect to /client/dashboard
```

### Step 3.2: View Service Details
```
Navigate: Click "Services" → Select the service
URL: http://localhost:3000/client/services/[serviceId]
```

### Step 3.3: View Required Documents (ClientDocumentSlots)
```
Expected sections:
├── 📤 Action Required (X) - Pending uploads
├── ⏳ Under Review (X) - Uploaded, awaiting PM review
├── ✅ Already Provided (X) - Linked by PM
└── ✅ Approved (X) - Reviewed and approved

✅ Check: Deadline shown for each pending document
✅ Check: PM's message displayed
✅ Check: Rejection reason shown (if any)
```

### Step 3.4: Upload Document via Slot (Auto-fill)
```
Action: Click "Upload" button on a pending document

Expected Dialog:
  Title: "Upload: [Document Name]"
  ✅ NEW: Category shown below title
  
Upload Process:
  1. Drag & drop or select file
  2. ✅ Verify: documentType auto-set from slot name
  3. Add optional description
  4. Click "Upload Document"

Expected:
  - Success toast
  - Document linked to slot
  - Slot status changes to "Uploaded - Under Review"
```

---

## PHASE 4: Client Uploads via Documents Repository

### Step 4.1: Navigate to Documents Page
```
URL: http://localhost:3000/client/documents
```

### Step 4.2: Click Upload Button
```
Action: Click "Upload Document" button
Expected: Upload dialog opens
```

### Step 4.3: Two-Step Category Selection (KEY NEW FEATURE)
```
STEP 1: SELECT CATEGORY
✅ Test: Click Category dropdown
✅ Verify: 12 categories shown:
   - Identity
   - Financial
   - Tax
   - GST
   - Business
   - Capital Gains
   - Professional
   - Address Proof
   - Foreign/NRI
   - Payroll
   - Import/Export
   - Other

✅ Test: Select a category (e.g., "Identity")
✅ Verify: Category hint appears below (e.g., "PAN Card, Aadhaar, Passport...")

STEP 2: SELECT DOCUMENT
✅ Test: Click Document dropdown
✅ Verify: Only documents from selected category shown
✅ Verify: "Other [Category] Document" option available
✅ Test: Select specific document type (e.g., "PAN Card")

FILE UPLOAD
✅ Test: Select/drag file
✅ Test: Add optional description
✅ Verify: Upload button enabled only when all required fields filled
✅ Test: Click "Upload Document"

Expected:
  - Success toast
  - Document appears in list
  - Document has correct type and category
```

---

## PHASE 5: PM Reviews Uploaded Documents

### Step 5.1: Navigate to Service Detail
```
URL: http://localhost:3000/project-manager/services/[serviceId]
```

### Step 5.2: View Document Status
```
Check document slots show:
  - UPLOADED status for pending review
  - File name and upload date
```

### Step 5.3: Review Documents
```
For each uploaded document:
  1. Click "Preview" to view document
  2. ✅ Test: Click "Approve" → Status changes to APPROVED
  3. ✅ Test: Click "Reject" → Enter rejection reason → Status changes to REJECTED
```

### Step 5.4: Link Additional Documents
```
If client uploaded to repository but didn't link to slot:
  1. Click "Request Documents" again
  2. Find the slot
  3. Change action to "Link"
  4. ✅ NEW TEST: Verify filtered by category
  5. Select the document
  6. Submit
```

---

## PHASE 6: Service Completion

### Step 6.1: All Documents Approved
```
Expected: 
  - All required document slots show APPROVED/LINKED
  - Service can proceed to next stage
```

### Step 6.2: Update Service Status
```
Action: PM changes service status to "In Progress" or "Completed"
```

---

# 🔍 SPECIFIC FEATURE TESTS

## Test 1: Category-Based Filtering in Link Dropdown

### Setup:
1. Client uploads documents:
   - `pan_card.pdf` (Type: PAN_CARD → Category: Identity)
   - `bank_statement.pdf` (Type: BANK_STATEMENT → Category: Financial)
   - `form16.pdf` (Type: FORM_16 → Category: Tax)

### Test:
1. PM opens Request Documents
2. For "Aadhaar Card" slot (Category: Identity):
   - Click Link → Select document
   - ✅ Expected: Shows `pan_card.pdf` (Identity)
   - ❌ Should NOT show: `bank_statement.pdf`, `form16.pdf`

3. For "Bank Statement" slot (Category: Financial):
   - Click Link → Select document
   - ✅ Expected: Shows `bank_statement.pdf` (Financial)
   - ❌ Should NOT show: `pan_card.pdf`, `form16.pdf`

---

## Test 2: Two-Step Upload Selection

### Test:
1. Client goes to /client/documents
2. Click Upload
3. Select Category: "Tax"
4. ✅ Expected: Category hint shows "Form 16, Form 26AS, AIS/TIS, ITR..."
5. Click Document dropdown
6. ✅ Expected: Shows only Tax documents from DocumentMaster
7. Select "Form 16"
8. Upload file
9. ✅ Expected: Document saved with documentType = "FORM_16"

---

## Test 3: Custom Document with Category

### Test in Service Creation:
1. PM creates new service
2. Step 4: Select Documents
3. Click "Add Custom Document"
4. Enter name: "Property Registration"
5. ✅ NEW: Select Category: "Capital Gains"
6. Click Add
7. ✅ Expected: Document shows with "Capital Gains" badge

### Test in Request Documents:
1. PM opens Request Documents dialog
2. Expand "Add More Documents"
3. Enter name: "NOC from Society"
4. ✅ NEW: Select Category: "Address Proof"
5. Click Add
6. ✅ Expected: Document slot created with "Address Proof" category

---

## Test 4: Slot-Based Upload Auto-fill

### Test:
1. Client views service detail
2. Click "Upload" on "PAN Card" slot
3. ✅ Expected: Dialog title shows "Upload: PAN Card"
4. ✅ Expected: Category shows "Identity" below title
5. ✅ Expected: documentType auto-set (no manual selection needed)
6. Upload file
7. ✅ Expected: Document linked to slot automatically

---

# 📝 EXPECTED API CALLS

| Action | Endpoint | Method |
|--------|----------|--------|
| Fetch document library | `/document-slots/document-library` | GET |
| Get service slots | `/document-slots/services/{id}/slots` | GET |
| Get client documents | `/document-slots/services/{id}/client-documents` | GET |
| Process slot actions | `/document-slots/services/{id}/process-actions` | POST |
| Add custom slot | `/document-slots/services/{id}/slots` | POST |
| Upload document | `/documents/upload` | POST |
| Link document to slot | `/document-slots/client/slots/{id}/upload` | POST |

---

# ✅ SUCCESS CRITERIA

| Feature | Criteria |
|---------|----------|
| Category Filtering | Link dropdown shows ONLY matching category documents |
| Two-Step Upload | Category → Document selection works correctly |
| Custom Doc Category | 12 categories available in both places |
| Slot Auto-fill | Category & doc type auto-set for slot uploads |
| Document Hints | Category hints appear in upload dialog |
| Document Library | API returns grouped categories |

---

# 🐛 POTENTIAL ISSUES TO WATCH

1. **API Not Responding**: Check if backend is running on port 5000
2. **Empty Document List**: Ensure DocumentMaster is seeded
3. **Category Mismatch**: Verify documentTypeToCategory mapping in RequestDocumentsDialog
4. **Missing Slots**: Ensure createSlotsFromRequirements runs on service creation

---

## Quick Reference: Category Mapping

| DocumentType | Maps to Category |
|--------------|-----------------|
| PAN_CARD, AADHAR_CARD, PASSPORT, VOTER_ID, DSC | Identity |
| BANK_STATEMENTS, CANCELLED_CHEQUE, PROFIT_LOSS | Financial |
| FORM_16, FORM_26AS, PREVIOUS_ITR, TAX_RETURN | Tax |
| GST_RETURNS, GSTIN_CERTIFICATE | GST |
| INCORPORATION_CERTIFICATE, MOA_AOA, PARTNERSHIP_DEED | Business |
| OTHER | Other |

---

**Created:** December 27, 2025  
**Last Updated:** December 27, 2025
