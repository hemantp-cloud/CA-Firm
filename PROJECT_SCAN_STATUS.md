# 🔍 PROJECT SCAN - WHAT EXISTS & WHAT NEEDS UPDATING

**Scan Date:** December 6, 2025, 5:27 PM IST

---

## 📊 **CURRENT STRUCTURE:**

### **Frontend (apps/web/app):**

```
✅ super-admin/          - COMPLETE (just built)
   ├── dashboard/
   ├── admins/
   ├── project-managers/
   ├── team-members/
   ├── clients/
   ├── audit-logs/
   └── settings/firm/

⚠️ (admin)/admin/        - EXISTS but uses OLD naming
   ├── dashboard/
   ├── ca/              ❌ Should be: project-managers/
   ├── trainees/        ❌ Should be: team-members/
   ├── client/          ✅ Correct
   ├── services/
   ├── documents/
   ├── invoices/
   ├── reports/
   ├── activity/
   └── settings/

❓ (project-manager)/    - Need to check
❓ (team-member)/        - Need to check
❓ (client)/             - Need to check
```

---

## 🎯 **WHAT NEEDS TO BE DONE:**

### **1. Admin Portal Updates:**
- ✅ Rename `/admin/ca/` → `/admin/project-managers/`
- ✅ Rename `/admin/trainees/` → `/admin/team-members/`
- ✅ Update all references in code
- ✅ Update navigation links
- ✅ Update API calls

### **2. Check Other Portals:**
- Project Manager portal
- Team Member portal
- Client portal

### **3. Backend Updates:**
- Check if admin.service.ts needs updates
- Update any old references (CA → PROJECT_MANAGER, TRAINEE → TEAM_MEMBER)

---

## 📋 **ACTION PLAN:**

1. **Scan all portals** to see what exists
2. **Rename folders** from old to new naming
3. **Update all code references**
4. **Update navigation menus**
5. **Update API endpoints**
6. **Test everything**

---

**Status:** 🟡 Scanning in progress...
