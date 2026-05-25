import { supabase } from '../lib/supabase';
import type { SymbolPair, TradingSymbol } from '../types';

interface SymbolRow {
  id: string;
  name: string;
  ticker: string;
  category: TradingSymbol['category'];
  base_currency: string | null;
  quote_currency: string | null;
  tick_size: number;
  pip_size: number;
  exchange: string | null;
  source: string;
  active: boolean;
}

const toSymbol = (row: SymbolRow): TradingSymbol => ({
  id: row.id,
  name: row.name,
  ticker: row.ticker,
  category: row.category,
  baseCurrency: row.base_currency || '',
  quoteCurrency: row.quote_currency || '',
  tickSize: row.tick_size,
  pipSize: row.pip_size,
  exchange: row.exchange || '',
  source: row.source,
  active: row.active,
});

export async function fetchSymbols(): Promise<TradingSymbol[]> {
  const { data, error } = await supabase
    .from('symbols')
    .select('id,name,ticker,category,base_currency,quote_currency,tick_size,pip_size,exchange,source,active')
    .eq('active', true)
    .order('category')
    .order('ticker');

  if (error) throw error;
  return (data || []).map(toSymbol);
}

export function findSymbol(symbols: TradingSymbol[], ticker: SymbolPair) {
  return symbols.find((symbol) => symbol.ticker === ticker);
}
