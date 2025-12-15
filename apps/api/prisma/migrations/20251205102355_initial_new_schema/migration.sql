/*
  Warnings:

  - The values [CA,TRAINEE] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `traineeId` on the `client_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `commission` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `services` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[teamMemberId,clientId]` on the table `client_assignments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[firmId,email]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamMemberId` to the `client_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByRole` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managedBy` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clientId` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Made the column `clientId` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clientId` on table `services` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT');
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "client_assignments" DROP CONSTRAINT "client_assignments_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "client_assignments" DROP CONSTRAINT "client_assignments_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_assignments" DROP CONSTRAINT "client_assignments_traineeId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_userId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_clientId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_userId_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_clientId_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_userId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_clientId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_firmId_fkey";

-- DropIndex
DROP INDEX "client_assignments_traineeId_clientId_key";

-- DropIndex
DROP INDEX "client_assignments_traineeId_idx";

-- DropIndex
DROP INDEX "clients_isActive_idx";

-- DropIndex
DROP INDEX "documents_userId_idx";

-- DropIndex
DROP INDEX "invoices_userId_idx";

-- DropIndex
DROP INDEX "services_userId_idx";

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "userType" TEXT;

-- AlterTable
ALTER TABLE "client_assignments" DROP COLUMN "traineeId",
ADD COLUMN     "teamMemberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "commission",
DROP COLUMN "notes",
ADD COLUMN     "aadhar" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "createdByRole" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "managedBy" TEXT NOT NULL,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3),
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "userId",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "teamMemberId" TEXT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "userId",
ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "services" DROP COLUMN "userId",
ADD COLUMN     "projectManagerId" TEXT,
ALTER COLUMN "clientId" SET NOT NULL;

-- DropTable
DROP TABLE "users";

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_firmId_key" ON "super_admins"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "super_admins_firmId_idx" ON "super_admins"("firmId");

-- CreateIndex
CREATE INDEX "super_admins_email_idx" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_firmId_idx" ON "admins"("firmId");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_createdBy_idx" ON "admins"("createdBy");

-- CreateIndex
CREATE INDEX "admins_deletedAt_idx" ON "admins"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admins_firmId_email_key" ON "admins"("firmId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "project_managers_email_key" ON "project_managers"("email");

-- CreateIndex
CREATE INDEX "project_managers_firmId_idx" ON "project_managers"("firmId");

-- CreateIndex
CREATE INDEX "project_managers_email_idx" ON "project_managers"("email");

-- CreateIndex
CREATE INDEX "project_managers_createdBy_idx" ON "project_managers"("createdBy");

-- CreateIndex
CREATE INDEX "project_managers_deletedAt_idx" ON "project_managers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_managers_firmId_email_key" ON "project_managers"("firmId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");

-- CreateIndex
CREATE INDEX "team_members_firmId_idx" ON "team_members"("firmId");

-- CreateIndex
CREATE INDEX "team_members_email_idx" ON "team_members"("email");

-- CreateIndex
CREATE INDEX "team_members_createdBy_idx" ON "team_members"("createdBy");

-- CreateIndex
CREATE INDEX "team_members_deletedAt_idx" ON "team_members"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_firmId_email_key" ON "team_members"("firmId", "email");

-- CreateIndex
CREATE INDEX "activity_logs_userType_idx" ON "activity_logs"("userType");

-- CreateIndex
CREATE INDEX "client_assignments_teamMemberId_idx" ON "client_assignments"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "client_assignments_teamMemberId_clientId_key" ON "client_assignments"("teamMemberId", "clientId");

-- CreateIndex
CREATE INDEX "clients_managedBy_idx" ON "clients"("managedBy");

-- CreateIndex
CREATE INDEX "clients_createdBy_idx" ON "clients"("createdBy");

-- CreateIndex
CREATE INDEX "clients_deletedAt_idx" ON "clients"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "clients_firmId_email_key" ON "clients"("firmId", "email");

-- CreateIndex
CREATE INDEX "documents_clientId_idx" ON "documents"("clientId");

-- CreateIndex
CREATE INDEX "documents_teamMemberId_idx" ON "documents"("teamMemberId");

-- CreateIndex
CREATE INDEX "services_projectManagerId_idx" ON "services"("projectManagerId");

-- AddForeignKey
ALTER TABLE "super_admins" ADD CONSTRAINT "super_admins_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_managers" ADD CONSTRAINT "project_managers_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_managedBy_fkey" FOREIGN KEY ("managedBy") REFERENCES "project_managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "project_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
