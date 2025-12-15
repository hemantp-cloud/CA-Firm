/*
  Warnings:

  - You are about to drop the column `isApproved` on the `documents` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'REVIEWING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- DropIndex
DROP INDEX "documents_isApproved_idx";

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "documentId" TEXT;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "isApproved",
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "folderPath" TEXT,
ADD COLUMN     "hiddenFrom" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "uploadStatus" TEXT NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "activity_logs_documentId_idx" ON "activity_logs"("documentId");

-- CreateIndex
CREATE INDEX "documents_uploadStatus_idx" ON "documents"("uploadStatus");

-- CreateIndex
CREATE INDEX "documents_assignedTo_idx" ON "documents"("assignedTo");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
