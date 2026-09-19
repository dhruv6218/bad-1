import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import type { Workspace } from "../types";

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  isWorkspaceInitializing: boolean;
  setActiveWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  updateWorkspaceName: (name: string) => Promise<{ error: string | null }>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: null,
  workspaces: [],
  isWorkspaceInitializing: true,
  setActiveWorkspace: () => undefined,
  refreshWorkspaces: async () => undefined,
  updateWorkspaceName: async () => ({ error: null }),
});

const ACTIVE_WORKSPACE_KEY = "astrix_active_workspace";

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWs] = useState<Workspace | null>(null);
  const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    setIsWorkspaceInitializing(true);
    if (!user) {
      setWorkspaces([]);
      setActiveWs(null);
      setIsWorkspaceInitializing(false);
      return;
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, owner_id, name, slug, timezone, logo_url, plan, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load workspaces", error);
      setWorkspaces([]);
      setActiveWs(null);
      setIsWorkspaceInitializing(false);
      return;
    }

    let rows = (data ?? []) as Workspace[];
    if (rows.length === 0) {
      const name = user.user_metadata.full_name?.trim() || user.email.split("@")[0] || "My Workspace";
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace"}-${crypto.randomUUID().slice(0, 8)}`;
      const { data: created, error: createError } = await supabase
        .from("workspaces")
        .insert({ owner_id: user.id, name, slug, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", plan: "Hook" })
        .select("id, owner_id, name, slug, timezone, logo_url, plan, created_at")
        .single();
      if (createError) {
        console.error("Failed to provision first workspace", createError);
      } else if (created) {
        rows = [created as Workspace];
      }
    }
    setWorkspaces(rows);
    const storedId = window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    const selected = rows.find((workspace) => workspace.id === storedId) ?? rows[0] ?? null;
    setActiveWs(selected);
    if (selected) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, selected.id);
    setIsWorkspaceInitializing(false);
  }, [user]);

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWs(workspace);
    window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace.id);
  };

  const updateWorkspaceName = async (name: string) => {
    if (!activeWorkspace || !name.trim()) return { error: "Workspace name is required." };
    const { data, error } = await supabase
      .from("workspaces")
      .update({ name: name.trim() })
      .eq("id", activeWorkspace.id)
      .select("id, owner_id, name, slug, timezone, logo_url, plan, created_at")
      .single();

    if (error) return { error: error.message };
    const updated = data as Workspace;
    setActiveWs(updated);
    setWorkspaces((current) => current.map((workspace) => workspace.id === updated.id ? updated : workspace));
    return { error: null };
  };

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace,
      workspaces,
      isWorkspaceInitializing,
      setActiveWorkspace,
      refreshWorkspaces: fetchWorkspaces,
      updateWorkspaceName,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
