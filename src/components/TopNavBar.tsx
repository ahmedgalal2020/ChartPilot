import React from 'react';
import { Bell, Settings as SettingsIcon, Wallet, LogOut, Code } from 'lucide-react';
import { User } from '../types';

interface TopNavBarProps {
  user: User | null;
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  onLogout: () => void;
  selectedSymbol?: string;
  priceChange?: string;
}

export default function TopNavBar({
  user,
  activeScreen,
  onScreenChange,
  onLogout,
  selectedSymbol,
  priceChange,
}: TopNavBarProps) {
  return (
    <header className="flex justify-between items-center w-full px-4 h-12 z-50 bg-surface-container-low border-b border-outline-variant fixed top-0 left-0 right-0">
      <div className="flex items-center gap-6">
        <span 
          className="font-headline-md text-headline-md font-bold text-primary tracking-tighter cursor-pointer flex items-center gap-2"
          onClick={() => onScreenChange('landing')}
        >
          ChartPilot
        </span>

        {selectedSymbol && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-0.5 bg-surface-container rounded border border-outline-variant">
            <span className="font-data-mono text-data-mono text-primary text-xs">{selectedSymbol}</span>
            <span className="text-secondary text-[10px] font-bold">{priceChange || '+2.45%'}</span>
          </div>
        )}

        {user && (
          <nav className="hidden md:flex gap-6 ml-4">
            <button 
              onClick={() => onScreenChange('dashboard')}
              className={`font-body-base text-body-base pb-1 transition-all ${
                activeScreen === 'dashboard' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onScreenChange('backtest')}
              className={`font-body-base text-body-base pb-1 transition-all ${
                activeScreen === 'backtest' || activeScreen === 'backtest-report'
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Backtest
            </button>
            <button 
              onClick={() => onScreenChange('strategy')}
              className={`font-body-base text-body-base pb-1 transition-all ${
                activeScreen === 'strategy' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Strategy
            </button>
            <button 
              onClick={() => onScreenChange('portfolio')}
              className={`font-body-base text-body-base pb-1 transition-all ${
                activeScreen === 'portfolio' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Portfolio
            </button>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button 
              onClick={() => onScreenChange('settings')}
              className={`p-1.5 hover:bg-surface-container-high transition-all duration-200 rounded-full text-on-surface-variant ${
                activeScreen === 'settings' ? 'text-primary bg-surface-container-high' : ''
              }`}
              title="Workstation Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-surface-container-high transition-all duration-200 rounded-full text-on-surface-variant" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-surface-container-high transition-all duration-200 rounded-full text-on-surface-variant" title="Balance Wallet">
              <Wallet className="w-4 h-4" />
            </button>
            
            <div 
              className="h-7 w-7 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant cursor-pointer hover:border-primary transition-all ml-1 flex items-center justify-center"
              onClick={() => onScreenChange('settings')}
              title={`${user.name}'s Profile`}
            >
              <img 
                src={user.avatar} 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>

            <button 
              onClick={onLogout}
              className="ml-2 p-1.5 text-error hover:bg-error/10 hover:text-error-container transition-all rounded-full"
              title="Exit Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => onScreenChange('landing')}
              className={`px-3 py-1 text-xs font-semibold rounded hover:text-primary transition-all ${
                activeScreen === 'landing' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => onScreenChange('auth')}
              className="px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded hover:brightness-110 active:opacity-90 transition-all glow-cyan"
            >
              Initialize Session
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
