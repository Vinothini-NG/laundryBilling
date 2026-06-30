ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_assignedToId_idx" ON "Order"("assignedToId");
