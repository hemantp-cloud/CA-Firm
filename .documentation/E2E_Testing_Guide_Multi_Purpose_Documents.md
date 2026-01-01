# Complete End-to-End Testing Guide
## Multi-Purpose Document Strategy Implementation

---

# PART 1: TESTING OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           E2E TESTING FLOW OVERVIEW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   STEP 1    │────▶│   STEP 2    │────▶│   STEP 3    │────▶│   STEP 4    │
    │ PM: Config  │     │ PM: Create  │     │  Client:    │     │ PM: Request │
    │   Purposes  │     │   Service   │     │   Upload    │     │   Documents │
    └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
          │                   │                   │                   │
          ▼                   ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │ Settings →  │     │ Service with│     │ Upload      │     │ See Aadhar  │
    │ Doc Master  │     │ "Address    │     │ Aadhar Card │     │ suggested   │
    │ → Edit      │     │  Proof"     │     │             │     │ for Address │
    │ → Save      │     │  slot       │     │             │     │ Proof slot! │
    └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

# PART 2: PREREQUISITES

Before testing, ensure:
- ✅ Backend API running: `npm run dev` in `apps/api` (Port 4000)
- ✅ Frontend running: `npm run dev` in `apps/web` (Port 3000)
- ✅ Seed data executed with purposes

**Required User Accounts:**
1. **Project Manager (PM)** - for service creation and configuration
2. **Client** - for document upload

---

# STEP 1: CONFIGURE DOCUMENT PURPOSES (PM)

## 1.1 Login as PM/CA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/login                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                        ┌──────────────────────────────┐                         │
│                        │           🏢 LOGIN           │                         │
│                        ├──────────────────────────────┤                         │
│                        │                              │                         │
│                        │  Email:                      │                         │
│                        │  ┌────────────────────────┐  │                         │
│                        │  │ pm@example.com         │  │  ← Enter PM email       │
│                        │  └────────────────────────┘  │                         │
│                        │                              │                         │
│                        │  Password:                   │                         │
│                        │  ┌────────────────────────┐  │                         │
│                        │  │ ••••••••               │  │  ← Enter password       │
│                        │  └────────────────────────┘  │                         │
│                        │                              │                         │
│                        │  ┌────────────────────────┐  │                         │
│                        │  │       🔐 LOGIN         │  │  ← Click to login       │
│                        │  └────────────────────────┘  │                         │
│                        │                              │                         │
│                        └──────────────────────────────┘                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Navigate to Settings

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/project-manager/dashboard                             │
├──────────────────┬──────────────────────────────────────────────────────────────┤
│                  │                                                              │
│  ┌────────────┐  │   Welcome back, [PM Name]!                                   │
│  │ 🏠 Dashboard│  │                                                              │
│  ├────────────┤  │   Quick Stats:                                               │
│  │ 👥 Clients │  │   ┌─────────────┬─────────────┬─────────────┐                │
│  ├────────────┤  │   │ Services: 5 │ Pending: 3  │ Clients: 12 │                │
│  │ 📋 Services│  │   └─────────────┴─────────────┴─────────────┘                │
│  ├────────────┤  │                                                              │
│  │ 📄 Documents│  │                                                              │
│  ├────────────┤  │                                                              │
│  │ ⚙️ Settings│◀──────── Click here!                                           │
│  └────────────┘  │                                                              │
│                  │                                                              │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

## 1.3 Open Document Master Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/project-manager/settings                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ⚙️ Settings                                                                    │
│                                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────────┐                │
│  │ 👤 Profile│ │🔒Security│ │🔔Notifications│ │📋 Document Master│◀── NEW TAB!   │
│  └──────────┘ └──────────┘ └──────────────┘ └─────────────────┘                │
│  ──────────────────────────────────────────────────────────────────             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 Document Master Configuration                                        │   │
│  │ Configure what purposes each document type can serve for auto-matching  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  🔍 [Search documents...                                    ]           │   │
│  │                                                                         │   │
│  │  [All] [Identity] [Financial] [Tax] [GST] [Business]  ← Filter buttons  │   │
│  │                                                                         │   │
│  │  ┌─ IDENTITY ──────────────────────────────────────────────────────┐    │   │
│  │  │ 📄 Aadhar Card      [Identity] [Address Proof] [KYC] +3   [Edit]│◀───┼── Click Edit │
│  │  │ 📄 PAN Card         [Identity] [Tax] [KYC] [Name Proof]   [Edit]│    │   │
│  │  │ 📄 Passport         [Identity] [Address Proof] [Photo ID] [Edit]│    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                         │   │
│  │  ┌─ FINANCIAL ─────────────────────────────────────────────────────┐    │   │
│  │  │ 📄 Bank Statements  [Financial] [Address Proof] [Income]  [Edit]│    │   │
│  │  │ 📄 Cancelled Cheque [Financial] [Bank Proof]              [Edit]│    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1.4 Edit Document Purposes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ✏️ Edit Document Purposes                                               [X]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  📄 Aadhar Card                                                                 │
│  ┌─────────────────────────────────────────────────────┐                        │
│  │ Primary Category: Identity                          │                        │
│  │ Code: AADHAR_CARD                                   │                        │
│  └─────────────────────────────────────────────────────┘                        │
│                                                                                 │
│  Select purposes this document can serve:                                       │
│                                                                                 │
│  IDENTITY                              ADDRESS                                  │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐     │
│  │ ☑ Identity                      │   │ ☑ Address Proof   ◀── VERIFY   │     │
│  │ ☑ Photo ID                      │   │ ☐ Residence Proof               │     │
│  │ ☑ Age Proof                     │   │ ☐ Office Proof                  │     │
│  │ ☑ DOB Proof                     │   └─────────────────────────────────┘     │
│  │ ☐ Name Proof                    │                                           │
│  │ ☑ KYC                           │   FINANCIAL                               │
│  └─────────────────────────────────┘   ┌─────────────────────────────────┐     │
│                                        │ ☐ Financial                     │     │
│                                        │ ☐ Income Proof                  │     │
│                                        │ ☐ Bank Proof                    │     │
│                                        └─────────────────────────────────┘     │
│                                                                                 │
│  + Add Custom Purpose                                                           │
│  ┌─────────────────────────────────────────────┐ ┌──────┐                      │
│  │ e.g., Government ID                         │ │ + Add│                      │
│  └─────────────────────────────────────────────┘ └──────┘                      │
│                                                                                 │
│  ──────────────────────────────────────────────────────────────────             │
│  Selected: 6 purposes                                                           │
│  [Identity] [Photo ID] [Age Proof] [DOB Proof] [KYC] [Address Proof]           │
│                                                                                 │
│                                        [Cancel]  [💾 Save Changes]   ◀── SAVE   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**✅ VERIFICATION:**
- Confirm "Address Proof" is checked for Aadhar Card
- Click Save → See success toast

---

# STEP 2: CREATE SERVICE WITH ADDRESS PROOF SLOT (PM)

## 2.1 Navigate to Create Service

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/project-manager/services/new                          │
├──────────────────┬──────────────────────────────────────────────────────────────┤
│                  │                                                              │
│  ┌────────────┐  │   📋 Create New Service                                      │
│  │ 🏠 Dashboard│  │                                                              │
│  ├────────────┤  │   Step 1: Basic Info                                         │
│  │ 👥 Clients │  │   ┌─────────────────────────────────────────────────────┐   │
│  ├────────────┤  │   │ Select Client: [Select a client...          ▼]      │   │
│  │ 📋 Services│◀─┼───│ Service Type:  [ITR Filing                  ▼]      │   │
│  │   └→ + New │  │   │ Title:         [ITR Filing for FY 2024-25     ]     │   │
│  ├────────────┤  │   └─────────────────────────────────────────────────────┘   │
│  │ 📄 Documents│  │                                                              │
│  ├────────────┤  │   Step 2: Required Documents                                 │
│  │ ⚙️ Settings│  │   ┌─────────────────────────────────────────────────────┐   │
│  └────────────┘  │   │ [+ Add Document Requirement]                         │   │
│                  │   └─────────────────────────────────────────────────────┘   │
│                  │                                                              │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

## 2.2 Add "Address Proof" Document Requirement

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📋 Create New Service                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Step 2: Required Documents                                                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search document requirements...                                     │   │
│  │  ──────────────────────────────────────────────────────────────────     │   │
│  │                                                                         │   │
│  │  📄 PAN Card              [Identity]                   [+ Add]          │   │
│  │  📄 Aadhar Card           [Identity]                   [+ Add]          │   │
│  │  📄 Address Proof         [Address Proof] ◀─ SELECT    [+ Add]   ◀───────── │
│  │  📄 Form 16               [Tax]                        [+ Add]          │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  OR add custom document:                                                        │
│  ┌───────────────────────────────────────┐ ┌─────────────────┐                 │
│  │ Custom document name...               │ │ Category ▼      │ [+ Add Custom] │
│  └───────────────────────────────────────┘ └─────────────────┘                 │
│                                                                                 │
│  ──────────────────────────────────────────────────────────────────             │
│                                                                                 │
│  ✅ Added Documents:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. 📄 PAN Card             [Identity]        [Required ✓]    [❌]      │   │
│  │  2. 📄 Address Proof        [Address Proof]   [Required ✓]    [❌]      │◀──┘│
│  │  3. 📄 Form 16              [Tax]             [Required ✓]    [❌]      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                                                         [Create Service]        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Create Service

Click **[Create Service]** → Service created with 3 document slots including "Address Proof"

**✅ VERIFICATION:**
- Navigate to service details
- See "Address Proof" slot with status "NOT_STARTED"

---

# STEP 3: UPLOAD AADHAR CARD (CLIENT)

## 3.1 Login as Client

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/login                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                        ┌──────────────────────────────┐                         │
│                        │           🏢 LOGIN           │                         │
│                        ├──────────────────────────────┤                         │
│                        │                              │                         │
│                        │  Email:                      │                         │
│                        │  ┌────────────────────────┐  │                         │
│                        │  │ client@example.com     │  │  ← Client email         │
│                        │  └────────────────────────┘  │                         │
│                        │                              │                         │
│                        │  Password:                   │                         │
│                        │  ┌────────────────────────┐  │                         │
│                        │  │ ••••••••               │  │                         │
│                        │  └────────────────────────┘  │                         │
│                        │                              │                         │
│                        │  ┌────────────────────────┐  │                         │
│                        │  │       🔐 LOGIN         │  │                         │
│                        │  └────────────────────────┘  │                         │
│                        │                              │                         │
│                        └──────────────────────────────┘                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Navigate to Documents

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/client/documents                                      │
├──────────────────┬──────────────────────────────────────────────────────────────┤
│                  │                                                              │
│  ┌────────────┐  │   📄 My Documents                                            │
│  │ 🏠 Dashboard│  │                                                              │
│  ├────────────┤  │   ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 Services│  │   │               [📤 Upload Document]   ◀── CLICK      │   │
│  ├────────────┤  │   │                                                     │   │
│  │ 📄 Documents│◀─┼───│  No documents uploaded yet                          │   │
│  ├────────────┤  │   │                                                     │   │
│  │ 📊 Payments│  │   │  Upload your first document to get started         │   │
│  └────────────┘  │   │                                                     │   │
│                  │   └─────────────────────────────────────────────────────┘   │
│                  │                                                              │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

## 3.3 Upload Aadhar Card

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📤 Upload Document                                                      [X]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Step 1: Select Document Type                                                   │
│                                                                                 │
│  🔍 [Search for document type...                                       ]       │
│     ┌─────────────────────────────────────────────────────────────────┐        │
│     │ IDENTITY                                                        │        │
│     │ ┌─────────────────────────────────────────────────────────────┐ │        │
│     │ │ 📄 Aadhar Card                                 [Select] ◀───┼─┼── CLICK│
│     │ │    Unique Identification Number issued by UIDAI              │ │        │
│     │ └─────────────────────────────────────────────────────────────┘ │        │
│     │ ┌─────────────────────────────────────────────────────────────┐ │        │
│     │ │ 📄 PAN Card                                                 │ │        │
│     │ └─────────────────────────────────────────────────────────────┘ │        │
│     │                                                                 │        │
│     │ ─────────────────────────────────────────────────────           │        │
│     │                                                                 │        │
│     │ 🤔 Can't find your document?                                    │        │
│     │    Upload as "Other" - Specify what it is                       │        │
│     └─────────────────────────────────────────────────────────────────┘        │
│                                                                                 │
│  ──────────────────────────────────────────────────────────────────             │
│                                                                                 │
│  ✅ Selected: Aadhar Card [Identity]                                            │
│                                                                                 │
│  Step 2: Upload File                                                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │           📁 Drag & drop or click to upload                             │   │
│  │                                                                         │   │
│  │              Max 10MB - PDF, JPG, PNG                                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ✅ Selected: aadhar-front.pdf (1.2 MB)                                        │
│                                                                                 │
│                                                         [Upload Document]       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**✅ VERIFICATION:**
- Document uploaded successfully
- See "Aadhar Card" in document list with category "Identity"

---

# STEP 4: REQUEST DOCUMENTS AND VERIFY MATCHING (PM)

## 4.1 Login Back as PM

Login with PM credentials

## 4.2 Open Service Details

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/project-manager/services                              │
├──────────────────┬──────────────────────────────────────────────────────────────┤
│                  │                                                              │
│  Sidebar         │   📋 Services                                                │
│                  │                                                              │
│                  │   ┌────────────────────────────────────────────────────┐    │
│                  │   │ 🔍 Search services...                              │    │
│                  │   └────────────────────────────────────────────────────┘    │
│                  │                                                              │
│                  │   ┌────────────────────────────────────────────────────┐    │
│                  │   │ 📋 ITR Filing for FY 2024-25                       │    │
│                  │   │    Client: [Client Name]                           │    │
│                  │   │    Status: 🟡 In Progress                          │    │
│                  │   │    Documents: 0/3 submitted                        │◀── CLICK │
│                  │   └────────────────────────────────────────────────────┘    │
│                  │                                                              │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

## 4.3 Open Request Documents Dialog

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 http://localhost:3000/project-manager/services/[id]                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  📋 ITR Filing for FY 2024-25                                                  │
│  Client: [Client Name] | Status: 🟡 In Progress                                 │
│                                                                                 │
│  ──────────────────────────────────────────────────────────────────             │
│                                                                                 │
│  📄 Required Documents (3)                            [ 📤 Request Documents ] │
│                                                            ↑                    │
│  ┌─────────────────────────────────────────────────────────┼───────────────┐   │
│  │                                                         │               │   │
│  │  1. 📄 PAN Card              Status: ⚪ Not Started     │               │   │
│  │     Category: Identity                                  │               │   │
│  │                                                         │               │   │
│  │  2. 📄 Address Proof         Status: ⚪ Not Started     │ CLICK HERE!  │   │
│  │     Category: Address Proof                             │               │   │
│  │                                                         │               │   │
│  │  3. 📄 Form 16               Status: ⚪ Not Started   ──┘               │   │
│  │     Category: Tax                                                       │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.4 THE MAGIC MOMENT - See Purpose-Based Matching! 🎉

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📤 Request Documents                                                     [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Manage document requests for this service                                      │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════            │
│  📄 SLOT 1: PAN Card                                                            │
│  ═══════════════════════════════════════════════════════════════════            │
│     Category: Identity                                                          │
│     Status: ⚪ Not Started                                                      │
│                                                                                 │
│     Action: ○ Link Document  ○ Request  ○ Skip                                  │
│     No exact match found - [🔗 Select different document ▼]                    │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════            │
│  📄 SLOT 2: Address Proof                           ◀── KEY TEST CASE          │
│  ═══════════════════════════════════════════════════════════════════            │
│     Category: Address Proof                                                     │
│     Status: ⚪ Not Started                                                      │
│                                                                                 │
│     🎯 SUGGESTED MATCH FOUND!                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐        │
│     │  ⭐ SAME CATEGORY (Can serve as Address Proof)                   │        │
│     │  ┌──────────────────────────────────────────────────────────┐   │        │
│     │  │  📄 Aadhar Card - aadhar-front.pdf                       │   │        │
│     │  │     ✓ Serves as: Identity, Address Proof, KYC            │   │ ◀────── │
│     │  │     [🔗 Link This Document]                              │   │  THIS! │
│     │  └──────────────────────────────────────────────────────────┘   │        │
│     └─────────────────────────────────────────────────────────────────┘        │
│                                                                                 │
│     Action: ● Link Document  ○ Request  ○ Skip                                  │
│             [Selected: Aadhar Card ▼]                                           │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════            │
│  📄 SLOT 3: Form 16                                                             │
│  ═══════════════════════════════════════════════════════════════════            │
│     Category: Tax                                                               │
│     Status: ⚪ Not Started                                                      │
│                                                                                 │
│     Action: ○ Link Document  ● Request  ○ Skip                                  │
│                                                                                 │
│  ──────────────────────────────────────────────────────────────────             │
│                                                                                 │
│                              [Cancel]  [✅ Submit Actions]                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🎉 SUCCESS! The Aadhar Card is suggested for Address Proof because:**
- Aadhar's `purposes` include `["Identity", "Address Proof", "KYC", ...]`
- Slot's category is `"Address Proof"`
- Match found: `purposes.includes("Address Proof")` = TRUE

---

# STEP 5: (BONUS) TEST "OTHER" DOCUMENT WITH CUSTOM NAME

## 5.1 Client Uploads "Other" Document

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📤 Upload Document                                                      [X]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🔍 [marriage...                                                       ]       │
│     ┌─────────────────────────────────────────────────────────────────┐        │
│     │                                                                 │        │
│     │  No results found for "marriage"                                │        │
│     │                                                                 │        │
│     │ ─────────────────────────────────────────────────────           │        │
│     │                                                                 │        │
│     │ 🤔 Can't find your document?                                    │        │
│     │    [Upload as "Other" - Specify what it is]   ◀── CLICK         │        │
│     └─────────────────────────────────────────────────────────────────┘        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Enter Custom Name

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📤 Upload Document                                                      [X]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  What is this document?                                                 │   │
│  │                                                                         │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Marriage Certificate                                             │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │        ↑                                                                │   │
│  │  Enter document name (helps with auto-matching)                        │   │
│  │                                                                         │   │
│  │                                  [Back]  [Continue]   ◀── CLICK         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Result:**
- Document saved with `documentType: "OTHER"`
- Document saved with `description: "Marriage Certificate"`
- When PM creates a slot named "Marriage Certificate", this document will match!

---

# COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       COMPLETE END-TO-END FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                            PM CONFIGURES                                │
    │                                                                         │
    │   Settings → Document Master → Edit Aadhar → Check "Address Proof"     │
    │                           ↓                                             │
    │                  Database Updated:                                      │
    │         Aadhar Card purposes = ["Identity", "Address Proof", ...]      │
    └─────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         PM CREATES SERVICE                              │
    │                                                                         │
    │   Services → New → Add "Address Proof" Document Requirement            │
    │                           ↓                                             │
    │                  Slot Created:                                          │
    │         { name: "Address Proof", category: "Address Proof" }           │
    └─────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                       CLIENT UPLOADS DOCUMENT                           │
    │                                                                         │
    │   Documents → Upload → Select "Aadhar Card" → Upload File              │
    │                           ↓                                             │
    │                  Document Created:                                      │
    │         { type: "AADHAR_CARD", category: "Identity" }                  │
    └─────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                      PM OPENS REQUEST DOCUMENTS                         │
    │                                                                         │
    │   Service Details → Request Documents                                   │
    │                           ↓                                             │
    │                  System Fetches:                                        │
    │         1. All slots (including "Address Proof")                       │
    │         2. Client documents (Aadhar Card)                              │
    │         3. Document Library with purposes                              │
    │                           ↓                                             │
    │                  Matching Runs:                                         │
    │         For "Address Proof" slot:                                      │
    │           - Check Aadhar purposes: ["Identity", "Address Proof", ...]  │
    │           - "Address Proof" IN purposes? ✅ YES!                       │
    │                           ↓                                             │
    │                  Result:                                                │
    │         Aadhar Card shown in "Same Category" section! 🎉               │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

# QUICK TEST CHECKLIST

| Step | Action | Expected Result | ✓ |
|------|--------|-----------------|---|
| 1 | PM: Settings → Document Master | See document list with purposes | ☐ |
| 2 | PM: Edit Aadhar → Verify "Address Proof" checked | Checkbox is checked | ☐ |
| 3 | PM: Create service with "Address Proof" slot | Service created | ☐ |
| 4 | Client: Upload Aadhar Card | Document uploaded | ☐ |
| 5 | PM: Open Request Documents dialog | Dialog opens | ☐ |
| 6 | PM: See Aadhar in "Same Category" for Address Proof slot | **MAGIC MOMENT! 🎉** | ☐ |
| 7 | PM: Link Aadhar to Address Proof slot | Document linked | ☐ |
| 8 | (Bonus) Client: Upload "Other" with custom name | Custom name stored | ☐ |

---

# TROUBLESHOOTING

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Document Master tab missing | Component not imported | Check Settings page imports |
| Edit modal empty | API not returning data | Check `/api/project-manager/document-master` |
| No matching suggested | Purposes not configured | Edit document in Document Master |
| 404 on document-master API | Route not registered | Check project-manager.routes.ts |
| Client upload fails | API error | Check client.documents.routes.ts |

---

**Document Created:** 2025-12-31
**Implementation Version:** 1.0
**Status:** Ready for Testing ✅
