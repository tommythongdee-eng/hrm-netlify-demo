-- CreateTable
CREATE TABLE "review_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "review_cycles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "selfRating" INTEGER,
    "selfComments" TEXT,
    "selfSubmittedAt" DATETIME,
    "managerRating" INTEGER,
    "managerComments" TEXT,
    "managerSubmittedAt" DATETIME,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "performance_reviews_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "review_cycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_reviews_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "training_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "category" TEXT NOT NULL,
    "completionDate" DATETIME NOT NULL,
    "expiryDate" DATETIME,
    "hours" REAL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "training_records_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "surveys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "numericValue" INTEGER,
    "textValue" TEXT,
    CONSTRAINT "survey_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "survey_responses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_participations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "survey_participations_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "talent_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "performanceRating" TEXT NOT NULL,
    "potentialRating" TEXT NOT NULL,
    "notes" TEXT,
    "assessedByUserId" TEXT NOT NULL,
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talent_assessments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "talent_assessments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "talent_assessments_assessedByUserId_fkey" FOREIGN KEY ("assessedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "key_positions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "criticality" TEXT,
    "notes" TEXT,
    "currentHolderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "key_positions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "key_positions_currentHolderId_fkey" FOREIGN KEY ("currentHolderId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "successor_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyPositionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "readiness" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "successor_candidates_keyPositionId_fkey" FOREIGN KEY ("keyPositionId") REFERENCES "key_positions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "successor_candidates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "performance_reviews_organizationId_idx" ON "performance_reviews"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reviews_cycleId_employeeId_key" ON "performance_reviews"("cycleId", "employeeId");

-- CreateIndex
CREATE INDEX "training_records_organizationId_idx" ON "training_records"("organizationId");

-- CreateIndex
CREATE INDEX "training_records_employeeId_idx" ON "training_records"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_participations_surveyId_employeeId_key" ON "survey_participations"("surveyId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "talent_assessments_employeeId_key" ON "talent_assessments"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "successor_candidates_keyPositionId_employeeId_key" ON "successor_candidates"("keyPositionId", "employeeId");
