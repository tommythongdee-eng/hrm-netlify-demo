-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxEmployees" INTEGER NOT NULL,
    "priceThbPerMonth" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "standardStartTime" TEXT,
    "standardEndTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "planId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organizations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_organizations" ("createdAt", "id", "name", "slug", "standardEndTime", "standardStartTime", "updatedAt") SELECT "createdAt", "id", "name", "slug", "standardEndTime", "standardStartTime", "updatedAt" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");
