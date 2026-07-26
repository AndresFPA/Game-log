import React, { useState, useEffect } from 'react';
import { GameEntry, CompletionStatus, Grade, PLATFORM_OPTIONS, STATUS_OPTIONS, GRADE_OPTIONS, GENRE_OPTIONS } from '../types';
import { X, Save, Trash2, Calendar, Clock, Star, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';

interface EditGameModalProps {
  game: GameEntry | null;
  onClose: () => void;
  onSave: (id: string, updated: Partial<GameEntry>) => void;
  onDelete: (id: string) => void;
}

export const EditGameModal: React.FC<EditGameModalProps> = ({
  game,
  onClose,
  onSave,
  onDelete
}) => {
  if (!game) return null;

  const [title, setTitle] = useState(game.title);
  const [platform, setPlatform] = useState(game.platform);
  const [status, setStatus] = useState<CompletionStatus>(game.status);
  const [grade, setGrade] = useState<Grade>(game.grade);
  const [beatenDate, setBeatenDate] = useState(game.beatenDate || '');
  const [hoursPlayed, setHoursPlayed] = useState<number>(game.hoursPlayed || 0);
  const [genre, setGenre] = useState(game.genre);
  const [coverUrl, setCoverUrl] = useState(game.coverUrl || '');
  const [releaseYear, setReleaseYear] = useState(game.releaseYear || '');
  const [synopsis, setSynopsis] = useState(game.synopsis || '');
  const [favorite, setFavorite] = useState(game.favorite || false);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    if (game) {
      setTitle(game.title);
      setPlatform(game.platform);
      setStatus(game.status);
      setGrade(game.grade);
      setBeatenDate(game.beatenDate || '');
      setHoursPlayed(game.hoursPlayed || 0);
      setGenre(game.genre);
      setCoverUrl(game.coverUrl || '');
      setReleaseYear(game.releaseYear || '');
      setSynopsis(game.synopsis || '');
      setFavorite(game.favorite || false);
    }
  }, [game]);

  const handleAutoScrape = async () => {
    if (!title.trim()) return;
    setScraping(true);
    try {
      const res = await fetch('/api/search-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.games && data.games.length > 0) {
          const match = data.games[0];
          if (match.coverUrl) setCoverUrl(match.coverUrl);
          if (match.genre) setGenre(match.genre);
          if (match.releaseYear) setReleaseYear(match.releaseYear);
          if (match.summary) setSynopsis(match.summary);
        }
      }
    } catch (err) {
      console.error('Failed to auto scrape cover:', err);
    } finally {
      setScraping(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(game.id, {
      title: title.trim(),
      platform,
      status,
      grade,
      beatenDate,
      hoursPlayed,
      genre,
      coverUrl: coverUrl.trim() || undefined,
      releaseYear: releaseYear.trim() || undefined,
      synopsis: synopsis.trim() || undefined,
      favorite
    });
    onClose();
  };

  const getFallbackCover = (t: string) => {
    return `https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Star className={`w-5 h-5 ${favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <h3 className="font-bold text-slate-100 text-base">
              Edit Game Entry
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Cover Art Banner & URL Input */}
          <div className="flex gap-4 items-start bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
              <img
                src={coverUrl || getFallbackCover(title)}
                alt={title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getFallbackCover(title);
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Cover Art Image URL</span>
                <button
                  type="button"
                  onClick={handleAutoScrape}
                  disabled={scraping || !title.trim()}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {scraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Auto-Fetch Web Cover</span>
                </button>
              </label>

              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500">
                Paste direct URL or click Auto-Fetch to scrape official box art.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Game Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Release Date / Year
              </label>
              <input
                type="text"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {GENRE_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Synopsis / Overview
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Game story & description..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {PLATFORM_OPTIONS.concat(platform && !PLATFORM_OPTIONS.includes(platform) ? [platform] : []).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Completion Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CompletionStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Grade / Score
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as Grade)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{g} Grade</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Beaten Date
              </label>
              <input
                type="date"
                value={beatenDate}
                onChange={(e) => setBeatenDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours Played
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hoursPlayed}
                onChange={(e) => setHoursPlayed(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onDelete(game.id);
                onClose();
              }}
              className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-medium border border-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Entry</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
