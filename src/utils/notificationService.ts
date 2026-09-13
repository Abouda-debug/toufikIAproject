import { ProductItem, ScheduledReminder } from '../types';
import { getDaysDifference, formatDateFrench } from './dateUtils';

const NOTIFICATIONS_PREF_KEY = 'nowaste_notifications_enabled';

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
 * Génère la liste des rappels planifiés (J-3 et J-0) pour tous les produits actifs
 */
export function getScheduledReminders(products: ProductItem[]): ScheduledReminder[] {
  const reminders: ScheduledReminder[] = [];
  const activeProducts = products.filter((p) => p.status === 'active');

  for (const product of activeProducts) {
    const daysRemaining = getDaysDifference(product.expirationDate);

    // Rappel J-3 (3 jours avant la date)
    const j3ScheduledDate = computeOffsetDate(product.expirationDate, -3);
    reminders.push({
      id: `${product.id}-j3`,
      productId: product.id,
      productName: product.name,
      expirationDate: product.expirationDate,
      type: 'J-3',
      scheduledDate: j3ScheduledDate,
      isTriggered: daysRemaining <= 3,
      message: `🔔 Rappel J-3 : "${product.name}" périme dans 3 jours (${formatDateFrench(product.expirationDate)}). Pensez à le cuisiner !`,
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
      message: `🚨 Alerte J-0 : "${product.name}" périme aujourd'hui (${formatDateFrench(product.expirationDate)}) ! Consommez-le maintenant pour éviter le gaspillage.`,
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
