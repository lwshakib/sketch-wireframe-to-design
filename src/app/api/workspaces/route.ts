import { createWorkspaceForUser, fetchWorkspacesForUser } from "@/actions/workspaces";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspaces = await fetchWorkspacesForUser(user.id);
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const workspace = await createWorkspaceForUser(user.id, name);
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("Error creating workspace", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

