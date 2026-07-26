import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade, PLATFORM_OPTIONS, STATUS_OPTIONS, GRADE_OPTIONS, GENRE_OPTIONS } from '../types';
import { PlusCircle, Download, Upload, RefreshCw, X, Gamepad2, FileSpreadsheet, Sparkles, Loader2, Calendar, FileText, Image as ImageIcon, Lock, KeyRound } from 'lucide-react';

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
  onLockApp
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
      const res = await fetch('/api/search-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.games && data.games.length > 0) {
          setScrapedResults(data.games);
          // Auto-fill top match immediately
          applyScrapedMatch(data.games[0]);
        } else {
          setScrapeError('No game info found.');
        }
      } else {
        setScrapeError('Failed to fetch game details.');
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="sidebar-container"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
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

          {/* Section 1: Add Entry Form */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-indigo-400 font-semibold text-xs uppercase tracking-wider">
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
                    Game Title <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleInlineAutoFetch}
                    disabled={scraping || !title.trim()}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer font-medium"
                    id="btn-auto-fetch-info"
                  >
                    {scraping ? <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> : <Sparkles className="w-3 h-3 text-indigo-400" />}
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
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    id="input-game-title"
                  />
                </div>

                {/* Scraped Results Suggestions Chips */}
                {scrapedResults.length > 0 && (
                  <div className="mt-2 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg space-y-1.5 animate-fade-in">
                    <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Select Match to Auto-Fill:
                    </p>
                    <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                      {scrapedResults.map((match, idx) => (
                        <button
                          key={`match-${match.title}-${idx}`}
                          type="button"
                          onClick={() => applyScrapedMatch(match)}
                          className="w-full text-left p-1.5 rounded bg-slate-900/80 hover:bg-indigo-900/40 border border-slate-800 text-[11px] text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
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
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
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
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700/80 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700/80 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
                    id="input-synopsis"
                  />
                </div>
              </div>

              {/* Cover Image URL & Thumbnail Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cover Art URL</span>
                  </label>
                </div>
                <div className="flex gap-2 items-center">
                  {coverUrl && (
                    <img
                      src={coverUrl}
                      alt="Preview"
                      className="w-8 h-10 object-cover rounded bg-slate-900 border border-slate-700 shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://... (Poster URL)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100"
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
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
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
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="checkbox-favorite" className="text-xs text-slate-300 cursor-pointer select-none">
                  Mark as Favorite ★
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                id="submit-add-game-button"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Game Entry</span>
              </button>
            </form>
          </div>

          {/* Section 2: Local CSV File Synchronization */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Local File Sync</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your backlog auto-saves in browser memory. Export or import standard <code className="text-indigo-300 font-mono bg-slate-900 px-1 py-0.5 rounded">.csv</code> files anytime.
            </p>

            <div className="space-y-2">
              <button
                onClick={onExportCsv}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                id="export-csv-button"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  Export to CSV
                </span>
                <span className="text-[10px] font-mono text-slate-400">.csv</span>
              </button>

              <label className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-between transition-colors cursor-pointer">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
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
            <div className="pt-2 border-t border-slate-800">
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
                <div className="p-2 bg-rose-950/40 border border-rose-800/60 rounded-lg text-center space-y-2">
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
                      className="flex-1 py-1 bg-slate-800 text-slate-300 text-xs rounded hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Vault Security */}
          {onLockApp && (
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-indigo-400 font-semibold text-xs uppercase tracking-wider">
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
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-medium border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                id="btn-sidebar-lock-now"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
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

