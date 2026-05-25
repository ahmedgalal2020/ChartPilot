import React, { useState } from 'react';
import { 
  Plus, 
  Bolt, 
  Waves, 
  Settings2, 
  Sparkles, 
  Play, 
  Edit, 
  Trash2, 
  Filter, 
  Grid, 
  Flame, 
  CheckCircle 
} from 'lucide-react';
import { TradingStrategy, SymbolPair, Timeframe } from '../types';

interface StrategyViewProps {
  strategies: TradingStrategy[];
  onAddStrategy: (newStrat: TradingStrategy) => void;
  onDeleteStrategy: (id: string) => void;
  onAddNotification: (msg: string) => void;
}

export default function StrategyView({ 
  strategies, 
  onAddStrategy, 
  onDeleteStrategy, 
  onAddNotification 
}: StrategyViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState<SymbolPair>('BTCUSDT');
  const [newTimeframe, setNewTimeframe] = useState<Timeframe>('15m');
  const [newType, setNewType] = useState<'AUTOMATED' | 'MANUAL'>('AUTOMATED');

  // Activate standard template check
  const handleUseTemplate = (templateName: string, defaultSymbol: SymbolPair = 'BTCUSDT') => {
    const isProfitable = Math.random() > 0.35;
    const randomWinrate = isProfitable ? Number((56 + Math.random() * 18).toFixed(1)) : Number((44 - Math.random() * 10).toFixed(1));
    const randomPL = isProfitable ? `+$${(Math.random() * 12).toFixed(1)}k` : `-$${(Math.random() * 3).toFixed(1)}k`;

    const newStrat: TradingStrategy = {
      id: `st-${Date.now()}`,
      name: `${templateName}_Engine`,
      symbol: defaultSymbol,
      timeframe: '15m',
      lastTest: `Win Rate: ${randomWinrate}% · P/L: ${randomPL}`,
      type: 'AUTOMATED',
      winRate: randomWinrate,
      totalPL: randomPL,
      status: 'ACTIVE'
    };

    onAddStrategy(newStrat);
    onAddNotification(`Initialized new strategy directly from template: ${templateName}`);
  };

  // Adding novel custom strategy
  const handleCreateCustomStrategySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newStrat: TradingStrategy = {
      id: `st-${Date.now()}`,
      name: newName.trim(),
      symbol: newSymbol,
      timeframe: newTimeframe,
      lastTest: 'Pending evaluation test run',
      type: newType,
      winRate: 0,
      totalPL: 'N/A',
      status: 'DRAFT'
    };

    onAddStrategy(newStrat);
    onAddNotification(`Created Custom Strategy Draft: ${newStrat.name}`);
    setIsModalOpen(false);
    setNewName('');
  };

  return (
    <div className="flex-grow w-full py-6 px-6 overflow-y-auto">
      
      {/* Header sections */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display-lg text-xl text-on-surface font-black select-none">Strategy Management</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">Configure, optimize, and deploy automated trading strategy logic units.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_8px_rgba(68,216,241,0.25)] uppercase tracking-wider"
        >
          <Settings2 className="w-4 h-4 text-on-primary" />
          Create Custom Strategy
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Left Side: Global performance status panels */}
        <aside className="col-span-12 lg:col-span-3 space-y-gutter">
          
          {/* Global statistics parameters */}
          <div className="bg-surface-container border border-outline-variant p-4 rounded-lg select-none">
            <div className="flex justify-between items-center mb-4 text-xs font-bold font-sans">
              <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px]">Global Workstation Stats</h3>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <span className="text-outline">Win Rate Median</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <div className="font-mono text-xl font-bold text-secondary">68.4%</div>
                  <span className="text-[10px] text-secondary font-bold">↑ 2.1%</span>
                </div>
              </div>

              <div>
                <span className="text-outline">Total Net Yield (Last 24h)</span>
                <div className="font-mono text-base font-bold text-primary mt-0.5">+$12,402.50 USDT</div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30">
                <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-outline uppercase tracking-wider">
                  <span>CPU COMPUTE LOAD</span>
                  <span className="text-primary font-bold">42%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[42%] shadow-[0_0_6px_rgba(68,216,241,0.4)]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation graphics mock */}
          <div className="bg-surface-container border border-outline-variant p-4 rounded-lg">
            <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold select-none mb-3">Asset Allocation Portfolio</h3>
            
            <div className="relative h-40 w-full bg-surface-container-lowest rounded overflow-hidden flex items-center justify-center">
              <img 
                className="w-full h-full object-cover opacity-15 grayscale" 
                src="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=300&h=200&auto=format&fit=crop" 
                alt="grid graphics"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 inset-y-0 bg-gradient-to-t from-surface-container-lowest to-transparent opacity-80" />
              <div className="absolute text-center select-none z-10">
                <div className="font-mono text-xl font-bold text-primary font-mono select-all">82%</div>
                <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Altcoin Allocation</div>
              </div>
            </div>
          </div>

        </aside>

        {/* Right Side: Active strategies list and templates cards */}
        <section className="col-span-12 lg:col-span-9 space-y-gutter flex flex-col">
          
          {/* Strategy Quick Templates grid */}
          <div className="bg-surface-container border border-outline-variant p-5 rounded-lg shrink-0">
            <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold mb-4 select-none">Quick Start Templates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              
              <div 
                onClick={() => handleUseTemplate('EMA_Cross', 'BTCUSDT')}
                className="bg-surface-container-low border border-outline-variant p-4 rounded-lg hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Bolt className="w-4 h-4 fill-current" />
                    </div>
                    <span className="font-bold text-[13px] text-on-surface font-sans">EMA Cross crossover</span>
                  </div>
                  <p className="text-on-surface-variant text-xs leading-relaxed font-sans font-medium">Standard momentum script mapping 50 and 200 EMA crossovers.</p>
                </div>
                <div className="mt-4 font-label-caps text-[9px] text-primary tracking-widest font-bold">CLICK TO ACTIVATE</div>
              </div>

              <div 
                onClick={() => handleUseTemplate('RSI_Divergence', 'ETHUSDT')}
                className="bg-surface-container-low border border-outline-variant p-4 rounded-lg hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Waves className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[13px] text-on-surface font-sans">RSI Overbought limits</span>
                  </div>
                  <p className="text-on-surface-variant text-xs leading-relaxed font-sans font-medium">Triggers execution on extreme historical RSI boundary breakouts.</p>
                </div>
                <div className="mt-4 font-label-caps text-[9px] text-primary tracking-widest font-bold">CLICK TO ACTIVATE</div>
              </div>

              <div 
                onClick={() => handleUseTemplate('Bollinger_Arbitrage', 'SOLUSDT')}
                className="bg-surface-container-low border border-outline-variant p-4 rounded-lg hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[13px] text-on-surface font-sans">Bollinger Reversions</span>
                  </div>
                  <p className="text-on-surface-variant text-xs leading-relaxed font-sans font-medium">Mean reversion scanning across standard standard standard dev bands.</p>
                </div>
                <div className="mt-4 font-label-caps text-[9px] text-primary tracking-widest font-bold">CLICK TO ACTIVATE</div>
              </div>

            </div>
          </div>

          {/* Active compiled strategy profiles */}
          <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40 shrink-0">
              <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold">Your Active Core Strategies</h3>
              <div className="flex gap-1">
                <button className="p-1 px-1.5 bg-surface-container-highest rounded text-on-surface-variant"><Filter className="w-3.5 h-3.5" /></button>
                <button className="p-1 px-1.5 bg-surface-container-highest rounded text-on-surface-variant"><Grid className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low font-label-caps text-[10px] text-outline uppercase tracking-wider font-bold">
                    <th className="px-6 py-3">Strategy Framework</th>
                    <th className="px-6 py-3">Run Regime</th>
                    <th className="px-6 py-3">Previous Results Profile</th>
                    <th className="px-6 py-3">Deployment Status</th>
                    <th className="px-6 py-3 text-right">Edit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant font-sans">
                  {strategies.map((strat) => (
                    <tr key={strat.id} className="hover:bg-[#1C222D]/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-on-surface text-sm">{strat.name}</div>
                        <div className="text-on-surface-variant text-[11px] font-medium mt-0.5">{strat.symbol} · {strat.timeframe} interval</div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] font-bold text-outline-variant uppercase border border-outline-variant tracking-wider">
                          {strat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {strat.winRate > 0 ? (
                          <div className="flex items-center gap-4 text-[11px]">
                            <div>
                              <div className="text-[9px] text-outline uppercase tracking-wider font-bold mb-0.5">Win Ratio</div>
                              <div className="font-mono text-secondary font-bold font-mono">{strat.winRate}%</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-outline uppercase tracking-wider font-bold mb-0.5">Yield log</div>
                              <div className="font-mono text-primary font-bold font-mono">{strat.totalPL}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-outline italic text-[11px] font-mono">Pending Evaluation Run</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${strat.status === 'ACTIVE' ? 'bg-secondary animate-pulse shadow-[0_0_4px_#34e3cd]' : 'bg-outline'}`}></span>
                          <span className={`font-mono font-bold text-[10px] tracking-widest ${strat.status === 'ACTIVE' ? 'text-secondary' : 'text-outline-variant'}`}>{strat.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onAddNotification(`Draft config checked for ${strat.name}.`)}
                            className="p-1 px-1.5 bg-surface-container-highest hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-all"
                            title="Edit Parameters"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteStrategy(strat.id)}
                            className="p-1 px-1.5 bg-surface-container-highest hover:bg-error/15 rounded text-on-surface-variant hover:text-error transition-all"
                            title="Delete Strat Framework"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </div>

      {/* Strategy Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-dim/74 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 w-full max-w-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
            
            <h2 className="font-headline-md text-base text-on-surface font-bold mb-1">Assemble Custom Framework</h2>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">Initialize a personalized strategy model framework for execution.</p>

            <form onSubmit={handleCreateCustomStrategySubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Framework Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. RSI_Golden_Cross_V1"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Asset Symbol</label>
                  <select 
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value as SymbolPair)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs cursor-pointer"
                  >
                    <option value="BTCUSDT">BTCUSDT</option>
                    <option value="ETHUSDT">ETHUSDT</option>
                    <option value="SOLUSDT">SOLUSDT</option>
                    <option value="XRPUSDT">XRPUSDT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Interval timeline</label>
                  <select 
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value as Timeframe)}
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Execution Regime</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-on-surface cursor-pointer">
                    <input 
                      type="radio" 
                      name="stratRegime" 
                      checked={newType === 'AUTOMATED'} 
                      onChange={() => setNewType('AUTOMATED')} 
                      className="accent-primary"
                    />
                    Automated System
                  </label>
                  <label className="flex items-center gap-2 text-on-surface cursor-pointer">
                    <input 
                      type="radio" 
                      name="stratRegime" 
                      checked={newType === 'MANUAL'} 
                      onChange={() => setNewType('MANUAL')} 
                      className="accent-primary"
                    />
                    Manual Playback
                  </label>
                </div>
              </div>

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
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 active:opacity-90 shadow-lg glow-cyan"
                >
                  Create Strategy Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
