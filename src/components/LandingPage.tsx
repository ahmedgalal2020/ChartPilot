import React from 'react';
import { Bolt, Play, CheckCircle2, Terminal, Share2, Award, Zap, Activity } from 'lucide-react';

interface LandingPageProps {
  onStartTrading: () => void;
  onViewDemo?: () => void;
}

export default function LandingPage({ onStartTrading, onViewDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col pt-12">
      {/* Hero Section */}
      <section className="relative min-h-[819px] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary mb-6">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span className="font-label-caps text-label-caps tracking-wider text-[10px]">V2.4 NOW LIVE WITH SUPABASE SYNC</span>
          </div>

          <h1 className="font-display-lg text-[48px] md:text-[64px] leading-tight font-black text-on-surface tracking-tight mb-6">
            Analyze, Replay, and <span className="text-primary">Backtest Your Trades</span> with Precision
          </h1>

          <p className="font-body-base text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            A simple professional platform for chart analysis, drawing tools, and manual strategy testing. Built for high-performance traders who demand accuracy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={onStartTrading}
              className="w-full sm:w-auto bg-primary text-on-primary font-body-base font-bold px-8 py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all glow-cyan"
            >
              Start Backtesting
            </button>
            <button 
              onClick={onViewDemo || onStartTrading}
              className="w-full sm:w-auto bg-transparent border border-outline-variant text-primary font-body-base font-medium px-8 py-3 rounded-lg hover:bg-surface-container-high transition-all"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Product Preview Mockup */}
      <section className="px-6 max-w-6xl mx-auto -mt-10 mb-20 relative z-20 w-full">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-2xl">
          {/* Browser frame headers */}
          <div className="h-8 bg-surface-container-low border-b border-outline-variant flex items-center px-4 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-secondary/40"></div>
            <div className="ml-4 px-3 py-0.5 bg-surface-container rounded font-data-mono text-[9px] text-outline uppercase tracking-widest font-mono">
              XAUUSD | H4 | CANDLE REPLAY ACTIVE
            </div>
          </div>

          <div className="aspect-video relative bg-surface-dim overflow-hidden">
            <div className="absolute inset-0 opacity-70">
              <svg viewBox="0 0 1200 675" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="previewArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#44d8f1" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#44d8f1" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="previewGlow" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stopColor="#44d8f1" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#090f11" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="1200" height="675" fill="#090f11" />
                <rect width="1200" height="675" fill="url(#previewGlow)" />
                <g stroke="#3c494c" strokeWidth="1" strokeOpacity="0.28">
                  {Array.from({ length: 11 }).map((_, index) => (
                    <line key={`v-${index}`} x1={80 + index * 108} y1="58" x2={80 + index * 108} y2="610" />
                  ))}
                  {Array.from({ length: 7 }).map((_, index) => (
                    <line key={`h-${index}`} x1="80" y1={86 + index * 80} x2="1140" y2={86 + index * 80} />
                  ))}
                </g>
                <path
                  d="M 80 520 L 160 480 L 250 505 L 340 420 L 430 438 L 520 350 L 610 388 L 700 295 L 790 315 L 880 245 L 970 270 L 1080 170 L 1140 198 L 1140 610 L 80 610 Z"
                  fill="url(#previewArea)"
                />
                <path
                  d="M 80 520 L 160 480 L 250 505 L 340 420 L 430 438 L 520 350 L 610 388 L 700 295 L 790 315 L 880 245 L 970 270 L 1080 170 L 1140 198"
                  fill="none"
                  stroke="#44d8f1"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  [140, 455, 515, 432, 488, true],
                  [210, 415, 500, 470, 492, false],
                  [280, 392, 460, 428, 405, true],
                  [350, 370, 442, 418, 386, true],
                  [420, 360, 455, 382, 430, false],
                  [490, 305, 395, 368, 322, true],
                  [560, 285, 360, 318, 346, false],
                  [630, 255, 335, 312, 268, true],
                  [700, 235, 320, 260, 302, false],
                  [770, 205, 285, 268, 224, true],
                  [840, 190, 270, 218, 248, false],
                  [910, 155, 235, 228, 172, true],
                  [980, 140, 218, 168, 206, false],
                  [1050, 110, 195, 188, 128, true],
                ].map(([x, high, low, open, close, bull]) => {
                  const top = Math.min(open as number, close as number);
                  const height = Math.max(8, Math.abs((close as number) - (open as number)));
                  const color = bull ? '#66d9cc' : '#ffb4ab';
                  return (
                    <g key={`c-${x}`}>
                      <line x1={x as number} y1={high as number} x2={x as number} y2={low as number} stroke={color} strokeWidth="3" />
                      <rect x={(x as number) - 10} y={top} width="20" height={height} rx="3" fill={color} opacity="0.92" />
                    </g>
                  );
                })}
                <line x1="80" y1="198" x2="1140" y2="198" stroke="#44d8f1" strokeDasharray="8 8" strokeOpacity="0.55" />
                <rect x="1045" y="184" width="82" height="28" rx="4" fill="#44d8f1" />
                <text x="1086" y="203" textAnchor="middle" fill="#00363e" fontFamily="JetBrains Mono" fontSize="13" fontWeight="700">
                  2342.8
                </text>
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent"></div>

            {/* Overlay Simulated Terminal Details */}
            <div className="absolute inset-0 flex">
              {/* Sidebar */}
              <div className="w-10 border-r border-outline-variant bg-surface-container-lowest/80 backdrop-blur-sm flex flex-col items-center py-4 gap-4 text-outline">
                <span className="material-symbols-outlined text-primary text-base">near_me</span>
                <span className="material-symbols-outlined text-xs">show_chart</span>
                <span className="material-symbols-outlined text-xs">architecture</span>
                <span className="material-symbols-outlined text-xs">brush</span>
                <span className="material-symbols-outlined text-xs">title</span>
              </div>

              {/* Central Details */}
              <div className="flex-1 flex flex-col justify-end p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                  <div className="bg-surface-container-high/90 border border-outline-variant p-4 rounded-lg backdrop-blur-md">
                    <div className="font-label-caps text-label-caps text-outline text-[9px] uppercase tracking-wider mb-1">PROFIT/LOSS</div>
                    <div className="font-data-mono text-lg font-bold text-secondary font-mono">+$4,281.50</div>
                  </div>
                  <div className="bg-surface-container-high/90 border border-outline-variant p-3 rounded-lg backdrop-blur-md">
                    <div className="font-label-caps text-label-caps text-outline text-[9px] uppercase tracking-wider mb-1">WIN RATE</div>
                    <div className="font-data-mono text-on-surface font-bold text-base font-mono">68.4%</div>
                    <div className="w-24 h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-secondary w-[64%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bento grid */}
      <section className="px-6 max-w-6xl mx-auto py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="font-display-lg text-3xl font-bold mb-3 tracking-tight">Precision Tools for Modern Traders</h2>
          <p className="text-on-surface-variant font-body-base max-w-xl mx-auto font-sans">
            Everything you need to master your strategy without the clutter of traditional legacy platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          
          {/* Feature: Candle Replay */}
          <div className="md:col-span-3 bg-surface-container border border-outline-variant p-6 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors">
            <div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-xl">replay</span>
              </div>
              <h3 className="font-headline-md text-base mb-2 font-bold select-none">Live Candle Replay</h3>
              <p className="text-on-surface-variant font-body-sm leading-relaxed font-sans">
                Practice trading history as if it were unfolding live. Control replay speeds, step bar-by-bar, and build your execution instincts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between gap-4">
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden flex-1">
                <div className="h-full bg-primary w-2/3"></div>
              </div>
              <span className="font-data-mono font-mono text-[10px] text-primary uppercase select-none">1.5x Speed active</span>
            </div>
          </div>

          {/* Feature: Real Market Charts */}
          <div className="md:col-span-3 bg-surface-container border border-outline-variant p-6 rounded-xl hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                <span className="material-symbols-outlined text-xl">show_chart</span>
              </div>
              <h3 className="font-headline-md text-base mb-2 font-bold select-none">Global Asset Support</h3>
              <p className="text-on-surface-variant font-body-sm leading-relaxed font-sans">
                Highly calibrated data feeds across major indices, crypto, and commodity spot pairs for deep analytical coverage.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded font-data-mono text-[9px] font-mono">BTCUSDT</span>
              <span className="px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded font-data-mono text-[9px] font-mono">ETHUSDT</span>
              <span className="px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded font-data-mono text-[9px] font-mono">SOLUSDT</span>
              <span className="px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded font-data-mono text-[9px] font-mono">XRPUSDT</span>
            </div>
          </div>

          {/* Feature: Analytics */}
          <div className="md:col-span-2 bg-surface-container border border-outline-variant p-5 rounded-xl hover:border-primary/50 transition-colors">
            <h3 className="font-bold text-sm mb-1 text-on-surface">Advanced Performance Analytics</h3>
            <p className="text-on-surface-variant font-body-sm mb-4 leading-relaxed font-sans text-xs">
              Detailed metrics including drawdowns, win-loss dynamics, expectancy ratios, and Sharpe evaluations.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-outline-variant/30">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-outline">Max Drawdown</span>
                <span className="font-data-mono font-mono text-error font-medium">4.12%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-outline">Profit Factor</span>
                <span className="font-data-mono font-mono text-primary font-bold">2.84</span>
              </div>
            </div>
          </div>

          {/* Feature: Drawing Tools */}
          <div className="md:col-span-2 bg-surface-container border border-outline-variant p-5 rounded-xl hover:border-primary/50 transition-colors">
            <h3 className="font-bold text-sm mb-1 text-on-surface">Vector Drawing Suite</h3>
            <p className="text-on-surface-variant font-body-sm mb-3 leading-relaxed font-sans text-xs">
              Calibrated drawing implements including horizontal support grids, customizable paint vectors, and coordinate tools.
            </p>
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-outline-variant/30 text-outline">
              <div className="aspect-square bg-surface-container-low rounded border border-outline-variant flex items-center justify-center" title="Pointer"><span className="material-symbols-outlined text-sm">navigation</span></div>
              <div className="aspect-square bg-surface-container-low rounded border border-outline-variant flex items-center justify-center" title="Horizontal line"><span className="material-symbols-outlined text-sm">horizontal_rule</span></div>
              <div className="aspect-square bg-surface-container-low rounded border border-outline-variant flex items-center justify-center" title="Measurement"><span className="material-symbols-outlined text-sm">straighten</span></div>
              <div className="aspect-square bg-surface-container-low rounded border border-outline-variant flex items-center justify-center" title="Brush"><span className="material-symbols-outlined text-sm">brush</span></div>
            </div>
          </div>

          {/* Feature: Saved Workspaces */}
          <div className="md:col-span-2 bg-surface-container border border-outline-variant p-5 rounded-xl hover:border-primary/50 transition-colors flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-1 text-on-surface text-secondary">Cloud Sync Workspaces</h3>
              <p className="text-on-surface-variant font-body-sm leading-relaxed font-sans text-xs">
                Save, duplicate, and cluster your trading profiles. Seamlessly transition setups right inside your browser.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-primary">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_4px_#34e3cd]"></span>
              <span className="font-data-mono font-mono text-[9px] uppercase tracking-wider font-bold">Persistent Storage Synced</span>
            </div>
          </div>

        </div>
      </section>

      {/* stepper block */}
      <section className="bg-surface-container-low py-16 border-y border-outline-variant w-full">
        <div className="px-6 max-w-3xl mx-auto">
          <div className="mb-12">
            <h2 className="font-display-lg text-2xl font-bold mb-2">Master Your Strategy</h2>
            <p className="text-on-surface-variant font-body-sm font-sans">Three sequential disciplines to institutional competency.</p>
          </div>

          <div className="space-y-10 relative">
            <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-outline-variant"></div>

            {/* Step 1 */}
            <div className="relative flex items-start gap-8">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono font-bold shrink-0 z-10 antialiased glow-cyan">
                1
              </div>
              <div>
                <h3 className="font-headline-md text-base font-bold mb-1">Assemble Market Data</h3>
                <p className="text-on-surface-variant font-body-sm leading-relaxed font-sans">
                  Select your financial pairing, construct your initial starting test capital limits, and segment historical trading timelines.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-8">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant text-primary flex items-center justify-center font-mono font-bold shrink-0 z-10 antialiased">
                2
              </div>
              <div>
                <h3 className="font-headline-md text-base font-bold mb-1">Simulate Active Replay</h3>
                <p className="text-on-surface-variant font-body-sm leading-relaxed font-sans">
                  Deploy orders as candlesticks expand. Gauge risk thresholds, adapt stop metrics under simulated market latency.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start gap-8">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant text-primary flex items-center justify-center font-mono font-bold shrink-0 z-10 antialiased">
                3
              </div>
              <div>
                <h3 className="font-headline-md text-base font-bold mb-1">Log &amp; Calibrate Parameters</h3>
                <p className="text-on-surface-variant font-body-sm leading-relaxed font-sans">
                  Collect logs instantly inside the performance dashboard. Polish metrics, optimize parameter length, and rerun simulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* pricing plans */}
      <section className="px-6 max-w-6xl mx-auto py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="font-display-lg text-3xl font-bold mb-2">Calibrated Workspace Plans</h2>
          <p className="text-on-surface-variant font-body-base max-w-sm mx-auto font-sans text-sm">
            Scale your simulation capacity as your statistical consistency matures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Free */}
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="font-label-caps text-label-caps text-outline text-[10px] uppercase font-bold tracking-widest mb-1">BASIC WORKSPACE</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono">$0</span>
                <span className="text-outline text-xs">/month</span>
              </div>
              <p className="text-on-surface-variant text-xs mt-3 font-sans">A robust default profile for standard manual practice.</p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1 border-t border-outline-variant/30 pt-4 text-xs font-sans text-on-surface-variant">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Daily Candle resolution replay</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Base vector drawing implements</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Local session cache storage</li>
            </ul>

            <button 
              onClick={onStartTrading}
              className="w-full py-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all text-xs font-semibold"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro */}
          <div className="bg-surface-container-highest border-2 border-primary p-6 rounded-xl flex flex-col justify-between relative scale-105 shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-3 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
              STRATEGY PREFERRED
            </div>
            
            <div className="mb-6">
              <h3 className="font-label-caps text-label-caps text-primary text-[10px] uppercase font-bold tracking-widest mb-1">PRO WORKSTATION</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-primary">$29</span>
                <span className="text-outline text-xs">/month</span>
              </div>
              <p className="text-on-surface-variant text-xs mt-3 font-sans">Full tick-level backtest simulator for professional traders.</p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1 border-t border-primary/20 pt-4 text-xs font-sans text-on-surface">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Multi-timeframe bar replay</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Strategy Template triggers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Unlimited cached sessions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Metric journal logs CSV export</li>
            </ul>

            <button 
              onClick={onStartTrading}
              className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 transition-all text-xs shadow-lg glow-cyan"
            >
              Initialize Pro Session
            </button>
          </div>

          {/* Premium */}
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="font-label-caps text-label-caps text-outline text-[10px] uppercase font-bold tracking-widest mb-1">ENTERPRISE CORE</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono">$59</span>
                <span className="text-outline text-xs">/month</span>
              </div>
              <p className="text-on-surface-variant text-xs mt-3 font-sans">For multi-asset automated systems running cluster scans.</p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1 border-t border-outline-variant/30 pt-4 text-xs font-sans text-on-surface-variant">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Everything in Pro tier</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Grid-multichart dashboard sync</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Gemini AI custom report prompts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> High volume Webhook API nodes</li>
            </ul>

            <button 
              onClick={onStartTrading}
              className="w-full py-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all text-xs font-semibold"
            >
              Acquire Enterprise Core
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant py-10 w-full mt-auto">
        <div className="px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-3">
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter block select-none">ChartPilot</span>
            <p className="text-on-surface-variant font-body-sm max-w-xs text-xs font-sans">
              The high-caliber digital workspace for tactical backtesting, active replay, and parameter journaling.
            </p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-outline hover:text-primary cursor-pointer text-sm">terminal</span>
              <span className="material-symbols-outlined text-outline hover:text-primary cursor-pointer text-sm">share</span>
              <span className="material-symbols-outlined text-outline hover:text-primary cursor-pointer text-sm">hub</span>
            </div>
          </div>

          <div className="text-xs font-sans text-on-surface-variant space-y-2">
            <h4 className="font-label-caps text-label-caps text-on-surface font-bold text-[10px] tracking-wider mb-2 select-none uppercase">WORKSTATION</h4>
            <div className="flex flex-col gap-1.5">
              <a className="hover:text-primary transition-colors cursor-pointer" onClick={onStartTrading}>Candle Replay</a>
              <a className="hover:text-primary transition-colors cursor-pointer" onClick={onStartTrading}>Metrics Terminal</a>
              <a className="hover:text-primary transition-colors cursor-pointer" onClick={onStartTrading}>Macro Settings</a>
            </div>
          </div>

          <div className="text-xs font-sans text-on-surface-variant space-y-2">
            <h4 className="font-label-caps text-label-caps text-on-surface font-bold text-[10px] tracking-wider mb-2 select-none uppercase">SUPPORT</h4>
            <div className="flex flex-col gap-1.5">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Workspace Guide</a>
              <a href="#" className="hover:text-primary transition-colors">Engine API</a>
            </div>
          </div>

          <div className="text-xs font-sans text-on-surface-variant space-y-2">
            <h4 className="font-label-caps text-label-caps text-on-surface font-bold text-[10px] tracking-wider mb-2 select-none uppercase">MONITOR</h4>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_4px_rgba(102,217,204,0.5)]"></div>
              <span className="font-data-mono font-mono text-[10px] text-outline select-none">ALL SYSTEMS COLD</span>
            </div>
          </div>
        </div>

        <div className="px-6 max-w-6xl mx-auto pt-8 mt-8 border-t border-outline-variant flex justify-between items-center text-[10px] text-outline font-data-mono font-mono">
          <span>© 2026 ChartPilot Technology</span>
          <div className="flex gap-4">
            <span>LATENCY: 12ms</span>
            <span>NODE: US-EAST-1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
