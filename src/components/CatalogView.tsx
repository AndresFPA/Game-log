import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade, SortField, SortOrder, STATUS_OPTIONS, GRADE_OPTIONS } from '../types';
import {
  Star,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  Gamepad2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Search,
  Globe
} from 'lucide-react';

interface CatalogViewProps {
  games: GameEntry[];
  onUpdateGame: (id: string, updatedFields: Partial<GameEntry>) => void;
  onDeleteGame: (id: string) => void;
  onEditModalOpen: (game: GameEntry) => void;
  onOpenWebSearchModal?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedPlatform: string;
  onPlatformChange: (p: string) => void;
  selectedGrade: string;
  onGradeChange: (g: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  games,
  onUpdateGame,
  onDeleteGame,
  onEditModalOpen,
  onOpenWebSearchModal,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPlatform,
  onPlatformChange,
  selectedGrade,
  onGradeChange
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fallback image helper
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

  const getStatusBadge = (status: CompletionStatus) => {
    switch (status) {
      case 'Completed':
      case 'Mastered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-md';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 backdrop-blur-md';
      case 'Wishlist':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 backdrop-blur-md';
      case 'Dropped':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 backdrop-blur-md';
      default:
        return 'bg-slate-900/80 text-slate-300 border-slate-700 backdrop-blur-md';
    }
  };

  // Sorting
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
    <div className="space-y-4">
      {/* Search & Filter Header Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="🔍 Search catalog titles, genre, or platform..."
              className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              id="catalog-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Selects & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="catalog-filter-status"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="catalog-filter-grade"
          >
            <option value="all">All Grades</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g} Grade
              </option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="catalog-filter-platform"
          >
            <option value="all">All Platforms</option>
            {Array.from(new Set(games.map((g) => g.platform))).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="catalog-sort-field"
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
            className="p-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={`Sort Order: ${sortOrder.toUpperCase()}`}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          {/* Web Scrape Game Lookup Trigger */}
          {onOpenWebSearchModal && (
            <button
              onClick={onOpenWebSearchModal}
              className="py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              id="catalog-web-scrape-btn"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Search & Scrape</span>
            </button>
          )}

        </div>
      </div>

      {/* Catalog Grid View */}
      {sortedGames.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-4 shadow-xl">
          <Gamepad2 className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
          <p className="text-sm font-medium text-slate-400">No game covers match your active filter.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                onStatusChange('all');
                onGradeChange('all');
                onPlatformChange('all');
                onSearchChange('');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Clear Catalog Filters
            </button>
            {onOpenWebSearchModal && (
              <button
                onClick={onOpenWebSearchModal}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
              >
                Scrape Game Info from Web
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
          {sortedGames.map((game) => (
            <div
              key={game.id}
              className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
              id={`catalog-card-${game.id}`}
            >
              {/* Cover Art Box (3:4 Poster Aspect Ratio) */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                <img
                  src={game.coverUrl || getFallbackCover(game.title)}
                  alt={game.title}
                  onError={(e) => {
                    // Fallback on broken image link
                    (e.target as HTMLImageElement).src = getFallbackCover(game.title);
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Gradient Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Top Left: Completion Status Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono tracking-wider shadow-sm ${getStatusBadge(
                      game.status
                    )}`}
                  >
                    {game.status}
                  </span>
                </div>

                {/* Top Right: Grade Tier Badge & Favorite Star */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateGame(game.id, { favorite: !game.favorite });
                    }}
                    className="p-1 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors backdrop-blur-md cursor-pointer"
                    title={game.favorite ? 'Unmark Favorite' : 'Mark Favorite'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        game.favorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  <span
                    className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-black shadow-md ${getGradeBadge(
                      game.grade
                    )}`}
                  >
                    {game.grade}
                  </span>
                </div>

                {/* Bottom Overlay Info on Poster */}
                <div className="absolute bottom-2 left-2.5 right-2.5 z-10 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-indigo-300/90">
                    <span className="truncate">{game.genre}</span>
                    {game.releaseYear && (
                      <span className="text-slate-300 font-semibold shrink-0 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700/80">
                        {game.releaseYear}
                      </span>
                    )}
                  </div>
                  <h3
                    onClick={() => onEditModalOpen(game)}
                    className="font-bold text-slate-100 text-xs sm:text-sm leading-tight line-clamp-2 hover:text-indigo-300 transition-colors cursor-pointer"
                    title={game.title}
                  >
                    {game.title}
                  </h3>
                  {game.synopsis && (
                    <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight font-sans opacity-85">
                      {game.synopsis}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[100px] text-slate-400 text-[10px] font-semibold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {game.platform}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {game.hoursPlayed}h
                  </span>

                  <button
                    onClick={() => onEditModalOpen(game)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Edit Entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Counter */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          Catalog displaying <span className="text-slate-100 font-bold">{sortedGames.length}</span> cover art cards
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block">
          🖼 Visual Catalog View enabled • Click any cover to view details
        </div>
      </div>
    </div>
  );
};
