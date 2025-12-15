-- ============================================
-- COMPLETE DATABASE RESET & NEW SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor
-- This will DROP ALL TABLES and create new schema
-- ============================================

-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

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

-- Drop old enums if they exist
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "ServiceStatus" CASCADE;
DROP TYPE IF EXISTS "ServiceType" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;
DROP TYPE IF EXISTS "DocumentType" CASCADE;
DROP TYPE IF EXISTS "DocumentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;

-- ============================================
-- STEP 2: CREATE ENUMS
-- ============================================

CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT');
CREATE TYPE "ServiceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ServiceType" AS ENUM ('ITR_FILING', 'GST_REGISTRATION', 'GST_RETURN', 'TDS_RETURN', 'TDS_COMPLIANCE', 'ROC_FILING', 'AUDIT', 'BOOK_KEEPING', 'PAYROLL', 'CONSULTATION', 'OTHER');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "DocumentType" AS ENUM ('PAN_CARD', 'AADHAR_CARD', 'BANK_STATEMENT', 'FORM_16', 'FORM_26AS', 'GST_CERTIFICATE', 'INCORPORATION_CERTIFICATE', 'PARTNERSHIP_DEED', 'MOA_AOA', 'AUDIT_REPORT', 'BALANCE_SHEET', 'PROFIT_LOSS', 'TAX_RETURN', 'OTHER');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'REVIEWING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'UPI', 'NEFT', 'RTGS', 'CARD', 'BANK_TRANSFER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- ============================================
-- STEP 3: CREATE TABLES
-- ============================================

-- Firms table
CREATE TABLE "firms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "firms_email_key" ON "firms"("email");
CREATE INDEX "firms_email_idx" ON "firms"("email");

-- Super Admins table (Main Admin - Owner)
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "super_admins_firmId_key" ON "super_admins"("firmId");
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");
CREATE UNIQUE INDEX "super_admins_firmId_email_key" ON "super_admins"("firmId", "email");
CREATE INDEX "super_admins_firmId_idx" ON "super_admins"("firmId");
CREATE INDEX "super_admins_email_idx" ON "super_admins"("email");

-- Admins table (Regular Admins)
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE UNIQUE INDEX "admins_firmId_email_key" ON "admins"("firmId", "email");
CREATE INDEX "admins_firmId_idx" ON "admins"("firmId");
CREATE INDEX "admins_email_idx" ON "admins"("email");
CREATE INDEX "admins_createdBy_idx" ON "admins"("createdBy");
CREATE INDEX "admins_deletedAt_idx" ON "admins"("deletedAt");

-- Project Managers table (was CAs)
CREATE TABLE "project_managers" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "gstin" TEXT,
    "commission" DECIMAL(5,2),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "project_managers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_managers_email_key" ON "project_managers"("email");
CREATE UNIQUE INDEX "project_managers_firmId_email_key" ON "project_managers"("firmId", "email");
CREATE INDEX "project_managers_firmId_idx" ON "project_managers"("firmId");
CREATE INDEX "project_managers_email_idx" ON "project_managers"("email");
CREATE INDEX "project_managers_createdBy_idx" ON "project_managers"("createdBy");
CREATE INDEX "project_managers_deletedAt_idx" ON "project_managers"("deletedAt");

-- Team Members table (was Trainees)
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mentorId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");
CREATE UNIQUE INDEX "team_members_firmId_email_key" ON "team_members"("firmId", "email");
CREATE INDEX "team_members_firmId_idx" ON "team_members"("firmId");
CREATE INDEX "team_members_email_idx" ON "team_members"("email");
CREATE INDEX "team_members_createdBy_idx" ON "team_members"("createdBy");
CREATE INDEX "team_members_deletedAt_idx" ON "team_members"("deletedAt");

-- Clients table (End Customers)
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "managedBy" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "pan" TEXT,
    "aadhar" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "gstin" TEXT,
    "companyName" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");
CREATE UNIQUE INDEX "clients_firmId_email_key" ON "clients"("firmId", "email");
CREATE INDEX "clients_firmId_idx" ON "clients"("firmId");
CREATE INDEX "clients_managedBy_idx" ON "clients"("managedBy");
CREATE INDEX "clients_email_idx" ON "clients"("email");
CREATE INDEX "clients_createdBy_idx" ON "clients"("createdBy");
CREATE INDEX "clients_deletedAt_idx" ON "clients"("deletedAt");

-- ============================================
-- STEP 4: ADD FOREIGN KEYS
-- ============================================

ALTER TABLE "super_admins" ADD CONSTRAINT "super_admins_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admins" ADD CONSTRAINT "admins_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admins" ADD CONSTRAINT "admins_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_managers" ADD CONSTRAINT "project_managers_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_managedBy_fkey" FOREIGN KEY ("managedBy") REFERENCES "project_managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- STEP 5: INSERT INITIAL DATA
-- ============================================

-- Insert Firm
INSERT INTO "firms" ("id", "name", "email", "phone", "address", "gstin", "pan", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'CA Firm Management',
  'info@cafirm.com',
  '+91-9876543210',
  '123 Business Street, Financial District',
  '27AABCU9603R1ZX',
  'AABCU9603R',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert Super Admin
-- Password: pandey3466@ (hashed with bcrypt)
INSERT INTO "super_admins" (
  "id",
  "firmId",
  "email",
  "password",
  "name",
  "isActive",
  "emailVerified",
  "mustChangePassword",
  "twoFactorEnabled",
  "failedLoginAttempts",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  (SELECT "id" FROM "firms" WHERE "email" = 'info@cafirm.com' LIMIT 1),
  'hemant.p10x.in',
  '$2b$10$YourHashedPasswordHere', -- You'll need to hash 'pandey3466@' with bcrypt
  'Hemant Pandey',
  true,
  true,
  false,
  false,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================
-- DONE!
-- ============================================

SELECT 'Database reset complete! New schema applied.' AS status;
SELECT 'Firm created: CA Firm Management' AS info;
SELECT 'Super Admin created: hemant.p10x.in' AS info;
SELECT 'Password: pandey3466@' AS info;
