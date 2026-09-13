import React from 'react';
import { Leaf, Bell, BarChart3, ShieldCheck } from 'lucide-react';
import { AntiWasteStats } from '../types';

interface TopAppBarProps {
  stats: AntiWasteStats;
  urgentCount: number;
  onOpenNotifications: () => void;
  onOpenStats: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  stats,
  urgentCount,
  onOpenNotifications,
  onOpenStats,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-700/20">
            <Leaf className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                nowaste
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Zéro gaspillage alimentaire
            </p>
          </div>
        </div>

        {/* Action icons & Badges */}
        <div className="flex items-center gap-2">
          {/* Articles sauvés quick button */}
          <button
            id="btn-open-stats"
            onClick={onOpenStats}
            aria-label="Voir les statistiques anti-gaspillage"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors text-xs font-semibold"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Sauvés :</span>
            <span className="font-bold text-emerald-900">{stats.totalSaved}</span>
          </button>

          {/* Notifications button with urgent badge */}
          <button
            id="btn-open-notifications"
            onClick={onOpenNotifications}
            aria-label="Centre de notifications et rappels"
            className="relative p-2 rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {urgentCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {urgentCount}
              </span>
            )}
          </button>

          {/* History / Stats button */}
          <button
            id="btn-view-history"
            onClick={onOpenStats}
            aria-label="Historique des produits consommés"
            className="p-2 rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
