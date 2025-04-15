/*
  Warnings:

  - The primary key for the `Media` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `Media` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "_MediaToProject" DROP CONSTRAINT "_MediaToProject_A_fkey";

-- AlterTable
ALTER TABLE "Media" DROP CONSTRAINT "Media_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Media_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "_MediaToProject" ADD CONSTRAINT "_MediaToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
