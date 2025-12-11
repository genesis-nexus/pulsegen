-- CreateEnum
CREATE TYPE "AIFeatureType" AS ENUM ('SURVEY_GENERATE', 'QUESTION_SUGGEST', 'QUESTION_OPTIMIZE', 'RESPONSE_ANALYZE', 'SENTIMENT_ANALYZE', 'REPORT_GENERATE', 'SURVEY_IMPROVE', 'ANALYTICS_SUMMARY', 'CHAT', 'OTHER');

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT,
    "feature" "AIFeatureType" NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isFreeModel" BOOLEAN NOT NULL DEFAULT false,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "provider" "AIProvider",
    "model" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_provider_idx" ON "AIUsageLog"("provider");

-- CreateIndex
CREATE INDEX "AIUsageLog_feature_idx" ON "AIUsageLog"("feature");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_createdAt_idx" ON "AIUsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIChatConversation_userId_idx" ON "AIChatConversation"("userId");

-- CreateIndex
CREATE INDEX "AIChatConversation_createdAt_idx" ON "AIChatConversation"("createdAt");

-- CreateIndex
CREATE INDEX "AIChatMessage_conversationId_idx" ON "AIChatMessage"("conversationId");

-- CreateIndex
CREATE INDEX "AIChatMessage_createdAt_idx" ON "AIChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatConversation" ADD CONSTRAINT "AIChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIChatMessage" ADD CONSTRAINT "AIChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
