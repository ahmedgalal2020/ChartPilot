import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  CheckCircle, 
  Activity,
  Trash2
} from 'lucide-react';
import { BacktestSession, ChartCandle, DrawingObject, SymbolPair, Timeframe, Trade, TradingSymbol, UserSettings } from '../types';
import { marketDataProvider } from '../services/marketData';
import { createDrawing, deleteDrawing, fetchDrawings } from '../services/drawings';

interface DashboardViewProps {
  userId: string;
  settings: UserSettings;
  symbols: TradingSymbol[];
  initialSymbol: SymbolPair;
  initialTimeframe: Timeframe;
  activeSession?: BacktestSession | null;
  onReplayProgress?: (sessionId: string, progress: {
    currentIndex: number;
    currentBalance: number;
    speed: number;
    status: 'playing' | 'paused' | 'completed';
  }) => void | Promise<void>;
  onPersistTrade?: (trade: Trade) => void | Promise<void>;
  onAddTradeNotification: (msg: string) => void;
}

export default function DashboardView({ userId, settings, symbols, initialSymbol, initialTimeframe, activeSession, onReplayProgress, onPersistTrade, onAddTradeNotification }: DashboardViewProps) {
  const [selectedAsset, setSelectedAsset] = useState<SymbolPair>(initialSymbol || 'BTCUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe || '1h');
  const [activeRightTab, setActiveRightTab] = useState<'setup' | 'watchlist'>('setup');
  const [activeBottomTab, setActiveBottomTab] = useState<'replay' | 'trades' | 'performance'>('replay');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');

  // Replay playback engine states
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1.5);
  const [candlePool, setCandlePool] = useState<ChartCandle[]>([]);
  const [visibleCandles, setVisibleCandles] = useState<ChartCandle[]>([]);
  const [replayIndex, setReplayIndex] = useState(activeSession?.replayState?.currentIndex || 80);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);

  // Trade Setup form fields (dynamically bound to current close price)
  const [entryPrice, setEntryPrice] = useState<string>('64420.50');
  const [stopLoss, setStopLoss] = useState<string>('63850.00');
  const [takeProfit, setTakeProfit] = useState<string>('66200.00');

  // Simulated live metrics based on playback ticks
  const [pLOffset, setPLOffset] = useState<number>(0);
  const [simulatedTrades, setSimulatedTrades] = useState<Trade[]>([
    { id: 'sim-1', type: 'LONG', symbol: initialSymbol || 'BTCUSD', entryPrice: 64120.00, exitPrice: 65150.00, stopLoss: 63500.00, takeProfit: 66000.00, profitProgress: 1030.00, rMultiple: 1.66, status: 'closed', dateTime: '2 hours ago' },
    { id: 'sim-2', type: 'SHORT', symbol: initialSymbol || 'BTCUSD', entryPrice: 65200.00, exitPrice: 64850.00, stopLoss: 65700.00, takeProfit: 64200.00, profitProgress: 350.00, rMultiple: 0.7, status: 'closed', dateTime: '1 hour ago' },
  ]);

  // Loading candle sequence on asset or timeframe change
  useEffect(() => {
    let cancelled = false;
    const loadCandles = async () => {
      setIsChartLoading(true);
      const activeSymbol = activeSession?.symbol || selectedAsset;
      const activeTimeframe = activeSession?.timeframe || timeframe;
      const activeIndex = activeSession?.replayState?.currentIndex || 80;
      const rawCandles = await marketDataProvider.getCandles({
        symbol: activeSymbol,
        timeframe: activeTimeframe,
        count: 220,
        startDate: activeSession?.startDate || activeSession?.replayState?.startDate,
      });
      if (cancelled) return;
      const startingVisibleCount = Math.max(20, Math.min(activeIndex, rawCandles.length - 1));
      setSelectedAsset(activeSymbol);
      setTimeframe(activeTimeframe);
      setReplayIndex(startingVisibleCount);
      setVisibleCandles(rawCandles.slice(Math.max(0, startingVisibleCount - 100), startingVisibleCount));
      setCandlePool(rawCandles.slice(startingVisibleCount));
      setIsPlaying(false);

      const lastPrice = rawCandles[startingVisibleCount - 1]?.close || rawCandles.at(-1)?.close || 1;
      const factor = Math.max(lastPrice * 0.012, lastPrice < 10 ? 0.002 : 0.2);
      setEntryPrice(lastPrice.toString());
      setStopLoss((lastPrice - factor).toFixed(lastPrice < 10 ? 5 : 2));
      setTakeProfit((lastPrice + factor * 2).toFixed(lastPrice < 10 ? 5 : 2));
      setIsChartLoading(false);
    };
    loadCandles();
    return () => {
      cancelled = true;
    };
  }, [selectedAsset, timeframe, activeSession?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadDrawings = async () => {
      try {
        const savedDrawings = await fetchDrawings(userId, selectedAsset, timeframe);
        if (!cancelled) setDrawings(savedDrawings);
      } catch {
        if (!cancelled) setDrawings([]);
      }
    };
    loadDrawings();
    return () => {
      cancelled = true;
    };
  }, [userId, selectedAsset, timeframe]);

  // Replay interval loop
  useEffect(() => {
    if (!isPlaying || candlePool.length === 0) return;

    const intervalPeriod = Math.max(200, 2000 / replaySpeed);
    const interval = setInterval(() => {
      setVisibleCandles((prev) => {
        if (candlePool.length === 0) {
          setIsPlaying(false);
          clearInterval(interval);
          return prev;
        }

        const nextCandle = candlePool[0];
        setCandlePool((pool) => pool.slice(1));
        setReplayIndex((current) => current + 1);

        // Update current live rates
        setEntryPrice(nextCandle.close.toString());

        // Increment simulated P/L a bit at random to represent market ticks
        const isWinning = Math.random() > 0.42;
        const tickMove = (Math.random() * Math.max(nextCandle.close * 0.002, 1)) * (isWinning ? 1 : -1);
        setPLOffset((curr) => curr + tickMove);

        // Keep maximum 100 candles on chart at once to avoid sluggish overflow
        const updated = [...prev, nextCandle];
        if (updated.length > 100) {
          return updated.slice(1);
        }
        return updated;
      });
    }, intervalPeriod);

    return () => clearInterval(interval);
  }, [isPlaying, candlePool, replaySpeed, selectedAsset]);

  useEffect(() => {
    if (!activeSession?.id || !onReplayProgress) return;
    const saveTimer = setTimeout(() => {
      onReplayProgress(activeSession.id, {
        currentIndex: replayIndex,
        currentBalance: activeSession.replayState?.currentBalance || activeSession.initialBalance || 10000,
        speed: replaySpeed,
        status: candlePool.length === 0 ? 'completed' : isPlaying ? 'playing' : 'paused',
      });
    }, 800);

    return () => clearTimeout(saveTimer);
  }, [activeSession?.id, replayIndex, replaySpeed, isPlaying, candlePool.length]);

  // Handle speed changes
  const handleSpeedSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaySpeed(Number(e.target.value));
  };

  // Skip step forward
  const handleStepForward = () => {
    if (candlePool.length === 0) return;
    const nextCandle = candlePool[0];
    setCandlePool((prev) => prev.slice(1));
    setVisibleCandles((prevVisible) => {
      const updated = [...prevVisible, nextCandle];
      return updated.length > 100 ? updated.slice(1) : updated;
    });
    setReplayIndex((current) => current + 1);
    setEntryPrice(nextCandle.close.toString());
    setPLOffset((curr) => curr + (Math.random() - 0.45) * 50);
  };

  // Reset/Replay trigger
  const handleResetReplay = async () => {
    const rawCandles = await marketDataProvider.getCandles({ symbol: selectedAsset, timeframe, count: 180, startDate: new Date(Date.now() - 180 * 60 * 60 * 1000).toISOString() });
    setVisibleCandles(rawCandles.slice(0, 80));
    setCandlePool(rawCandles.slice(80));
    setReplayIndex(80);
    setIsPlaying(false);
    setPLOffset(0);
    onAddTradeNotification('Simulation replay reset to timestamp 00:00.');
  };

  // Executing new trade order
  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) {
      onAddTradeNotification('Error: Invalid price boundaries.');
      return;
    }

    // Add trade log simulation
    const pL = orderType === 'BUY' ? (tp - entry) : (entry - tp);
    const riskDistance = Math.max(Math.abs(entry - sl), 0.00001);
    const positionSize = Math.max(1, Number((100 / riskDistance).toFixed(3)));
    const estReward = pL * positionSize;
    const riskAmount = riskDistance * positionSize;

    const newSimTrade: Trade = {
      id: `sim-${Date.now()}`,
      type: orderType === 'BUY' ? 'LONG' : 'SHORT',
      symbol: selectedAsset,
      entryPrice: entry,
      exitPrice: tp,
      stopLoss: sl,
      takeProfit: tp,
      profitProgress: Number(estReward.toFixed(2)),
      positionSize,
      riskAmount: Number(riskAmount.toFixed(2)),
      riskPercent: settings.riskPerTrade,
      rMultiple: Number((estReward / Math.max(riskAmount, 0.01)).toFixed(2)),
      status: 'closed',
      closeReason: 'target',
      dateTime: 'Just now'
    };

    setSimulatedTrades((prev) => [newSimTrade, ...prev]);
    if (activeSession && onPersistTrade) {
      await onPersistTrade(newSimTrade);
    }
    onAddTradeNotification(`Executed: ${newSimTrade.type} Order opened for ${selectedAsset} at price $${entry.toFixed(2)}.`);
  };

  // Compute stats on active simulated performance
  const displayPL = 12450.00 + pLOffset;
  const isPLPositive = displayPL >= 0;
  const watchlistSymbols = symbols.length > 0 ? symbols.slice(0, 8) : [
    { ticker: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto' },
    { ticker: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto' },
    { ticker: 'EURUSD', name: 'Euro / US Dollar', category: 'forex' },
    { ticker: 'XAUUSD', name: 'Gold Spot / US Dollar', category: 'commodity' },
  ] as TradingSymbol[];

  const handleCreateDrawing = async (type: DrawingObject['type']) => {
    const lastCandle = visibleCandles[visibleCandles.length - 1];
    if (!lastCandle) return;
    const nextDrawing = {
      type,
      symbol: selectedAsset,
      timeframe,
      points: type === 'horizontal'
        ? [{ x: 0.15, y: 0.5, price: lastCandle.close }, { x: 0.9, y: 0.5, price: lastCandle.close }]
        : type === 'rectangle'
        ? [{ x: 0.25, y: 0.25 }, { x: 0.55, y: 0.55 }]
        : [{ x: 0.2, y: 0.65 }, { x: 0.62, y: 0.35 }],
      text: type === 'text' ? 'Review setup' : undefined,
      style: { color: type === 'horizontal' ? '#66d9cc' : '#44d8f1' },
    };

    try {
      const saved = await createDrawing(userId, nextDrawing);
      setDrawings((prev) => [...prev, saved]);
      onAddTradeNotification(`Saved ${type} drawing on ${selectedAsset}.`);
    } catch (error) {
      onAddTradeNotification(error instanceof Error ? error.message : 'Drawing save failed.');
    }
  };

  const handleDeleteLastDrawing = async () => {
    const latest = drawings[drawings.length - 1];
    if (!latest) {
      onAddTradeNotification('No drawing object selected to delete.');
      return;
    }

    try {
      await deleteDrawing(latest.id);
      setDrawings((prev) => prev.slice(0, -1));
      onAddTradeNotification('Deleted latest drawing object.');
    } catch (error) {
      onAddTradeNotification(error instanceof Error ? error.message : 'Drawing delete failed.');
    }
  };

  // Render SVG Candles Chart
  const renderInteractiveChart = () => {
    if (visibleCandles.length === 0) return null;

    // Grid details
    const width = 800;
    const height = 400;
    const paddingRight = 60;
    const paddingTop = 30;
    const paddingBottom = 20;

    const prices = visibleCandles.map((c) => [c.high, c.low]).flat();
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Mapping X/Y coordinate ratios
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const xStep = chartWidth / Math.max(1, visibleCandles.length - 1);
    const getY = (price: number) => {
      return paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    // Calculate glowing elements
    const lastVisibleCandle = visibleCandles[visibleCandles.length - 1];
    const trackingY = getY(lastVisibleCandle.close);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none" preserveAspectRatio="none">
        
        {/* Background grid lines */}
        {settings.gridLines !== false && (
          <g stroke="#3c494c" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="3,3">
            {/* Horizontal lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, index) => {
              const yVal = paddingTop + chartHeight * ratio;
              return <line key={`h-${index}`} x1="0" y1={yVal} x2={chartWidth} y2={yVal} />;
            })}
            {/* Vertical lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, index) => {
              const xVal = chartWidth * ratio;
              return <line key={`v-${index}`} x1={xVal} y1="0" x2={xVal} y2={height - paddingBottom} />;
            })}
          </g>
        )}

        {/* Dynamic neon gradient background */}
        <defs>
          <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#44d8f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#44d8f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Glow polygon anchor */}
        <path 
          d={`M 0 ${height - paddingBottom} 
              ${visibleCandles.map((c, i) => `L ${i * xStep} ${getY(c.close)}`).join(' ')} 
              L ${chartWidth} ${height - paddingBottom} Z`} 
          fill="url(#neonGradient)" 
        />

        {/* Candlestick bodies and wicks */}
        {visibleCandles.map((candle, index) => {
          const isBull = candle.close >= candle.open;
          const wickColor = isBull ? (settings.bullColor || '#26A69A') : (settings.bearColor || '#EF5350');
          const bodyColor = isBull ? (settings.bullColor || '#26A69A') : (settings.bearColor || '#EF5350');
          const borderStroke = isBull ? (settings.bullColor || '#26A69A') : (settings.bearColor || '#EF5350');

          const x = index * xStep;
          const yOpen = getY(candle.open);
          const yClose = getY(candle.close);
          const yHigh = getY(candle.high);
          const yLow = getY(candle.low);

          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(1.5, Math.abs(yOpen - yClose));
          const colWidth = Math.max(2, xStep * 0.62);

          return (
            <g key={`candle-${index}`}>
              {/* Wick segment */}
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={wickColor} strokeWidth="1.2" />
              {/* Candlestick bar body */}
              <rect 
                x={x - colWidth / 2} 
                y={bodyY} 
                width={colWidth} 
                height={bodyH} 
                fill={bodyColor} 
                stroke={borderStroke}
                strokeWidth="0.5"
                opacity="0.9"
              />
            </g>
          );
        })}

        {/* Dynamic tracking lines / Dotted crosshair */}
        <line x1="0" y1={trackingY} x2={chartWidth} y2={trackingY} stroke="#44d8f1" strokeOpacity="0.32" strokeDasharray="3,3" strokeWidth="1" />
        <line x1={chartWidth} y1="0" x2={chartWidth} y2={height} stroke="#3c494c" strokeWidth="1" />

        {drawings.map((drawing) => {
          const color = String(drawing.style?.color || '#44d8f1');
          if (drawing.type === 'horizontal') {
            const y = (drawing.points[0]?.y || 0.5) * height;
            return <line key={drawing.id} x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke={color} strokeWidth="2" strokeDasharray="6,4" />;
          }
          if (drawing.type === 'rectangle') {
            const first = drawing.points[0] || { x: 0.25, y: 0.25 };
            const second = drawing.points[1] || { x: 0.55, y: 0.55 };
            return (
              <rect
                key={drawing.id}
                x={Math.min(first.x, second.x) * chartWidth}
                y={Math.min(first.y, second.y) * height}
                width={Math.abs(second.x - first.x) * chartWidth}
                height={Math.abs(second.y - first.y) * height}
                fill={color}
                fillOpacity="0.08"
                stroke={color}
                strokeWidth="1.5"
              />
            );
          }
          if (drawing.type === 'text') {
            const first = drawing.points[0] || { x: 0.3, y: 0.35 };
            return <text key={drawing.id} x={first.x * chartWidth} y={first.y * height} fill={color} fontSize="13" fontWeight="700">{drawing.text || 'Note'}</text>;
          }
          const first = drawing.points[0] || { x: 0.2, y: 0.65 };
          const second = drawing.points[1] || { x: 0.62, y: 0.35 };
          return <line key={drawing.id} x1={first.x * chartWidth} y1={first.y * height} x2={second.x * chartWidth} y2={second.y * height} stroke={color} strokeWidth="2.5" />;
        })}

        {/* Tracking Price axis tag */}
        <g transform={`translate(${chartWidth}, ${trackingY - 8})`}>
          <rect width="60" height="15" fill="#44d8f1" rx="2" />
          <text x="30" y="11" fill="#00363e" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            {lastVisibleCandle.close.toFixed(1)}
          </text>
        </g>
      </svg>
    );
  };

  // Helper calculations for active risk setting
  const numEntry = parseFloat(entryPrice) || 1;
  const numSL = parseFloat(stopLoss) || 1;
  const numTP = parseFloat(takeProfit) || 1;

  const calculatedRR = Math.max(0.1, Math.abs(numTP - numEntry) / Math.max(0.01, Math.abs(numEntry - numSL)));
  const assetMultiplier = Math.max(numEntry * 0.0008, 0.1);
  const estimatedProfit = Math.abs(numTP - numEntry) * assetMultiplier * (settings.riskPerTrade / 2);
  const estimatedLoss = Math.abs(numEntry - numSL) * assetMultiplier * (settings.riskPerTrade / 2);

  return (
    <div className="flex flex-col md:flex-row flex-grow w-full overflow-hidden h-[calc(100vh-48px)]">
      
      {/* Central Terminal / Graph & Replay controller */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background relative border-r border-outline-variant">
        
        {/* Symbol Quick Toggles */}
        <div className="flex items-center justify-between px-4 py-2 bg-surface-container-low border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex bg-surface-container-lowest border border-outline-variant p-0.5 rounded max-w-[52vw] overflow-x-auto">
              {watchlistSymbols.slice(0, 6).map((symbol) => (
                <button
                  key={symbol.ticker}
                  onClick={() => setSelectedAsset(symbol.ticker)}
                  className={`px-3 py-1 font-mono text-[11px] font-bold rounded uppercase transition-all ${
                    selectedAsset === symbol.ticker 
                      ? 'bg-primary text-on-primary' 
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {symbol.ticker.replace('USD', '')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-l border-outline-variant pl-4">
              <span className="text-[10px] uppercase font-bold text-outline font-sans">Interval:</span>
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="bg-surface-container-lowest border border-outline-variant text-[11px] font-bold text-on-surface py-0.5 pl-2 pr-6 rounded focus:ring-0 outline-none cursor-pointer"
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1D">1D</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-outline font-bold">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>REAL-TIME PIPELINE ACTIVE</span>
          </div>
        </div>

        {activeSession && (
          <div className="px-4 py-2 bg-primary/8 border-b border-primary/20 flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <span className="text-primary font-bold uppercase">Active Replay</span>
            <span className="text-on-surface">{activeSession.name}</span>
            <span className="text-outline">Index {replayIndex}</span>
            <span className="text-outline">Saved state updates automatically</span>
          </div>
        )}

        {/* SVG Drawing Canvas Container */}
          <div className="flex-1 relative bg-surface-container-lowest overflow-hidden flex flex-col p-4">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3c494c 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          
          {/* Prices tickers overlay */}
          <div className="flex gap-4 font-mono font-medium text-[11px] text-on-surface-variant z-10 border-b border-outline-variant/20 pb-2 mb-2 shrink-0">
            {visibleCandles.length > 0 && (
              <>
                <span>O: <span className="text-primary font-bold">{visibleCandles[visibleCandles.length - 1].open.toLocaleString()}</span></span>
                <span>H: <span className="text-primary font-bold">{visibleCandles[visibleCandles.length - 1].high.toLocaleString()}</span></span>
                <span>L: <span className="text-primary font-bold">{visibleCandles[visibleCandles.length - 1].low.toLocaleString()}</span></span>
                <span>C: <span className="text-primary font-bold">{visibleCandles[visibleCandles.length - 1].close.toLocaleString()}</span></span>
                {candlePool.length > 0 && (
                  <span className="ml-auto text-primary animate-pulse text-[10px] tracking-wider uppercase font-bold">
                    Replay Pool: {candlePool.length} Bars remain
                  </span>
                )}
              </>
            )}
          </div>

          {/* SVG Canvas drawing block */}
          <div className="flex-1 relative min-h-0 flex items-center justify-center">
            {isChartLoading ? (
              <div className="text-primary font-mono text-xs uppercase tracking-widest">Loading market candles...</div>
            ) : visibleCandles.length === 0 ? (
              <div className="text-outline font-mono text-xs uppercase tracking-widest">No candle data available</div>
            ) : (
              renderInteractiveChart()
            )}
          </div>
        </div>

        {/* Bottom Console Panel (Tabs inside Replay, Simulated log, Stats) */}
        <div className="h-1/3 min-h-[180px] border-t border-outline-variant bg-surface-container-low flex flex-col overflow-hidden shrink-0">
          <div className="flex items-center px-4 border-b border-outline-variant bg-surface-container gap-4 h-9 shrink-0">
            <button 
              onClick={() => setActiveBottomTab('replay')}
              className={`pb-0 h-full px-2 font-label-caps text-xs tracking-wider uppercase font-semibold transition-all ${
                activeBottomTab === 'replay' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Replay Console
            </button>
            <button 
              onClick={() => setActiveBottomTab('trades')}
              className={`pb-0 h-full px-2 font-label-caps text-xs tracking-wider uppercase font-semibold transition-all ${
                activeBottomTab === 'trades' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Active Session Trades ({simulatedTrades.length})
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeBottomTab === 'replay' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center h-full">
                
                {/* Replay controller console */}
                <div className="lg:col-span-4 flex items-center gap-4 border-r border-outline-variant/30 pr-6 h-full">
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleResetReplay}
                      className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary transition-all bg-surface-container-lowest"
                      title="Reset timeline back cache"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isPlaying 
                          ? 'bg-primary text-on-primary shadow-[0_0_8px_rgba(68,216,241,0.35)]' 
                          : 'border border-outline-variant text-on-surface hover:text-primary hover:border-primary'
                      }`}
                      title={isPlaying ? 'Pause replay' : 'Play / Pause live timeline candles'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <button 
                      onClick={handleStepForward}
                      className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary transition-all bg-surface-container-lowest"
                      title="Step single forward candle"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex justify-between text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                      <span>Live Replay Speed</span>
                      <span className="text-primary font-bold">{replaySpeed.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="5" 
                      step="0.5" 
                      value={replaySpeed}
                      onChange={handleSpeedSliderChange}
                      className="w-full h-1 bg-outline-variant rounded-full appearance-none accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Simulated live metrics dashboard */}
                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-surface-container p-2.5 rounded border border-outline-variant">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Win Rate</div>
                    <div className="font-mono text-base font-bold text-secondary">64.2%</div>
                  </div>
                  
                  <div className="bg-surface-container p-2.5 rounded border border-outline-variant">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Total Profit/Loss</div>
                    <div className={`font-mono text-base font-bold ${isPLPositive ? 'text-secondary' : 'text-error'}`}>
                      {isPLPositive ? '+' : ''}${displayPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-surface-container p-2.5 rounded border border-outline-variant">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Profit Factor</div>
                    <div className="font-mono text-base font-bold text-primary">1.84</div>
                  </div>

                  <div className="bg-surface-container p-2.5 rounded border border-outline-variant">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Max Drawdown</div>
                    <div className="font-mono text-base font-bold text-error">4.12%</div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant text-[10px] uppercase font-bold text-outline">
                      <th className="pb-2">Side</th>
                      <th className="pb-2">Asset</th>
                      <th className="pb-2 text-right">Entry Price</th>
                      <th className="pb-2 text-right">Exit Target</th>
                      <th className="pb-2 text-right">Profit/Loss (Sim)</th>
                      <th className="pb-2 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
                    {simulatedTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-container">
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.type === 'LONG' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-on-surface">{selectedAsset}</td>
                        <td className="py-2.5 text-right font-bold text-on-surface">${t.entryPrice.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-medium text-on-surface-variant">${t.exitPrice.toLocaleString()}</td>
                        <td className={`py-2.5 text-right font-bold ${t.profitProgress >= 0 ? 'text-secondary' : 'text-error'}`}>
                          {t.profitProgress >= 0 ? '+' : ''}${t.profitProgress.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-outline">{t.dateTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Right Sidebar Console Panel */}
      <aside className="w-full md:w-80 border-t md:border-t-0 border-outline-variant bg-surface-container-low flex flex-col overflow-y-auto shrink-0">
        
        {/* Right Tab selection */}
        <div className="flex items-center px-4 border-b border-outline-variant bg-surface-container h-9 shrink-0">
          <button 
            type="button"
            onClick={() => setActiveRightTab('setup')}
            className={`flex-1 text-[11px] font-bold uppercase tracking-wider h-full pb-0 ${
              activeRightTab === 'setup' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'
            }`}
          >
            Tactical Order Setup
          </button>
          <button 
            type="button"
            onClick={() => setActiveRightTab('watchlist')}
            className={`flex-1 text-[11px] font-bold uppercase tracking-wider h-full pb-0 ${
              activeRightTab === 'watchlist' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'
            }`}
          >
            Watchlist
          </button>
        </div>

        {activeRightTab === 'setup' ? (
          <div className="p-4 flex flex-col gap-5">
            {/* Long / Short tab options */}
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setOrderType('BUY')}
                className={`flex-1 py-1.5 rounded uppercase font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
                  orderType === 'BUY' 
                    ? 'bg-secondary text-on-secondary font-bold shadow-[0_0_8px_rgba(102,217,204,0.15)]' 
                    : 'bg-surface-container-high text-outline hover:text-on-surface'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Buy / Long
              </button>
              <button 
                type="button"
                onClick={() => setOrderType('SELL')}
                className={`flex-1 py-1.5 rounded uppercase font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-1 ${
                  orderType === 'SELL' 
                    ? 'bg-error text-on-error font-bold shadow-[0_0_8px_rgba(255,180,171,0.15)]' 
                    : 'bg-surface-container-high text-outline hover:text-on-surface'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Sell / Short
              </button>
            </div>

            {/* Inputs list */}
            <form onSubmit={handleExecuteOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Limit Entry Price</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono text-xs focus:border-primary outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-outline font-bold tracking-wider">USDT</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Stop Loss threshold</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-error font-mono text-xs focus:border-error outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-outline font-bold tracking-wider">USDT</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Take Profit objective</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-secondary font-mono text-xs focus:border-secondary outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-outline font-bold tracking-wider">USDT</span>
                </div>
              </div>

              {/* Risk metrics review box */}
              <div className="bg-surface-container rounded p-3.5 border border-outline-variant text-[11px] space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-outline-variant/30 font-semibold text-outline">
                  <span>Risk Parameter Checks</span>
                  <span>Limits Locked</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Risk to Reward Ration</span>
                  <span className="font-mono text-primary font-bold">{calculatedRR.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Est. Profit (Simized)</span>
                  <span className="font-mono text-secondary font-bold">+${estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Est. Loss (At Stop)</span>
                  <span className="font-mono text-error font-bold">-${estimatedLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg glow-cyan"
              >
                Execute Limit Order
              </button>
            </form>

            <div className="border-t border-outline-variant/30 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Drawing Objects</h3>
                <span className="font-mono text-[10px] text-primary">{drawings.length} saved</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleCreateDrawing('trendline')} className="py-1.5 rounded border border-outline-variant text-xs text-on-surface hover:border-primary">Trendline</button>
                <button type="button" onClick={() => handleCreateDrawing('horizontal')} className="py-1.5 rounded border border-outline-variant text-xs text-on-surface hover:border-primary">H-Line</button>
                <button type="button" onClick={() => handleCreateDrawing('rectangle')} className="py-1.5 rounded border border-outline-variant text-xs text-on-surface hover:border-primary">Rectangle</button>
                <button type="button" onClick={() => handleCreateDrawing('text')} className="py-1.5 rounded border border-outline-variant text-xs text-on-surface hover:border-primary">Text Note</button>
              </div>
              <button type="button" onClick={handleDeleteLastDrawing} className="w-full py-1.5 rounded border border-error/30 text-error text-xs flex items-center justify-center gap-1 hover:bg-error/10">
                <Trash2 className="w-3 h-3" />
                Delete Latest Object
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider select-none">Active assets monitor</h3>
            <div className="space-y-1 flex flex-col">
              {watchlistSymbols.map((symbol, index) => {
                const isPositive = index % 3 !== 1;
                const lastClose = visibleCandles[visibleCandles.length - 1]?.close;
                return (
                  <div 
                    key={symbol.ticker}
                    onClick={() => setSelectedAsset(symbol.ticker)}
                    className={`flex justify-between items-center p-2.5 hover:bg-surface-container rounded transition-all cursor-pointer ${
                      selectedAsset === symbol.ticker ? 'bg-surface-container border border-primary/20' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">{symbol.ticker}</span>
                      <span className="text-[9px] text-on-surface-variant font-bold truncate max-w-36">{symbol.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-medium">{selectedAsset === symbol.ticker && lastClose ? lastClose.toLocaleString() : symbol.category.toUpperCase()}</div>
                      <div className={`text-[10px] font-bold font-mono ${isPositive ? 'text-secondary' : 'text-error'}`}>
                        {isPositive ? '+' : '-'}{(0.4 + index * 0.37).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}
      </aside>

    </div>
  );
}
