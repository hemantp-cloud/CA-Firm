-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TRAINEE';

-- CreateTable
CREATE TABLE "client_assignments" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_assignments_traineeId_idx" ON "client_assignments"("traineeId");

-- CreateIndex
CREATE INDEX "client_assignments_clientId_idx" ON "client_assignments"("clientId");

-- CreateIndex
CREATE INDEX "client_assignments_assignedBy_idx" ON "client_assignments"("assignedBy");

-- CreateIndex
CREATE UNIQUE INDEX "client_assignments_traineeId_clientId_key" ON "client_assignments"("traineeId", "clientId");

-- AddForeignKey
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
