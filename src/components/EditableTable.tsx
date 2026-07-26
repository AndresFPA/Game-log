import React, { useState } from 'react';
import { GameEntry, CompletionStatus, Grade, SortField, SortOrder, STATUS_OPTIONS, GRADE_OPTIONS } from '../types';
import { Star, Edit3, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Clock, Calendar, Gamepad2 } from 'lucide-react';

interface EditableTableProps {
  games: GameEntry[];
  onUpdateGame: (id: string, updatedFields: Partial<GameEntry>) => void;
  onDeleteGame: (id: string) => void;
  onEditModalOpen: (game: GameEntry) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedPlatform: string;
  onPlatformChange: (p: string) => void;
  selectedGrade: string;
  onGradeChange: (g: string) => void;
}

export const EditableTable: React.FC<EditableTableProps> = ({
  games,
  onUpdateGame,
  onDeleteGame,
  onEditModalOpen,
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

  const getFallbackCover = (title: string) => {
    return `https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop`;
  };

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
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

  // Grade badge styling
  const getGradeBadge = (grade: Grade) => {
    switch (grade) {
      case 'S':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60 shadow-xs shadow-purple-500/20 font-bold';
      case 'A':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-semibold';
      case 'B':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'C':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'D':
        return 'bg-orange-950/80 text-orange-300 border-orange-700/60';
      case 'F':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Status badge styling
  const getStatusBadge = (status: CompletionStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Mastered':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30';
      case 'In Progress':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Not Started':
        return 'bg-slate-800/90 text-slate-300 border-slate-700';
      case 'Wishlist':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Dropped':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  return (
    <div className="border rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      
      {/* Search & Filter Header Toolbar */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="🔍 Search game title, genre, or platform..."
              className="w-full pl-3 pr-8 py-2 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
              id="table-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-1.5 border rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
            id="filter-status-select"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Grade Select */}
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="px-3 py-1.5 border rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
            id="filter-grade-select"
          >
            <option value="all">All Grades</option>
            {GRADE_OPTIONS.map(g => (
              <option key={g} value={g}>{g} Grade</option>
            ))}
          </select>

          {/* Platform Select */}
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="px-3 py-1.5 border rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
            id="filter-platform-select"
          >
            <option value="all">All Platforms</option>
            {Array.from(new Set(games.map(g => g.platform))).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {(selectedStatus !== 'all' || selectedGrade !== 'all' || selectedPlatform !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                onStatusChange('all');
                onGradeChange('all');
                onPlatformChange('all');
                onSearchChange('');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto custom-scrollbar min-w-0 max-w-full">
        {sortedGames.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Gamepad2 className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm font-medium text-slate-400">No games matched your current filters.</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or adding a new game entry in the sidebar.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" id="backlog-editable-table">
            <thead>
              <tr className="border-b text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none" style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}>
                <th className="py-3 px-3 text-center w-10">★</th>
                <th className="py-3 px-2 w-14 text-center">Cover</th>
                
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200 group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Title & Genre</span>
                    {renderSortIcon('title')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('platform')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200 group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Platform</span>
                    {renderSortIcon('platform')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-200 group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status (Editable)</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('grade')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Grade</span>
                    {renderSortIcon('grade')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('beatenDate')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Beaten Date</span>
                    {renderSortIcon('beatenDate')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('hoursPlayed')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 group text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Hours</span>
                    {renderSortIcon('hoursPlayed')}
                  </div>
                </th>

                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedGames.map((game) => (
                <tr
                  key={game.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Favorite Toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onUpdateGame(game.id, { favorite: !game.favorite })}
                      className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                      title={game.favorite ? 'Unmark Favorite' : 'Mark Favorite'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          game.favorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </td>

                  {/* Cover Thumbnail */}
                  <td className="py-2 px-2 text-center">
                    <div className="w-10 h-13 mx-auto rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-sm shrink-0">
                      <img
                        src={game.coverUrl || getFallbackCover(game.title)}
                        alt={game.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackCover(game.title);
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>

                  {/* Title & Genre & Synopsis */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => onEditModalOpen(game)}
                        className="hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        {game.title}
                      </span>
                      {game.releaseYear && (
                        <span
                          className="text-[10px] text-slate-300 font-mono px-1.5 py-0.2 rounded border"
                          style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                        >
                          {game.releaseYear}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] theme-accent-text mt-0.5 font-medium opacity-90">
                      {game.genre}
                    </div>
                    {game.synopsis && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-md">
                        {game.synopsis}
                      </p>
                    )}
                  </td>

                  {/* Platform */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-slate-300 font-mono text-[11px] border"
                      style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}
                    >
                      {game.platform}
                    </span>
                  </td>

                  {/* Status (Editable Select) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <select
                      value={game.status}
                      onChange={(e) =>
                        onUpdateGame(game.id, { status: e.target.value as CompletionStatus })
                      }
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${getStatusBadge(
                        game.status
                      )}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-slate-900 text-slate-200">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Grade (Editable Select) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      value={game.grade}
                      onChange={(e) =>
                        onUpdateGame(game.id, { grade: e.target.value as Grade })
                      }
                      className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold focus:outline-none cursor-pointer ${getGradeBadge(
                        game.grade
                      )}`}
                    >
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g} className="bg-slate-900 text-slate-200 font-mono">
                          {g}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Beaten Date (Editable Date picker) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={game.beatenDate || ''}
                      onChange={(e) =>
                        onUpdateGame(game.id, { beatenDate: e.target.value })
                      }
                      className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 focus:bg-slate-900 px-1.5 py-0.5 rounded text-xs text-slate-300 font-mono focus:outline-none cursor-pointer"
                    />
                  </td>

                  {/* Hours Played (Editable Number) */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={game.hoursPlayed}
                      onChange={(e) =>
                        onUpdateGame(game.id, {
                          hoursPlayed: Math.max(0, parseFloat(e.target.value) || 0)
                        })
                      }
                      className="w-16 text-right bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 focus:bg-slate-900 px-1 py-0.5 rounded text-xs text-slate-200 font-mono focus:outline-none"
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditModalOpen(game)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Full Entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {deletingId === game.id ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                          <button
                            onClick={() => {
                              onDeleteGame(game.id);
                              setDeletingId(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded font-bold hover:bg-rose-500 cursor-pointer"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(game.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div
        className="p-3 border-t flex items-center justify-between text-xs text-slate-400 font-mono"
        style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
      >
        <div>
          Showing <span className="text-slate-200 font-bold">{sortedGames.length}</span> of {games.length} games
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block">
          💡 Click any game title to edit or view full metadata
        </div>
      </div>
    </div>
  );
};
