import { ProductItem, ScheduledReminder } from '../types';
import { getDaysDifference, formatDateFrench } from './dateUtils';

const NOTIFICATIONS_PREF_KEY = 'nowaste_notifications_enabled';
const REMINDER_DAYS_KEY = 'nowaste_reminder_days_before';

export const REMINDER_DELAY_OPTIONS = [1, 3, 5, 7] as const;
export const DEFAULT_REMINDER_DAYS_BEFORE = 3;

type Lang = 'fr' | 'en';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';
    localStorage.setItem(NOTIFICATIONS_PREF_KEY, isGranted ? 'true' : 'false');
    return isGranted;
  } catch (e) {
    console.error('Erreur demande de permission notification:', e);
    return false;
  }
}

/**
 * Lit le délai de rappel préféré (en jours avant péremption) depuis le local storage.
 * Retourne la valeur par défaut si absente ou invalide.
 */
export function getReminderDaysPreference(): number {
  try {
    const raw = localStorage.getItem(REMINDER_DAYS_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (REMINDER_DELAY_OPTIONS.includes(parsed as any)) {
      return parsed;
    }
  } catch (e) {
    console.error('Erreur lecture préférence de rappel:', e);
  }
  return DEFAULT_REMINDER_DAYS_BEFORE;
}

export function setReminderDaysPreference(days: number): void {
  try {
    localStorage.setItem(REMINDER_DAYS_KEY, String(days));
  } catch (e) {
    console.error('Erreur sauvegarde préférence de rappel:', e);
  }
}

/**
 * Génère la liste des rappels planifiés (J-N configurable et J-0) pour tous les produits actifs
 */
export function getScheduledReminders(
  products: ProductItem[],
  reminderDaysBefore: number = DEFAULT_REMINDER_DAYS_BEFORE,
  lang: Lang = 'fr'
): ScheduledReminder[] {
  const reminders: ScheduledReminder[] = [];
  const activeProducts = products.filter((p) => p.status === 'active');

  const messages =
    lang === 'fr'
      ? {
          jN: (name: string, days: number, date: string) =>
            `🔔 Rappel J-${days} : "${name}" périme dans ${days} jour${days > 1 ? 's' : ''} (${date}). Pensez à le cuisiner !`,
          j0: (name: string, date: string) =>
            `🚨 Alerte J-0 : "${name}" périme aujourd'hui (${date}) ! Consommez-le maintenant pour éviter le gaspillage.`,
        }
      : {
          jN: (name: string, days: number, date: string) =>
            `🔔 Reminder (day -${days}): "${name}" expires in ${days} day${days > 1 ? 's' : ''} (${date}). Time to cook it!`,
          j0: (name: string, date: string) =>
            `🚨 Alert (day 0): "${name}" expires today (${date})! Consume it now to avoid waste.`,
        };

  for (const product of activeProducts) {
    const daysRemaining = getDaysDifference(product.expirationDate);
    const formattedDate = formatDateFrench(product.expirationDate, lang);

    // Rappel J-N (N jours avant la date, configurable)
    const jNScheduledDate = computeOffsetDate(product.expirationDate, -reminderDaysBefore);
    reminders.push({
      id: `${product.id}-jn`,
      productId: product.id,
      productName: product.name,
      expirationDate: product.expirationDate,
      type: `J-${reminderDaysBefore}`,
      scheduledDate: jNScheduledDate,
      isTriggered: daysRemaining <= reminderDaysBefore,
      message: messages.jN(product.name, reminderDaysBefore, formattedDate),
    });

    // Rappel J-0 (le jour même)
    reminders.push({
      id: `${product.id}-j0`,
      productId: product.id,
      productName: product.name,
      expirationDate: product.expirationDate,
      type: 'J-0',
      scheduledDate: product.expirationDate,
      isTriggered: daysRemaining <= 0,
      message: messages.j0(product.name, formattedDate),
    });
  }

  // Trier les rappels par date
  return reminders.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

function computeOffsetDate(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/**
 * Déclenche une notification système locale (Web Notification API) et renvoie le succès
 */
export function sendLocalNotification(title: string, body: string): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `nowaste-${Date.now()}`,
    });
    return true;
  } catch (e) {
    console.error('Erreur déclenchement notification locale:', e);
    return false;
  }
}
