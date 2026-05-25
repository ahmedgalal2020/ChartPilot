import React, { useState } from 'react';
import { 
  Navigation, 
  TrendingUp, 
  Sliders, 
  Brush, 
  Type, 
  Ruler, 
  Layers, 
  Eye, 
  EyeOff,
  User,
  Activity,
  Award,
  BookOpen
} from 'lucide-react';

interface SideNavBarProps {
  onToolActivated?: (toolName: string) => void;
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

export default function SideNavBar({ onToolActivated, activeScreen, onScreenChange }: SideNavBarProps) {
  const [activeTool, setActiveTool] = useState<string>('pointer');
  const [showDrawings, setShowDrawings] = useState<boolean>(true);

  const handleToolClick = (toolName: string) => {
    setActiveTool(toolName);
    if (onToolActivated) {
      onToolActivated(toolName);
    }
  };

  return (
    <aside className="hidden md:flex flex-col items-center py-4 space-y-4 h-[calc(100vh-48px)] w-16 z-40 bg-surface-container-lowest border-r border-outline-variant fixed left-0 top-12 shrink-0">
      
      {/* Upper Drawing Tools Cluster */}
      <div className="flex flex-col gap-2 w-full px-2">
        <button 
          onClick={() => handleToolClick('pointer')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
            activeTool === 'pointer'
              ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_4px_rgba(68,216,241,0.15)]'
              : 'text-outline hover:text-primary hover:bg-surface-container-highest'
          }`}
          title="Crosshair Pointer"
        >
          <Navigation className="w-4 h-4 transform -rotate-45" />
        </button>

        <button 
          onClick={() => handleToolClick('chartLink')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
            activeTool === 'chartLink'
              ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_4px_rgba(68,216,241,0.15)]'
              : 'text-outline hover:text-primary hover:bg-surface-container-highest'
          }`}
          title="Trendline Draw"
        >
          <TrendingUp className="w-4 h-4" />
        </button>

        <button 
          onClick={() => handleToolClick('gann')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
            activeTool === 'gann'
              ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_4px_rgba(68,216,241,0.15)]'
              : 'text-outline hover:text-primary hover:bg-surface-container-highest'
          }`}
          title="Fibonacci Retracement"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button 
          onClick={() => handleToolClick('brush')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
            activeTool === 'brush'
              ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_4px_rgba(68,216,241,0.15)]'
              : 'text-outline hover:text-primary hover:bg-surface-container-highest'
          }`}
          title="Paint Brush"
        >
          <Brush className="w-4 h-4" />
        </button>

        <button 
          onClick={() => handleToolClick('text')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
            activeTool === 'text'
              ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_4px_rgba(68,216,241,0.15)]'
              : 'text-outline hover:text-primary hover:bg-surface-container-highest'
          }`}
          title="Add Text Label"
        >
          <Type className="w-4 h-4" />
        </button>

        <button 
          onClick={() => handleToolClick('ruler')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
            activeTool === 'ruler'
              ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_4px_rgba(68,216,241,0.15)]'
              : 'text-outline hover:text-primary hover:bg-surface-container-highest'
          }`}
          title="Measure Distance/Price"
        >
          <Ruler className="w-4 h-4" />
        </button>
      </div>

      {/* Screen navigation quick links as safety fallback */}
      <div className="w-8 h-[1px] bg-outline-variant my-2" />
      <div className="flex flex-col gap-2 w-full px-2">
        <button 
          onClick={() => onScreenChange('strategy')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            activeScreen === 'strategy' ? 'text-primary bg-primary/10' : 'text-outline hover:text-primary'
          }`}
          title="Strategy Library"
        >
          <Award className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onScreenChange('portfolio')}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            activeScreen === 'portfolio' ? 'text-primary bg-primary/10' : 'text-outline hover:text-primary'
          }`}
          title="Saved Workspaces"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>

      {/* Footer Drawing Control Actions */}
      <div className="mt-auto flex flex-col gap-2 w-full px-2 pb-2">
        <button 
          onClick={() => handleToolClick('layers')}
          className="w-10 h-10 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-highest transition-colors rounded-lg"
          title="Chart Layers List"
        >
          <Layers className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => {
            setShowDrawings(!showDrawings);
            handleToolClick(showDrawings ? 'hide-drawings' : 'show-drawings');
          }}
          className="w-10 h-10 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-highest transition-colors rounded-lg"
          title={showDrawings ? "Hide All Drawings" : "Show All Drawings"}
        >
          {showDrawings ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4 text-error" />
          )}
        </button>
      </div>
    </aside>
  );
}
