/*
  Warnings:

  - A unique constraint covering the columns `[userId,roomId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Vote_userId_photoId_key";

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "roomId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_roomId_key" ON "Vote"("userId", "roomId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
