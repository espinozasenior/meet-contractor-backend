/*
  Warnings:

  - You are about to drop the `_ProjectRealtors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProjectRealtors" DROP CONSTRAINT "_ProjectRealtors_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectRealtors" DROP CONSTRAINT "_ProjectRealtors_B_fkey";

-- DropTable
DROP TABLE "_ProjectRealtors";
