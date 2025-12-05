-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN', 'RATING_SCALE', 'MATRIX', 'RANKING', 'SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'NUMBER', 'DATE', 'TIME', 'FILE_UPLOAD', 'SLIDER', 'YES_NO', 'NPS', 'LIKERT_SCALE');

-- CreateEnum
CREATE TYPE "LogicType" AS ENUM ('SKIP_LOGIC', 'BRANCHING', 'PIPING', 'DISPLAY_LOGIC');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'EXCEL', 'PDF', 'JSON');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'AZURE_OPENAI', 'COHERE', 'HUGGINGFACE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('LOCAL', 'GOOGLE', 'MICROSOFT', 'GITHUB', 'GITLAB', 'OKTA', 'AUTH0', 'SAML', 'OIDC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SurveyVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED', 'UNLISTED');

-- CreateEnum
CREATE TYPE "LicenseTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AIToolType" AS ENUM ('MINDSDB', 'TENSORFLOW', 'PYTORCH', 'HUGGINGFACE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('TRAINING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INVITED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "provider" "IdentityProvider" NOT NULL DEFAULT 'LOCAL',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAIProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "apiKey" TEXT NOT NULL,
    "modelName" TEXT,
    "endpoint" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAIProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tier" "LicenseTier" NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxUsers" INTEGER NOT NULL DEFAULT -1,
    "maxSurveys" INTEGER NOT NULL DEFAULT -1,
    "maxResponses" INTEGER NOT NULL DEFAULT -1,
    "features" JSONB NOT NULL,
    "instanceId" TEXT,
    "instanceFingerprint" TEXT,
    "currentUsers" INTEGER NOT NULL DEFAULT 0,
    "currentSurveys" INTEGER NOT NULL DEFAULT 0,
    "currentResponses" INTEGER NOT NULL DEFAULT 0,
    "lastUsageUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "offlineSince" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseVerificationLog" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "LicenseVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL,
    "licenseEnforced" BOOLEAN NOT NULL DEFAULT false,
    "licenseGracePeriod" BOOLEAN NOT NULL DEFAULT true,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleAnalyticsId" TEXT,
    "telemetryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "instanceName" TEXT,
    "instanceDescription" TEXT,
    "adminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "SurveyVisibility" NOT NULL DEFAULT 'PUBLIC',
    "password" TEXT,
    "workspaceId" TEXT,
    "createdBy" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "responseLimit" INTEGER,
    "closeDate" TIMESTAMP(3),
    "welcomeText" TEXT,
    "thankYouText" TEXT,
    "slug" TEXT NOT NULL,
    "shareableLink" TEXT,
    "embedCode" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyPage" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SurveyPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "pageId" TEXT,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isRandomized" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "validation" JSONB,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyLogic" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "targetQuestionId" TEXT,
    "type" "LogicType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,

    CONSTRAINT "SurveyLogic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyTheme" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#6B7280',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#1F2937',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "logoUrl" TEXT,
    "customCss" TEXT,

    CONSTRAINT "SurveyTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "dateValue" TIMESTAMP(3),
    "fileUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnalytics" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "totalResponses" INTEGER NOT NULL DEFAULT 0,
    "completeResponses" INTEGER NOT NULL DEFAULT 0,
    "averageDuration" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "dropoffRate" DOUBLE PRECISION,
    "analyticsData" JSONB,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "type" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "content" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "description" TEXT,
    "options" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "issuer" TEXT,
    "authUrl" TEXT,
    "tokenUrl" TEXT,
    "userInfoUrl" TEXT,
    "callbackUrl" TEXT,
    "scopes" TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMTPConfig" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "replyTo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMTPConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformBranding" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL DEFAULT 'PulseGen',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "loginBgUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#6B7280',
    "accentColor" TEXT NOT NULL DEFAULT '#10B981',
    "customCss" TEXT,
    "customJs" TEXT,
    "footerText" TEXT,
    "supportEmail" TEXT,
    "termsUrl" TEXT,
    "privacyUrl" TEXT,
    "showPoweredBy" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadAccessRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "fullName" TEXT,
    "youtubeSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "instagramFollowed" BOOLEAN NOT NULL DEFAULT false,
    "proofScreenshotUrl" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "statusNote" TEXT,
    "githubInviteSent" BOOLEAN NOT NULL DEFAULT false,
    "githubInvitedAt" TIMESTAMP(3),
    "githubInviteAccepted" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referralSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "DownloadAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIToolConfig" (
    "id" TEXT NOT NULL,
    "type" "AIToolType" NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "apiKey" TEXT,
    "username" TEXT,
    "password" TEXT,
    "database" TEXT,
    "settings" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIToolConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLModel" (
    "id" TEXT NOT NULL,
    "toolConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "modelType" TEXT NOT NULL,
    "targetColumn" TEXT,
    "features" TEXT[],
    "status" "ModelStatus" NOT NULL DEFAULT 'TRAINING',
    "accuracy" DOUBLE PRECISION,
    "metadata" JSONB,
    "query" TEXT,
    "surveyId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "MLModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "surveyId" TEXT,
    "responseId" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_provider_providerId_idx" ON "User"("provider", "providerId");

-- CreateIndex
CREATE INDEX "UserAIProvider_userId_idx" ON "UserAIProvider"("userId");

-- CreateIndex
CREATE INDEX "UserAIProvider_isDefault_idx" ON "UserAIProvider"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "UserAIProvider_userId_provider_key" ON "UserAIProvider"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "License_instanceId_key" ON "License"("instanceId");

-- CreateIndex
CREATE INDEX "License_licenseKey_idx" ON "License"("licenseKey");

-- CreateIndex
CREATE INDEX "License_email_idx" ON "License"("email");

-- CreateIndex
CREATE INDEX "License_customerId_idx" ON "License"("customerId");

-- CreateIndex
CREATE INDEX "License_status_idx" ON "License"("status");

-- CreateIndex
CREATE INDEX "License_expiresAt_idx" ON "License"("expiresAt");

-- CreateIndex
CREATE INDEX "LicenseVerificationLog_licenseId_idx" ON "LicenseVerificationLog"("licenseId");

-- CreateIndex
CREATE INDEX "LicenseVerificationLog_verifiedAt_idx" ON "LicenseVerificationLog"("verifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_refreshToken_idx" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "Workspace_name_idx" ON "Workspace"("name");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_slug_key" ON "Survey"("slug");

-- CreateIndex
CREATE INDEX "Survey_createdBy_idx" ON "Survey"("createdBy");

-- CreateIndex
CREATE INDEX "Survey_workspaceId_idx" ON "Survey"("workspaceId");

-- CreateIndex
CREATE INDEX "Survey_status_idx" ON "Survey"("status");

-- CreateIndex
CREATE INDEX "Survey_slug_idx" ON "Survey"("slug");

-- CreateIndex
CREATE INDEX "Survey_visibility_idx" ON "Survey"("visibility");

-- CreateIndex
CREATE INDEX "SurveyPage_surveyId_idx" ON "SurveyPage"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyPage_order_idx" ON "SurveyPage"("order");

-- CreateIndex
CREATE INDEX "Question_surveyId_idx" ON "Question"("surveyId");

-- CreateIndex
CREATE INDEX "Question_pageId_idx" ON "Question"("pageId");

-- CreateIndex
CREATE INDEX "Question_order_idx" ON "Question"("order");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE INDEX "QuestionOption_order_idx" ON "QuestionOption"("order");

-- CreateIndex
CREATE INDEX "SurveyLogic_surveyId_idx" ON "SurveyLogic"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyLogic_sourceQuestionId_idx" ON "SurveyLogic"("sourceQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyTheme_surveyId_key" ON "SurveyTheme"("surveyId");

-- CreateIndex
CREATE INDEX "Response_surveyId_idx" ON "Response"("surveyId");

-- CreateIndex
CREATE INDEX "Response_completedAt_idx" ON "Response"("completedAt");

-- CreateIndex
CREATE INDEX "Response_isComplete_idx" ON "Response"("isComplete");

-- CreateIndex
CREATE INDEX "Answer_responseId_idx" ON "Answer"("responseId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAnalytics_surveyId_key" ON "SurveyAnalytics"("surveyId");

-- CreateIndex
CREATE INDEX "AiInsight_surveyId_idx" ON "AiInsight"("surveyId");

-- CreateIndex
CREATE INDEX "AiInsight_type_idx" ON "AiInsight"("type");

-- CreateIndex
CREATE INDEX "Distribution_surveyId_idx" ON "Distribution"("surveyId");

-- CreateIndex
CREATE INDEX "Distribution_recipientEmail_idx" ON "Distribution"("recipientEmail");

-- CreateIndex
CREATE INDEX "Export_surveyId_idx" ON "Export"("surveyId");

-- CreateIndex
CREATE INDEX "Export_status_idx" ON "Export"("status");

-- CreateIndex
CREATE INDEX "SurveyTemplate_category_idx" ON "SurveyTemplate"("category");

-- CreateIndex
CREATE INDEX "SurveyTemplate_isPublic_idx" ON "SurveyTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "QuestionBank_category_idx" ON "QuestionBank"("category");

-- CreateIndex
CREATE INDEX "QuestionBank_type_idx" ON "QuestionBank"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "IdentityProviderConfig_isEnabled_idx" ON "IdentityProviderConfig"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProviderConfig_provider_key" ON "IdentityProviderConfig"("provider");

-- CreateIndex
CREATE INDEX "SMTPConfig_isActive_idx" ON "SMTPConfig"("isActive");

-- CreateIndex
CREATE INDEX "DownloadAccessRequest_email_idx" ON "DownloadAccessRequest"("email");

-- CreateIndex
CREATE INDEX "DownloadAccessRequest_githubUsername_idx" ON "DownloadAccessRequest"("githubUsername");

-- CreateIndex
CREATE INDEX "DownloadAccessRequest_status_idx" ON "DownloadAccessRequest"("status");

-- CreateIndex
CREATE INDEX "DownloadAccessRequest_createdAt_idx" ON "DownloadAccessRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AIToolConfig_isEnabled_idx" ON "AIToolConfig"("isEnabled");

-- CreateIndex
CREATE INDEX "AIToolConfig_type_idx" ON "AIToolConfig"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AIToolConfig_type_name_key" ON "AIToolConfig"("type", "name");

-- CreateIndex
CREATE INDEX "MLModel_toolConfigId_idx" ON "MLModel"("toolConfigId");

-- CreateIndex
CREATE INDEX "MLModel_status_idx" ON "MLModel"("status");

-- CreateIndex
CREATE INDEX "MLModel_surveyId_idx" ON "MLModel"("surveyId");

-- CreateIndex
CREATE INDEX "MLModel_createdBy_idx" ON "MLModel"("createdBy");

-- CreateIndex
CREATE INDEX "Prediction_modelId_idx" ON "Prediction"("modelId");

-- CreateIndex
CREATE INDEX "Prediction_surveyId_idx" ON "Prediction"("surveyId");

-- CreateIndex
CREATE INDEX "Prediction_responseId_idx" ON "Prediction"("responseId");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- AddForeignKey
ALTER TABLE "UserAIProvider" ADD CONSTRAINT "UserAIProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseVerificationLog" ADD CONSTRAINT "LicenseVerificationLog_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyPage" ADD CONSTRAINT "SurveyPage_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SurveyPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyLogic" ADD CONSTRAINT "SurveyLogic_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyLogic" ADD CONSTRAINT "SurveyLogic_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyLogic" ADD CONSTRAINT "SurveyLogic_targetQuestionId_fkey" FOREIGN KEY ("targetQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyTheme" ADD CONSTRAINT "SurveyTheme_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnalytics" ADD CONSTRAINT "SurveyAnalytics_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyTemplate" ADD CONSTRAINT "SurveyTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLModel" ADD CONSTRAINT "MLModel_toolConfigId_fkey" FOREIGN KEY ("toolConfigId") REFERENCES "AIToolConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLModel" ADD CONSTRAINT "MLModel_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLModel" ADD CONSTRAINT "MLModel_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "MLModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE SET NULL ON UPDATE CASCADE;
