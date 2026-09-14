import React from 'react';
import { Sparkles, Search, Flame, Clock, CheckCircle2, Layers } from 'lucide-react';
import { AntiWasteStats } from '../types';
import { useTranslations } from '../i18n';

interface AntiWasteHeaderProps {
  stats: AntiWasteStats;
  urgentCount: number;
  warningCount: number;
  safeCount: number;
  totalActiveCount: number;
  activeFilter: 'all' | 'urgent' | 'warning' | 'safe';
  onFilterChange: (filter: 'all' | 'urgent' | 'warning' | 'safe') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const AntiWasteHeader: React.FC<AntiWasteHeaderProps> = ({
  stats,
  urgentCount,
  warningCount,
  safeCount,
  totalActiveCount,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const { t } = useTranslations();
  const h = t.header;

  return (
    <div className="space-y-4 pt-2 pb-1">
      {/* Hero Counter Card: Articles sauvés du gaspillage */}
      <div className="rounded-3xl bg-linear-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 shadow-md shadow-emerald-950/10 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-4 top-4 text-emerald-400/20">
          <Sparkles className="w-20 h-20 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 text-[11px] font-semibold border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                {h.ecoImpact}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {stats.totalSaved}
              </span>
              <span className="text-sm font-semibold text-emerald-100">
                {stats.totalSaved > 1 ? h.itemsSaved : h.itemSaved} {h.wastageSuffix}
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-1">
              {stats.totalSaved > 0
                ? h.successRateLine(stats.savedPercentage, stats.estimatedMoneySaved.toFixed(2))
                : h.scanCta}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <div className="px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
              <span className="block text-lg font-bold text-white leading-tight">
                {totalActiveCount}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                {h.inStock}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
              <span className="block text-lg font-bold text-red-300 leading-tight">
                {urgentCount}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-200">
                {h.urgent}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          id="input-search-products"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={h.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 p-1"
          >
            {h.clear}
          </button>
        )}
      </div>

      {/* Color Code Filter Chips (Requirement 1: Rouge <= 2 jours, Orange <= 7 jours, Vert > 7 jours) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Tous */}
        <button
          id="filter-chip-all"
          onClick={() => onFilterChange('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{h.filterAll} ({totalActiveCount})</span>
        </button>

        {/* Rouge : Expire sous 2 jours */}
        <button
          id="filter-chip-urgent"
          onClick={() => onFilterChange('urgent')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'urgent'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Flame className="w-3.5 h-3.5" />
          <span>{h.filterUrgent} ({urgentCount})</span>
        </button>

        {/* Orange : Sous 7 jours */}
        <button
          id="filter-chip-warning"
          onClick={() => onFilterChange('warning')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'warning'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <Clock className="w-3.5 h-3.5" />
          <span>{h.filterWarning} ({warningCount})</span>
        </button>

        {/* Vert : Plus de 7 jours */}
        <button
          id="filter-chip-safe"
          onClick={() => onFilterChange('safe')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === 'safe'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{h.filterSafe} ({safeCount})</span>
        </button>
      </div>
    </div>
  );
};
