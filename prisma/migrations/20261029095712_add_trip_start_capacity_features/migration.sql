-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TripCompanion" (
    "tripId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "TripCompanion_pkey" PRIMARY KEY ("tripId","teamMemberId")
);

-- CreateIndex
CREATE INDEX "TripCompanion_teamMemberId_idx" ON "TripCompanion"("teamMemberId");

-- CreateIndex
CREATE INDEX "Trip_startDate_idx" ON "Trip"("startDate");

-- AddForeignKey
ALTER TABLE "TripCompanion" ADD CONSTRAINT "TripCompanion_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCompanion" ADD CONSTRAINT "TripCompanion_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
