import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade, SortField, SortOrder } from '../types';
import { Star, Clock, Calendar, Edit3, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface CardGridViewProps {
  games: GameEntry[];
  onUpdateGame: (id: string, updatedFields: Partial<GameEntry>) => void;
  onDeleteGame: (id: string) => void;
  onEditModalOpen: (game: GameEntry) => void;
}

export const CardGridView: React.FC<CardGridViewProps> = ({
  games,
  onUpdateGame,
  onDeleteGame,
  onEditModalOpen
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getFallbackCover = (title: string) => {
    return `https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop`;
  };

  const getGradeBadge = (grade: Grade) => {
    switch (grade) {
      case 'S':
        return 'bg-purple-950/90 text-purple-200 border-purple-600/80 shadow-md shadow-purple-500/20';
      case 'A':
        return 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80';
      case 'B':
        return 'bg-blue-950/90 text-blue-200 border-blue-600/80';
      case 'C':
        return 'bg-amber-950/90 text-amber-200 border-amber-600/80';
      case 'D':
        return 'bg-orange-950/90 text-orange-200 border-orange-600/80';
      case 'F':
        return 'bg-rose-950/90 text-rose-200 border-rose-600/80';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (status: CompletionStatus) => {
    switch (status) {
      case 'Completed':
      case 'Mastered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Wishlist':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Dropped':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800/80 text-slate-400 border-slate-700';
    }
  };

  const sortedGames = [...games].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (sortField === 'grade') {
      const order: Record<Grade, number> = { S: 7, A: 6, B: 5, C: 4, D: 3, F: 2, Unrated: 1 };
      aVal = order[a.grade] || 0;
      bVal = order[b.grade] || 0;
    } else if (sortField === 'createdAt' || sortField === 'beatenDate') {
      const aTime = aVal ? new Date(aVal).getTime() || 0 : 0;
      const bTime = bVal ? new Date(bVal).getTime() || 0 : 0;
      if (aTime < bTime) return sortOrder === 'asc' ? -1 : 1;
      if (aTime > bTime) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 font-medium">
          Displaying <span className="text-indigo-300 font-bold">{sortedGames.length}</span> games
        </span>

        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="cards-sort-field"
          >
            <option value="createdAt">Sort: Date Added</option>
            <option value="beatenDate">Sort: Date Completed</option>
            <option value="title">Sort: Title A-Z</option>
            <option value="grade">Sort: Grade Tier</option>
            <option value="status">Sort: Status</option>
            <option value="hoursPlayed">Sort: Hours Played</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={`Sort Order: ${sortOrder.toUpperCase()}`}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedGames.map(game => (
        <div
          key={game.id}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group transition-all"
        >
          {/* Card Top Image Banner */}
          <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
            <img
              src={game.coverUrl || getFallbackCover(game.title)}
              alt={game.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getFallbackCover(game.title);
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

            {/* Favorite & Grade Badges */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <button
                onClick={() => onUpdateGame(game.id, { favorite: !game.favorite })}
                className="p-1 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Star className={`w-3.5 h-3.5 ${game.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <span className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold ${getGradeBadge(game.grade)}`}>
                {game.grade}
              </span>
            </div>

            {/* Genre */}
            <div className="absolute bottom-2 left-3 z-10">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {game.genre}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h3
                onClick={() => onEditModalOpen(game)}
                className="font-bold text-slate-100 text-base leading-snug group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-2"
              >
                {game.title}
              </h3>

              {/* Status & Platform & Release Year Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${getStatusBadge(game.status)}`}>
                  {game.status}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                  {game.platform}
                </span>
                {game.releaseYear && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-300">
                    {game.releaseYear}
                  </span>
                )}
              </div>

              {game.synopsis && (
                <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {game.synopsis}
                </p>
              )}
            </div>

            {/* Footer Metadata & Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300 font-bold">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {game.hoursPlayed}h
                </span>
                {game.beatenDate && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {game.beatenDate}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditModalOpen(game)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Entry"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteGame(game.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};
