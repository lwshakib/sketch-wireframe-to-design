import {
  fetchWorkspaceById,
  updateWorkspaceContent,
} from "@/actions/workspaces";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Params = { params: { workspaceId: string } };

export async function GET(_req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace id is required" },
      { status: 400 }
    );
  }

  try {
    const workspace = await fetchWorkspaceById(user.id, workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Error fetching workspace", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace id is required" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { content } = body ?? {};

    if (content !== null && typeof content !== "object") {
      return NextResponse.json(
        { error: "Content must be an object or null" },
        { status: 400 }
      );
    }

    const updated = await updateWorkspaceContent(user.id, workspaceId, content);
    if (!updated) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace: updated });
  } catch (error) {
    console.error("Error updating workspace", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}
