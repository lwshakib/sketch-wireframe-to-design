"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/context";
import {
  Palette,
  Type,
  Images,
  Brush,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CanvasArea from "./_compoennts/CanvasArea";
import Moodboard from "./_compoennts/Moodboard";
import CustomTabs from "./_compoennts/CustomTabs";
import ColorsTab from "./_compoennts/ColorsTab";
import TypographyTab from "./_compoennts/TypographyTab";

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { workspaces, setWorkspaces } = useWorkspaceStore();

  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [activeStyleGuideTab, setActiveStyleGuideTab] = useState("moodboard");

  const workspaceFromStore = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId),
    [workspaces, workspaceId]
  );

  useEffect(() => {
    if (workspaceFromStore?.name) {
      setWorkspaceName(workspaceFromStore.name);
      setWorkspaceLoading(false);
    }
  }, [workspaceFromStore]);

  useEffect(() => {
    if (!workspaceId) return;

    let ignore = false;

    const loadWorkspace = async () => {
      try {
        setWorkspaceError(null);
        setWorkspaceLoading(true);

        const response = await fetch(`/api/workspaces/${workspaceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch workspace");
        }

        const data = await response.json();
        if (ignore) return;

        const fetchedWorkspace = data.workspace;
        if (fetchedWorkspace?.name) {
          setWorkspaceName(fetchedWorkspace.name);
        }

        setWorkspaces((previous) => {
          const existingIndex = previous.findIndex(
            (workspace) => workspace.id === fetchedWorkspace.id
          );

          if (existingIndex === -1) {
            return [...previous, fetchedWorkspace];
          }

          const updated = [...previous];
          updated[existingIndex] = fetchedWorkspace;
          return updated;
        });
      } catch (error) {
        if (ignore) return;
        console.error(error);
        setWorkspaceError("Unable to load this workspace.");
      } finally {
        if (!ignore) {
          setWorkspaceLoading(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      ignore = true;
    };
  }, [workspaceId, setWorkspaces]);

  const StyleGuideTabs = () => {
    return (
      <div className="shrink-0">
        <CustomTabs
          value={activeStyleGuideTab}
          items={[
            {
              value: "colors",
              label: (
                <>
                  <Palette className="h-4 w-4" />
                  Colors
                </>
              ),
              content: null,
            },
            {
              value: "typography",
              label: (
                <>
                  <Type className="h-4 w-4" />
                  Typography
                </>
              ),
              content: null,
            },
            {
              value: "moodboard",
              label: (
                <>
                  <Images className="h-4 w-4" />
                  Moodboard
                </>
              ),
              content: null,
            },
          ]}
          onTabChange={setActiveStyleGuideTab}
        />
      </div>
    );
  };

  const StyleGuideContent = () => {
    return (
      <div className="flex-1 w-full">
        {activeStyleGuideTab === "colors" && <ColorsTab />}
        {activeStyleGuideTab === "typography" && <TypographyTab />}
        {activeStyleGuideTab === "moodboard" && (
          <div className="h-[calc(100vh-200px)]">
            <Moodboard />
          </div>
        )}
      </div>
    );
  };
  return (
    <Tabs
      defaultValue="canvas"
      className="min-h-screen bg-[#0f0f0f] text-white gap-0 w-full"
    >
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/70 text-white hover:bg-white/5 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-white/90">
            {workspaceLoading ? "Loading..." : workspaceName}
          </span>
        </div>

        {workspaceError ? (
          <div className="text-xs text-red-300">{workspaceError}</div>
        ) : null}

        <TabsList className="bg-[#1b1b1b] text-white/80 px-2 py-1 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.08)] h-10 gap-2">
          <TabsTrigger
            value="canvas"
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5 transition data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white data-[state=active]:shadow inline-flex items-center gap-2"
          >
            <Brush className="h-4 w-4" />
            Canvas
          </TabsTrigger>
          <TabsTrigger
            value="style-guide"
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5 transition data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white data-[state=active]:shadow inline-flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Style Guide
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3 text-sm font-medium text-white/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <span className="text-white text-xs font-semibold">R</span>
          </div>
        </div>
      </header>

      <TabsContent value="canvas" className="flex-1 p-6 text-white/60 flex">
        <CanvasArea />
      </TabsContent>
      <TabsContent value="style-guide" className="flex-1 p-6 text-white/60">
        <div className="flex flex-col h-full max-w-7xl mx-auto">
          {/* Top row: Title/Subtitle on left, Tabs on right */}
          <div className="flex items-start justify-between gap-6 mb-6">
            {/* Left side: Title and Subtitle */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-white mb-2">
                Style Guide
              </h1>
              <p className="text-sm text-white/60">
                Manage your style guide for your project.
              </p>
            </div>

            {/* Right side: Tabs */}
            <StyleGuideTabs />
          </div>

          {/* Full width content area */}
          <StyleGuideContent />
        </div>
      </TabsContent>
    </Tabs>
  );
}
