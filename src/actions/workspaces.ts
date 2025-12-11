import db from "@/db";
import { workspacesTable, Workspace } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function fetchWorkspacesForUser(
  clerkId: string
): Promise<Workspace[]> {
  const workspaces = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.clerkId, clerkId))
    .orderBy(desc(workspacesTable.updatedAt));

  return workspaces;
}

export async function fetchWorkspaceById(
  clerkId: string,
  workspaceId: string
): Promise<Workspace | null> {
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(
      and(eq(workspacesTable.clerkId, clerkId), eq(workspacesTable.id, workspaceId))
    );
  return workspace ?? null;
}

export async function createWorkspaceForUser(
  clerkId: string,
  name: string
): Promise<Workspace> {
  const sanitizedName = name.trim() || "Untitled workspace";
  const [workspace] = await db
    .insert(workspacesTable)
    .values({
      clerkId,
      name: sanitizedName,
    })
    .returning();

  return workspace;
}

