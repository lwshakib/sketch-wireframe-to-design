import db from "@/db";
import { workspacesTable, Workspace } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function fetchWorkspacesForUser(
  clerkId: string
): Promise<Workspace[]> {
  const workspaces = await db
    .select({
      id: workspacesTable.id,
      name: workspacesTable.name,
      createdAt: workspacesTable.createdAt,
      updatedAt: workspacesTable.updatedAt,
    })
    .from(workspacesTable)
    .where(eq(workspacesTable.clerkId, clerkId))
    .orderBy(desc(workspacesTable.updatedAt));

  return workspaces as Workspace[];
}

export async function fetchWorkspaceById(
  clerkId: string,
  workspaceId: string
): Promise<Workspace | null> {
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(
      and(
        eq(workspacesTable.clerkId, clerkId),
        eq(workspacesTable.id, workspaceId)
      )
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

export async function updateWorkspaceContent(
  clerkId: string,
  workspaceId: string,
  content: Record<string, unknown> | null
): Promise<Workspace | null> {
  const [updated] = await db
    .update(workspacesTable)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workspacesTable.clerkId, clerkId),
        eq(workspacesTable.id, workspaceId)
      )
    )
    .returning();

  return updated ?? null;
}
