# 🔍 Admin Portal: Deep Scan & Status Report
**Date:** December 8, 2025
**Status:** ⚠️ PARTIALLY FUNCTIONAL / CRITICAL BUGS

## 1. 🚨 Critical Issues (Immediate Fixes Required)

### A. CA / Project Manager Management
*   **Issue:** The `/api/admin/ca` endpoint returns **Clients**, not Project Managers.
*   **Cause:** It re-uses `getAllClients` which filters by `role: 'CLIENT'`.
*   **Impact:** Admin cannot see or manage CAs/Project Managers correctly. The "CA" tab displays Clients.
*   **Fix:** dedicated handler for `/admin/ca` filtering by `role: 'PROJECT_MANAGER'`.

### B. Client & CA Creation/Deletion
*   **Issue:** Creating or Deleting a Client/CA throws a server error.
*   **Cause:** `admin.routes.ts` calls `createClient` and `deleteClient` in `admin.service.ts`, which are marked `@deprecated` and explicitly **throw errors**.
*   **Impact:** Admin cannot onboard new users or remove them.
*   **Fix:** Refactor routes to call `createUser` and `deleteUser` directly.

### C. Missing Features (Placeholders)
*   **Services Tab:** Returns empty list. Endpoint `/api/admin/services` is a placeholder.
*   **Documents Tab:** Returns empty list. Endpoint `/api/admin/documents` is a placeholder.
*   **Invoices:** Likely incorrect or missing integration.

## 2. ✅ Working Features
*   **Dashboard Stats:** `getDashboardStats` seems implemented (needs verification of logic).
*   **Client List:** Displays clients (though mixed up with CA route issue).
*   **Team Member List:** `/api/admin/team-members` is implemented correctly (filters `role: 'TEAM_MEMBER'`).

## 3. 🔄 Hierarchy & Sync Status
*   **Super Admin -> Admin:** Working.
*   **Admin -> Project Manager:** **BROKEN** (Due to Issue A). sync mechanism (viewing PM's clients) is not exposed effectively.
*   **Admin -> Client:** **BROKEN Creation**, Viewing works.
*   **Admin -> Services/Docs:** **BROKEN** (Placeholders).

## 4. 🛠 Implementation Plan (Next Steps)
1.  **Refactor `admin.routes.ts`**:
    *   Separate `clientRouter` and `caRouter` logic.
    *   Fix Create/Delete to use `createUser`/`deleteUser`.
    *   Connect `/services` to `services.service.ts` (Admin view all).
    *   Connect `/documents` to `documents.service.ts`.
2.  **Verify Dashboard Logic**: Ensure counts pull from `Client`, `ProjectManager`, `TeamMember`, `Service` tables correctly.
3.  **Frontend Verification**: After API fixes, click through all Admin tabs to confirm data loads.

---
**Recommendation:** Proceed immediately with **Step 1: Refactor `admin.routes.ts`** to restore basic functionality.
