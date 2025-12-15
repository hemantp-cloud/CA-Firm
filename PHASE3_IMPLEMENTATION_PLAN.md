# 🚀 PHASE 3: BACKEND REFACTORING PLAN

**Status:** IN PROGRESS  
**Started:** December 5, 2025, 4:16 PM IST

---

## 📋 CRITICAL FILES TO UPDATE

### **Priority 1: Authentication & Core** (CRITICAL - App won't work without these)

1. **`auth.service.ts`** - Login logic (checks old `users` table)
   - Update login() to check all 5 tables
   - Update verifyOTP() to check all 5 tables
   - Update all helper functions
   - Update getRedirectUrl() for new roles

2. **`auth.types.ts`** - Type definitions
   - Update Role enum
   - Update AuthenticatedUser interface

3. **`middleware/auth.ts`** - JWT verification
   - Update to handle new role names

---

### **Priority 2: Admin Module** (HIGH - User management)

4. **`admin.service.ts`** - Dashboard & user management
   - Update getDashboardStats() - query new tables
   - Update createUser() - create in correct table based on role
   - Update getUsers() - query all 5 tables
   - Update getUserById() - check all 5 tables
   - Update updateUser() - update correct table
   - Update deleteUser() - delete from correct table

5. **`admin.controller.ts`** - API endpoints
   - Update all endpoints

---

### **Priority 3: Role-Specific Modules** (MEDIUM)

6. **Rename `ca/` folder → `project-manager/`**
7. **Rename `trainee/` folder → `team-member/`**
8. **Update `client/` module** - references to old roles

---

## 🎯 PHASE 3 APPROACH

Due to the complexity, I'll break this into **sub-phases**:

### **Sub-Phase 3A: Authentication (30 min)**
- Update auth.service.ts
- Update auth.types.ts
- Test login works

### **Sub-Phase 3B: Admin Module (1 hour)**
- Update admin.service.ts
- Update admin.controller.ts
- Test user creation works

### **Sub-Phase 3C: Rename Modules (1 hour)**
- Rename ca → project-manager
- Rename trainee → team-member
- Update all imports

### **Sub-Phase 3D: Testing (30 min)**
- Test all endpoints
- Fix any errors
- Verify functionality

---

## ⚠️ RECOMMENDATION

**This is a LARGE refactoring (80+ files, 3000+ lines).**

**I recommend we do this in stages:**

1. **First:** Fix authentication so you can login
2. **Then:** Fix admin module so you can create users
3. **Then:** Rename modules
4. **Finally:** Test everything

**Each stage will be tested before moving to next.**

**This will take 3-4 hours of focused work.**

---

## 🤔 YOUR DECISION

**Option A:** Proceed with full Phase 3 now (3-4 hours)
**Option B:** Do Sub-Phase 3A only (authentication) so you can login, then pause
**Option C:** Manual approach - I create detailed guides, you make changes

**Which option do you prefer?**

