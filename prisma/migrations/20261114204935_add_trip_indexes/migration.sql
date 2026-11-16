-- CreateIndex
CREATE INDEX "Trip_isPublished_createdAt_idx" ON "Trip"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Trip_isPublished_price_idx" ON "Trip"("isPublished", "price");
