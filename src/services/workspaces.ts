import { supabase } from '../lib/supabase';
import type { SymbolPair, Timeframe, Workspace } from '../types';

interface WorkspaceRow {
  id: string;
  name: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  range: string | null;
  trades_count: number | null;
  is_active: boolean | null;
  image_url: string | null;
  last_modified: string | null;
  watchlist?: string[] | null;
  layout?: Record<string, unknown> | null;
}

const formatModified = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : new Date().toLocaleDateString();

const toWorkspace = (row: WorkspaceRow): Workspace => ({
  id: row.id,
  name: row.name,
  symbol: row.symbol,
  timeframe: row.timeframe,
  range: row.range || '2024.01.01 - 2024.05.25',
  tradesCount: row.trades_count ?? 0,
  isActive: row.is_active ?? false,
  imageUrl: row.image_url || '',
  lastModified: formatModified(row.last_modified),
  watchlist: row.watchlist || ['BTCUSD', 'ETHUSD', 'EURUSD', 'XAUUSD'],
  layout: row.layout || {},
});

export async function fetchWorkspaces(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id,name,symbol,timeframe,range,trades_count,is_active,image_url,last_modified,watchlist,layout')
    .eq('user_id', userId)
    .order('last_modified', { ascending: false });

  if (error) throw error;
  return (data || []).map(toWorkspace);
}

export async function createWorkspace(userId: string, workspace: Workspace): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      name: workspace.name,
      symbol: workspace.symbol,
      timeframe: workspace.timeframe,
      range: workspace.range,
      trades_count: workspace.tradesCount || 0,
      is_active: workspace.isActive || false,
      image_url: workspace.imageUrl || '',
      watchlist: workspace.watchlist || ['BTCUSD', 'ETHUSD', 'EURUSD', 'XAUUSD'],
      layout: workspace.layout || {},
      last_modified: new Date().toISOString(),
    })
    .select('id,name,symbol,timeframe,range,trades_count,is_active,image_url,last_modified,watchlist,layout')
    .single();

  if (error) throw error;
  return toWorkspace(data);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) throw error;
}

export async function renameWorkspace(id: string, name: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .update({ name, last_modified: new Date().toISOString() })
    .eq('id', id)
    .select('id,name,symbol,timeframe,range,trades_count,is_active,image_url,last_modified,watchlist,layout')
    .single();

  if (error) throw error;
  return toWorkspace(data);
}

export async function setActiveWorkspace(userId: string, id: string): Promise<void> {
  const { error: clearError } = await supabase
    .from('workspaces')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (clearError) throw clearError;

  const { error } = await supabase
    .from('workspaces')
    .update({ is_active: true, last_modified: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
