import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Timeframe, UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void | Promise<void>;
  onAddNotification: (msg: string) => void;
}

export default function SettingsView({ settings, onSaveSettings, onAddNotification }: SettingsViewProps) {
  const [bullColor, setBullColor] = useState(settings.bullColor || '#26A69A');
  const [bearColor, setBearColor] = useState(settings.bearColor || '#EF5350');
  const [riskPerTrade, setRiskPerTrade] = useState(settings.riskPerTrade || 2);
  const [gridLines, setGridLines] = useState(settings.gridLines !== false);
  const [telemetry, setTelemetry] = useState(settings.showTelemetry !== false);
  const [defaultInitialBalance, setDefaultInitialBalance] = useState(settings.defaultInitialBalance || 10000);
  const [defaultSymbol, setDefaultSymbol] = useState(settings.defaultSymbol || 'BTCUSD');
  const [defaultTimeframe, setDefaultTimeframe] = useState<Timeframe>(settings.defaultTimeframe || '1h');

  const handleSettingsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      ...settings,
      bullColor,
      bearColor,
      riskPerTrade,
      gridLines,
      showTelemetry: telemetry,
      defaultInitialBalance,
      defaultSymbol,
      defaultTimeframe,
    });
  };

  const handleRestoreDefaults = () => {
    setBullColor('#26A69A');
    setBearColor('#EF5350');
    setRiskPerTrade(2);
    setGridLines(true);
    setTelemetry(true);
    setDefaultInitialBalance(10000);
    setDefaultSymbol('BTCUSD');
    setDefaultTimeframe('1h');
    onAddNotification('Workstation settings restored to system defaults.');
  };

  return (
    <div className="flex-grow w-full py-6 px-6 overflow-y-auto">
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display-lg text-xl text-on-surface font-black select-none">Workstation Settings</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">Calibrate charting indicators, risk sizing algorithms, and UI theme profiles.</p>
        </div>
      </div>

      <div className="max-w-2xl bg-surface-container border border-outline-variant rounded-lg p-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>

        <form onSubmit={handleSettingsFormSubmit} className="space-y-6 font-sans text-xs">
          
          {/* Section: Chart Customisation colors */}
          <div className="space-y-4">
            <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold border-b border-outline-variant pb-2">Chart Color Customization</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-on-surface font-medium block">Bullish Candle Color (HEX)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bullColor}
                    onChange={(e) => setBullColor(e.target.value)}
                    className="w-10 h-8 rounded border border-outline-variant bg-surface-container-lowest cursor-pointer p-0.5"
                  />
                  <input 
                    type="text" 
                    value={bullColor}
                    onChange={(e) => setBullColor(e.target.value)}
                    maxLength={7}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono"
                    placeholder="#26A69A"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-on-surface font-medium block">Bearish Candle Color (HEX)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={bearColor}
                    onChange={(e) => setBearColor(e.target.value)}
                    className="w-10 h-8 rounded border border-outline-variant bg-surface-container-lowest cursor-pointer p-0.5"
                  />
                  <input 
                    type="text" 
                    value={bearColor}
                    onChange={(e) => setBearColor(e.target.value)}
                    maxLength={7}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono"
                    placeholder="#EF5350"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Risk Calculator details */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold pb-2 border-b border-outline-variant/30">Risk Management engine</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-on-surface font-medium">Default Sizing Risk Per Trade: <span className="text-primary font-bold font-mono">{riskPerTrade}%</span></label>
                <span className="text-outline text-[10px] uppercase font-bold tracking-tight">Of Available Capital</span>
              </div>
              
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((percent) => (
                  <button 
                    key={percent}
                    type="button"
                    onClick={() => setRiskPerTrade(percent)}
                    className={`flex-1 py-1.5 rounded transition-all font-mono font-bold ${
                      riskPerTrade === percent 
                        ? 'bg-primary text-on-primary shadow-[0_0_4px_rgba(68,216,241,0.15)]' 
                        : 'bg-surface-container-lowest border border-outline-variant text-outline hover:text-on-surface'
                    }`}
                  >
                    {percent}% Risk
                  </button>
                ))}
              </div>
              <p className="text-outline text-[10px] leading-relaxed pt-1 select-none font-sans">
                Adjusts long/short position estimations inside the tactical order entry ledger. Maintain prudent risk tiers during simulations.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold pb-2 border-b border-outline-variant/30">Session Defaults</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-on-surface font-medium block">Initial Balance</span>
                <input
                  type="number"
                  min={100}
                  value={defaultInitialBalance}
                  onChange={(event) => setDefaultInitialBalance(Number(event.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-on-surface font-medium block">Default Symbol</span>
                <input
                  type="text"
                  value={defaultSymbol}
                  onChange={(event) => setDefaultSymbol(event.target.value.toUpperCase())}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-on-surface font-medium block">Default Timeframe</span>
                <select
                  value={defaultTimeframe}
                  onChange={(event) => setDefaultTimeframe(event.target.value as Timeframe)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1D">1d</option>
                </select>
              </label>
            </div>
          </div>

          {/* Section: Canvas visual options */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <h3 className="font-label-caps text-outline uppercase tracking-wider text-[9px] font-bold pb-2 border-b border-outline-variant/30">Visual Preferences</h3>
            
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-on-surface font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={gridLines}
                  onChange={(e) => setGridLines(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0"
                />
                Show horizontal and vertical grid coordinate lines on chart canvas
              </label>

              <label className="flex items-center gap-2 text-on-surface font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={telemetry}
                  onChange={(e) => setTelemetry(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-0"
                />
                Show system telemetry status outputs in margin layout rails
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-6 border-t border-outline-variant/30 justify-end">
            <button 
              type="button"
              onClick={handleRestoreDefaults}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/50 rounded flex items-center gap-1.5 transition-all font-medium font-sans"
            >
              <RefreshCw className="w-3.5 h-3.5 text-outline" />
              Restore System Defaults
            </button>

            <button 
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary font-bold rounded flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-lg glow-cyan uppercase tracking-wider"
            >
              <Save className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
