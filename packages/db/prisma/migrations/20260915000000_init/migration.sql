-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('Basketball', 'Soccer', 'Volleyball', 'Pickleball', 'Tennis', 'Softball', 'Football', 'UltimateFrisbee', 'Hockey', 'Kickball');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'AllLevels');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('Open', 'Cancelled', 'Completed');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('Pending', 'Confirmed', 'Expired', 'Left', 'Refunded');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'Open',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "venueName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "entryFeeCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "refundCutoffHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEntry" (
    "id" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "holdExpiresAt" TIMESTAMP(3),
    "stripeCheckoutId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MatchEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "stripeAccountId" TEXT,
    "stripePayoutsReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_hostId_idx" ON "Match"("hostId");

-- CreateIndex
CREATE INDEX "Match_startsAt_id_idx" ON "Match"("startsAt", "id");

-- CreateIndex
CREATE INDEX "Match_sport_startsAt_idx" ON "Match"("sport", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchEntry_stripeCheckoutId_key" ON "MatchEntry"("stripeCheckoutId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchEntry_stripePaymentIntentId_key" ON "MatchEntry"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "MatchEntry_userId_status_idx" ON "MatchEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "MatchEntry_matchId_status_idx" ON "MatchEntry"("matchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MatchEntry_matchId_userId_key" ON "MatchEntry"("matchId", "userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeAccountId_key" ON "User"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEntry" ADD CONSTRAINT "MatchEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEntry" ADD CONSTRAINT "MatchEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
