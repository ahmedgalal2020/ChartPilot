export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export type SymbolPair = string;

export interface BacktestSession {
  id: string;
  name: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  dateRange: string;
  status?: 'running' | 'paused' | 'completed';
  initialBalance?: number;
  startDate?: string;
  endDate?: string;
  totalTrades: number;
  winRate: number; // percentage (e.g. 64.2)
  totalPL: number; // in USDT / USD
  createdDate: string;
  tradesList: Trade[];
  metrics?: PerformanceMetrics;
  replayState?: ReplayState;
  rsiLength?: number;
  emaTrigger?: number;
  volatilityFilter?: string;
  notes?: string;
}

export interface Trade {
  id: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  profitProgress: number; // Net USD value
  dateTime: string;
  symbol?: SymbolPair;
  positionSize?: number;
  riskAmount?: number;
  riskPercent?: number;
  rMultiple?: number;
  status?: 'open' | 'closed';
  closeReason?: string;
}

export interface Workspace {
  id: string;
  name: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  lastModified: string;
  imageUrl: string;
  range?: string;
  tradesCount?: number;
  isActive?: boolean;
  watchlist?: SymbolPair[];
  layout?: Record<string, unknown>;
}

export interface TradingStrategy {
  id: string;
  name: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  lastTest: string;
  type: 'AUTOMATED' | 'MANUAL';
  winRate: number;
  totalPL: string;
  status: 'ACTIVE' | 'DRAFT';
}

export interface ChartCandle {
  time: string;
  timestamp?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TradingSymbol {
  id: string;
  name: string;
  ticker: SymbolPair;
  category: 'forex' | 'crypto' | 'index' | 'commodity';
  baseCurrency: string;
  quoteCurrency: string;
  tickSize: number;
  pipSize: number;
  exchange: string;
  source: string;
  active: boolean;
}

export interface DrawingObject {
  id: string;
  type: 'trendline' | 'horizontal' | 'rectangle' | 'text';
  symbol: SymbolPair;
  timeframe: Timeframe;
  points: Array<{ x: number; y: number; time?: string; price?: number }>;
  text?: string;
  style?: Record<string, unknown>;
}

export interface ReplayState {
  id?: string;
  backtestSessionId: string;
  symbol: SymbolPair;
  timeframe: Timeframe;
  startDate?: string;
  currentIndex: number;
  initialBalance: number;
  currentBalance: number;
  speed: number;
  status: 'playing' | 'paused' | 'completed';
}

export interface PerformanceMetrics {
  netPL: number;
  winRate: number;
  averageR: number;
  maxDrawdown: number;
  profitFactor: number;
  tradeCount: number;
  equityCurve: Array<{ index: number; balance: number }>;
}

export interface UserSettings {
  commission: number; // percentage (e.g. 0.05)
  slippage: number; // points / ticks
  riskPerTrade: number; // percentage (e.g. 2.0)
  theme: 'dark' | 'light';
  bullColor: string; // hex
  bearColor: string; // hex
  timezone: string;
  gridLines: boolean;
  volumeBars: boolean;
  priceLabel: boolean;
  showTelemetry?: boolean;
  defaultInitialBalance?: number;
  defaultTimeframe?: Timeframe;
  defaultSymbol?: SymbolPair;
}
