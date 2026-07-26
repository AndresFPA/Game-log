import React from 'react';
import { GameEntry, Grade, CompletionStatus } from '../types';
import { Trophy, Clock, Gamepad2, CheckCircle, BarChart3, PieChart, Sparkles } from 'lucide-react';

interface StatsViewProps {
  games: GameEntry[];
}

export const StatsView: React.FC<StatsViewProps> = ({ games }) => {
  const total = games.length;
  if (total === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
        <BarChart3 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-sm font-medium">No games in database to compute metrics.</p>
      </div>
    );
  }

  // Grade counts
  const gradeCounts: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0, Unrated: 0 };
  games.forEach(g => {
    gradeCounts[g.grade] = (gradeCounts[g.grade] || 0) + 1;
  });

  // Status counts
  const statusCounts: Record<CompletionStatus, number> = {
    'Completed': 0,
    'Mastered': 0,
    'In Progress': 0,
    'Not Started': 0,
    'Wishlist': 0,
    'Dropped': 0
  };
  games.forEach(g => {
    statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
  });

  // Platform counts
  const platformCounts: Record<string, number> = {};
  games.forEach(g => {
    platformCounts[g.platform] = (platformCounts[g.platform] || 0) + 1;
  });

  const sortedPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top played games
  const topPlayed = [...games]
    .sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0))
    .slice(0, 5);

  const gradeColors: Record<Grade, string> = {
    S: 'bg-purple-500 text-purple-200 border-purple-400',
    A: 'bg-emerald-500 text-emerald-200 border-emerald-400',
    B: 'bg-blue-500 text-blue-200 border-blue-400',
    C: 'bg-amber-500 text-amber-200 border-amber-400',
    D: 'bg-orange-500 text-orange-200 border-orange-400',
    F: 'bg-rose-500 text-rose-200 border-rose-400',
    Unrated: 'bg-slate-700 text-slate-300 border-slate-600'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Grade Breakdown & Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Grade Tier Breakdown */}
        <div className="border rounded-2xl p-5 shadow-xl" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-4 theme-accent-text font-semibold text-sm uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Grade Tier Distribution</span>
          </div>

          <div className="space-y-3">
            {(['S', 'A', 'B', 'C', 'D', 'F', 'Unrated'] as Grade[]).map(g => {
              const count = gradeCounts[g];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={g} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${gradeColors[g]}`}>
                        {g}
                      </span>
                      {g === 'S' ? 'Masterpiece' : g === 'A' ? 'Excellent' : g === 'B' ? 'Good' : g === 'C' ? 'Average' : g === 'D' ? 'Below Avg' : g === 'F' ? 'Poor' : 'Unrated'}
                    </span>
                    <span className="text-slate-400">{count} games ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        g === 'S' ? 'bg-purple-500' : g === 'A' ? 'bg-emerald-500' : g === 'B' ? 'bg-blue-500' : g === 'C' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Status Distribution */}
        <div className="border rounded-2xl p-5 shadow-xl" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            <PieChart className="w-4 h-4" />
            <span>Backlog Status Breakdown</span>
          </div>

          <div className="space-y-3">
            {(Object.keys(statusCounts) as CompletionStatus[]).map(s => {
              const count = statusCounts[s];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={s} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{s}</span>
                    <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        s === 'Completed' || s === 'Mastered'
                          ? 'bg-emerald-500'
                          : s === 'In Progress'
                          ? 'bg-amber-500'
                          : s === 'Wishlist'
                          ? 'bg-indigo-500'
                          : s === 'Dropped'
                          ? 'bg-rose-500'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Platforms & Top Time Invested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Platforms */}
        <div className="border rounded-2xl p-5 shadow-xl" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-4 text-cyan-400 font-semibold text-sm uppercase tracking-wider">
            <Gamepad2 className="w-4 h-4" />
            <span>Gaming Platforms</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sortedPlatforms.map(([platform, count]) => (
              <div key={platform} className="p-3 border rounded-xl" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                <div className="text-xs font-mono text-slate-400 truncate">{platform}</div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">{count} games</div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Played Games */}
        <div className="border rounded-2xl p-5 shadow-xl" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2 mb-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Most Hours Invested</span>
          </div>

          <div className="space-y-2">
            {topPlayed.map((g, idx) => (
              <div key={g.id} className="p-2.5 border rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--theme-input)', borderColor: 'var(--theme-border)' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{g.title}</div>
                    <div className="text-[10px] text-slate-500">{g.platform}</div>
                  </div>
                </div>
                <div className="text-xs font-bold font-mono theme-accent-text shrink-0">
                  {g.hoursPlayed} hrs
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
