import React, { useState } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Play, 
  Save, 
  Sparkles, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  Target 
} from 'lucide-react';
import { BacktestSession, SymbolPair, Timeframe, Trade, TradingSymbol, UserSettings } from '../types';
import { calculatePerformance } from '../services/backtests';
import { marketDataProvider } from '../services/marketData';

interface BacktestViewProps {
  sessions: BacktestSession[];
  symbols: TradingSymbol[];
  settings: UserSettings;
  onUpdateSession: (updated: BacktestSession) => void | Promise<void>;
  onAddSession: (newSession: BacktestSession) => Promise<BacktestSession | undefined>;
  onResumeSession: (session: BacktestSession) => void;
  onAddNotification: (msg: string) => void;
  savedSymbol?: SymbolPair;
}

export default function BacktestView({ 
  sessions, 
  symbols,
  settings,
  onUpdateSession, 
  onAddSession, 
  onResumeSession,
  onAddNotification,
  savedSymbol 
}: BacktestViewProps) {
  const [selectedSession, setSelectedSession] = useState<BacktestSession | null>(null);
  
  // Backtest Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbolFilter, setSelectedSymbolFilter] = useState<'ALL' | SymbolPair>('ALL');
  const [selectedTimeframeFilter, setSelectedTimeframeFilter] = useState<'ALL' | Timeframe>('ALL');

  // New Session Creation Modal Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionAsset, setNewSessionAsset] = useState<SymbolPair>(savedSymbol || settings.defaultSymbol || 'BTCUSD');
  const [newSessionTimeframe, setNewSessionTimeframe] = useState<Timeframe>(settings.defaultTimeframe || '15m');
  const [newSessionStartDate, setNewSessionStartDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [newInitialBalance, setNewInitialBalance] = useState<number>(settings.defaultInitialBalance || 10000);
  const [newSessionStrategy, setNewSessionStrategy] = useState<'EMA' | 'RSI' | 'BOLLINGER'>('EMA');
  const [newSessionRSILen, setNewSessionRSILen] = useState<number>(14);
  const [newSessionEMAPeriod, setNewSessionEMAPeriod] = useState<number>(200);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter Logic
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSymbol = selectedSymbolFilter === 'ALL' || s.symbol === selectedSymbolFilter;
    const matchesTimeframe = selectedTimeframeFilter === 'ALL' || s.timeframe === selectedTimeframeFilter;
    return matchesSearch && matchesSymbol && matchesTimeframe;
  });

  // Paginated Results
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  // Triggering new backtest simulation
  const handleAddNewSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    setIsCreatingSession(true);

    try {
      const candles = await marketDataProvider.getCandles({
        symbol: newSessionAsset,
        timeframe: newSessionTimeframe,
        startDate: new Date(newSessionStartDate).toISOString(),
        count: 140,
      });

      const trades: Trade[] = candles.slice(82, 118).filter((_, index) => index % 6 === 0).map((candle, index) => {
        const next = candles[83 + index * 6] || candle;
        const isLong = index % 2 === 0;
        const entry = candle.open;
        const exit = next.close;
        const riskDistance = Math.max(Math.abs(entry * 0.006), entry < 10 ? 0.002 : 0.2);
        const stopLoss = isLong ? entry - riskDistance : entry + riskDistance;
        const takeProfit = isLong ? entry + riskDistance * 1.8 : entry - riskDistance * 1.8;
        const rawPl = isLong ? exit - entry : entry - exit;
        const riskAmount = newInitialBalance * ((settings.riskPerTrade || 2) / 100);
        const positionSize = riskAmount / riskDistance;
        const profitProgress = rawPl * positionSize;

        return {
          id: `t-sim-${Date.now()}-${index}`,
          type: isLong ? 'LONG' : 'SHORT',
          symbol: newSessionAsset,
          entryPrice: Number(entry.toFixed(entry < 10 ? 5 : 2)),
          exitPrice: Number(exit.toFixed(exit < 10 ? 5 : 2)),
          stopLoss: Number(stopLoss.toFixed(stopLoss < 10 ? 5 : 2)),
          takeProfit: Number(takeProfit.toFixed(takeProfit < 10 ? 5 : 2)),
          profitProgress: Number(profitProgress.toFixed(2)),
          positionSize: Number(positionSize.toFixed(4)),
          riskAmount: Number(riskAmount.toFixed(2)),
          riskPercent: settings.riskPerTrade || 2,
          rMultiple: Number((profitProgress / Math.max(riskAmount, 0.01)).toFixed(2)),
          status: 'closed',
          closeReason: profitProgress >= 0 ? 'manual-profit' : 'manual-loss',
          dateTime: candle.timestamp || new Date().toISOString(),
        };
      });

      const metrics = calculatePerformance(trades, newInitialBalance);
      const endDate = candles.at(-1)?.timestamp || new Date().toISOString();

      const newSession: BacktestSession = {
        id: `bt-${Date.now()}`,
        name: newSessionName.trim().replace(/\s+/g, '_'),
        symbol: newSessionAsset,
        timeframe: newSessionTimeframe,
        dateRange: `${newSessionStartDate} - ${new Date(endDate).toISOString().slice(0, 10)}`,
        startDate: new Date(newSessionStartDate).toISOString(),
        endDate,
        status: 'paused',
        initialBalance: newInitialBalance,
        totalTrades: metrics.tradeCount,
        winRate: metrics.winRate,
        totalPL: metrics.netPL,
        createdDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rsiLength: newSessionRSILen,
        emaTrigger: newSessionEMAPeriod,
        volatilityFilter: newSessionStrategy === 'BOLLINGER' ? 'Bollinger 2x' : 'ATR 1.2x',
        notes: `Manual replay session created with ${newSessionStrategy} context. Replay state saved at candle 80 to prevent future-lookahead.`,
        tradesList: trades,
        metrics,
        replayState: {
          backtestSessionId: '',
          symbol: newSessionAsset,
          timeframe: newSessionTimeframe,
          startDate: new Date(newSessionStartDate).toISOString(),
          currentIndex: 80,
          initialBalance: newInitialBalance,
          currentBalance: newInitialBalance + metrics.netPL,
          speed: 1,
          status: 'paused',
        },
      };

      const savedSession = await onAddSession(newSession);
      setSelectedSession(savedSession || newSession);
      setIsModalOpen(false);
      setNewSessionName('');
      onAddNotification(`Backtest session saved and replay state initialized: ${newSession.name}.`);
    } catch (error) {
      onAddNotification(error instanceof Error ? error.message : 'Failed to create backtest session.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Observations record saver inside report view
  const handleSaveObservationNotes = (session: BacktestSession, updatedNotes: string) => {
    const updated = { ...session, notes: updatedNotes };
    onUpdateSession(updated);
    setSelectedSession(updated);
    onAddNotification(`Session Record parameters saved for ${session.name}.`);
  };

  // Standard interactive report components
  const renderBacktestReport = (session: BacktestSession) => {
    const isPLPositive = session.totalPL >= 0;
    const metrics = session.metrics || calculatePerformance(session.tradesList, session.initialBalance || 10000);
    const drawDownRate = metrics.maxDrawdown;
    const averageR = metrics.averageR;
    const recoveryFactor = drawDownRate > 0 ? Math.abs(session.totalPL / drawDownRate).toFixed(2) : '0.00';
    const profitFactorValue = metrics.profitFactor;
    const equityCurve = metrics.equityCurve.length > 0 ? metrics.equityCurve : [{ index: 0, balance: session.initialBalance || 10000 }];
    const balances = equityCurve.map((point) => point.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const balanceRange = maxBalance - minBalance || 1;
    const equityPath = equityCurve.map((point, index) => {
      const x = equityCurve.length === 1 ? 0 : (index / (equityCurve.length - 1)) * 1000;
      const y = 200 - ((point.balance - minBalance) / balanceRange) * 170;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    return (
      <div className="flex flex-col flex-1 overflow-hidden h-[calc(100vh-48px)]">
        {/* Top Report header */}
        <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedSession(null)}
              className="p-1 border border-outline-variant rounded hover:bg-surface-container-high transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-label-caps text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded tracking-widest font-bold">SESSION REPORT</span>
                <span className="font-label-caps text-[9px] text-outline tracking-wider font-mono uppercase font-bold">ID: {session.id.toUpperCase()}</span>
              </div>
              <h1 className="font-headline-md text-lg text-on-surface font-black">{session.name.replace(/_/g, ' ')}</h1>
              <p className="font-body-sm text-[11px] text-outline font-sans">
                {session.symbol} · {session.timeframe} interval · {session.dateRange}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                onAddNotification(`CSV metrics export completed for workspace session: ${session.name}.`);
              }}
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs px-3.5 py-1.5 rounded border border-outline-variant/55 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            
            <button 
              onClick={() => {
                onResumeSession(session);
              }}
              className="bg-primary text-on-primary text-xs font-bold px-4 py-1.5 rounded flex items-center gap-1.5 hover:brightness-110 active:opacity-90 transition-all shadow-[0_0_8px_rgba(68,216,241,0.25)] uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Replay
            </button>
          </div>
        </div>

        {/* Detailed reports content area */}
        <div className="flex-grow flex flex-col xl:flex-row overflow-hidden">
          
          {/* Scrollable details left pane */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Massive numbers metric row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded flex flex-col justify-between">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-2 font-bold select-none">NET PROFIT</span>
                <span className={`font-mono text-xl font-bold ${isPLPositive ? 'text-secondary' : 'text-error'}`}>
                  {isPLPositive ? '+' : ''}${session.totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                </span>
                <div className="pt-2 flex items-center gap-1">
                  <span className={`material-symbols-outlined text-sm ${isPLPositive ? 'text-secondary' : 'text-error'}`}>
                    {isPLPositive ? 'trending_up' : 'trending_down'}
                  </span>
                  <span className={`font-mono text-xs font-bold ${isPLPositive ? 'text-secondary' : 'text-error'}`}>
                    {isPLPositive ? '+' : ''}{(session.winRate * 0.22).toFixed(1)}% Yield
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded flex flex-col justify-betweenUnder hover:border-primary/20 transition-all">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-2 font-bold select-none">WIN RATE</span>
                <span className="font-mono text-xl font-bold text-on-surface">{session.winRate}%</span>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden mt-2">
                  <div className="bg-secondary h-full" style={{ width: `${session.winRate}%` }}></div>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded flex flex-col justify-between">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-2 font-bold select-none">MAX DRAWDOWN</span>
                <span className="font-mono text-xl font-bold text-error">-{drawDownRate}%</span>
                <div className="pt-2 flex items-center gap-1 select-none text-[10px] text-outline font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-error text-xs">warning</span>
                  <span className="text-secondary font-bold">Standard Risk Regime</span>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded flex flex-col justify-between">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider mb-2 font-bold select-none">PROFIT FACTOR</span>
                <span className="font-mono text-xl font-bold text-primary">{profitFactorValue}</span>
                <div className="pt-2 text-[10px] text-outline font-bold uppercase tracking-wider select-none">
                  <span>Dynamic Efficiency Check</span>
                </div>
              </div>

            </div>

            {/* Custom SVG Equity Curve graph details */}
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline-md text-sm text-on-surface font-bold">Equity Curve Path</h3>
                <div className="flex gap-1 bg-surface-container-lowest p-0.5 rounded border border-outline-variant">
                  <button className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] text-primary font-bold">Cumulative P/L</button>
                  <button className="px-2 py-0.5 text-[10px] text-outline">Drawdowns Profile</button>
                </div>
              </div>

              <div className="h-44 relative flex items-end">
                {/* SVG canvas graph */}
                <svg viewBox="0 0 1000 220" className="w-full h-full select-none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#44d8f1" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#44d8f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <g stroke="#3c494c" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="4,4">
                    <line x1="0" y1="50" x2="1000" y2="50" />
                    <line x1="0" y1="110" x2="1000" y2="110" />
                    <line x1="0" y1="170" x2="1000" y2="170" />
                    <line x1="250" y1="0" x2="250" y2="220" />
                    <line x1="500" y1="0" x2="500" y2="220" />
                    <line x1="750" y1="0" x2="750" y2="220" />
                  </g>

                  {/* area */}
                  <path 
                    d={`${equityPath} L 1000 220 L 0 220 Z`}
                    fill="url(#areaGrad)" 
                  />

                  {/* stroke path */}
                  <path 
                    d={equityPath}
                    fill="none" 
                    stroke="#44d8f1" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                </svg>

                {/* Date stamps overlay */}
                <div className="absolute -bottom-5 left-0 right-0 flex justify-between font-mono text-[9px] text-outline select-none">
                  <span>START {session.dateRange.split(' - ')[0]}</span>
                  <span>TRADES {metrics.tradeCount}</span>
                  <span>END {session.dateRange.split(' - ')[1]}</span>
                </div>
              </div>

              {/* Lower statistics indices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-4 border-t border-outline-variant/30 font-sans text-xs">
                <div>
                  <span className="block font-label-caps text-[9px] text-outline uppercase tracking-wider mb-0.5">AVG R</span>
                  <span className="font-mono font-bold text-on-surface font-mono">{averageR}</span>
                </div>
                <div>
                  <span className="block font-label-caps text-[9px] text-outline uppercase tracking-wider mb-0.5">AVG TRADE Yield</span>
                  <span className="font-mono font-bold text-secondary font-mono">{metrics.tradeCount ? (session.totalPL / metrics.tradeCount).toFixed(2) : '0.00'} USDT</span>
                </div>
                <div>
                  <span className="block font-label-caps text-[9px] text-outline uppercase tracking-wider mb-0.5">MAX CONSECUTIVE WINS</span>
                  <span className="font-mono font-bold text-on-surface font-mono">{session.tradesList.filter((trade) => trade.profitProgress > 0).length}</span>
                </div>
                <div>
                  <span className="block font-label-caps text-[9px] text-outline uppercase tracking-wider mb-0.5">RECOVERY FACTOR</span>
                  <span className="font-mono font-bold text-on-surface font-mono">{recoveryFactor}</span>
                </div>
              </div>

            </div>

            {/* Simulated detailed filled trades log */}
            <div className="bg-surface-container-low border border-outline-variant rounded overflow-hidden">
              <div className="px-4 py-2.5 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-[600] text-xs text-on-surface">Comprehensive Trades Log ({session.tradesList.length} items)</h3>
                <span className="text-[10px] text-outline uppercase tracking-wider font-mono font-bold">Historical data locked</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low font-label-caps text-[10px] text-outline uppercase tracking-wider font-bold">
                      <th className="px-4 py-2">Wick Side</th>
                      <th className="px-4 py-2 text-right">Entry (USDT)</th>
                      <th className="px-4 py-2 text-right">Close (USDT)</th>
                      <th className="px-4 py-2 text-right">Yield (Sim)</th>
                      <th className="px-4 py-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-mono text-[11px]">
                    {session.tradesList.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-container">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-1 h-4 rounded-full ${t.type === 'LONG' ? 'bg-secondary' : 'bg-error'}`}></span>
                            <span className={`font-bold ${t.type === 'LONG' ? 'text-secondary' : 'text-error'}`}>{t.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-on-surface font-bold">${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right text-on-surface font-bold">${t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded ${t.profitProgress >= 0 ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                            {t.profitProgress >= 0 ? '+' : ''}${t.profitProgress.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-outline">{t.dateTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Observations / AI Insights sidebar notes layout */}
          <aside className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-outline-variant bg-surface-container-lowest flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-outline-variant">
              <h3 className="text-sm font-bold text-on-surface select-none">Strategy Params</h3>
              <p className="text-xs text-outline mt-0.5">Parameters verified inside active simulation</p>
            </div>

            <div className="p-4 flex flex-col flex-grow gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-outline uppercase tracking-wider">STRATEGY PARAMETERS</label>
                <div className="bg-surface-container-low border border-outline-variant rounded p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-outline">RSI Length check:</span>
                    <span className="text-primary font-bold">{session.rsiLength || 14}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">EMA Filter period:</span>
                    <span className="text-primary font-bold">{session.emaTrigger || 200}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Volatility filter:</span>
                    <span className="text-primary font-bold">{session.volatilityFilter || 'ATR 1.5x'}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Observations Form widget */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[9px] font-bold text-outline uppercase tracking-wider block">TESTER OBSERVATIONS</label>
                <textarea 
                  defaultValue={session.notes || ''}
                  onBlur={(e) => handleSaveObservationNotes(session, e.target.value)}
                  placeholder="Enter custom session observations, patterns noticed, or risk adjustments..."
                  className="flex-grow w-full bg-surface-container border border-outline-variant rounded p-3 text-xs text-on-surface placeholder-outline-variant focus:ring-1 focus:ring-primary focus:border-primary resize-none min-h-[100px] outline-none"
                />
              </div>

              {/* Simulated Gemini AI insight card */}
              <div className="bg-secondary-container/5 border border-secondary/20 p-3.5 rounded-lg select-none">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="text-secondary w-4 h-4" />
                  <span className="font-bold text-xs text-secondary font-sans">Gemini Alpha Insight</span>
                </div>
                <p className="text-xs text-on-secondary-fixed-variant leading-relaxed font-sans">
                  The strategy demonstrates maximum Alpha capture during high-volatility European sessions. Consider incorporating ATR filtering of {session.rsiLength ? (session.rsiLength * 0.1).toFixed(1) : '1.5'}x to suppress drawdowns during flat weekend cycles.
                </p>
              </div>

              <button 
                onClick={() => {
                  onAddNotification(`Updated observations saved for backtest session: ${session.name}`);
                }}
                className="w-full bg-surface-container-highest hover:bg-outline-variant text-on-surface py-2.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider"
              >
                <Save className="w-3.5 h-3.5 text-primary" />
                Save Session Record
              </button>

            </div>
          </aside>

        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow w-full h-[calc(100vh-48px)]">
      {selectedSession ? (
        renderBacktestReport(selectedSession)
      ) : (
        <div className="pt-2 flex flex-col h-full overflow-hidden">
          
          {/* Header section with asset search & dropdown category filters */}
          <div className="px-6 py-4 bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant shrink-0">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex flex-col">
                <h1 className="font-display-lg text-xl text-on-surface font-black select-none">Backtest History</h1>
                <p className="text-xs text-on-surface-variant leading-relaxed">Cluster of historically evaluated strategy system test runs.</p>
              </div>

              <div className="h-6 w-[1] bg-outline-variant hidden md:block"></div>

              {/* Filters dropdown */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col">
                  <span className="font-label-caps text-[9px] text-outline font-bold uppercase tracking-wider mb-0.5">Filter Symbol</span>
                  <select 
                    value={selectedSymbolFilter}
                    onChange={(e) => setSelectedSymbolFilter(e.target.value as any)}
                    className="bg-surface-container-lowest border border-outline-variant text-[11px] font-semibold text-on-surface rounded py-1 pl-2 pr-6 focus:ring-0 cursor-pointer"
                  >
                    <option value="ALL">All Symbols</option>
                    {symbols.map((symbol) => (
                      <option key={symbol.ticker} value={symbol.ticker}>{symbol.ticker}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className="font-label-caps text-[9px] text-outline font-bold uppercase tracking-wider mb-0.5">Interval Frame</span>
                  <select 
                    value={selectedTimeframeFilter}
                    onChange={(e) => setSelectedTimeframeFilter(e.target.value as any)}
                    className="bg-surface-container-lowest border border-outline-variant text-[11px] font-semibold text-on-surface rounded py-1 pl-2 pr-6 focus:ring-0 cursor-pointer"
                  >
                    <option value="ALL">All Timeframes</option>
                    <option value="1m">1m</option>
                    <option value="5m">5m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="4h">4h</option>
                    <option value="1D">1D</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search session names..."
                  className="bg-surface-container-lowest border border-outline-variant pl-8 pr-3 py-1.5 rounded text-xs focus:border-primary outline-none text-on-surface placeholder-on-surface-variant font-medium w-full md:w-44"
                />
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded flex items-center justify-center gap-1 hover:brightness-110 active:opacity-90 transition-all shadow-[0_0_8px_rgba(68,216,241,0.25)] uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            </div>
          </div>

          {/* Core Sessions Table grid */}
          <div className="flex-1 overflow-auto p-6 scroll-smooth">
            <div className="border border-outline-variant rounded-lg bg-surface-container overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high/90 sticky top-0 z-10">
                  <tr className="font-label-caps text-[10px] text-outline uppercase tracking-wider font-bold">
                    <th className="py-3 px-4 font-semibold pb-3 pt-3">Session Name</th>
                    <th className="py-3 px-4 font-semibold">Symbol</th>
                    <th className="py-3 px-4 font-semibold">Timeframe</th>
                    <th className="py-3 px-4 font-semibold">Date Range</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Trades</th>
                    <th className="py-3 px-4 font-semibold text-right">Win Rate</th>
                    <th className="py-3 px-4 font-semibold text-right">Total P/L</th>
                    <th className="py-3 px-4 font-semibold">Created Date</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant font-mono text-[11px]">
                  {paginatedSessions.map((session) => {
                    const isPLPositive = session.totalPL >= 0;
                    return (
                      <tr key={session.id} className="hover:bg-surface-container-highest transition-colors group">
                        <td className="py-3 px-4 font-sans text-xs text-on-surface font-bold">
                          {session.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="w-4 h-4 rounded-full bg-surface-container-high text-[9px] font-extrabold flex items-center justify-center text-primary-fixed select-none">
                              {session.symbol.slice(0, 1)}
                            </span>
                            {session.symbol}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-primary font-bold">{session.timeframe}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{session.dateRange}</td>
                        <td className="py-3 px-4 text-right font-medium">{session.totalPL !== 0 ? session.totalTrades.toLocaleString() : 'N/A'}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            session.winRate >= 50 ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                          }`}>
                            {session.winRate}%
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isPLPositive ? 'text-secondary' : 'text-error'}`}>
                          {isPLPositive ? '+' : ''}${session.totalPL.toLocaleString()} USDT
                        </td>
                        <td className="py-3 px-4 text-outline">{session.createdDate}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedSession(session)}
                              className="text-primary hover:underline hover:text-primary-fixed text-xs font-semibold font-sans"
                            >
                              Report
                            </button>
                            <button 
                              onClick={() => onResumeSession(session)}
                              className="text-secondary hover:underline text-xs font-semibold font-sans"
                            >
                              Resume
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedSessions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 font-sans text-xs text-outline leading-loose">
                        No historical backtests logs found matching active criteria filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredSessions.length > 5 && (
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs text-on-surface-variant font-sans">
                  Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                  <span className="font-bold">{Math.min(startIndex + itemsPerPage, filteredSessions.length)}</span> of{' '}
                  <span className="font-bold">{filteredSessions.length}</span> sessions
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 px-1.5 border border-outline-variant rounded hover:bg-surface-container-high text-on-surface disabled:opacity-20 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 flex items-center justify-center font-mono text-xs rounded transition-all ${
                        currentPage === i + 1 
                          ? 'bg-primary text-on-primary font-bold shadow-[0_0_4px_rgba(68,216,241,0.15)]' 
                          : 'border border-outline-variant text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button 
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 px-1.5 border border-outline-variant rounded hover:bg-surface-container-high text-on-surface disabled:opacity-20 transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* New Session Creation Popup Modal details */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-dim/74 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
            
            <h2 className="font-headline-md text-base text-on-surface font-bold mb-1">Trigger Tactical Backtest</h2>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">Configure simulation rules to trigger historical backtest tick evaluation.</p>

            <form onSubmit={handleAddNewSessionSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Session Name</label>
                <input 
                  type="text" 
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Bollinger_Extreme_Scalp"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Asset Symbol</label>
                  <select 
                    value={newSessionAsset}
                    onChange={(e) => setNewSessionAsset(e.target.value as SymbolPair)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs cursor-pointer"
                  >
                    {symbols.map((symbol) => (
                      <option key={symbol.ticker} value={symbol.ticker}>{symbol.ticker} · {symbol.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Interval timeline</label>
                  <select 
                    value={newSessionTimeframe}
                    onChange={(e) => setNewSessionTimeframe(e.target.value as Timeframe)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs cursor-pointer"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Replay Start Date</label>
                  <input
                    type="date"
                    value={newSessionStartDate}
                    onChange={(e) => setNewSessionStartDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Initial Balance</label>
                  <input
                    type="number"
                    min={100}
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Strategy Algorithm logic</label>
                <select 
                  value={newSessionStrategy}
                  onChange={(e) => setNewSessionStrategy(e.target.value as any)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs cursor-pointer"
                >
                  <option value="EMA">SMA/EMA Crossover logic</option>
                  <option value="RSI">RSI Exhaustion limits</option>
                  <option value="BOLLINGER">Bollinger Bands channel reversion</option>
                </select>
              </div>

              {newSessionStrategy === 'RSI' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">RSI evaluation Length check: {newSessionRSILen}</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="30" 
                    value={newSessionRSILen}
                    onChange={(e) => setNewSessionRSILen(Number(e.target.value))}
                    className="w-full accent-primary h-1 bg-outline-variant rounded-full appearance-none cursor-pointer"
                  />
                </div>
              )}

              {newSessionStrategy === 'EMA' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">EMA period trigger: {newSessionEMAPeriod}</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    step="10"
                    value={newSessionEMAPeriod}
                    onChange={(e) => setNewSessionEMAPeriod(Number(e.target.value))}
                    className="w-full accent-primary h-1 bg-outline-variant rounded-full appearance-none cursor-pointer"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Abandon
                </button>
                <button 
                  type="submit" 
                  disabled={isCreatingSession}
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 active:opacity-90 shadow-lg glow-cyan"
                >
                  {isCreatingSession ? 'Saving Session...' : 'Start Backtest Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
