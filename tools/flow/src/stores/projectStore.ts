import { create } from "zustand";
import { load, LazyStore } from "@tauri-apps/plugin-store";
import { open } from "@tauri-apps/plugin-dialog";
import { commands } from "../bindings";

export interface RecentProject {
  name: string;
  path: string;
  lastOpened: string;
}

interface ProjectState {
  currentProject: RecentProject | null;
  recentProjects: RecentProject[];
  isLoading: boolean;
  error: string | null;
  warning: string | null;

  // Actions
  initialize: () => Promise<void>;
  openProject: () => Promise<void>;
  selectRecentProject: (project: RecentProject) => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;
  clearError: () => void;
  clearWarning: () => void;
}

const STORE_FILE = "projects.json";
const MAX_RECENT_PROJECTS = 10;

let store: LazyStore | null = null;

async function getStore(): Promise<LazyStore> {
  if (!store) {
    store = new LazyStore(STORE_FILE);
  }
  return store;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  recentProjects: [],
  isLoading: true,
  error: null,
  warning: null,

  initialize: async () => {
    try {
      const store = await getStore();
      const current = await store.get<RecentProject>("currentProject");
      const recent = await store.get<RecentProject[]>("recentProjects") ?? [];

      set({
        currentProject: current ?? null,
        recentProjects: recent,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to initialize project store:", err);
      set({ isLoading: false, error: "Failed to load project data" });
    }
  },

  openProject: async () => {
    try {
      set({ error: null, warning: null });

      const selected = await open({
        multiple: false,
        directory: true,
        title: "Select Project Folder",
      });

      if (!selected) {
        return; // User cancelled
      }

      const path = typeof selected === "string" ? selected : selected[0];
      const validation = await commands.validateProject(path);

      if (!validation.valid) {
        set({ error: validation.error ?? "Invalid project folder" });
        return;
      }

      const project: RecentProject = {
        name: validation.project_name ?? path.split("/").pop() ?? "Unknown",
        path,
        lastOpened: new Date().toISOString(),
      };

      // Update recent projects (remove if exists, add to front)
      const { recentProjects } = get();
      const filtered = recentProjects.filter((p) => p.path !== path);
      const updatedRecent = [project, ...filtered].slice(0, MAX_RECENT_PROJECTS);

      // Persist to store
      const store = await getStore();
      await store.set("currentProject", project);
      await store.set("recentProjects", updatedRecent);
      await store.save();

      set({
        currentProject: project,
        recentProjects: updatedRecent,
      });
    } catch (err) {
      console.error("Failed to open project:", err);
      set({ error: "Failed to open project folder" });
    }
  },

  selectRecentProject: async (project: RecentProject) => {
    try {
      set({ error: null });

      // Validate the project still exists
      const validation = await commands.validateProject(project.path);

      if (!validation.valid) {
        // Remove from recents if no longer valid
        const { recentProjects } = get();
        const filtered = recentProjects.filter((p) => p.path !== project.path);

        const store = await getStore();
        await store.set("recentProjects", filtered);
        await store.save();

        set({
          recentProjects: filtered,
          error: "Project folder no longer exists",
        });
        return;
      }

      // Update last opened time
      const updatedProject: RecentProject = {
        ...project,
        lastOpened: new Date().toISOString(),
      };

      // Move to front of recent list
      const { recentProjects } = get();
      const filtered = recentProjects.filter((p) => p.path !== project.path);
      const updatedRecent = [updatedProject, ...filtered];

      // Persist
      const store = await getStore();
      await store.set("currentProject", updatedProject);
      await store.set("recentProjects", updatedRecent);
      await store.save();

      set({
        currentProject: updatedProject,
        recentProjects: updatedRecent,
      });
    } catch (err) {
      console.error("Failed to select project:", err);
      set({ error: "Failed to open project" });
    }
  },

  removeRecentProject: async (path: string) => {
    try {
      const { recentProjects } = get();
      const filtered = recentProjects.filter((p) => p.path !== path);

      const store = await getStore();
      await store.set("recentProjects", filtered);
      await store.save();

      set({ recentProjects: filtered });
    } catch (err) {
      console.error("Failed to remove project from recents:", err);
    }
  },

  clearError: () => set({ error: null }),
  clearWarning: () => set({ warning: null }),
}));
