-- CreateTable
CREATE TABLE "PaymentOtp" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOtp_bookingId_key" ON "PaymentOtp"("bookingId");

-- AddForeignKey
ALTER TABLE "PaymentOtp" ADD CONSTRAINT "PaymentOtp_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
