-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "status" "public"."ListingStatus" NOT NULL DEFAULT 'PENDING';
