import { create } from "zustand";

export type Workspace = {
  id: string;
  name: string;
  content?: Record<string, unknown> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

interface WorkspaceStore {
  workspaces: Workspace[];
  setWorkspaces: (
    workspaces:
      | Workspace[]
      | ((previous: Workspace[]) => Workspace[])
  ) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  setWorkspaces: (workspaces) =>
    set((state) => ({
      workspaces:
        typeof workspaces === "function"
          ? workspaces(state.workspaces)
          : workspaces,
    })),
}));

// Backwards compatibility in case older imports still reference this name.
export const useSketchStore = useWorkspaceStore;