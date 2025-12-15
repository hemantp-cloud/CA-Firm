# 🚀 MANUAL DATABASE MIGRATION GUIDE

**Status:** Phase 2 - Database Migration  
**Approach:** Manual (due to Supabase connection issues)  
**Time Required:** 15-20 minutes

---

## ⚠️ IMPORTANT

We encountered connection issues with automated migration. This guide will help you complete the migration manually using Supabase's SQL Editor.

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Open Supabase SQL Editor**

1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

---

### **STEP 2: Run Database Reset SQL**

**Copy and paste this SQL into the editor:**

```sql
-- Drop all existing tables
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "client_assignments" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "invoice_items" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "team_members" CASCADE;
DROP TABLE IF EXISTS "project_managers" CASCADE;
DROP TABLE IF EXISTS "admins" CASCADE;
DROP TABLE IF EXISTS "super_admins" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "firms" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "ServiceStatus" CASCADE;
DROP TYPE IF EXISTS "ServiceType" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;
DROP TYPE IF EXISTS "DocumentType" CASCADE;
DROP TYPE IF EXISTS "DocumentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
```

**Click "RUN"** and wait for completion.

---

### **STEP 3: Apply New Schema Using Prisma**

**Back in your terminal, run:**

```powershell
cd "C:\Users\admin\OneDrive\Desktop\CA Firm Management\apps\api"
npx prisma db push --accept-data-loss
```

**This will:**
- Create all new tables (super_admins, admins, project_managers, team_members, clients)
- Create all enums with new values
- Set up all foreign keys and indexes

**Wait for:** "✔ Your database is now in sync with your Prisma schema"

---

### **STEP 4: Generate Prisma Client**

```powershell
npx prisma generate
```

**Wait for:** "✔ Generated Prisma Client"

---

### **STEP 5: Create Initial Data (Firm + Super Admin)**

```powershell
npx ts-node scripts/setup-initial-data.ts
```

**This will create:**
- ✅ Firm: CA Firm Management
- ✅ Super Admin: hemant.p10x.in (password: pandey3466@)

---

### **STEP 6: Verify in Prisma Studio**

```powershell
npx prisma studio
```

**Check:**
1. Open `firms` table → Should have 1 record
2. Open `super_admins` table → Should have 1 record (hemant.p10x.in)
3. Other tables (admins, project_managers, team_members, clients) → Should be empty

---

### **STEP 7: Test Login**

1. Start your application:
   ```powershell
   npm run dev
   ```

2. Open browser: `http://localhost:3000`

3. Login with:
   - **Email:** hemant.p10x.in
   - **Password:** pandey3466@

4. You should be redirected to Super Admin dashboard

---

## ✅ SUCCESS CRITERIA

Migration is successful when:

- ✅ All old tables dropped
- ✅ New tables created (5 role tables)
- ✅ Firm record exists
- ✅ Super Admin can login
- ✅ No errors in console

---

## 🔧 TROUBLESHOOTING

### **Issue: "Table already exists"**

**Solution:** Run STEP 2 again to drop all tables

---

### **Issue: "Cannot connect to database"**

**Solution:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Check Supabase project is running
3. Check your internet connection

---

### **Issue: "Prisma Client not generated"**

**Solution:**
```powershell
npx prisma generate --force
```

---

### **Issue: "Login fails"**

**Solution:**
1. Check Prisma Studio - verify super_admin record exists
2. Check password is exactly: `pandey3466@`
3. Check email is exactly: `hemant.p10x.in`

---

## 📞 NEXT STEPS AFTER SUCCESSFUL MIGRATION

Once you can login as Super Admin:

1. **Create other users** from Super Admin dashboard:
   - Regular Admins
   - Project Managers
   - Team Members
   - Clients

2. **Update backend code** (Phase 3):
   - Rename CA → PROJECT_MANAGER in all files
   - Rename TRAINEE → TEAM_MEMBER in all files
   - Update API endpoints
   - Update services

3. **Update frontend code** (Phase 4):
   - Update routes
   - Update components
   - Update UI text

---

## 🎯 CURRENT STATUS

- ✅ **Phase 1:** Schema created
- ⏳ **Phase 2:** Manual migration (YOU ARE HERE)
- ⏸️ **Phase 3:** Backend refactoring (waiting)
- ⏸️ **Phase 4:** Frontend refactoring (waiting)

---

## 💡 TIPS

1. **Take your time** - Don't rush through the steps
2. **Verify each step** - Check Prisma Studio after each step
3. **Save your work** - Keep terminal output for reference
4. **Ask for help** - If stuck, let me know which step failed

---

**Ready to proceed? Start with STEP 1!** 🚀

