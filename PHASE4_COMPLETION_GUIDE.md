# 📘 PHASE 4 COMPLETION GUIDE - FRONTEND REFACTORING

**Estimated Time:** 4-5 hours  
**Complexity:** Medium  
**Files to Update:** ~50-70 files

---

## 🎯 OBJECTIVE

Update all frontend code to use new role names and route paths:
- `CA` → `PROJECT_MANAGER`
- `TRAINEE` → `TEAM_MEMBER`
- `/ca/` → `/project-manager/`
- `/trainee/` → `/team-member/`

---

## ✅ ALREADY COMPLETED

1. ✅ Route groups renamed:
   - `app/(ca)` → `app/(project-manager)`
   - `app/(trainee)` → `app/(team-member)`

2. ✅ Middleware updated:
   - `apps/web/middleware.ts` - All role checks updated

---

## 📋 STEP-BY-STEP GUIDE

### **STEP 1: Global Find & Replace (15 minutes)**

Use your IDE's global find & replace feature:

#### **Replace Route Paths:**
1. Find: `/ca/` → Replace: `/project-manager/`
2. Find: `/trainee/` → Replace: `/team-member/`
3. Find: `/trainees/` → Replace: `/team-members/`

#### **Replace Role Names:**
1. Find: `"CA"` → Replace: `"PROJECT_MANAGER"`
2. Find: `'CA'` → Replace: `'PROJECT_MANAGER'`
3. Find: `"TRAINEE"` → Replace: `"TEAM_MEMBER"`
4. Find: `'TRAINEE'` → Replace: `'TEAM_MEMBER'`

#### **Replace UI Text:**
1. Find: `"CA"` (in UI text) → Replace: `"Project Manager"`
2. Find: `"Trainee"` → Replace: `"Team Member"`
3. Find: `"Trainees"` → Replace: `"Team Members"`

**Directories to search:**
- `apps/web/app/`
- `apps/web/components/`
- `apps/web/lib/`

---

### **STEP 2: Update Specific Files (2-3 hours)**

#### **A. Layout Files**

**File:** `apps/web/app/(project-manager)/layout.tsx`
```typescript
// Update navigation links
const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/project-manager/dashboard" },
  { icon: UserCircle, label: "Clients", href: "/project-manager/clients" },
  { icon: Users, label: "Team Members", href: "/project-manager/team-members" }, // Changed from Trainees
  { icon: Briefcase, label: "Services", href: "/project-manager/services" },
  { icon: FileText, label: "Documents", href: "/project-manager/documents" },
  { icon: CreditCard, label: "Invoices", href: "/project-manager/invoices" },
  { icon: User, label: "Profile", href: "/project-manager/profile" },
]

// Update title
<title>Project Manager Portal</title>
```

**File:** `apps/web/app/(team-member)/layout.tsx`
```typescript
// Update navigation links
const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/team-member/dashboard" },
  { icon: Briefcase, label: "Services", href: "/team-member/services" },
  { icon: FileText, label: "Documents", href: "/team-member/documents" },
  { icon: UserCircle, label: "Clients", href: "/team-member/clients" },
  { icon: User, label: "Profile", href: "/team-member/profile" },
]

// Update title and role display
<title>Team Member Portal</title>
```

---

#### **B. API Calls**

**Pattern to find:** `api.get("/ca/...)`  
**Replace with:** `api.get("/project-manager/...)`

**Pattern to find:** `api.get("/trainee/...)`  
**Replace with:** `api.get("/team-member/...)`

**Files with API calls (search in):**
- `apps/web/app/(project-manager)/*/page.tsx`
- `apps/web/app/(team-member)/*/page.tsx`
- `apps/web/components/**/*.tsx`

---

#### **C. Link Components**

**Pattern to find:** `<Link href="/ca/...`  
**Replace with:** `<Link href="/project-manager/...`

**Pattern to find:** `<Link href="/trainee/...`  
**Replace with:** `<Link href="/team-member/...`

**Example:**
```typescript
// Before
<Link href="/ca/dashboard">Dashboard</Link>
<Link href="/ca/trainees">Trainees</Link>

// After
<Link href="/project-manager/dashboard">Dashboard</Link>
<Link href="/project-manager/team-members">Team Members</Link>
```

---

#### **D. Router Navigation**

**Pattern to find:** `router.push("/ca/...)`  
**Replace with:** `router.push("/project-manager/...)`

**Pattern to find:** `router.push("/trainee/...)`  
**Replace with:** `router.push("/team-member/...)`

**Example:**
```typescript
// Before
router.push("/ca/services")
router.push("/trainee/dashboard")

// After
router.push("/project-manager/services")
router.push("/team-member/dashboard")
```

---

#### **E. Rename Nested Folders**

**Project Manager Module:**
```powershell
# Rename trainees folder to team-members
cd "apps\web\app\(project-manager)"
Move-Item -Path "ca\trainees" -Destination "project-manager\team-members"

# Or manually rename in file explorer:
# apps/web/app/(project-manager)/ca/trainees → project-manager/team-members
```

**Then move all files from `ca/` to `project-manager/`:**
```powershell
# Move all subfolders
Move-Item -Path "ca\*" -Destination "project-manager\"
# Remove empty ca folder
Remove-Item -Path "ca" -Force
```

---

### **STEP 3: Update Type Definitions (30 minutes)**

**File:** `apps/web/types/index.ts` (or similar)

```typescript
// Update Role enum
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  PROJECT_MANAGER = "PROJECT_MANAGER", // was CA
  TEAM_MEMBER = "TEAM_MEMBER",         // was TRAINEE
  CLIENT = "CLIENT",
}

// Update User type
export interface User {
  id: string
  email: string
  name: string
  role: Role
  firmId: string
  // Remove clientId if present
}
```

---

### **STEP 4: Update UI Text (1 hour)**

Search for these terms in UI components and update:

**Role Display Names:**
- "CA" → "Project Manager"
- "CA Portal" → "Project Manager Portal"
- "Trainee" → "Team Member"
- "Trainee Portal" → "Team Member Portal"

**Navigation Labels:**
- "Trainees" → "Team Members"
- "CA Dashboard" → "Project Manager Dashboard"

**Form Labels:**
- "CA Name" → "Project Manager Name"
- "Assign Trainee" → "Assign Team Member"

**Breadcrumbs:**
- "CA / Dashboard" → "Project Manager / Dashboard"
- "Trainee / Services" → "Team Member / Services"

---

### **STEP 5: Update Admin Module (1 hour)**

**File:** `apps/web/app/(admin)/*/page.tsx`

Update any references to creating/managing CAs and Trainees:

```typescript
// Before
<option value="CA">CA</option>
<option value="TRAINEE">Trainee</option>

// After
<option value="PROJECT_MANAGER">Project Manager</option>
<option value="TEAM_MEMBER">Team Member</option>
```

Update API calls:
```typescript
// API calls should work as-is since backend handles both old and new endpoints
// But update for clarity:
const response = await api.get("/admin/users?role=PROJECT_MANAGER")
```

---

### **STEP 6: Testing Checklist (1 hour)**

After completing updates, test:

#### **Authentication:**
- [ ] Login as Super Admin
- [ ] Login as Admin
- [ ] Login as Project Manager
- [ ] Login as Team Member
- [ ] Login as Client

#### **Navigation:**
- [ ] All navigation links work
- [ ] Breadcrumbs display correctly
- [ ] Role-based redirects work

#### **CRUD Operations:**
- [ ] Create user (all roles)
- [ ] View user list
- [ ] Update user
- [ ] Delete user

#### **Role-Specific Features:**
- [ ] Project Manager can manage clients
- [ ] Project Manager can manage team members
- [ ] Team Member can view assigned tasks
- [ ] Client can view their services

---

## 🔍 SEARCH PATTERNS

Use these regex patterns in your IDE:

### **Find API Endpoints:**
```regex
api\.(get|post|put|delete)\(['"](/ca/|/trainee/)
```

### **Find Route Links:**
```regex
href=['"](/ca/|/trainee/)
```

### **Find Router Navigation:**
```regex
router\.push\(['"](/ca/|/trainee/)
```

### **Find Role Checks:**
```regex
(role|userRole)\s*===?\s*['"](CA|TRAINEE)['"]
```

---

## ⚠️ COMMON PITFALLS

1. **Don't replace "CA" in:**
   - Company names (e.g., "CA Firm Management")
   - File paths that are already correct
   - Comments explaining old vs new

2. **Case sensitivity:**
   - API endpoints: `/project-manager/` (lowercase with hyphen)
   - Role enums: `PROJECT_MANAGER` (uppercase with underscore)
   - UI text: "Project Manager" (title case with space)

3. **Backward compatibility:**
   - Backend still supports `/ca/` endpoints for now
   - But update frontend to use new endpoints

---

## 📊 PROGRESS TRACKING

Use this checklist:

### **Files Updated:**
- [ ] `middleware.ts` ✅ (Already done)
- [ ] `app/(project-manager)/layout.tsx`
- [ ] `app/(team-member)/layout.tsx`
- [ ] All page files in `(project-manager)/`
- [ ] All page files in `(team-member)/`
- [ ] All page files in `(admin)/`
- [ ] All components in `components/`
- [ ] Type definitions in `types/`

### **Features Tested:**
- [ ] Authentication
- [ ] Navigation
- [ ] User management
- [ ] Role-specific features

---

## 🚀 QUICK START

**Fastest approach:**

1. **Use IDE's Find & Replace** (15 min)
   - Replace all `/ca/` with `/project-manager/`
   - Replace all `/trainee/` with `/team-member/`

2. **Manual Review** (30 min)
   - Check layout files
   - Check navigation components
   - Check role displays

3. **Test** (30 min)
   - Login
   - Navigate
   - Create/update users

4. **Fix Bugs** (1-2 hours)
   - Fix any broken links
   - Fix any API calls
   - Fix any UI text

**Total:** 2-3 hours (faster than 4-5 hours)

---

## 💡 TIPS

1. **Use version control:**
   ```bash
   git add .
   git commit -m "Phase 4: Frontend refactoring in progress"
   ```

2. **Test incrementally:**
   - Update one module at a time
   - Test before moving to next

3. **Keep notes:**
   - Track which files you've updated
   - Note any issues found

---

## 📞 HELP

If you encounter issues:

1. **Check backend first:**
   - Ensure backend is running
   - Test API endpoints with Postman

2. **Check browser console:**
   - Look for 404 errors (wrong endpoints)
   - Look for auth errors

3. **Check middleware:**
   - Ensure role names match
   - Ensure routes are correct

---

**Good luck with Phase 4! You've got this!** 🚀

