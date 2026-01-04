-- CreateEnum
CREATE TYPE "MESSAGE_ROLE" AS ENUM ('user', 'assistant');

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "role" "MESSAGE_ROLE" NOT NULL DEFAULT 'user',
    "parts" JSONB[],
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_userId_idx" ON "project"("userId");

-- CreateIndex
CREATE INDEX "message_projectId_idx" ON "message"("projectId");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
