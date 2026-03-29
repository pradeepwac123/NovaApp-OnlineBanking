CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "upiId" TEXT NOT NULL UNIQUE,
  "accountNo" TEXT NOT NULL UNIQUE,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
  "mpin" TEXT NOT NULL DEFAULT '',
  "dob" TEXT,
  "aadhaarFront" TEXT,
  "aadhaarBack" TEXT,
  "pan" TEXT,
  "selfie" TEXT,
  "kycStatus" TEXT NOT NULL DEFAULT 'pending',
  "role" TEXT NOT NULL DEFAULT 'user',
  "avatar" TEXT,
  "blockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT PRIMARY KEY,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'success',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
