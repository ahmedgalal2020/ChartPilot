import type { ChartCandle, SymbolPair, Timeframe } from '../types';

export interface MarketDataProvider {
  getCandles(input: {
    symbol: SymbolPair;
    timeframe: Timeframe;
    startDate?: string;
    count?: number;
  }): Promise<ChartCandle[]>;
}

const basePrices: Record<string, number> = {
  EURUSD: 1.086,
  GBPUSD: 1.274,
  USDJPY: 157.2,
  USDCHF: 0.91,
  AUDUSD: 0.665,
  USDCAD: 1.367,
  NZDUSD: 0.612,
  BTCUSD: 68400,
  ETHUSD: 3780,
  SOLUSD: 168,
  XRPUSD: 0.62,
  NASDAQ: 18950,
  SPX500: 5320,
  DAX: 18450,
  DJI: 39800,
  XAUUSD: 2342,
  XAGUSD: 31.2,
  WTI: 78.4,
};

const timeframeMinutes: Record<Timeframe, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1D': 1440,
};

const seededRandom = (seedText: string) => {
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) % 2147483647;
  }
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
};

export class MockMarketDataProvider implements MarketDataProvider {
  async getCandles({ symbol, timeframe, startDate, count = 240 }: {
    symbol: SymbolPair;
    timeframe: Timeframe;
    startDate?: string;
    count?: number;
  }): Promise<ChartCandle[]> {
    const rand = seededRandom(`${symbol}-${timeframe}-${startDate || 'latest'}`);
    const stepMs = timeframeMinutes[timeframe] * 60 * 1000;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - count * stepMs);
    const base = basePrices[symbol] || 100;
    const volatility = base > 1000 ? 0.006 : base > 10 ? 0.01 : 0.004;
    const candles: ChartCandle[] = [];
    let price = base * (0.94 + rand() * 0.12);

    for (let index = 0; index < count; index += 1) {
      const timestamp = new Date(start.getTime() + index * stepMs);
      const drift = (rand() - 0.48) * volatility;
      const open = price;
      const close = open * (1 + drift);
      const high = Math.max(open, close) * (1 + rand() * volatility * 0.8);
      const low = Math.min(open, close) * (1 - rand() * volatility * 0.8);
      price = close;

      candles.push({
        time: timeframe === '1D'
          ? timestamp.toLocaleDateString()
          : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: timestamp.toISOString(),
        open: Number(open.toFixed(base < 10 ? 5 : 2)),
        high: Number(high.toFixed(base < 10 ? 5 : 2)),
        low: Number(low.toFixed(base < 10 ? 5 : 2)),
        close: Number(close.toFixed(base < 10 ? 5 : 2)),
        volume: Math.round(1000 + rand() * 9000),
      });
    }

    return candles;
  }
}

export const marketDataProvider: MarketDataProvider = new MockMarketDataProvider();
