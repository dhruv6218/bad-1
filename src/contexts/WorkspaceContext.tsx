'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'
import type { Workspace } from '../types'

interface WorkspaceContextType { activeWorkspace: Workspace | null; workspaces: Workspace[]; isWorkspaceInitializing: boolean; setActiveWorkspace: (ws: Workspace) => void; refreshWorkspaces: () => Promise<void>; updateWorkspaceName: (name: string) => void }
const WorkspaceContext = createContext<WorkspaceContextType>({ activeWorkspace: null, workspaces: [], isWorkspaceInitializing: true, setActiveWorkspace: () => {}, refreshWorkspaces: async () => {}, updateWorkspaceName: () => {} })
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); const supabase = createClient(); const db = supabase as any; const [workspaces, setWorkspaces] = useState<Workspace[]>([]); const [activeWorkspace, setActive] = useState<Workspace | null>(null); const [isWorkspaceInitializing, setLoading] = useState(true)
  const refreshWorkspaces = async () => { if (!user) { setWorkspaces([]); setActive(null); setLoading(false); return }; setLoading(true); const { data } = await db.from('workspaces').select('*').order('created_at'); const rows = (data ?? []) as Workspace[]; setWorkspaces(rows); setActive(current => rows.find(w => w.id === current?.id) ?? rows[0] ?? null); setLoading(false) }
  useEffect(() => { refreshWorkspaces() }, [user?.id])
  const createWorkspace = async () => { if (!user || workspaces.length) return; const slug = `${(user.user_metadata.full_name ?? user.email?.split('@')[0] ?? 'workspace').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 6)}`; const { data } = await db.from('workspaces').insert({ owner_id: user.id, name: 'My Workspace', slug, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', plan: 'Hook' }).select().single(); if (data) { await db.from('workspace_members').insert({ workspace_id: data.id, user_id: user.id, role: 'owner' }); await refreshWorkspaces() } }
  useEffect(() => { if (user && !isWorkspaceInitializing && !workspaces.length) createWorkspace() }, [user?.id, isWorkspaceInitializing, workspaces.length])
  const updateWorkspaceName = async (name: string) => { if (!activeWorkspace) return; await db.from('workspaces').update({ name }).eq('id', activeWorkspace.id); await refreshWorkspaces() }
  return <WorkspaceContext.Provider value={{ activeWorkspace, workspaces, isWorkspaceInitializing, setActiveWorkspace: setActive, refreshWorkspaces, updateWorkspaceName }}>{children}</WorkspaceContext.Provider>
}
export const useWorkspace = () => useContext(WorkspaceContext)
