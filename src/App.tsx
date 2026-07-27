/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameEntry, AppTheme, THEME_CONFIGS } from './types';
import { ThemeSelector } from './components/ThemeSelector';
import {
  loadGamesFromStorage,
  saveGamesToStorage,
  resetGamesToDefault,
  downloadCsvFile,
  parseCsvStringToGames
} from './utils/csvUtils';
import {
  ensureAuth,
  subscribeToGames,
  saveGameToFirestore,
  deleteGameFromFirestore,
  resetGamesInFirestore,
  subscribeToPasscode,
  savePasscodeToFirestore
} from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { CatalogView } from './components/CatalogView';
import { EditableTable } from './components/EditableTable';
import { CardGridView } from './components/CardGridView';
import { StatsView } from './components/StatsView';
import { EditGameModal } from './components/EditGameModal';
import { ViewGameModal } from './components/ViewGameModal';
import { WebGameSearchModal } from './components/WebGameSearchModal';
import { PasscodeLockModal } from './components/PasscodeLockModal';
import {
  Gamepad2,
  Menu,
  Table as TableIcon,
  LayoutGrid,
  BarChart2,
  Download,
  Check,
  Globe,
  Sparkles,
  Library,
  Lock,
  Cloud
} from 'lucide-react';

export default function App() {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(true);

  // App Theme State ('crimson' | 'violet' | 'midnight')
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('game_log_theme') as AppTheme) || 'crimson';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('game_log_theme', theme);
  }, [theme]);
  
  // Security & Passcode State (Unlocked PIN valid for 24 hours)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const lastUnlocked = localStorage.getItem('vault_unlocked_at');
    if (lastUnlocked) {
      const elapsed = Date.now() - parseInt(lastUnlocked, 10);
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      if (!isNaN(elapsed) && elapsed < TWENTY_FOUR_HOURS) {
        return true;
      }
    }
    return false;
  });

  const [savedPasscode, setSavedPasscode] = useState<string>(() => {
    return localStorage.getItem('master_passcode') || '1234';
  });

  const handleUpdatePasscode = (newPasscode: string) => {
    setSavedPasscode(newPasscode);
    localStorage.setItem('master_passcode', newPasscode);
    savePasscodeToFirestore(newPasscode).catch((err) => console.error(err));
    showToast('Updated Master Passcode across devices!');
  };

  const handleUnlockApp = () => {
    localStorage.setItem('vault_unlocked_at', Date.now().toString());
    setIsUnlocked(true);
    showToast('Vault unlocked. PIN session active for 24 hours.');
  };

  const handleLockApp = () => {
    localStorage.removeItem('vault_unlocked_at');
    setIsUnlocked(false);
    showToast('Vault locked.');
  };

  // Views: 'catalog' | 'table' | 'cards' | 'analytics'
  const [viewMode, setViewMode] = useState<'catalog' | 'table' | 'cards' | 'analytics'>('catalog');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [metricQuickFilter, setMetricQuickFilter] = useState('all');

  // Edit Modal, View Info Modal & Web Search Modal State
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
  const [viewingGame, setViewingGame] = useState<GameEntry | null>(null);
  const [webSearchOpen, setWebSearchOpen] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Connect Firebase Auth & Firestore real-time subscriptions
  useEffect(() => {
    // Load local storage immediately so UI is populated instantly
    const local = loadGamesFromStorage();
    if (local && local.length > 0) {
      setGames(local);
      setIsCloudLoading(false);
    }

    // Subscribe to cloud passcode for cross-device sync
    const unsubPasscode = subscribeToPasscode((cloudPasscode) => {
      setSavedPasscode(cloudPasscode);
      localStorage.setItem('master_passcode', cloudPasscode);
    });

    let unsubGames: (() => void) | null = null;

    ensureAuth()
      .then(() => {
        unsubGames = subscribeToGames(
          (cloudGames) => {
            if (cloudGames && cloudGames.length > 0) {
              setGames(cloudGames);
              saveGamesToStorage(cloudGames);
            }
            setIsCloudLoading(false);
          },
          (err) => {
            console.warn('Firestore subscription fallback to localStorage:', err);
            setIsCloudLoading(false);
          }
        );
      })
      .catch((err) => {
        console.warn('Firebase Auth/Firestore fallback to localStorage:', err);
        const loaded = loadGamesFromStorage();
        setGames(loaded);
        setIsCloudLoading(false);
      });

    return () => {
      if (unsubGames) unsubGames();
      if (unsubPasscode) unsubPasscode();
    };
  }, []);

  // Add game
  const handleAddGame = async (gameData: Omit<GameEntry, 'id' | 'createdAt'>) => {
    const newEntry: GameEntry = {
      ...gameData,
      id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    setGames(prev => {
      const updated = [newEntry, ...prev.filter(g => g.id !== newEntry.id)];
      saveGamesToStorage(updated);
      return updated;
    });
    showToast(`Added "${newEntry.title}" to catalog!`);

    saveGameToFirestore(newEntry).catch(err => console.warn(err));
  };

  // Update game entry
  const handleUpdateGame = async (id: string, updatedFields: Partial<GameEntry>) => {
    const existing = games.find(g => g.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updatedFields };

    setGames(prev => {
      const updatedList = prev.map(g => (g.id === id ? updated : g));
      saveGamesToStorage(updatedList);
      return updatedList;
    });

    saveGameToFirestore(updated).catch(err => console.warn(err));
  };

  // Delete game entry
  const handleDeleteGame = async (id: string) => {
    const game = games.find(g => g.id === id);

    setGames(prev => {
      const updated = prev.filter(g => g.id !== id);
      saveGamesToStorage(updated);
      return updated;
    });
    showToast(`Removed "${game?.title || 'Game'}" from catalog.`);

    deleteGameFromFirestore(id).catch(err => console.warn(err));
  };

  // CSV Export
  const handleExportCsv = () => {
    downloadCsvFile(games);
    showToast('Downloaded game_backlog.csv to device!');
  };

  // CSV Import
  const handleImportCsv = async (csvText: string) => {
    const parsed = parseCsvStringToGames(csvText);
    if (parsed.length > 0) {
      setGames(prev => {
        const combined = [...parsed, ...prev.filter(p => !parsed.some(n => n.id === p.id))];
        saveGamesToStorage(combined);
        return combined;
      });
      showToast(`Successfully imported ${parsed.length} games to catalog!`);

      for (const game of parsed) {
        saveGameToFirestore(game).catch(err => console.warn(err));
      }
    } else {
      showToast('Could not parse CSV file. Please check format.');
    }
  };

  // Reset defaults
  const handleResetDefaults = async () => {
    const defaults = resetGamesToDefault();
    setGames(defaults);
    saveGamesToStorage(defaults);
    showToast('Reset database to default games!');

    resetGamesInFirestore().catch(err => console.warn(err));
  };

  // Handle quick metric filter click
  const handleMetricSelect = (filterId: string) => {
    setMetricQuickFilter(filterId);
    if (filterId === 'all') {
      setSelectedStatus('all');
      setSelectedGrade('all');
    } else if (filterId === 'grade_S') {
      setSelectedGrade('S');
      setSelectedStatus('all');
    } else {
      setSelectedStatus(filterId);
      setSelectedGrade('all');
    }
  };

  // Filtered games calculation
  const filteredGames = games.filter(g => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchGenre = g.genre.toLowerCase().includes(q);
      const matchPlatform = g.platform.toLowerCase().includes(q);
      if (!matchTitle && !matchGenre && !matchPlatform) return false;
    }

    // Status filter (Completed filter also shows Mastered games)
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'Completed') {
        if (g.status !== 'Completed' && g.status !== 'Mastered') {
          return false;
        }
      } else if (g.status !== selectedStatus) {
        return false;
      }
    }

    // Platform filter
    if (selectedPlatform !== 'all' && g.platform !== selectedPlatform) {
      return false;
    }

    // Grade filter
    if (selectedGrade !== 'all' && g.grade !== selectedGrade) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden" style={{ backgroundColor: 'var(--theme-bg)' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 theme-surface-bg border text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-slide-down max-w-[calc(100vw-2rem)]" style={{ borderColor: 'var(--theme-border)' }}>
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Streamlit Top Header Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-2.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-300 w-full max-w-full ${
        sidebarOpen ? 'lg:pl-[336px]' : 'lg:pl-4'
      }`} style={{ backgroundColor: 'var(--theme-header-bg)', borderColor: 'var(--theme-border)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
                sidebarOpen
                  ? 'text-slate-100 shadow-inner'
                  : 'text-slate-300'
              }`}
              style={{
                backgroundColor: sidebarOpen ? 'var(--theme-accent-subtle)' : 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
                borderWidth: '1px'
              }}
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
              id="toggle-sidebar-button"
            >
              <Menu className="w-5 h-5 theme-accent-text" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">{sidebarOpen ? 'Sidebar' : 'Sidebar'}</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl theme-gradient-btn text-white shadow-lg shrink-0">
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="font-bold text-slate-100 text-sm sm:text-base leading-none tracking-tight truncate">
                    Game Log
                  </h1>
                  <div className="hidden xs:flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0" title="Real-time Firebase Cloud Storage Active">
                    <Cloud className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline">Firebase Cloud</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                  Games
                </p>
              </div>
            </div>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Web Search Trigger */}
            <button
              onClick={() => setWebSearchOpen(true)}
              className="hidden sm:flex py-1.5 px-3 theme-gradient-btn hover:opacity-90 text-white rounded-xl text-xs font-semibold items-center gap-1.5 shadow-md transition-all cursor-pointer"
              id="header-web-scrape-btn"
            >
              <Globe className="w-4 h-4" />
              <span>Web Scrape</span>
            </button>

            {/* View Modes Switcher */}
            <div className="p-1 rounded-xl border flex items-center gap-0.5 sm:gap-1" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
              <button
                onClick={() => setViewMode('catalog')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'catalog'
                    ? 'theme-accent-bg text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-catalog-btn"
                title="Catalog View"
              >
                <Library className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Catalog</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'theme-accent-bg text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-table-btn"
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'theme-accent-bg text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-cards-btn"
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </button>

              <button
                onClick={() => setViewMode('analytics')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'analytics'
                    ? 'theme-accent-bg text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-analytics-btn"
                title="Analytics View"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Stats</span>
              </button>
            </div>

            {/* Direct Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="hidden xl:flex py-1.5 px-3 hover:bg-slate-800 text-slate-300 border rounded-xl text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
              title="Download CSV Backup"
              id="header-export-csv-button"
            >
              <Download className="w-4 h-4 theme-accent-text" />
              <span>Export CSV</span>
            </button>

            {/* Lock App Vault Button */}
            <button
              onClick={handleLockApp}
              className="p-1.5 sm:py-1.5 sm:px-2.5 hover:opacity-90 text-slate-300 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
              title="Lock Application Vault"
              id="header-lock-app-btn"
            >
              <Lock className="w-3.5 h-3.5 theme-accent-text" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            {/* Theme Selector Dropdown */}
            <ThemeSelector
              currentTheme={theme}
              onSelectTheme={setTheme}
              variant="dropdown"
            />
          </div>

        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-x-hidden min-w-0 w-full max-w-full">
        
        {/* Streamlit Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onAddGame={handleAddGame}
          onExportCsv={handleExportCsv}
          onImportCsv={handleImportCsv}
          onResetDefaults={handleResetDefaults}
          totalGamesCount={games.length}
          onOpenWebSearchModal={() => setWebSearchOpen(true)}
          onLockApp={handleLockApp}
          currentTheme={theme}
          onSelectTheme={setTheme}
        />

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-300 overflow-y-auto overflow-x-hidden p-3 sm:p-6 custom-scrollbar min-w-0 w-full max-w-full ${
            sidebarOpen ? 'lg:pl-[340px]' : 'lg:pl-6'
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Streamlit st.metric Cards Row */}
            <MetricCards
              games={games}
              selectedFilter={metricQuickFilter}
              onSelectFilter={handleMetricSelect}
            />

            {/* Selected View Rendering */}
            {viewMode === 'catalog' && (
              <CatalogView
                games={filteredGames}
                onUpdateGame={handleUpdateGame}
                onDeleteGame={handleDeleteGame}
                onEditModalOpen={(game) => setEditingGame(game)}
                onViewModalOpen={(game) => setViewingGame(game)}
                onOpenWebSearchModal={() => setWebSearchOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                selectedGrade={selectedGrade}
                onGradeChange={setSelectedGrade}
              />
            )}

            {viewMode === 'table' && (
              <EditableTable
                games={filteredGames}
                onUpdateGame={handleUpdateGame}
                onDeleteGame={handleDeleteGame}
                onEditModalOpen={(game) => setEditingGame(game)}
                onViewModalOpen={(game) => setViewingGame(game)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                selectedGrade={selectedGrade}
                onGradeChange={setSelectedGrade}
              />
            )}

            {viewMode === 'cards' && (
              <CardGridView
                games={filteredGames}
                onUpdateGame={handleUpdateGame}
                onDeleteGame={handleDeleteGame}
                onEditModalOpen={(game) => setEditingGame(game)}
                onViewModalOpen={(game) => setViewingGame(game)}
              />
            )}

            {viewMode === 'analytics' && (
              <StatsView games={games} />
            )}

          </div>
        </main>
      </div>

      {/* Read-Only Game Info Overview Modal */}
      <ViewGameModal
        game={viewingGame}
        onClose={() => setViewingGame(null)}
        onEdit={(game) => {
          setViewingGame(null);
          setEditingGame(game);
        }}
        onDelete={(id) => {
          handleDeleteGame(id);
          setViewingGame(null);
        }}
        onUpdateGame={(id, fields) => {
          handleUpdateGame(id, fields);
          if (viewingGame && viewingGame.id === id) {
            setViewingGame({ ...viewingGame, ...fields });
          }
        }}
      />

      {/* Edit Game Modal */}
      <EditGameModal
        game={editingGame}
        onClose={() => setEditingGame(null)}
        onSave={(id, updated) => {
          handleUpdateGame(id, updated);
          showToast('Updated game entry!');
        }}
        onDelete={(id) => {
          handleDeleteGame(id);
          setEditingGame(null);
        }}
      />

      {/* Web Scrape & Search Modal */}
      <WebGameSearchModal
        isOpen={webSearchOpen}
        onClose={() => setWebSearchOpen(false)}
        onAddGame={(newGame) => {
          handleAddGame(newGame);
          showToast(`Added "${newGame.title}" with web cover art!`);
        }}
      />

      {/* Master Passcode Vault Lock Screen (Requires unlock once every 24hrs) */}
      {!isUnlocked && (
        <PasscodeLockModal
          onUnlock={handleUnlockApp}
          savedPasscode={savedPasscode}
          onUpdatePasscode={handleUpdatePasscode}
        />
      )}

    </div>
  );
}
