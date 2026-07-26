import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade } from '../types';
import { Search, Globe, Sparkles, X, PlusCircle, Check, Loader2, Star } from 'lucide-react';

interface ScrapedGameResult {
  title: string;
  platform: string;
  genre: string;
  releaseYear?: string;
  summary?: string;
  coverUrl?: string;
  suggestedGrade?: string;
  ratingScore?: number;
}

interface WebGameSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: Omit<GameEntry, 'id' | 'createdAt'>) => void;
}

export const WebGameSearchModal: React.FC<WebGameSearchModalProps> = ({
  isOpen,
  onClose,
  onAddGame
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapedGameResult[]>([]);
  const [addedTitles, setAddedTitles] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/search-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.games && Array.isArray(data.games)) {
        setResults(data.games);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Error fetching web game data:', err);
      setErrorMessage(err.message || 'Failed to search web data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportScrapedGame = (scraped: ScrapedGameResult) => {
    const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F', 'Unrated'];
    const grade: Grade = scraped.suggestedGrade && validGrades.includes(scraped.suggestedGrade.toUpperCase() as Grade)
      ? (scraped.suggestedGrade.toUpperCase() as Grade)
      : 'A';

    onAddGame({
      title: scraped.title,
      platform: scraped.platform || 'PC / Steam',
      status: 'In Progress',
      grade: grade,
      beatenDate: '',
      hoursPlayed: 0,
      genre: scraped.genre || 'Action RPG',
      coverUrl: scraped.coverUrl || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop',
      favorite: true
    });

    setAddedTitles(prev => ({ ...prev, [scraped.title]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden max-w-full">
      <div
        className="border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]"
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
      >
        
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl theme-accent-bg/20 theme-accent-text border border-indigo-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                Web Scraper Game Search & Auto-Fill
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Search live web metadata & game covers automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input Form */}
        <div
          className="p-4 border-b"
          style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type any game title (e.g., Grand Theft Auto VI, Elden Ring, Zelda)..."
                className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                id="web-search-query-input"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="py-2.5 px-5 theme-accent-bg hover:opacity-90 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
              id="web-search-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Scraping Web...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Scrape Info</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading && (
            <div className="py-12 text-center text-slate-400 space-y-3 animate-pulse">
              <Loader2 className="w-10 h-10 mx-auto text-indigo-400 animate-spin" />
              <p className="text-sm font-medium">Scraping web sources for game cover art, platform, & details...</p>
              <p className="text-xs text-slate-500">Querying live game databases & Google search metadata...</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              ⚠️ {errorMessage}
            </div>
          )}

          {!loading && results.length === 0 && !errorMessage && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Globe className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium text-slate-400">Search for any game to scrape its cover & details</p>
              <p className="text-xs text-slate-500">Try searching "Black Myth Wukong", "Elden Ring", or "Hollow Knight"</p>
            </div>
          )}

          {!loading && results.map((game, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-lg transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Cover Art Preview */}
                <div className="w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                  <img
                    src={game.coverUrl}
                    alt={game.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info Text */}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 text-[10px] font-mono font-bold">
                      {game.genre}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono">
                      {game.platform}
                    </span>
                    {game.releaseYear && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {game.releaseYear}
                      </span>
                    )}
                    {game.ratingScore && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-mono font-bold">
                        Score: {game.ratingScore}/100
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-100 text-base leading-tight">
                    {game.title}
                  </h4>

                  {game.summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-snug">
                      {game.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleImportScrapedGame(game)}
                disabled={addedTitles[game.title]}
                className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  addedTitles[game.title]
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {addedTitles[game.title] ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Catalog</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Add to Catalog</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-right text-xs text-slate-500 font-mono">
          Powered by Gemini Web Grounding API & Scraper
        </div>

      </div>
    </div>
  );
};
