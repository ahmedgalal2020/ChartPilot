import { supabase } from '../lib/supabase';
import type { UserSettings } from '../types';

export const defaultSettings: UserSettings = {
  commission: 0.05,
  slippage: 0,
  riskPerTrade: 2,
  theme: 'dark',
  bullColor: '#26A69A',
  bearColor: '#EF5350',
  timezone: 'UTC',
  gridLines: true,
  volumeBars: true,
  priceLabel: true,
  showTelemetry: true,
  defaultInitialBalance: 10000,
  defaultTimeframe: '1h',
  defaultSymbol: 'BTCUSD',
};

interface SettingsRow {
  bull_color: string | null;
  bear_color: string | null;
  risk_per_trade: number | null;
  grid_lines: boolean | null;
  show_telemetry: boolean | null;
  theme: 'dark' | 'light' | null;
  default_initial_balance: number | null;
  default_timeframe: UserSettings['defaultTimeframe'] | null;
  default_symbol: string | null;
}

const toSettings = (row: SettingsRow | null): UserSettings => ({
  ...defaultSettings,
  bullColor: row?.bull_color || defaultSettings.bullColor,
  bearColor: row?.bear_color || defaultSettings.bearColor,
  riskPerTrade: row?.risk_per_trade ?? defaultSettings.riskPerTrade,
  gridLines: row?.grid_lines ?? defaultSettings.gridLines,
  showTelemetry: row?.show_telemetry ?? defaultSettings.showTelemetry,
  theme: row?.theme || defaultSettings.theme,
  defaultInitialBalance: row?.default_initial_balance ?? defaultSettings.defaultInitialBalance,
  defaultTimeframe: row?.default_timeframe || defaultSettings.defaultTimeframe,
  defaultSymbol: row?.default_symbol || defaultSettings.defaultSymbol,
});

export async function fetchSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('bull_color,bear_color,risk_per_trade,grid_lines,show_telemetry,theme,default_initial_balance,default_timeframe,default_symbol')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return toSettings(data);
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        bull_color: settings.bullColor,
        bear_color: settings.bearColor,
        risk_per_trade: settings.riskPerTrade,
        grid_lines: settings.gridLines,
        show_telemetry: settings.showTelemetry,
        theme: settings.theme || 'dark',
        default_initial_balance: settings.defaultInitialBalance || 10000,
        default_timeframe: settings.defaultTimeframe || '1h',
        default_symbol: settings.defaultSymbol || 'BTCUSD',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('bull_color,bear_color,risk_per_trade,grid_lines,show_telemetry,theme,default_initial_balance,default_timeframe,default_symbol')
    .single();

  if (error) throw error;
  return toSettings(data);
}
