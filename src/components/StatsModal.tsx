import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Utensils,
  Trash2,
  Euro,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ProductItem, AntiWasteStats } from '../types';
import { formatDateFrench } from '../utils/dateUtils';
import { CATEGORY_PRICE_RATES, getProductEstimatedPrice } from '../data/productStorage';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AntiWasteStats;
  products: ProductItem[];
  onResetData: () => void;
  onRestoreProduct: (id: string) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  products,
  onResetData,
  onRestoreProduct,
}) => {
  const [showPriceRates, setShowPriceRates] = useState(false);

  if (!isOpen) return null;

  const resolvedProducts = products.filter((p) => p.status !== 'active');

  const exportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nowaste_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Bilan Anti-Gaspillage
              </h2>
              <p className="text-xs text-stone-500">
                Statistiques & historique des aliments
              </p>
            </div>
          </div>
          <button
            id="btn-close-stats-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold mb-1">
                <Utensils className="w-4 h-4" />
                <span>Articles sauvés</span>
              </div>
              <div className="text-3xl font-black text-emerald-950 font-['Plus_Jakarta_Sans',sans-serif]">
                {stats.totalSaved}
              </div>
              <p className="text-[11px] text-emerald-700/90 mt-0.5">
                Consommés avant la date
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-600 text-xs font-bold mb-1">
                <Euro className="w-4 h-4 text-emerald-600" />
                <span>Économies estimées</span>
              </div>
              <div className="text-3xl font-black text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                ~{stats.estimatedMoneySaved.toFixed(2)} €
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Barème ADEME par catégorie
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-1.5 text-stone-600 text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Taux de sauvetage</span>
              </div>
              <div className="text-3xl font-black text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {stats.savedPercentage}%
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Ratio consommés vs jetés
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold mb-1">
                <Trash2 className="w-4 h-4" />
                <span>Articles jetés</span>
              </div>
              <div className="text-3xl font-black text-rose-950 font-['Plus_Jakarta_Sans',sans-serif]">
                {stats.totalDiscarded}
              </div>
              <p className="text-[11px] text-rose-700/90 mt-0.5">
                Non consommés à temps
              </p>
            </div>
          </div>

          {/* Section Barème forfaitaire Option A */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-stone-700">
            <button
              onClick={() => setShowPriceRates((prev) => !prev)}
              className="w-full flex items-center justify-between font-bold text-emerald-950 text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Comment sont calculés ces tarifs ? (Option A)</span>
              </div>
              {showPriceRates ? (
                <ChevronUp className="w-4 h-4 text-emerald-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-700" />
              )}
            </button>

            <p className="text-stone-600 mt-1.5 leading-relaxed text-[11px]">
              Puisque les emballages ne comportent pas de prix imprimé, l'application applique automatiquement le <strong>barème moyen officiel (INSEE / ADEME anti-gaspillage)</strong> dès qu'un produit est consommé :
            </p>

            {showPriceRates && (
              <div className="mt-3 pt-3 border-t border-emerald-200/70 grid grid-cols-2 gap-2 text-[11px]">
                {Object.entries(CATEGORY_PRICE_RATES)
                  .filter(([key]) => !['sec', 'frais', 'boissons', 'surgeles'].includes(key))
                  .map(([key, item]) => (
                    <div
                      key={key}
                      className="p-2 rounded-xl bg-white/80 border border-emerald-100 flex items-center justify-between"
                    >
                      <span className="text-stone-700 font-medium truncate">{item.label}</span>
                      <span className="font-bold text-emerald-800 shrink-0 ml-1">
                        {item.price.toFixed(2)} €
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Guaranteed offline / Paid version banner */}
          <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-900">
                Application payante à l'achat — 100% débloquée
              </p>
              <p className="text-stone-600 mt-0.5">
                Aucune publicité, aucun abonnement, aucun compte requis.
                Toutes les données sont stockées localement sur votre appareil en toute confidentialité.
              </p>
            </div>
          </div>

          {/* Historical List */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Historique des actions ({resolvedProducts.length})
            </h3>

            {resolvedProducts.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-xs bg-stone-50 rounded-2xl border border-stone-200">
                Aucun produit terminé pour le moment. Glissez vos produits vers la droite pour les marquer "Consommé" !
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {resolvedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {p.status === 'consumed' ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Utensils className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div className="truncate">
                        <span className="font-bold text-stone-900 block truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Date : {formatDateFrench(p.expirationDate)} •{' '}
                          {p.status === 'consumed' ? (
                            <span className="font-semibold text-emerald-700">
                              +{(getProductEstimatedPrice(p.category) * (p.quantity || 1)).toFixed(2)} € sauvés
                            </span>
                          ) : (
                            <span className="font-semibold text-rose-600">Non consommé</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRestoreProduct(p.id)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-md hover:bg-emerald-50 shrink-0"
                    >
                      Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Tools: Export & Reset */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
            <button
              id="btn-export-json"
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Sauvegarde JSON
            </button>

            <button
              id="btn-reset-demo-data"
              onClick={() => {
                if (confirm('Réinitialiser les données avec les exemples par défaut ?')) {
                  onResetData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
