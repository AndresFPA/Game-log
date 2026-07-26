import React from 'react';
import { GameEntry } from '../types';
import { Gamepad2, CheckCircle2, Flame, Trophy, Clock, Bookmark, Star } from 'lucide-react';

interface MetricCardsProps {
  games: GameEntry[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ games, selectedFilter, onSelectFilter }) => {
  const total = games.length;
  const completed = games.filter(g => g.status === 'Completed' || g.status === 'Mastered').length;
  const inProgress = games.filter(g => g.status === 'In Progress').length;
  const backlog = games.filter(g => g.status === 'Not Started').length;
  const wishlist = games.filter(g => g.status === 'Wishlist').length;
  const sTierCount = games.filter(g => g.grade === 'S').length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalHours = games.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0);

  const ratedGames = games.filter(g => g.grade !== 'Unrated');
  const gradePoints: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, F: 0 };
  const avgGradeNum = ratedGames.length > 0
    ? ratedGames.reduce((acc, g) => acc + (gradePoints[g.grade] ?? 0), 0) / ratedGames.length
    : 0;
  
  const getAvgGradeLetter = (val: number) => {
    if (val >= 4.5) return 'S';
    if (val >= 3.5) return 'A';
    if (val >= 2.5) return 'B';
    if (val >= 1.5) return 'C';
    if (val >= 0.5) return 'D';
    return 'F';
  };

  const metrics = [
    {
      id: 'all',
      title: 'Total Backlog',
      value: total,
      subtext: `${completionRate}% Completion Rate`,
      icon: Gamepad2,
      color: 'bg-[var(--theme-accent-subtle)] text-[var(--theme-accent)] border-[var(--theme-accent)]/30',
      activeColor: 'ring-2 ring-[var(--theme-accent)]'
    },
    {
      id: 'Completed',
      title: 'Completed & Beaten',
      value: completed,
      subtext: `${games.filter(g => g.status === 'Mastered').length} Mastered`,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      activeColor: 'ring-2 ring-emerald-500'
    },
    {
      id: 'In Progress',
      title: 'Currently Playing',
      value: inProgress,
      subtext: 'Active Campaigns',
      icon: Flame,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      activeColor: 'ring-2 ring-amber-500'
    },
    {
      id: 'grade_S',
      title: 'S-Tier Masterpieces',
      value: sTierCount,
      subtext: `Avg Rating: ${getAvgGradeLetter(avgGradeNum)} Tier`,
      icon: Trophy,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      activeColor: 'ring-2 ring-purple-500'
    },
    {
      id: 'hours',
      title: 'Total Time Invested',
      value: `${totalHours} hrs`,
      subtext: `${backlog} Unstarted Games`,
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      activeColor: ''
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {metrics.map(metric => {
        const Icon = metric.icon;
        const isSelected = selectedFilter === metric.id;
        return (
          <button
            key={metric.id}
            onClick={() => metric.id !== 'hours' && onSelectFilter(metric.id)}
            className={`text-left p-4 rounded-xl border backdrop-blur-md transition-all duration-200 ${
              isSelected ? `${metric.activeColor}` : ''
            } ${metric.id !== 'hours' ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
            style={{
              backgroundColor: isSelected ? 'var(--theme-card)' : 'var(--theme-surface)',
              borderColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-border)'
            }}
            id={`metric-card-${metric.id}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {metric.title}
              </span>
              <div className={`p-2 rounded-lg border ${metric.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {metric.value}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{metric.subtext}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
