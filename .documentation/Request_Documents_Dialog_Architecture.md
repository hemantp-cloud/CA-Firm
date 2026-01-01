# Request Documents Dialog - Complete Architecture
## Actual Codebase Implementation

---

# YOUR SCREENSHOT MAPPED TO CODE

Based on the screenshot you provided:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📄 Document Request                                                     [X]   │
│  Service: ITR-2 - Client3 - AY 2026-27 • Client: Client3                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─ Documents (5) ─────────────────────────────── 2 to request • 3 linked ──┐  │
│  │                                                                           │  │
│  │ 🔵 PAN Card         *  [Identity]   [Link ▼]      [👁 Screensh... ▼]     │  │
│  │                                                                           │  │
│  │ 🔵 Aadhar Card      *  [Identity]   [Link ▼]      [👁 Screensh... ▼]     │  │
│  │                                                                           │  │
│  │ 🟠 Bank Statements  *  [Financial]  [Request ▼]                          │  │
│  │    (all accounts)                                                         │  │
│  │                                                                           │  │
│  │ 🟠 Shareholding     *  [Business]   [Request ▼]                          │  │
│  │    Pattern                                                                │  │
│  │                                                                           │  │
│  │ 🔵 XYZ              *  [Other]      [Link ▼]      [👁 IMG-202... ▼]      │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  * Mandatory documents                                                          │
│                                                                                 │
│  + Add More Documents                                       [▲]                │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ Document Name              Category         ☑ Mandatory    [+ Add]    │    │
│  │ [e.g., Rent Agreement   ] [Other   ▼]                                 │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                   [Cancel]  [📧 Send Request (5)]              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: COMPONENT ARCHITECTURE

## File Structure Overview

```
apps/web/
├── app/(project-manager)/project-manager/services/[id]/
│   └── page.tsx                          ← Service detail page (contains action buttons)
│
├── components/services/
│   ├── ServiceActionButtons.tsx          ← Button component with "Request Documents"
│   └── RequestDocumentsDialog.tsx        ← THE MAIN DIALOG (771 lines)
│
└── lib/
    └── api.ts                            ← Axios API client
```

---

# PART 2: DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT HIERARCHY                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  ServiceDetail Page (page.tsx)                                          │
    │  /project-manager/services/[id]                                         │
    │                                                                         │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │  ServiceActionButtons                                           │   │
    │  │  ┌─────────────────────────┐                                    │   │
    │  │  │ [📄 Request Documents]  │  ← Button clicked                  │   │
    │  │  └─────────────────────────┘                                    │   │
    │  │           │                                                      │   │
    │  │           │ onClick → setRequestDocsDialogOpen(true)            │   │
    │  │           │                                                      │   │
    │  │  ┌───────▼───────────────────────────────────────────────────┐  │   │
    │  │  │  RequestDocumentsDialog                                   │  │   │
    │  │  │  ├── open={requestDocsDialogOpen}                         │  │   │
    │  │  │  ├── serviceId={serviceId}                               │  │   │
    │  │  │  ├── serviceName={serviceName}                           │  │   │
    │  │  │  ├── clientName={clientName}                             │  │   │
    │  │  │  └── onSuccess={onActionComplete}                        │  │   │
    │  │  └───────────────────────────────────────────────────────────┘  │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                                                                         │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

# PART 3: CODE PATH TRACE

## Step 1: Button Click
**File:** `ServiceActionButtons.tsx` (Line 82-87)

```typescript
const handleActionClick = (action: ActionConfig) => {
    // Special handling for request-documents to use enhanced dialog
    if (action.action === 'request-documents') {
        setRequestDocsDialogOpen(true)    // ← Opens the dialog
        return
    }
    // ... other actions
}
```

## Step 2: Dialog Renders
**File:** `ServiceActionButtons.tsx` (Line 248-256)

```typescript
{/* Enhanced Request Documents Dialog */}
<RequestDocumentsDialog
    serviceId={serviceId}
    serviceName={serviceName}
    clientName={clientName}
    open={requestDocsDialogOpen}          // ← Controlled by state
    onOpenChange={setRequestDocsDialogOpen}
    onSuccess={onActionComplete}
/>
```

## Step 3: Dialog Loads Data
**File:** `RequestDocumentsDialog.tsx` (Line 100-154)

```typescript
useEffect(() => {
    if (open && serviceId) {
        loadData()    // ← Triggers when dialog opens
    }
}, [open, serviceId])

const loadData = async () => {
    setLoading(true)
    try {
        // Parallel API calls
        const [slotsRes, docsRes, libraryRes] = await Promise.all([
            api.get(`/document-slots/services/${serviceId}/slots`),      // ← Get service slots
            api.get(`/document-slots/services/${serviceId}/client-documents`), // ← Get client docs
            api.get(`/project-manager/document-library`)                 // ← Get doc library with purposes
        ])
        
        // Process and set state...
    }
}
```

---

# PART 4: API ENDPOINTS CALLED

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            API CALLS ON DIALOG OPEN                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  1. GET /document-slots/services/:serviceId/slots                       │
    │     └── Returns: Document slots for this service                        │
    │         Example Response:                                               │
    │         [                                                               │
    │           { id: "slot-1", documentName: "PAN Card", category: "Identity", │
    │             isRequired: true, status: "NOT_STARTED" },                   │
    │           { id: "slot-2", documentName: "Aadhar Card", category: "Identity",│
    │             isRequired: true, status: "NOT_STARTED" },                   │
    │           { id: "slot-3", documentName: "Bank Statements",              │
    │             category: "Financial", isRequired: true, status: "NOT_STARTED" } │
    │         ]                                                               │
    └─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  2. GET /document-slots/services/:serviceId/client-documents            │
    │     └── Returns: All documents uploaded by this client                  │
    │         Example Response:                                               │
    │         [                                                               │
    │           { id: "doc-1", fileName: "Screenshot_aadhar.png",             │
    │             documentType: "AADHAR_CARD", fileType: "image/png" },       │
    │           { id: "doc-2", fileName: "pan_card.pdf",                      │
    │             documentType: "PAN_CARD", fileType: "application/pdf" }     │
    │         ]                                                               │
    └─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  3. GET /project-manager/document-library    ◀── NEW (Multi-Purpose)   │
    │     └── Returns: All document types with their purposes                 │
    │         Example Response:                                               │
    │         [                                                               │
    │           { code: "AADHAR_CARD", name: "Aadhar Card",                   │
    │             category: "Identity",                                       │
    │             purposes: ["Identity", "Address Proof", "KYC", "Age Proof"]},│
    │           { code: "PAN_CARD", name: "PAN Card",                         │
    │             category: "Identity",                                       │
    │             purposes: ["Identity", "Tax", "KYC", "Name Proof"] }        │
    │         ]                                                               │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

# PART 5: MATCHING LOGIC FLOW

**File:** `RequestDocumentsDialog.tsx` (Line 162-204)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MATCHING FUNCTION: findMatchingDocWithPurposes               │
└─────────────────────────────────────────────────────────────────────────────────┘

For each slot, find the best matching client document:

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  SLOT: "Address Proof" (category: "Address Proof")                      │
    └─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  PRIORITY 1: Exact Type Match                                           │
    │  ─────────────────────────────────────────────────────────────────      │
    │  doc.documentType === "ADDRESS_PROOF" ?                                 │
    │  → No match                                                             │
    └────────────────────────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  PRIORITY 2: OTHER Type with Description Match                          │
    │  ─────────────────────────────────────────────────────────────────      │
    │  doc.documentType === "OTHER" && doc.description.includes("address") ?  │
    │  → No match                                                             │
    └────────────────────────────────────────────┬────────────────────────────┘
    │                                            │
    │                                            ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  PRIORITY 3: Purpose-Based Match   ◀── NEW! FROM DATABASE              │
    │  ─────────────────────────────────────────────────────────────────      │
    │  Check: Aadhar Card                                                     │
    │         purposes = ["Identity", "Address Proof", "KYC", ...]           │
    │                                                                         │
    │  "Address Proof" IN purposes? → ✅ YES! MATCH FOUND!                   │
    │                                                                         │
    │  → Return: Aadhar Card document                                         │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

# PART 6: UI COMPONENT BREAKDOWN

**File:** `RequestDocumentsDialog.tsx` (Line 348-771)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DIALOG STRUCTURE                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘

<Dialog>                                               ← shadcn/ui Dialog
    <DialogContent>                                    ← Modal container
    
        ┌──────────────────────────────────────────────────────────────────────┐
        │ <DialogHeader>                                          (Line 352)  │
        │   📄 Document Request                                                │
        │   Service: ITR-2 - Client3 • Client: Client3                        │
        └──────────────────────────────────────────────────────────────────────┘
        
        ┌──────────────────────────────────────────────────────────────────────┐
        │ <div className="documents-section">                     (Line 374)  │
        │   ┌─────────────────────────────────────────────────────────────┐   │
        │   │ Header: Documents (5)         2 to request • 3 linked       │   │
        │   └─────────────────────────────────────────────────────────────┘   │
        │                                                                     │
        │   {pendingSlots.map(slot => (                           (Line 396)  │
        │     <div className="slot-row">                                      │
        │       🔵/🟠 {slot.documentName}  [{slot.category}]                  │
        │                                                                     │
        │       <Select>                                          (Line 435)  │
        │         [Link ▼]  [Request ▼]  [Skip ▼]                            │
        │       </Select>                                                     │
        │                                                                     │
        │       {action === 'LINK' && (                           (Line 463)  │
        │         <Popover>                                                   │
        │           [👁 Document Name ▼]                                      │
        │           ──────────────────────────────────────                    │
        │           ⭐ EXACT MATCH                                            │
        │             📄 Screenshot_pan.png                                   │
        │           📂 SAME CATEGORY (Identity)                               │
        │             📄 Aadhar_card.pdf                                      │
        │           📁 OTHER AVAILABLE                                        │
        │             📄 bank_statement.pdf                                   │
        │         </Popover>                                                  │
        │       )}                                                            │
        │     </div>                                                          │
        │   ))}                                                               │
        └──────────────────────────────────────────────────────────────────────┘
        
        ┌──────────────────────────────────────────────────────────────────────┐
        │ <Collapsible> + Add More Documents                      (Line ~650) │
        │   ┌─────────────────────────────────────────────────────────────┐   │
        │   │ Document Name: [_______________]  Category: [Other ▼]       │   │
        │   │ ☑ Mandatory  [+ Add]                                        │   │
        │   └─────────────────────────────────────────────────────────────┘   │
        └──────────────────────────────────────────────────────────────────────┘
        
        ┌──────────────────────────────────────────────────────────────────────┐
        │ <Footer>                                                (Line ~750) │
        │   [Cancel]  [📧 Send Request (5)]                                   │
        └──────────────────────────────────────────────────────────────────────┘
        
    </DialogContent>
</Dialog>
```

---

# PART 7: SUBMIT ACTION FLOW

**File:** `RequestDocumentsDialog.tsx` (Line 307-340)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  USER CLICKS: [📧 Send Request (5)]                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  handleSubmit()                                                         │
    │  ─────────────────────────────────────────────────────────────────      │
    │                                                                         │
    │  // Collect all slot actions                                            │
    │  const finalActions = [                                                 │
    │    { slotId: "slot-1", action: "LINK", linkedDocumentId: "doc-1" },    │
    │    { slotId: "slot-2", action: "LINK", linkedDocumentId: "doc-2" },    │
    │    { slotId: "slot-3", action: "REQUEST" },                            │
    │    { slotId: "slot-4", action: "REQUEST" },                            │
    │    { slotId: "slot-5", action: "LINK", linkedDocumentId: "doc-3" }     │
    │  ]                                                                      │
    │                                                                         │
    │  // API call                                                            │
    │  POST /document-slots/services/:serviceId/process-actions              │
    │  Body: { actions: finalActions, globalMessage: "..." }                 │
    │                                                                         │
    └─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  BACKEND PROCESSES:                                                     │
    │  ─────────────────────────────────────────────────────────────────      │
    │                                                                         │
    │  For LINK actions:                                                      │
    │    → Update slot status to "SUBMITTED"                                  │
    │    → Link document to slot                                              │
    │                                                                         │
    │  For REQUEST actions:                                                   │
    │    → Update slot status to "REQUESTED"                                  │
    │    → Send notification to client                                        │
    │    → Create document request record                                     │
    │                                                                         │
    └─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  SUCCESS:                                                               │
    │  ─────────────────────────────────────────────────────────────────      │
    │  toast.success("Request sent: 2 documents requested, 3 linked")         │
    │  onSuccess()    → Refresh service details                               │
    │  onOpenChange(false)  → Close dialog                                    │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

# PART 8: STATE MANAGEMENT

**File:** `RequestDocumentsDialog.tsx` (Line 88-99)

```typescript
// Main state variables
const [loading, setLoading] = useState(false)         // Loading indicator
const [submitting, setSubmitting] = useState(false)   // Submit in progress
const [slots, setSlots] = useState<DocumentSlot[]>([]) // All document slots
const [clientDocs, setClientDocs] = useState<ClientDocument[]>([]) // Client's uploaded docs
const [actions, setActions] = useState<Record<string, SlotAction>>({}) // User's choices

// Document library with purposes (NEW for multi-purpose)
const [documentLibrary, setDocumentLibrary] = useState<Array<{
    code: string
    name: string
    category: string
    purposes: string[]  // ← This enables multi-purpose matching!
}>>([])

// Add document form state
const [addDocsOpen, setAddDocsOpen] = useState(false)
const [customDocName, setCustomDocName] = useState("")
const [customDocCategory, setCustomDocCategory] = useState("Other")
const [customDocRequired, setCustomDocRequired] = useState(true)
```

---

# PART 9: TYPE DEFINITIONS

**File:** `RequestDocumentsDialog.tsx` (Line 41-69)

```typescript
interface DocumentSlot {
    id: string
    documentName: string          // e.g., "PAN Card", "Address Proof"
    category: string | null       // e.g., "Identity", "Financial"
    isRequired: boolean           // True = mandatory
    isCustom: boolean             // True = added by PM
    status: string                // "NOT_STARTED", "REQUESTED", "SUBMITTED", etc.
    linkedDocument?: {
        id: string
        fileName: string
        uploadedAt: string
        fileUrl?: string
    } | null
}

interface ClientDocument {
    id: string
    fileName: string              // e.g., "aadhar_scan.pdf"
    fileType: string              // e.g., "application/pdf"
    documentType: string | null   // e.g., "AADHAR_CARD", "PAN_CARD"
    uploadedAt: string
    fileUrl?: string
}

interface SlotAction {
    slotId: string
    action: 'LINK' | 'REQUEST' | 'SKIP'
    linkedDocumentId?: string     // Only for LINK action
}
```

---

# SUMMARY: YOUR SCREENSHOT EXPLAINED

| UI Element | Code Location | Data Source |
|------------|---------------|-------------|
| Header "Document Request" | Line 352-362 | Props: serviceName, clientName |
| "Documents (5)" | Line 376-378 | pendingSlots.length |
| "2 to request • 3 linked" | Line 380-386 | Computed from actions state |
| Blue/Orange circles | Line 406-409 | action.action (LINK=blue, REQUEST=orange) |
| Document names with * | Line 412-425 | slot.documentName, slot.isRequired |
| Category badges | Line 428-431 | slot.category |
| [Link ▼] / [Request ▼] | Line 435-460 | Select component with actions |
| [👁 Screensh... ▼] | Line 463-480 | Popover for document selection |
| "+ Add More Documents" | Line ~650 | Collapsible form |
| [Send Request (5)] | Line ~760 | Button → handleSubmit() |

---

**File Reference:** `apps/web/components/services/RequestDocumentsDialog.tsx`
**Total Lines:** 771
**Last Updated:** 2025-12-31
