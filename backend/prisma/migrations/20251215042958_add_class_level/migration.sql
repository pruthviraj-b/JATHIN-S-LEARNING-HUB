-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "classLevel" INTEGER NOT NULL DEFAULT 1,
    "visible" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Subject" ("code", "id", "name", "visible") SELECT "code", "id", "name", "visible" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
