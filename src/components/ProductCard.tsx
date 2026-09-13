import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
  Utensils,
  Trash2,
  Calendar,
  Refrigerator,
  Package,
  Snowflake,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProductItem } from '../types';
import {
  getExpirationUrgency,
  getUrgencyStyles,
  formatDaysRemainingText,
  formatDateFrench,
  getDaysDifference,
} from '../utils/dateUtils';

interface ProductCardProps {
  product: ProductItem;
  onMarkConsumed: (id: string) => void;
  onMarkDiscarded: (id: string) => void;
  onEdit: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onMarkConsumed,
  onMarkDiscarded,
  onEdit,
}) => {
  const urgency = getExpirationUrgency(product.expirationDate);
  const styles = getUrgencyStyles(urgency);
  const daysRemaining = getDaysDifference(product.expirationDate);
  const daysText = formatDaysRemainingText(product.expirationDate);

  const x = useMotionValue(0);
  // Transformations pour révéler les fonds vert (droite) et rouge (gauche)
  const greenOpacity = useTransform(x, [0, 80], [0, 1]);
  const redOpacity = useTransform(x, [-80, 0], [1, 0]);

  const [isSwipingAction, setIsSwipingAction] = useState<'consumed' | 'discarded' | null>(null);

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x > 80) {
      setIsSwipingAction('consumed');
      setTimeout(() => onMarkConsumed(product.id), 200);
    } else if (info.offset.x < -80) {
      setIsSwipingAction('discarded');
      setTimeout(() => onMarkDiscarded(product.id), 200);
    }
  };

  const getLocationIcon = () => {
    switch (product.storageLocation) {
      case 'frigo':
        return <Refrigerator className="w-3.5 h-3.5 text-blue-500" />;
      case 'congelateur':
        return <Snowflake className="w-3.5 h-3.5 text-cyan-500" />;
      case 'placard':
      default:
        return <Package className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const getLocationLabel = () => {
    switch (product.storageLocation) {
      case 'frigo':
        return 'Frigo';
      case 'congelateur':
        return 'Congélateur';
      case 'placard':
      default:
        return 'Placard';
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xs select-none group">
      {/* Fond vert Swipe Droite : Consommé / Sauvé */}
      <motion.div
        style={{ opacity: greenOpacity }}
        className="absolute inset-0 bg-emerald-600 flex items-center justify-start pl-6 text-white font-bold rounded-2xl z-0"
      >
        <div className="flex items-center gap-2">
          <Utensils className="w-6 h-6 animate-bounce" />
          <span className="text-sm uppercase tracking-wider">Consommé ! Sauvé</span>
        </div>
      </motion.div>

      {/* Fond rouge Swipe Gauche : Jeté */}
      <motion.div
        style={{ opacity: redOpacity }}
        className="absolute inset-0 bg-rose-600 flex items-center justify-end pr-6 text-white font-bold rounded-2xl z-0"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm uppercase tracking-wider">Jeté</span>
          <Trash2 className="w-6 h-6 animate-bounce" />
        </div>
      </motion.div>

      {/* Carte principale avec swipe physique */}
      <motion.div
        id={`product-card-${product.id}`}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        animate={isSwipingAction ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{ x }}
        className={`relative z-10 bg-white border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 transition-all ${styles.cardBorder} hover:shadow-xs`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Main info */}
          <div className="flex-1 min-w-0" onClick={() => onEdit(product)}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dotColor}`} />
              <h3 className="font-bold text-stone-900 text-base sm:text-lg truncate tracking-tight">
                {product.name}
              </h3>
            </div>

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
              {/* Statut temporaire : Rouge <= 2 jours, Orange <= 7 jours, Vert > 7 jours */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold border text-[11px] ${styles.badgeBg}`}
              >
                <Clock className="w-3 h-3" />
                {daysText}
              </span>

              {/* Date imprimée & Type (DLC / DDM) */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                <Calendar className="w-3 h-3 text-stone-500" />
                {product.dateType || 'DLC'} : {formatDateFrench(product.expirationDate)}
              </span>

              {/* Emplacement */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                {getLocationIcon()}
                {getLocationLabel()}
              </span>

              {/* Marque */}
              {product.brand && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium truncate max-w-[120px]">
                  <Tag className="w-3 h-3 text-stone-400" />
                  {product.brand}
                </span>
              )}
            </div>

            {/* Note ou avertissement éventuel */}
            {product.notes && (
              <p className="text-xs text-stone-500 italic mt-2 line-clamp-1">
                "{product.notes}"
              </p>
            )}
          </div>

          {/* Direct action buttons (Consommé & Jeté) */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0 self-center sm:self-start">
            <button
              id={`btn-consume-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkConsumed(product.id);
              }}
              title="Marquer comme consommé (aliment sauvé !)"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all text-xs font-bold active:scale-95"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Consommé</span>
            </button>

            <button
              id={`btn-discard-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkDiscarded(product.id);
              }}
              title="Marquer comme jeté"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-50 text-stone-500 hover:bg-rose-50 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition-all text-xs font-semibold active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Jeté</span>
            </button>
          </div>
        </div>

        {/* Indication visuelle de swipe discrète pour mobile */}
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            👉 Glisser à droite pour <strong className="text-emerald-700">Consommer</strong>
          </span>
          <span className="flex items-center gap-1">
            👈 Glisser à gauche pour <strong className="text-rose-700">Jeter</strong>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
