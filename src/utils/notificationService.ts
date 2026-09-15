import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ProductItem, ScheduledReminder } from '../types';
import { getDaysDifference, formatDateFrench } from './dateUtils';

export const isNativePlatform = Capacitor.isNativePlatform();

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

/**
 * Demande la permission d'envoyer des notifications natives planifiées (Android/iOS via Capacitor).
 * Sans effet sur le web (utilise sendLocalNotification / requestNotificationPermission à la place).
 */
export async function requestNativeNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (e) {
    console.error('Erreur permission notifications natives:', e);
    return false;
  }
}

/**
 * Vérifie l'état actuel de la permission de notifications natives (sans la demander).
 * Sans effet sur le web.
 */
export async function getNativeNotificationPermissionStatus(): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (e) {
    console.error('Erreur vérification permission notifications natives:', e);
    return false;
  }
}

/**
 * Vérifie si la permission "alarmes exactes" (Android 12+) est accordée. Sans elle, les
 * rappels sont tout de même délivrés mais l'OS peut les retarder de quelques minutes/heures
 * (mode "inexact") au lieu de sonner pile à l'heure prévue. Android < 12 : toujours true.
 */
export async function getExactAlarmPermissionStatus(): Promise<boolean> {
  if (!isNativePlatform) return true;
  try {
    const result = await LocalNotifications.checkExactNotificationSetting();
    return result.exact_alarm === 'granted';
  } catch (e) {
    console.error('Erreur vérification permission alarmes exactes:', e);
    return true;
  }
}

/**
 * Ouvre l'écran système "Alarmes et rappels" pour que l'utilisateur active les alarmes
 * exactes. Sans effet sur Android < 12 (renvoie granted directement) ni sur le web.
 */
export async function requestExactAlarmPermission(): Promise<boolean> {
  if (!isNativePlatform) return true;
  try {
    const result = await LocalNotifications.changeExactNotificationSetting();
    return result.exact_alarm === 'granted';
  } catch (e) {
    console.error('Erreur demande permission alarmes exactes:', e);
    return false;
  }
}

/**
 * Déclenche immédiatement une notification native (test manuel depuis la modale Notifications).
 * Sans effet sur le web (utilise sendLocalNotification à la place).
 */
export async function sendImmediateNativeNotification(title: string, body: string): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 2147483647),
          title,
          body,
        },
      ],
    });
    return true;
  } catch (e) {
    console.error('Erreur envoi notification native immédiate:', e);
    return false;
  }
}

// Convertit une chaîne en entier stable (pour servir d'ID de notification native, qui doit être un nombre)
function hashToInt32(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Resynchronise les notifications natives planifiées (Capacitor Local Notifications) avec la
 * liste de rappels courante : annule tout ce qui est en attente puis replanifie uniquement les
 * rappels dont la date est encore future. Appelé à chaque changement de produits ou de préférence
 * de délai, pour que l'OS déclenche les rappels même app fermée (contrairement à l'API Web
 * Notification qui ne fonctionne que si l'app est ouverte ou récemment active).
 */
export async function syncNativeScheduledNotifications(reminders: ScheduledReminder[]): Promise<void> {
  if (!isNativePlatform) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }

    const now = Date.now();
    const notificationsToSchedule = reminders
      .filter((r) => !r.isTriggered)
      .map((r) => {
        const [y, m, d] = r.scheduledDate.split('-').map(Number);
        const at = new Date(y, m - 1, d, 9, 0, 0); // Rappel à 9h le jour prévu
        return {
          id: hashToInt32(r.id),
          title: `🔔 nowaste (${r.type})`,
          body: r.message,
          schedule: { at },
        };
      })
      .filter((n) => n.schedule.at.getTime() > now);

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (e) {
    console.error('Erreur synchronisation des notifications natives:', e);
  }
}
