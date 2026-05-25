import { BacktestSession, Workspace, TradingStrategy, ChartCandle, SymbolPair, Timeframe, Trade } from './types';

// Helper to generate realistic historical candles using a pseudo-random seed
export function generateCandles(symbol: SymbolPair, count: number = 100, seedValue: number = 42): ChartCandle[] {
  let initialPrice = 64000;
  if (symbol === 'ETHUSDT') initialPrice = 3450;
  if (symbol === 'SOLUSDT') initialPrice = 146;
  if (symbol === 'XRPUSDT') initialPrice = 0.55;

  const candles: ChartCandle[] = [];
  let currentPrice = initialPrice;

  // Simple LCG random generator for reproducible data
  let seed = seedValue;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const hourOffset = 4;
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * hourOffset * 60 * 60 * 1000);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const changePercent = (rand() - 0.495) * 0.015; // slight upward drift
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + rand() * 0.008);
    const low = Math.min(open, close) * (1 - rand() * 0.008);

    candles.push({
      time: i === 0 ? '14:00' : timeStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    currentPrice = close;
  }

  return candles;
}

// Default backtest reports pre-filled with data from templates
export const initialBacktests: BacktestSession[] = [
  {
    id: 'bt-1',
    name: 'Mean_Reversion_V4_Test',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    dateRange: '2023.01.01 - 2023.12.31',
    totalTrades: 1248,
    winRate: 64.2,
    totalPL: 14208.45,
    createdDate: '2024.05.12 14:30',
    rsiLength: 14,
    emaTrigger: 200,
    volatilityFilter: 'ATR 1.5x',
    notes: 'Primary test of Mean Reversion Bollinger logic with dynamic take profit on high volume nodes.',
    tradesList: [
      { id: 't-1', type: 'LONG', entryPrice: 64231.50, exitPrice: 67112.00, stopLoss: 63800.00, takeProfit: 68000.00, profitProgress: 2880.50, dateTime: '2024-04-12 14:00' },
      { id: 't-2', type: 'SHORT', entryPrice: 65900.00, exitPrice: 66250.00, stopLoss: 66500.00, takeProfit: 63000.00, profitProgress: -350.00, dateTime: '2024-04-11 08:30' },
      { id: 't-3', type: 'LONG', entryPrice: 63150.00, exitPrice: 64500.00, stopLoss: 62900.00, takeProfit: 65500.00, profitProgress: 1350.00, dateTime: '2024-04-10 16:45' },
      { id: 't-4', type: 'LONG', entryPrice: 61800.00, exitPrice: 62900.00, stopLoss: 61000.00, takeProfit: 63500.00, profitProgress: 1100.00, dateTime: '2024-04-09 10:15' },
      { id: 't-5', type: 'SHORT', entryPrice: 62450.00, exitPrice: 62800.00, stopLoss: 63000.00, takeProfit: 61000.00, profitProgress: -350.00, dateTime: '2024-04-08 22:30' }
    ]
  },
  {
    id: 'bt-2',
    name: 'Scalper_Aggressive_3_ETH',
    symbol: 'ETHUSDT',
    timeframe: '1m',
    dateRange: '2023.06.01 - 2023.08.01',
    totalTrades: 4512,
    winRate: 48.1,
    totalPL: -2114.20,
    createdDate: '2024.05.10 09:15',
    rsiLength: 7,
    emaTrigger: 50,
    volatilityFilter: 'Tick 2x',
    notes: 'Aggressive scalper logic configured on standard ETH volatility waves. Experienced drawdowns in flat regimes.',
    tradesList: [
      { id: 'eth-1', type: 'SHORT', entryPrice: 3450.20, exitPrice: 3410.50, stopLoss: 3470.00, takeProfit: 3380.00, profitProgress: 39.70, dateTime: '2024-05-09 11:24' },
      { id: 'eth-2', type: 'LONG', entryPrice: 3420.00, exitPrice: 3390.00, stopLoss: 3385.00, takeProfit: 3490.00, profitProgress: -30.00, dateTime: '2024-05-09 04:12' },
      { id: 'eth-3', type: 'SHORT', entryPrice: 3480.00, exitPrice: 3512.00, stopLoss: 3510.00, takeProfit: 3400.00, profitProgress: -32.00, dateTime: '2024-05-08 19:33' }
    ]
  },
  {
    id: 'bt-3',
    name: 'Trend_Follower_Daily_Macro',
    symbol: 'SOLUSDT',
    timeframe: '1D',
    dateRange: '2021.01.01 - 2024.01.01',
    totalTrades: 86,
    winRate: 72.5,
    totalPL: 42912.00,
    createdDate: '2024.05.08 22:45',
    rsiLength: 21,
    emaTrigger: 200,
    volatilityFilter: 'ATR 2.0x',
    notes: 'Macro swing execution following standard Solana market breakouts.',
    tradesList: [
      { id: 'sol-1', type: 'LONG', entryPrice: 112.50, exitPrice: 145.80, stopLoss: 95.00, takeProfit: 160.00, profitProgress: 3330.00, dateTime: '2024-05-01 09:00' },
      { id: 'sol-2', type: 'LONG', entryPrice: 92.40, exitPrice: 108.10, stopLoss: 80.00, takeProfit: 120.00, profitProgress: 1570.00, dateTime: '2024-04-15 09:00' }
    ]
  },
  {
    id: 'bt-4',
    name: 'Breakout_Hunter_4H_XRP',
    symbol: 'XRPUSDT',
    timeframe: '4h',
    dateRange: '2022.01.01 - 2022.12.31',
    totalTrades: 241,
    winRate: 55.2,
    totalPL: 1422.30,
    createdDate: '2024.05.05 11:20',
    rsiLength: 14,
    emaTrigger: 100,
    volatilityFilter: 'None',
    notes: 'Clean breakouts over high liquidity horizontal support and resistance lines.',
    tradesList: [
      { id: 'xrp-1', type: 'LONG', entryPrice: 0.5210, exitPrice: 0.5840, stopLoss: 0.4900, takeProfit: 0.6100, profitProgress: 63.00, dateTime: '2024-04-22 16:00' }
    ]
  },
  {
    id: 'bt-5',
    name: 'Arb_Scan_Base_V1',
    symbol: 'BTCUSDT',
    timeframe: '5m',
    dateRange: '2024.01.01 - 2024.03.01',
    totalTrades: 8102,
    winRate: 50.2,
    totalPL: -452.12,
    createdDate: '2024.05.02 08:00',
    rsiLength: 14,
    emaTrigger: 100,
    volatilityFilter: 'None',
    notes: 'Arbitrage Scanner scanning order depths across three regional endpoints.',
    tradesList: [
      { id: 'arb-1', type: 'SHORT', entryPrice: 65400.00, exitPrice: 65420.00, stopLoss: 65350.00, takeProfit: 65550.00, profitProgress: -20.00, dateTime: '2024-05-01 10:05' }
    ]
  }
];

// Workspaces preloads
export const initialWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Intraday Scalping',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    lastModified: 'Modified 2h ago',
    imageUrl: 'https://images.unsplash.com/photo-1611974717535-7c809af05bd7?q=80&w=600&h=400&auto=format&fit=crop'
  },
  {
    id: 'ws-2',
    name: 'ETH Pivot Points',
    symbol: 'ETHUSDT',
    timeframe: '1h',
    lastModified: 'Modified Yesterday',
    imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=600&h=400&auto=format&fit=crop'
  },
  {
    id: 'ws-3',
    name: 'Macro Trends',
    symbol: 'SOLUSDT',
    timeframe: '1D',
    lastModified: 'Modified Oct 24',
    imageUrl: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=600&h=400&auto=format&fit=crop'
  },
  {
    id: 'ws-4',
    name: 'Volatility Screener',
    symbol: 'XRPUSDT',
    timeframe: '5m',
    lastModified: 'Modified 12h ago',
    imageUrl: 'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?q=80&w=600&h=400&auto=format&fit=crop'
  }
];

// Strategies preloads
export const initialStrategies: TradingStrategy[] = [
  {
    id: 'st-1',
    name: 'Mean Reversion V4',
    symbol: 'BTCUSDT',
    timeframe: '5m',
    lastTest: 'Win Rate: 72.1% · P/L: +$8.4k',
    type: 'AUTOMATED',
    winRate: 72.1,
    totalPL: '+$8.4k',
    status: 'ACTIVE'
  },
  {
    id: 'st-2',
    name: 'Trend Follower',
    symbol: 'ETHUSDT',
    timeframe: '1h',
    lastTest: 'Win Rate: 54.8% · P/L: +$3.2k',
    type: 'AUTOMATED',
    winRate: 54.8,
    totalPL: '+$3.2k',
    status: 'DRAFT'
  },
  {
    id: 'st-3',
    name: 'Scalper Aggressive',
    symbol: 'SOLUSDT',
    timeframe: '1m',
    lastTest: 'Win Rate: 42.5% · P/L: -$1.2k',
    type: 'MANUAL',
    winRate: 42.5,
    totalPL: '-$1.2k',
    status: 'ACTIVE'
  }
];
