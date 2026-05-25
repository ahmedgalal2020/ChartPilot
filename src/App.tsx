import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

import { User, BacktestSession, Workspace, TradingStrategy, UserSettings, SymbolPair, TradingSymbol } from './types';
import { getCurrentUser, signOut } from './services/auth';
import { addTradeToSession, calculatePerformance, createBacktest, fetchBacktests, savePerformanceMetrics, updateBacktestNotes, updateReplayState } from './services/backtests';
import { defaultSettings, fetchSettings, saveSettings } from './services/settings';
import { createStrategy, deleteStrategy, fetchStrategies } from './services/strategies';
import { createWorkspace, deleteWorkspace, fetchWorkspaces, renameWorkspace, setActiveWorkspace } from './services/workspaces';
import { fetchSymbols } from './services/symbols';

import TopNavBar from './components/TopNavBar';
import SideNavBar from './components/SideNavBar';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import DashboardView from './components/DashboardView';
import BacktestView from './components/BacktestView';
import StrategyView from './components/StrategyView';
import PortfolioView from './components/PortfolioView';
import SettingsView from './components/SettingsView';

interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>('landing');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  const [sessions, setSessions] = useState<BacktestSession[]>([]);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [symbols, setSymbols] = useState<TradingSymbol[]>([]);
  const [activeBacktestSession, setActiveBacktestSession] = useState<BacktestSession | null>(null);
  
  // Workspace and Settings details
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolPair>('BTCUSDT');
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Slide-in flash notifications queue state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Function to enqueue toast notifications
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `notif-${Date.now()}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return 'Unexpected Supabase operation failure.';
  };

  const loadUserData = async (currentUser: User) => {
    setIsDataLoading(true);
    try {
      const [loadedSettings, loadedStrategies, loadedWorkspaces, loadedBacktests, loadedSymbols] = await Promise.all([
        fetchSettings(currentUser.id),
        fetchStrategies(currentUser.id),
        fetchWorkspaces(currentUser.id),
        fetchBacktests(currentUser.id),
        fetchSymbols(),
      ]);

      setSettings(loadedSettings);
      setStrategies(loadedStrategies);
      setWorkspaces(loadedWorkspaces);
      setSessions(loadedBacktests);
      setSymbols(loadedSymbols);
      const activeWorkspace = loadedWorkspaces.find((workspace) => workspace.isActive);
      if (activeWorkspace) setSelectedSymbol(activeWorkspace.symbol);
      else if (loadedSettings.defaultSymbol) setSelectedSymbol(loadedSettings.defaultSymbol);
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const restoredUser = await getCurrentUser();
        if (!isMounted) return;
        if (restoredUser) {
          setUser(restoredUser);
          setActiveScreen('dashboard');
          await loadUserData(restoredUser);
        }
      } catch (error) {
        if (isMounted) triggerNotification(getErrorMessage(error), 'error');
      } finally {
        if (isMounted) setIsAppLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const handleUserLogin = async (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveScreen('dashboard');
    await loadUserData(authenticatedUser);
    triggerNotification(`Workstation session initialized. Welcome back, ${authenticatedUser.name}!`);
  };

  // Sign out handler
  const handleUserLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setSessions([]);
      setActiveBacktestSession(null);
      setStrategies([]);
      setWorkspaces([]);
      setSettings(defaultSettings);
      setActiveScreen('landing');
      triggerNotification('Session securely closed. Workstation cleared.', 'info');
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  // Strategy triggers
  const handleAddStrategy = async (newStrat: TradingStrategy) => {
    if (!user) return;
    try {
      const savedStrategy = await createStrategy(user.id, newStrat);
      setStrategies((prev) => [savedStrategy, ...prev]);
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    try {
      await deleteStrategy(id);
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      triggerNotification('Strategy framework removed successfully.', 'info');
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  // Backtest triggers
  const handleAddBacktestSession = async (newSession: BacktestSession) => {
    if (!user) throw new Error('You must be signed in to create a backtest session.');
    try {
      const savedSession = await createBacktest(user.id, newSession);
      setSessions((prev) => [savedSession, ...prev]);
      return savedSession;
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
      throw error;
    }
  };

  const handleUpdateBacktestSession = async (updatedSession: BacktestSession) => {
    try {
      await updateBacktestNotes(updatedSession.id, updatedSession.notes || '');
      setSessions((prev) => prev.map((s) => s.id === updatedSession.id ? updatedSession : s));
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleResumeBacktestSession = (session: BacktestSession) => {
    setActiveBacktestSession(session);
    setSelectedSymbol(session.symbol);
    setActiveScreen('dashboard');
    triggerNotification(`Replay session loaded: ${session.name}`, 'info');
  };

  const handleReplayProgress = async (sessionId: string, progress: {
    currentIndex: number;
    currentBalance: number;
    speed: number;
    status: 'playing' | 'paused' | 'completed';
  }) => {
    try {
      await updateReplayState({
        sessionId,
        currentIndex: progress.currentIndex,
        currentBalance: progress.currentBalance,
        speed: progress.speed,
        status: progress.status,
      });
      setSessions((prev) => prev.map((session) => {
        if (session.id !== sessionId) return session;
        const replayState = session.replayState
          ? { ...session.replayState, ...progress }
          : undefined;
        return { ...session, replayState, status: progress.status };
      }));
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleAddTradeToActiveSession = async (trade: import('./types').Trade) => {
    if (!user || !activeBacktestSession) return;
    try {
      const savedTrade = await addTradeToSession(user.id, activeBacktestSession.id, activeBacktestSession.symbol, trade);
      const nextTrades = [savedTrade, ...activeBacktestSession.tradesList];
      const metrics = calculatePerformance(nextTrades, activeBacktestSession.initialBalance || 10000);
      await savePerformanceMetrics(user.id, activeBacktestSession.id, metrics);
      const updatedSession: BacktestSession = {
        ...activeBacktestSession,
        tradesList: nextTrades,
        totalTrades: metrics.tradeCount,
        winRate: metrics.winRate,
        totalPL: metrics.netPL,
        metrics,
      };
      setActiveBacktestSession(updatedSession);
      setSessions((prev) => prev.map((session) => session.id === updatedSession.id ? updatedSession : session));
      triggerNotification('Trade saved to active backtest session.', 'success');
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  // Workspace actions
  const handleAddWorkspace = async (newWs: Workspace) => {
    if (!user) return;
    try {
      const savedWorkspace = await createWorkspace(user.id, newWs);
      setWorkspaces((prev) => [savedWorkspace, ...prev]);
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleDuplicateWorkspace = async (id: string) => {
    if (!user) return;
    const sourceWs = workspaces.find((w) => w.id === id);
    if (!sourceWs) return;

    const clonedWs: Workspace = {
      ...sourceWs,
      name: `${sourceWs.name}_CLONE`,
      isActive: false
    };

    try {
      const savedWorkspace = await createWorkspace(user.id, clonedWs);
      setWorkspaces((prev) => [...prev, savedWorkspace]);
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    try {
      await deleteWorkspace(id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleRenameWorkspace = async (id: string, name: string) => {
    try {
      const renamed = await renameWorkspace(id, name);
      setWorkspaces((prev) => prev.map((workspace) => workspace.id === id ? renamed : workspace));
      triggerNotification('Workspace renamed successfully.', 'success');
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  // Loading workspace settings directly into chartSymbol
  const handleLoadWorkspace = async (workspace: Workspace) => {
    if (!user) return;
    try {
      await setActiveWorkspace(user.id, workspace.id);
      setSelectedSymbol(workspace.symbol);
      setWorkspaces((prev) => prev.map((w) => ({
        ...w,
        isActive: w.id === workspace.id
      })));
      setActiveScreen('dashboard');
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  const handleSaveSettings = async (updatedSettings: UserSettings) => {
    if (!user) return;
    try {
      const savedSettings = await saveSettings(user.id, updatedSettings);
      setSettings(savedSettings);
      triggerNotification('Workstation settings profile updated successfully.');
    } catch (error) {
      triggerNotification(getErrorMessage(error), 'error');
    }
  };

  // Handlers for side tools activated notifications
  const handleSideToolActivated = (toolName: string) => {
    triggerNotification(`Tool Activated: ${toolName.toUpperCase()} vector plotting ready.`, 'info');
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-primary font-mono text-xs uppercase tracking-widest">
        Loading ChartPilot session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col relative">
      
      {/* Premium Top Navigation header */}
      <TopNavBar 
        user={user} 
        activeScreen={activeScreen} 
        onScreenChange={setActiveScreen} 
        onLogout={handleUserLogout}
        selectedSymbol={user ? selectedSymbol : undefined}
      />

      {/* Main Container Layout */}
      <div className="flex-grow flex content-stretch pt-12 relative w-full">
        
        {/* Render Side drawing panel only for logged in dashboard views */}
        {user && activeScreen === 'dashboard' && (
          <SideNavBar 
            onToolActivated={handleSideToolActivated} 
            activeScreen={activeScreen}
            onScreenChange={setActiveScreen}
          />
        )}

        {/* Dynamic Screen router content */}
        <div className={`flex-grow flex flex-col min-w-0 transition-all ${
          user && activeScreen === 'dashboard' ? 'md:pl-16' : ''
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="flex-grow flex flex-col"
            >
              {activeScreen === 'landing' && (
                <LandingPage 
                  onStartTrading={() => setActiveScreen(user ? 'dashboard' : 'auth')} 
                />
              )}

              {activeScreen === 'auth' && (
                <AuthPage 
                  onLogin={handleUserLogin} 
                />
              )}

              {user && isDataLoading && activeScreen !== 'landing' && activeScreen !== 'auth' && (
                <div className="flex-grow flex items-center justify-center text-primary font-mono text-xs uppercase tracking-widest">
                  Syncing Supabase workspace...
                </div>
              )}

              {user && !isDataLoading && activeScreen === 'dashboard' && (
                <DashboardView 
                  userId={user.id}
                  settings={settings}
                  symbols={symbols}
                  initialSymbol={selectedSymbol}
                  initialTimeframe={settings.defaultTimeframe || '1h'}
                  activeSession={activeBacktestSession}
                  onReplayProgress={handleReplayProgress}
                  onPersistTrade={handleAddTradeToActiveSession}
                  onAddTradeNotification={(msg) => triggerNotification(msg, 'success')}
                />
              )}

              {user && !isDataLoading && activeScreen === 'backtest' && (
                <BacktestView 
                  sessions={sessions}
                  symbols={symbols}
                  settings={settings}
                  onUpdateSession={handleUpdateBacktestSession}
                  onAddSession={handleAddBacktestSession}
                  onResumeSession={handleResumeBacktestSession}
                  onAddNotification={(msg) => triggerNotification(msg, 'success')}
                />
              )}

              {user && !isDataLoading && activeScreen === 'strategy' && (
                <StrategyView 
                  strategies={strategies}
                  onAddStrategy={handleAddStrategy}
                  onDeleteStrategy={handleDeleteStrategy}
                  onAddNotification={(msg) => triggerNotification(msg, 'success')}
                />
              )}

              {user && !isDataLoading && activeScreen === 'portfolio' && (
                <PortfolioView 
                  workspaces={workspaces}
                  onAddWorkspace={handleAddWorkspace}
                  onDuplicateWorkspace={handleDuplicateWorkspace}
                  onDeleteWorkspace={handleDeleteWorkspace}
                  onRenameWorkspace={handleRenameWorkspace}
                  onLoadWorkspace={handleLoadWorkspace}
                  onAddNotification={(msg) => triggerNotification(msg, 'success')}
                />
              )}

              {user && !isDataLoading && activeScreen === 'settings' && (
                <SettingsView 
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onAddNotification={(msg) => triggerNotification(msg, 'info')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Premium Notification Toast Stack on Right-top corner */}
      <div className="fixed top-14 right-4 z-55 flex flex-col gap-2 pointer-events-none max-w-sm w-full font-sans">
        <AnimatePresence>
          {notifications.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 26, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 26, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto p-3.5 rounded border shadow-lg flex items-start gap-3 backdrop-blur-md ${
                item.type === 'success' 
                  ? 'bg-surface-container-high/90 border-secondary/35 text-on-surface' 
                  : item.type === 'error'
                  ? 'bg-surface-container-high/90 border-error/35 text-error'
                  : 'bg-surface-container-high/90 border-primary/35 text-on-surface'
              }`}
            >
              {item.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-secondary shrink-0 mt-0.5" />
              ) : item.type === 'error' ? (
                <AlertCircle className="w-4.5 h-4.5 text-error shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed font-semibold">{item.message}</p>
              </div>

              <button 
                onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== item.id))}
                className="text-outline hover:text-on-surface p-0.5 rounded transition-all shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
