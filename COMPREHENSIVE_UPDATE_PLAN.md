# 🔄 COMPREHENSIVE UPDATE PLAN - CA/Trainee → Project Manager/Team Member

**Date:** December 6, 2025, 5:30 PM IST

---

## 📊 **WHAT NEEDS TO BE UPDATED:**

### **1. Folder Renaming:**
```
❌ /admin/ca/              → ✅ /admin/project-managers/
❌ /admin/trainees/        → ✅ /admin/team-members/
```

### **2. Navigation Menu Updates:**
**File:** `apps/web/app/(admin)/layout.tsx`
- Line 37: Change "CAs" → "Project Managers"
- Line 37: Change href "/admin/ca" → "/admin/project-managers"
- Line 39: Change href "/admin/trainees" → "/admin/team-members"

### **3. Code References to Update:**

#### **CA → Project Managers:**
Files with `/admin/ca` references (23 occurrences):
- layout.tsx
- admin/ca/new/page.tsx
- admin/ca/page.tsx
- admin/ca/[id]/page.tsx
- admin/dashboard/page.tsx
- admin/client/[id]/edit/page.tsx

#### **Trainees → Team Members:**
Files with `/admin/trainees` references (20 occurrences):
- layout.tsx
- admin/trainees/page.tsx
- admin/trainees/new/page.tsx
- admin/trainees/[id]/page.tsx
- admin/trainees/[id]/assign-clients/page.tsx
- admin/trainees/create/page.tsx
- admin/dashboard/page.tsx

---

## 🎯 **IMPLEMENTATION STRATEGY:**

### **Option A: Rename Folders (Recommended)**
1. Rename `/admin/ca/` → `/admin/project-managers/`
2. Rename `/admin/trainees/` → `/admin/team-members/`
3. Update all code references
4. Test everything

### **Option B: Keep Folders, Update References Only**
1. Keep folder names as is
2. Update only navigation labels
3. Update only display text
4. (Not recommended - causes confusion)

---

## ✅ **RECOMMENDED APPROACH:**

**I will:**
1. ✅ Update navigation menu in layout.tsx
2. ✅ Update all href references from `/admin/ca` → `/admin/project-managers`
3. ✅ Update all href references from `/admin/trainees` → `/admin/team-members`
4. ✅ Rename folders to match new naming
5. ✅ Update all labels and display text

**This ensures:**
- Consistent naming throughout
- No confusion between old/new terms
- Clean, professional codebase
- Easy to maintain

---

## 📋 **FILES TO UPDATE:**

### **High Priority:**
1. `(admin)/layout.tsx` - Navigation menu
2. `(admin)/admin/dashboard/page.tsx` - Quick actions
3. All CA folder files
4. All trainees folder files

### **Medium Priority:**
5. Client edit page (CA dropdown)
6. Any service-related pages

---

**Status:** 🟡 Ready to implement
**Estimated Time:** 15-20 minutes
**Risk Level:** 🟢 Low (just renaming and updating references)

---

**Shall I proceed with the complete update?**
