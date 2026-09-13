import { ExpirationUrgency } from '../types';

/**
 * Normalise une date à minuit UTC pour des comparaisons de jours fiables
 */
export function getDaysDifference(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = targetDateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Règle de couleur stricte selon les spécifications :
 * - Rouge = expire sous 2 jours (<= 2 jours ou déjà périmé)
 * - Orange = sous 7 jours (3 à 7 jours)
 * - Vert = plus de 7 jours (> 7 jours)
 */
export function getExpirationUrgency(targetDateStr: string): ExpirationUrgency {
  const days = getDaysDifference(targetDateStr);
  if (days < 0) return 'expired';
  if (days <= 2) return 'urgent';
  if (days <= 7) return 'warning';
  return 'safe';
}

export function getUrgencyStyles(urgency: ExpirationUrgency) {
  switch (urgency) {
    case 'expired':
      return {
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        cardBorder: 'border-l-4 border-l-rose-600',
        dotColor: 'bg-rose-600',
        accentColor: '#E11D48',
        label: 'Périmé',
        textClass: 'text-rose-700 font-bold',
      };
    case 'urgent':
      return {
        badgeBg: 'bg-red-50 text-red-700 border-red-200',
        cardBorder: 'border-l-4 border-l-red-500',
        dotColor: 'bg-red-500',
        accentColor: '#EF4444',
        label: 'Urgent (≤ 2 jours)',
        textClass: 'text-red-700 font-semibold',
      };
    case 'warning':
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        cardBorder: 'border-l-4 border-l-amber-500',
        dotColor: 'bg-amber-500',
        accentColor: '#F59E0B',
        label: 'À surveiller (≤ 7 jours)',
        textClass: 'text-amber-700 font-medium',
      };
    case 'safe':
    default:
      return {
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        cardBorder: 'border-l-4 border-l-emerald-500',
        dotColor: 'bg-emerald-500',
        accentColor: '#10B981',
        label: 'Frais (> 7 jours)',
        textClass: 'text-emerald-700 font-medium',
      };
  }
}

export function formatDaysRemainingText(targetDateStr: string): string {
  const days = getDaysDifference(targetDateStr);

  if (days < -1) return `Périmé depuis ${Math.abs(days)} jours`;
  if (days === -1) return 'Périmé hier';
  if (days === 0) return "Expire aujourd'hui !";
  if (days === 1) return 'Expire demain';
  if (days === 2) return 'Expire dans 2 jours';
  return `Expire dans ${days} jours`;
}

export function formatDateFrench(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Calcule la date ISO pour aujourd'hui + N jours
 */
export function getRelativeDateISO(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
