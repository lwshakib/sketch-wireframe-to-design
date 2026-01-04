import { auth } from "@/lib/auth";
import { streamText } from "@/llm/streamText";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Get the last message (user's current message)
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Save user message
    await prisma.message.create({
      data: {
        projectId: projectId,
        role: "user",
        parts: lastMessage.content
      },
    });

    // Save assistant message after streaming completes
    const onFinish: any = async (result: any) => {
      try {
        await prisma.message.create({
          data: {
            projectId: projectId,
            role: "assistant",
            parts: result.text,
          },
        });
      } catch (error) {
        console.error("[CHAT] Failed to save assistant message:", error);
      }
    };

    const result = await streamText(messages, {
      onFinish,
    });

    // Create a custom response using the Vercel AI SDK method
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[CHAT]", error);
    return NextResponse.json({ error: "Failed to chat" }, { status: 500 });
  }
}
