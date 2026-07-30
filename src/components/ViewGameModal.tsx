import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade } from '../types';
import { X, Edit3, Trash2, Calendar, Clock, Star, Gamepad2, Award, BookOpen, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ViewGameModalProps {
  game: GameEntry | null;
  onClose: () => void;
  onEdit: (game: GameEntry) => void;
  onDelete: (id: string) => void;
  onUpdateGame: (id: string, updatedFields: Partial<GameEntry>) => void;
  isUnlocked?: boolean;
  onOpenUnlockModal?: () => void;
}

export const ViewGameModal: React.FC<ViewGameModalProps> = ({
  game,
  onClose,
  onEdit,
  onDelete,
  onUpdateGame,
  isUnlocked = false,
  onOpenUnlockModal
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!game) return null;

  const getFallbackCover = (title: string) => {
    return `https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop`;
  };

  const getGradeBadge = (grade: Grade) => {
    switch (grade) {
      case 'S':
        return 'bg-purple-950/90 text-purple-200 border-purple-500/80 shadow-md shadow-purple-500/30';
      case 'A':
        return 'bg-emerald-950/90 text-emerald-200 border-emerald-500/80';
      case 'B':
        return 'bg-blue-950/90 text-blue-200 border-blue-500/80';
      case 'C':
        return 'bg-amber-950/90 text-amber-200 border-amber-500/80';
      case 'D':
        return 'bg-orange-950/90 text-orange-200 border-orange-500/80';
      case 'F':
        return 'bg-rose-950/90 text-rose-200 border-rose-500/80';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getGradeTitle = (grade: Grade) => {
    switch (grade) {
      case 'S': return 'S Tier — Masterpiece';
      case 'A': return 'A Tier — Exceptional';
      case 'B': return 'B Tier — Great';
      case 'C': return 'C Tier — Good / Average';
      case 'D': return 'D Tier — Below Average';
      case 'F': return 'F Tier — Disappointing';
      default: return 'Unrated';
    }
  };

  const getStatusBadge = (status: CompletionStatus) => {
    switch (status) {
      case 'Completed':
      case 'Mastered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Wishlist':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Dropped':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-900/80 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto max-w-full">
      <div 
        className="border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in my-auto max-h-[92vh] flex flex-col"
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
      >
        {/* Header Bar */}
        <div 
          className="p-4 border-b flex items-center justify-between shrink-0" 
          style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-2 max-w-[80%]">
            <span className="p-1.5 rounded-lg border theme-accent-text" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
              <Gamepad2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              Game Overview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateGame(game.id, { favorite: !game.favorite })}
              className="p-1.5 rounded-lg border text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
              title={game.favorite ? 'Unmark Favorite' : 'Mark Favorite'}
            >
              <Star className={`w-4 h-4 ${game.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Top Banner Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            {/* Poster Frame */}
            <div className="sm:col-span-4 flex flex-col items-center">
              <div className="relative aspect-[3/4] w-full max-w-[200px] sm:max-w-none rounded-2xl overflow-hidden border shadow-2xl bg-black" style={{ borderColor: 'var(--theme-border)' }}>
                <img
                  src={game.coverUrl || getFallbackCover(game.title)}
                  alt={game.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackCover(game.title);
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shadow ${getStatusBadge(game.status)}`}>
                    {game.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-mono font-black shadow-md ${getGradeBadge(game.grade)}`}>
                    {game.grade}
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Metadata Details */}
            <div className="sm:col-span-8 space-y-3.5 flex flex-col justify-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold theme-accent-text uppercase tracking-wider px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                    {game.genre}
                  </span>
                  {game.releaseYear && (
                    <span className="text-xs font-mono text-slate-300 px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                      Year: {game.releaseYear}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">
                  {game.title}
                </h2>
              </div>

              {/* Key Metrics Chips */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-mono text-slate-400">Platform</p>
                    <p className="text-xs font-bold text-slate-200 truncate">{game.platform}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-mono text-slate-400">Playtime</p>
                    <p className="text-xs font-bold text-slate-200">{game.hoursPlayed} Hours</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                  <Award className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-mono text-slate-400">Rating Tier</p>
                    <p className="text-xs font-bold text-slate-200 truncate">{getGradeTitle(game.grade)}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-mono text-slate-400">Date Beaten</p>
                    <p className="text-xs font-bold text-slate-200 truncate">{game.beatenDate || 'Not recorded'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Synopsis Section */}
          <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              <BookOpen className="w-3.5 h-3.5 theme-accent-text" />
              <span>Synopsis & Description</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {game.synopsis || 'No synopsis recorded for this title.'}
            </p>
          </div>

          {/* Added Date Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Added to catalog: {new Date(game.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ID: {game.id}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div 
          className="p-4 border-t flex items-center justify-between gap-3 shrink-0"
          style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
        >
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full justify-between animate-fade-in">
              <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-4 h-4" /> Confirm delete?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 border rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(game.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  if (!isUnlocked) {
                    onOpenUnlockModal?.();
                  } else {
                    setShowDeleteConfirm(true);
                  }
                }}
                className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-slate-100 border rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (!isUnlocked) {
                      onOpenUnlockModal?.();
                    } else {
                      onClose();
                      onEdit(game);
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold theme-accent-bg hover:opacity-90 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Game</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
