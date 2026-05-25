import { supabase } from '../lib/supabase';
import type { SymbolPair, Timeframe, TradingStrategy } from '../types';

interface StrategyRow {
  id: string;
  name: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  last_test: string | null;
  type: 'AUTOMATED' | 'MANUAL';
  win_rate: number | null;
  total_pl: string | null;
  status: 'ACTIVE' | 'DRAFT';
}

const toStrategy = (row: StrategyRow): TradingStrategy => ({
  id: row.id,
  name: row.name,
  symbol: row.symbol,
  timeframe: row.timeframe,
  lastTest: row.last_test || 'Pending evaluation test run',
  type: row.type,
  winRate: row.win_rate ?? 0,
  totalPL: row.total_pl || 'N/A',
  status: row.status,
});

export async function fetchStrategies(userId: string): Promise<TradingStrategy[]> {
  const { data, error } = await supabase
    .from('strategies')
    .select('id,name,symbol,timeframe,last_test,type,win_rate,total_pl,status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toStrategy);
}

export async function createStrategy(userId: string, strategy: TradingStrategy): Promise<TradingStrategy> {
  const { data, error } = await supabase
    .from('strategies')
    .insert({
      user_id: userId,
      name: strategy.name,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      last_test: strategy.lastTest,
      type: strategy.type,
      win_rate: strategy.winRate,
      total_pl: strategy.totalPL,
      status: strategy.status,
    })
    .select('id,name,symbol,timeframe,last_test,type,win_rate,total_pl,status')
    .single();

  if (error) throw error;
  return toStrategy(data);
}

export async function deleteStrategy(id: string): Promise<void> {
  const { error } = await supabase.from('strategies').delete().eq('id', id);
  if (error) throw error;
}
