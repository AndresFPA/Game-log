import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade, AppTheme, PLATFORM_OPTIONS, STATUS_OPTIONS, GRADE_OPTIONS, GENRE_OPTIONS } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { PlusCircle, Download, Upload, RefreshCw, X, Gamepad2, FileSpreadsheet, Sparkles, Loader2, Calendar, FileText, Image as ImageIcon, Lock, KeyRound, Palette } from 'lucide-react';
import { searchGames } from '../utils/gameSearch';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: Omit<GameEntry, 'id' | 'createdAt'>) => void;
  onExportCsv: () => void;
  onImportCsv: (csvText: string) => void;
  onResetDefaults: () => void;
  totalGamesCount: number;
  onOpenWebSearchModal?: () => void;
  onLockApp?: () => void;
  currentTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  isUnlocked?: boolean;
  onOpenUnlockModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onAddGame,
  onExportCsv,
  onImportCsv,
  onResetDefaults,
  totalGamesCount,
  onOpenWebSearchModal,
  onLockApp,
  currentTheme = 'crimson',
  onSelectTheme,
  isUnlocked = false,
  onOpenUnlockModal
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState(PLATFORM_OPTIONS[0]);
  const [customPlatform, setCustomPlatform] = useState('');
  const [status, setStatus] = useState<CompletionStatus>('In Progress');
  const [grade, setGrade] = useState<Grade>('A');
  const [beatenDate, setBeatenDate] = useState('');
  const [hoursPlayed, setHoursPlayed] = useState<number | ''>(0);
  const [genre, setGenre] = useState(GENRE_OPTIONS[0]);
  const [coverUrl, setCoverUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [favorite, setFavorite] = useState(false);

  // Web Scraping / Auto-Fill State
  const [scraping, setScraping] = useState(false);
  const [scrapedResults, setScrapedResults] = useState<any[]>([]);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const [formSuccess, setFormSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle direct inline web-scraping
  const handleInlineAutoFetch = async () => {
    if (!title.trim()) return;
    setScraping(true);
    setScrapeError(null);
    setScrapedResults([]);

    try {
      const games = await searchGames(title.trim());
      if (games && games.length > 0) {
        setScrapedResults(games);
        applyScrapedMatch(games[0]);
      } else {
        setScrapeError('No game info found.');
      }
    } catch (err) {
      console.error('Error fetching web game data:', err);
      setScrapeError('Web scraping connection error.');
    } finally {
      setScraping(false);
    }
  };

  const applyScrapedMatch = (match: any) => {
    if (match.title) setTitle(match.title);
    if (match.coverUrl) setCoverUrl(match.coverUrl);
    if (match.releaseYear) setReleaseYear(match.releaseYear);
    if (match.summary) setSynopsis(match.summary);
    if (match.suggestedGrade && GRADE_OPTIONS.includes(match.suggestedGrade as Grade)) {
      setGrade(match.suggestedGrade as Grade);
    }
    if (match.genre) {
      const foundGenre = GENRE_OPTIONS.find(g => g.toLowerCase() === match.genre.toLowerCase()) || match.genre;
      if (GENRE_OPTIONS.includes(foundGenre)) {
        setGenre(foundGenre);
      }
    }
    if (match.platform) {
      const foundPlat = PLATFORM_OPTIONS.find(p => p.toLowerCase().includes(match.platform.toLowerCase())) || match.platform;
      if (PLATFORM_OPTIONS.includes(foundPlat)) {
        setPlatform(foundPlat);
      } else {
        setPlatform('Other');
        setCustomPlatform(match.platform);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      onOpenUnlockModal?.();
      return;
    }
    if (!title.trim()) return;

    const finalPlatform = platform === 'Other' && customPlatform.trim() ? customPlatform.trim() : platform;

    onAddGame({
      title: title.trim(),
      platform: finalPlatform,
      status,
      grade,
      beatenDate,
      hoursPlayed: typeof hoursPlayed === 'number' ? hoursPlayed : 0,
      genre,
      coverUrl: coverUrl.trim() || undefined,
      releaseYear: releaseYear.trim() || undefined,
      synopsis: synopsis.trim() || undefined,
      favorite
    });

    // Reset form
    setTitle('');
    setCustomPlatform('');
    setCoverUrl('');
    setReleaseYear('');
    setSynopsis('');
    setBeatenDate('');
    setHoursPlayed(0);
    setFavorite(false);
    setScrapedResults([]);

    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isUnlocked) {
      onOpenUnlockModal?.();
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportCsv(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] border-r flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
        id="sidebar-container"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg text-white theme-gradient-btn">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-1.5">
                Streamlit Sidebar
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Catalog & Backlog Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            title="Hide Sidebar"
            id="close-sidebar-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form & Controls Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

          {/* Read-Only Mode Banner */}
          {!isUnlocked && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Read-Only Mode Active</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                You are viewing the catalog in read-only mode. Enter your master passcode to unlock full write, grade, and catalog editing rights.
              </p>
              {onOpenUnlockModal && (
                <button
                  type="button"
                  onClick={onOpenUnlockModal}
                  className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Unlock Write / Edit Mode</span>
                </button>
              )}
            </div>
          )}

          {/* Section 1: Add Entry Form */}
          <div className="p-4 rounded-xl border shadow-sm space-y-3" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center justify-between theme-accent-text font-semibold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Add Game</span>
              </div>
            </div>

            {formSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Game saved with full info!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Game Title with Web Scraping Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Game Title <span className="theme-accent-text">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleInlineAutoFetch}
                    disabled={scraping || !title.trim()}
                    className="text-[11px] theme-accent-text hover:opacity-80 disabled:opacity-40 flex items-center gap-1 cursor-pointer font-medium"
                    id="btn-auto-fetch-info"
                  >
                    {scraping ? <Loader2 className="w-3 h-3 animate-spin theme-accent-text" /> : <Sparkles className="w-3 h-3 theme-accent-text" />}
                    <span>Auto-Fetch Info</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Type title (e.g. Elden Ring, Hades)..."
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="input-game-title"
                  />
                </div>

                {/* Scraped Results Suggestions Chips */}
                {scrapedResults.length > 0 && (
                  <div className="mt-2 p-2 border rounded-lg space-y-1.5 animate-fade-in" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 theme-accent-text">
                      <Sparkles className="w-3 h-3 theme-accent-text" /> Select Match to Auto-Fill:
                    </p>
                    <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                      {scrapedResults.map((match, idx) => (
                        <button
                          key={`match-${match.title}-${idx}`}
                          type="button"
                          onClick={() => applyScrapedMatch(match)}
                          className="w-full text-left p-1.5 rounded hover:bg-slate-800 border text-[11px] text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                          style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                        >
                          <span className="font-medium truncate max-w-[170px]">{match.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({match.releaseYear || 'N/A'})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {scrapeError && (
                  <p className="text-[10px] text-rose-400 mt-1">{scrapeError}</p>
                )}
              </div>

              {/* General Info: Release Year & Synopsis */}
              <div className="p-2.5 border rounded-lg space-y-2" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 theme-accent-text" />
                  <span>General Game Info</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Release Date / Year
                  </label>
                  <input
                    type="text"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    placeholder="e.g. 2024, Oct 2023"
                    className="w-full px-2.5 py-1 border rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    id="input-release-year"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    Synopsis / Summary
                  </label>
                  <textarea
                    rows={2}
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="Brief story / gameplay overview..."
                    className="w-full px-2.5 py-1 border rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none custom-scrollbar resize-none"
                    style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                    id="input-synopsis"
                  />
                </div>
              </div>

              {/* Cover Image URL & Thumbnail Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 theme-accent-text" />
                    <span>Cover Art URL</span>
                  </label>
                </div>
                <div className="flex gap-2 items-center">
                  {coverUrl && (
                    <img
                      src={coverUrl}
                      alt="Preview"
                      className="w-8 h-10 object-cover rounded border shrink-0"
                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://... (Poster URL)"
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="input-cover-url"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs text-slate-100 focus:outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="select-platform"
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs text-slate-100 focus:outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="select-genre"
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {platform === 'Other' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custom Platform Name
                  </label>
                  <input
                    type="text"
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    placeholder="e.g., PS Vita, Arcade"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs text-slate-100"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CompletionStatus)}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs text-slate-100 focus:outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="select-status"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Grade / Rating
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as Grade)}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold text-slate-100 focus:outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="select-grade"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g === 'S' ? 'S Tier' : g === 'A' ? 'A Tier' : g === 'B' ? 'B Tier' : g === 'C' ? 'C Tier' : g === 'D' ? 'D Tier' : g === 'F' ? 'F Tier' : 'Unrated'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Beaten Date
                  </label>
                  <input
                    type="date"
                    value={beatenDate}
                    onChange={(e) => setBeatenDate(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs text-slate-100 focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="input-beaten-date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hours Played
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hoursPlayed}
                    onChange={(e) => setHoursPlayed(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs text-slate-100 font-mono focus:outline-none"
                    style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    id="input-hours-played"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-favorite"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="rounded border text-emerald-400 w-4 h-4 cursor-pointer accent-[var(--theme-accent)]"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
                <label htmlFor="checkbox-favorite" className="text-xs text-slate-300 cursor-pointer select-none">
                  Mark as Favorite ★
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 px-4 theme-gradient-btn hover:opacity-90 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                id="submit-add-game-button"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Game Entry</span>
              </button>
            </form>
          </div>

          {/* Section 2: Local CSV File Synchronization */}
          <div className="p-4 rounded-xl border shadow-sm space-y-3" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center gap-2 theme-accent-text font-semibold text-xs uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Local File Sync</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your backlog auto-saves in browser memory. Export or import standard <code className="font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>.csv</code> files anytime.
            </p>

            <div className="space-y-2">
              <button
                onClick={onExportCsv}
                className="w-full py-2 px-3 hover:bg-slate-800 text-slate-100 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                id="export-csv-button"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 theme-accent-text" />
                  Export to CSV
                </span>
                <span className="text-[10px] font-mono text-slate-400">.csv</span>
              </button>

              <label className="w-full py-2 px-3 hover:bg-slate-800 text-slate-100 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors cursor-pointer" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 theme-accent-text" />
                  Import CSV File
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-csv-file-input"
                />
                <span className="text-[10px] font-mono text-slate-400">Upload</span>
              </label>
            </div>

            {/* Reset to defaults button */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  id="reset-sample-data-trigger"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Sample Dataset</span>
                </button>
              ) : (
                <div className="p-2 border rounded-lg text-center space-y-2" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
                  <p className="text-[11px] text-rose-300">
                    Replace current table with sample games?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onResetDefaults();
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded font-medium cursor-pointer"
                      id="confirm-reset-button"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-1 text-slate-300 text-xs rounded hover:bg-slate-800 cursor-pointer"
                      style={{ backgroundColor: 'var(--theme-surface)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Visual Theme Selection */}
          {onSelectTheme && (
            <ThemeSelector
              currentTheme={currentTheme}
              onSelectTheme={onSelectTheme}
              variant="sidebar"
            />
          )}

          {/* Section 4: Vault Security */}
          {onLockApp && (
            <div className="p-3.5 rounded-xl border shadow-sm space-y-2" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between theme-accent-text font-semibold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Vault Security</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Protected</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Requires passcode every time app opens.
              </p>
              <button
                onClick={onLockApp}
                className="w-full py-1.5 px-3 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                id="btn-sidebar-lock-now"
              >
                <Lock className="w-3.5 h-3.5 theme-accent-text" />
                <span>Lock Vault Now</span>
              </button>
            </div>
          )}

          {/* Section 4: System Specs Info */}
          <div className="p-3 rounded-lg border border-slate-800/60 bg-slate-950/30 text-xs text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Catalog Total:</span>
              <span className="text-slate-300 font-bold">{totalGamesCount} entries</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Driver:</span>
              <span className="text-emerald-400">CSV LocalStorage</span>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};

