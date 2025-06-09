/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `namaLengkap` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "email" TEXT,
ADD COLUMN     "namaLengkap" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT;

-- DropTable
DROP TABLE "Payment";
