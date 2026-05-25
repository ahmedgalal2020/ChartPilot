import React, { useState } from 'react';
import { BookOpen, Copy, Edit3, Trash2, FolderSync } from 'lucide-react';
import { Workspace, SymbolPair, Timeframe } from '../types';

interface PortfolioViewProps {
  workspaces: Workspace[];
  onAddWorkspace: (newWorkspace: Workspace) => void;
  onDuplicateWorkspace: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onLoadWorkspace: (workspace: Workspace) => void;
  onAddNotification: (msg: string) => void;
}

export default function PortfolioView({
  workspaces,
  onAddWorkspace,
  onDuplicateWorkspace,
  onDeleteWorkspace,
  onRenameWorkspace,
  onLoadWorkspace,
  onAddNotification
}: PortfolioViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAsset, setNewAsset] = useState<SymbolPair>('BTCUSDT');
  const [newTimeframe, setNewTimeframe] = useState<Timeframe>('4h');

  // Trigger loading workspace
  const handleLoadWorkspaceClick = (ws: Workspace) => {
    onLoadWorkspace(ws);
    onAddNotification(`Workspace Profile Loaded: "${ws.name}". Active layout updated to ${ws.symbol} ${ws.timeframe}.`);
  };

  // Submit new custom workspace
  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: newTitle.trim().replace(/\s+/g, '_').toUpperCase(),
      symbol: newAsset,
      timeframe: newTimeframe,
      lastModified: new Date().toLocaleDateString(),
      imageUrl: '',
      range: '2024.01.01 - 2024.05.25',
      tradesCount: 0,
      isActive: false
    };

    onAddWorkspace(newWs);
    onAddNotification(`Created new Workspace structure: ${newWs.name}`);
    setIsModalOpen(false);
    setNewTitle('');
  };

  const handleRenameWorkspace = (ws: Workspace) => {
    const nextName = window.prompt('Rename workspace', ws.name);
    if (!nextName?.trim() || nextName.trim() === ws.name) return;
    onRenameWorkspace(ws.id, nextName.trim().replace(/\s+/g, '_').toUpperCase());
  };

  return (
    <div className="flex-grow w-full py-6 px-6 overflow-y-auto">
      
      {/* Header sections */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display-lg text-xl text-on-surface font-black select-none">Saved Workspaces</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">Save, clone, and catalog your trading layout sessions and historical presets.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_8px_rgba(68,216,241,0.25)] uppercase tracking-wider"
        >
          <BookOpen className="w-4 h-4 text-on-primary" />
          Create Preset Workspace
        </button>
      </div>

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {workspaces.map((ws) => (
          <div 
            key={ws.id} 
            className={`bg-surface-container border p-5 rounded-lg flex flex-col justify-between relative group hover:border-primary/50 transition-all ${
              ws.isActive ? 'border-primary/42 shadow-[0_0_12px_rgba(68,216,241,0.1)]' : 'border-outline-variant'
            }`}
          >
            {/* Glowing active header anchor */}
            {ws.isActive && (
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
            )}

            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 rounded ${
                  ws.isActive ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-highest text-outline'
                }`}>
                  {ws.isActive ? 'ACTIVE WORKSPACE' : 'ARCHIVED PRESET'}
                </span>
                
                <span className="font-data-mono font-mono text-[10px] text-primary font-bold">
                  {ws.symbol} · {ws.timeframe}
                </span>
              </div>

              <h3 className="font-headline-md text-base text-on-surface font-black tracking-tight leading-snug font-sans uppercase break-all">
                {ws.name}
              </h3>

              <div className="space-y-1.5 pt-4 mt-4 border-t border-outline-variant/30 text-xs font-sans text-on-surface-variant">
                <div className="flex justify-between">
                  <span className="text-outline">Candle timeline:</span>
                  <span className="font-mono">{ws.range}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Simulated Trades logged:</span>
                  <span className="font-semibold text-on-surface">{ws.tradesCount} positions</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 pt-4 border-t border-outline-variant/20">
              <button 
                onClick={() => handleLoadWorkspaceClick(ws)}
                className="flex-1 bg-primary hover:brightness-110 text-on-primary font-bold py-2 rounded text-xs transition-all uppercase tracking-wider"
              >
                Load Layout
              </button>

              <button 
                onClick={() => {
                  onDuplicateWorkspace(ws.id);
                  onAddNotification(`Duplicated preset workspace setup for: ${ws.name}`);
                }}
                className="p-2 border border-outline-variant hover:border-primary text-outline hover:text-primary rounded transition-all bg-surface-container-lowest"
                title="Clone Workspace Preset"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={() => handleRenameWorkspace(ws)}
                className="p-2 border border-outline-variant hover:border-primary text-outline hover:text-primary rounded transition-all bg-surface-container-lowest"
                title="Rename workspace"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={() => {
                  onDeleteWorkspace(ws.id);
                  onAddNotification(`Deleted Workspace layout profile: ${ws.name}`);
                }}
                className="p-2 border border-outline-variant hover:border-error text-outline hover:text-error rounded transition-all bg-surface-container-lowest"
                title="Delete layout preset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-1 md:col-span-3 text-center py-16 bg-surface-container rounded-lg border border-outline-variant/30 leading-loose">
            <FolderSync className="w-10 h-10 text-outline-variant mx-auto mb-4" />
            <span className="text-xs text-outline font-sans">No saved workspaces locked. Click "Create Preset Workspace" to create your first trading configuration.</span>
          </div>
        )}

      </div>

      {/* Workspace Creation Modal Form popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-dim/74 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 w-full max-w-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
            
            <h2 className="font-headline-md text-base text-on-surface font-bold mb-1">Assemble Custom Preset Workspace</h2>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">Save standard framework asset allocations and timeframe defaults.</p>

            <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Workspace Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. BTC_DAILY_REPLAY_LOCKED"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Asset Symbol</label>
                  <select 
                    value={newAsset}
                    onChange={(e) => setNewAsset(e.target.value as SymbolPair)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface outline-none focus:border-primary text-xs cursor-pointer"
                  >
                    <option value="BTCUSDT">BTCUSDT</option>
                    <option value="ETHUSDT">ETHUSDT</option>
                    <option value="SOLUSDT">SOLUSDT</option>
                    <option value="XRPUSDT">XRPUSDT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Default interval</label>
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
                  Create Preset Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
