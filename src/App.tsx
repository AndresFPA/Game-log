/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameEntry } from './types';
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
  
  // Security & Passcode State (Starts locked every time app opens or reloads)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [savedPasscode, setSavedPasscode] = useState<string>(() => {
    return localStorage.getItem('master_passcode') || '1234';
  });

  const handleUpdatePasscode = (newPasscode: string) => {
    setSavedPasscode(newPasscode);
    localStorage.setItem('master_passcode', newPasscode);
    savePasscodeToFirestore(newPasscode).catch((err) => console.error(err));
    showToast('Updated Master Passcode across devices!');
  };

  const handleLockApp = () => {
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

  // Edit Modal & Web Search Modal State
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
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
    // Subscribe to cloud passcode immediately for instant cross-device sync
    const unsubPasscode = subscribeToPasscode((cloudPasscode) => {
      setSavedPasscode(cloudPasscode);
      localStorage.setItem('master_passcode', cloudPasscode);
    });

    let unsubGames: (() => void) | null = null;

    ensureAuth()
      .then(() => {
        setIsCloudLoading(true);
        unsubGames = subscribeToGames((cloudGames) => {
          setGames(cloudGames);
          saveGamesToStorage(cloudGames);
          setIsCloudLoading(false);
        });
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
    try {
      await saveGameToFirestore(newEntry);
      showToast(`Saved "${newEntry.title}" to Cloud!`);
    } catch (err) {
      console.error(err);
      const updated = [newEntry, ...games];
      setGames(updated);
      saveGamesToStorage(updated);
      showToast(`Added "${newEntry.title}" locally.`);
    }
  };

  // Update game entry
  const handleUpdateGame = async (id: string, updatedFields: Partial<GameEntry>) => {
    const existing = games.find(g => g.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updatedFields };
    try {
      await saveGameToFirestore(updated);
    } catch (err) {
      console.error(err);
      const updatedList = games.map(g => (g.id === id ? updated : g));
      setGames(updatedList);
      saveGamesToStorage(updatedList);
    }
  };

  // Delete game entry
  const handleDeleteGame = async (id: string) => {
    const game = games.find(g => g.id === id);
    try {
      await deleteGameFromFirestore(id);
      showToast(`Removed "${game?.title || 'Game'}" from Cloud catalog.`);
    } catch (err) {
      console.error(err);
      const updated = games.filter(g => g.id !== id);
      setGames(updated);
      saveGamesToStorage(updated);
      showToast(`Removed "${game?.title || 'Game'}" locally.`);
    }
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
      for (const game of parsed) {
        await saveGameToFirestore(game).catch(err => console.error(err));
      }
      showToast(`Successfully imported ${parsed.length} games to Firebase Cloud!`);
    } else {
      showToast('Could not parse CSV file. Please check format.');
    }
  };

  // Reset defaults
  const handleResetDefaults = async () => {
    try {
      await resetGamesInFirestore();
      showToast('Reset Cloud Firestore database to sample games!');
    } catch (err) {
      console.error(err);
      const defaults = resetGamesToDefault();
      setGames(defaults);
      saveGamesToStorage(defaults);
      showToast('Reset local database.');
    }
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

    // Status filter
    if (selectedStatus !== 'all' && g.status !== selectedStatus) {
      return false;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-indigo-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-slide-down">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Streamlit Top Header Bar */}
      <header className={`sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-[336px]' : 'lg:pl-4'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                sidebarOpen
                  ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/50 shadow-inner'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
              id="toggle-sidebar-button"
            >
              <Menu className="w-5 h-5 text-indigo-400" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">{sidebarOpen ? 'Sidebar' : 'Sidebar'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-100 text-base leading-none tracking-tight">
                    Game Log
                  </h1>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full" title="Real-time Firebase Cloud Storage Active">
                    <Cloud className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline">Firebase Cloud</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Games
                </p>
              </div>
            </div>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex items-center gap-2">
            
            {/* Web Search Trigger */}
            <button
              onClick={() => setWebSearchOpen(true)}
              className="hidden sm:flex py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              id="header-web-scrape-btn"
            >
              <Globe className="w-4 h-4" />
              <span>Web Scrape</span>
            </button>

            {/* View Modes Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setViewMode('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'catalog'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-catalog-btn"
              >
                <Library className="w-3.5 h-3.5" />
                <span>Catalog</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-table-btn"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-cards-btn"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </button>

              <button
                onClick={() => setViewMode('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="view-mode-analytics-btn"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Stats</span>
              </button>
            </div>

            {/* Direct Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="hidden xl:flex py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
              title="Download CSV Backup"
              id="header-export-csv-button"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            {/* Lock App Vault Button */}
            <button
              onClick={handleLockApp}
              className="py-1.5 px-2.5 bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Lock Application Vault"
              id="header-lock-app-btn"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
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
        />

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-300 overflow-y-auto p-4 sm:p-6 custom-scrollbar ${
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
              />
            )}

            {viewMode === 'analytics' && (
              <StatsView games={games} />
            )}

          </div>
        </main>
      </div>

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

      {/* Master Passcode Vault Lock Screen (Prompts every time app opens / reloads) */}
      {!isUnlocked && (
        <PasscodeLockModal
          onUnlock={() => {
            setIsUnlocked(true);
            showToast('Vault unlocked. Welcome back!');
          }}
          savedPasscode={savedPasscode}
          onUpdatePasscode={handleUpdatePasscode}
        />
      )}

    </div>
  );
}
