import { supabase } from '../lib/supabase';
import type { DrawingObject, SymbolPair, Timeframe } from '../types';

interface DrawingRow {
  id: string;
  type: DrawingObject['type'];
  symbol: SymbolPair;
  timeframe: Timeframe;
  points: DrawingObject['points'];
  text: string | null;
  style: Record<string, unknown> | null;
}

const toDrawing = (row: DrawingRow): DrawingObject => ({
  id: row.id,
  type: row.type,
  symbol: row.symbol,
  timeframe: row.timeframe,
  points: row.points || [],
  text: row.text || undefined,
  style: row.style || {},
});

export async function fetchDrawings(userId: string, symbol: SymbolPair, timeframe: Timeframe): Promise<DrawingObject[]> {
  const { data, error } = await supabase
    .from('drawings')
    .select('id,type,symbol,timeframe,points,text,style')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(toDrawing);
}

export async function createDrawing(userId: string, drawing: Omit<DrawingObject, 'id'>): Promise<DrawingObject> {
  const { data, error } = await supabase
    .from('drawings')
    .insert({
      user_id: userId,
      type: drawing.type,
      symbol: drawing.symbol,
      timeframe: drawing.timeframe,
      points: drawing.points,
      text: drawing.text,
      style: drawing.style || {},
    })
    .select('id,type,symbol,timeframe,points,text,style')
    .single();

  if (error) throw error;
  return toDrawing(data);
}

export async function deleteDrawing(id: string): Promise<void> {
  const { error } = await supabase.from('drawings').delete().eq('id', id);
  if (error) throw error;
}
