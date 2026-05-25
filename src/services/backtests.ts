import { supabase } from '../lib/supabase';
import type { BacktestSession, PerformanceMetrics, ReplayState, SymbolPair, Timeframe, Trade } from '../types';

interface TradeRow {
  id: string;
  type: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  profit_progress: number;
  date_time: string;
  symbol: string | null;
  position_size: number | null;
  risk_amount: number | null;
  risk_percent: number | null;
  r_multiple: number | null;
  status: 'open' | 'closed' | null;
  close_reason: string | null;
}

interface BacktestRow {
  id: string;
  name: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  date_range: string;
  total_trades: number;
  win_rate: number;
  total_pl: number;
  rsi_length: number | null;
  ema_trigger: number | null;
  volatility_filter: string | null;
  notes: string | null;
  created_at: string;
  trades?: TradeRow[];
  performance_metrics?: Array<{
    net_pl: number;
    win_rate: number;
    average_r: number;
    max_drawdown: number;
    profit_factor: number;
    trade_count: number;
    equity_curve: Array<{ index: number; balance: number }>;
  }>;
  replay_states?: Array<{
    id: string;
    symbol: string;
    timeframe: Timeframe;
    start_date: string | null;
    current_index: number;
    initial_balance: number;
    current_balance: number;
    speed: number;
    status: ReplayState['status'];
  }>;
}

const toMetrics = (row?: BacktestRow['performance_metrics']): PerformanceMetrics | undefined => {
  const metrics = row?.[0];
  if (!metrics) return undefined;
  return {
    netPL: metrics.net_pl,
    winRate: metrics.win_rate,
    averageR: metrics.average_r,
    maxDrawdown: metrics.max_drawdown,
    profitFactor: metrics.profit_factor,
    tradeCount: metrics.trade_count,
    equityCurve: metrics.equity_curve || [],
  };
};

const toReplayState = (sessionId: string, row?: BacktestRow['replay_states']): ReplayState | undefined => {
  const replay = row?.[0];
  if (!replay) return undefined;
  return {
    id: replay.id,
    backtestSessionId: sessionId,
    symbol: replay.symbol,
    timeframe: replay.timeframe,
    startDate: replay.start_date || undefined,
    currentIndex: replay.current_index,
    initialBalance: replay.initial_balance,
    currentBalance: replay.current_balance,
    speed: replay.speed,
    status: replay.status,
  };
};

const toTrade = (row: TradeRow): Trade => ({
  id: row.id,
  type: row.type,
  entryPrice: row.entry_price,
  exitPrice: row.exit_price,
  stopLoss: row.stop_loss,
  takeProfit: row.take_profit,
  profitProgress: row.profit_progress,
  dateTime: new Date(row.date_time).toLocaleString(),
  symbol: row.symbol || undefined,
  positionSize: row.position_size ?? 1,
  riskAmount: row.risk_amount ?? 0,
  riskPercent: row.risk_percent ?? 0,
  rMultiple: row.r_multiple ?? 0,
  status: row.status || 'closed',
  closeReason: row.close_reason || undefined,
});

const toBacktest = (row: BacktestRow): BacktestSession => ({
  id: row.id,
  name: row.name,
  symbol: row.symbol,
  timeframe: row.timeframe,
  dateRange: row.date_range,
  totalTrades: row.total_trades,
  winRate: row.win_rate,
  totalPL: row.total_pl,
  createdDate: new Date(row.created_at).toLocaleString(),
  status: row.replay_states?.[0]?.status === 'completed' ? 'completed' : 'paused',
  initialBalance: row.replay_states?.[0]?.initial_balance,
  startDate: row.replay_states?.[0]?.start_date || undefined,
  rsiLength: row.rsi_length || undefined,
  emaTrigger: row.ema_trigger || undefined,
  volatilityFilter: row.volatility_filter || undefined,
  notes: row.notes || undefined,
  tradesList: (row.trades || []).map(toTrade),
  metrics: toMetrics(row.performance_metrics),
  replayState: toReplayState(row.id, row.replay_states),
});

const toIsoDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export async function fetchBacktests(userId: string): Promise<BacktestSession[]> {
  const { data, error } = await supabase
    .from('backtest_sessions')
    .select(`
      id,name,symbol,timeframe,date_range,total_trades,win_rate,total_pl,
      rsi_length,ema_trigger,volatility_filter,notes,created_at,
      trades(id,type,entry_price,exit_price,stop_loss,take_profit,profit_progress,date_time,symbol,position_size,risk_amount,risk_percent,r_multiple,status,close_reason),
      performance_metrics(net_pl,win_rate,average_r,max_drawdown,profit_factor,trade_count,equity_curve),
      replay_states(id,symbol,timeframe,start_date,current_index,initial_balance,current_balance,speed,status)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as BacktestRow[]).map(toBacktest);
}

export async function createBacktest(userId: string, session: BacktestSession): Promise<BacktestSession> {
  const { data: created, error } = await supabase
    .from('backtest_sessions')
    .insert({
      user_id: userId,
      name: session.name,
      symbol: session.symbol,
      timeframe: session.timeframe,
      date_range: session.dateRange,
      total_trades: session.totalTrades,
      win_rate: session.winRate,
      total_pl: session.totalPL,
      rsi_length: session.rsiLength,
      ema_trigger: session.emaTrigger,
      volatility_filter: session.volatilityFilter,
      notes: session.notes,
    })
    .select('id,name,symbol,timeframe,date_range,total_trades,win_rate,total_pl,rsi_length,ema_trigger,volatility_filter,notes,created_at')
    .single();

  if (error) throw error;

  if (session.tradesList.length > 0) {
    const { error: tradesError } = await supabase.from('trades').insert(
      session.tradesList.map((trade) => ({
        user_id: userId,
        backtest_session_id: created.id,
        type: trade.type,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        profit_progress: trade.profitProgress,
        symbol: trade.symbol || session.symbol,
        position_size: trade.positionSize || 1,
        risk_amount: trade.riskAmount || 0,
        risk_percent: trade.riskPercent || 0,
        r_multiple: trade.rMultiple || 0,
        status: trade.status || 'closed',
        close_reason: trade.closeReason,
        date_time: toIsoDate(trade.dateTime),
      })),
    );

    if (tradesError) throw tradesError;
  }

  const metrics = calculatePerformance(session.tradesList, session.initialBalance || 10000);

  const { error: replayError } = await supabase.from('replay_states').upsert({
    user_id: userId,
    backtest_session_id: created.id,
    symbol: session.symbol,
    timeframe: session.timeframe,
    start_date: session.startDate ? toIsoDate(session.startDate) : null,
    current_index: session.replayState?.currentIndex || 80,
    initial_balance: session.initialBalance || 10000,
    current_balance: (session.initialBalance || 10000) + metrics.netPL,
    speed: session.replayState?.speed || 1,
    status: session.status || 'paused',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'backtest_session_id' });

  if (replayError) throw replayError;

  const { error: metricsError } = await supabase.from('performance_metrics').upsert({
    user_id: userId,
    backtest_session_id: created.id,
    net_pl: metrics.netPL,
    win_rate: metrics.winRate,
    average_r: metrics.averageR,
    max_drawdown: metrics.maxDrawdown,
    profit_factor: metrics.profitFactor,
    trade_count: metrics.tradeCount,
    equity_curve: metrics.equityCurve,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'backtest_session_id' });

  if (metricsError) throw metricsError;

  const [reloaded] = await fetchBacktests(userId);
  return reloaded || toBacktest({ ...created, trades: [] });
}

export async function updateBacktestNotes(sessionId: string, notes: string): Promise<void> {
  const { error } = await supabase.from('backtest_sessions').update({ notes }).eq('id', sessionId);
  if (error) throw error;
}

export async function updateReplayState(input: {
  sessionId: string;
  currentIndex: number;
  currentBalance: number;
  speed: number;
  status: ReplayState['status'];
}): Promise<void> {
  const { error } = await supabase
    .from('replay_states')
    .update({
      current_index: input.currentIndex,
      current_balance: input.currentBalance,
      speed: input.speed,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('backtest_session_id', input.sessionId);

  if (error) throw error;
}

export async function addTradeToSession(userId: string, sessionId: string, sessionSymbol: string, trade: Trade): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .insert({
      user_id: userId,
      backtest_session_id: sessionId,
      type: trade.type,
      entry_price: trade.entryPrice,
      exit_price: trade.exitPrice,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      profit_progress: trade.profitProgress,
      symbol: trade.symbol || sessionSymbol,
      position_size: trade.positionSize || 1,
      risk_amount: trade.riskAmount || 0,
      risk_percent: trade.riskPercent || 0,
      r_multiple: trade.rMultiple || 0,
      status: trade.status || 'closed',
      close_reason: trade.closeReason,
      date_time: toIsoDate(trade.dateTime),
    })
    .select('id,type,entry_price,exit_price,stop_loss,take_profit,profit_progress,date_time,symbol,position_size,risk_amount,risk_percent,r_multiple,status,close_reason')
    .single();

  if (error) throw error;
  return toTrade(data);
}

export async function savePerformanceMetrics(userId: string, sessionId: string, metrics: PerformanceMetrics): Promise<void> {
  const { error } = await supabase.from('performance_metrics').upsert({
    user_id: userId,
    backtest_session_id: sessionId,
    net_pl: metrics.netPL,
    win_rate: metrics.winRate,
    average_r: metrics.averageR,
    max_drawdown: metrics.maxDrawdown,
    profit_factor: metrics.profitFactor,
    trade_count: metrics.tradeCount,
    equity_curve: metrics.equityCurve,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'backtest_session_id' });

  if (error) throw error;

  const { error: sessionError } = await supabase
    .from('backtest_sessions')
    .update({
      total_trades: metrics.tradeCount,
      win_rate: metrics.winRate,
      total_pl: metrics.netPL,
    })
    .eq('id', sessionId);

  if (sessionError) throw sessionError;
}

export function calculatePerformance(trades: Array<{ profitProgress: number; riskAmount?: number; rMultiple?: number }>, initialBalance = 10000) {
  const wins = trades.filter((trade) => trade.profitProgress > 0);
  const losses = trades.filter((trade) => trade.profitProgress < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.profitProgress, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.profitProgress, 0));
  let peak = initialBalance;
  let maxDrawdown = 0;
  let balance = initialBalance;
  const equityCurve = trades.map((trade, index) => {
    balance += trade.profitProgress;
    peak = Math.max(peak, balance);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? ((peak - balance) / peak) * 100 : 0);
    return { index: index + 1, balance: Number(balance.toFixed(2)) };
  });

  return {
    netPL: Number((grossProfit - grossLoss).toFixed(2)),
    winRate: trades.length ? Number(((wins.length / trades.length) * 100).toFixed(1)) : 0,
    averageR: trades.length
      ? Number((trades.reduce((sum, trade) => sum + (trade.rMultiple || 0), 0) / trades.length).toFixed(2))
      : 0,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    profitFactor: grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? grossProfit : 0,
    tradeCount: trades.length,
    equityCurve,
  };
}
