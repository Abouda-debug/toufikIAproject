import React, { useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  Sparkles,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { ScheduledReminder } from '../types';
import {
  isNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendLocalNotification,
} from '../utils/notificationService';
import { formatDateFrench } from '../utils/dateUtils';
import { useTranslations } from '../i18n';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ScheduledReminder[];
  reminderDaysBefore: number;
  onTriggerSimulatedAlert: (reminder: ScheduledReminder) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  reminders,
  reminderDaysBefore,
  onTriggerSimulatedAlert,
}) => {
  const { t, lang } = useTranslations();
  const n = t.notifications;
  const [permission, setPermission] = useState<NotificationPermission>(
    getNotificationPermissionStatus()
  );
  const [filterType, setFilterType] = useState<'all' | 'due' | 'upcoming'>('all');
  const [activeTestAlert, setActiveTestAlert] = useState<ScheduledReminder | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAlert = async (reminder: ScheduledReminder) => {
    // 1. Déclencher le visuel d'alerte immédiat dans la modale
    setActiveTestAlert(reminder);

    // 2. Tenter la notification système Web si supportée
    let notificationSent = false;
    if (isNotificationSupported()) {
      if (Notification.permission === 'default') {
        const granted = await requestNotificationPermission();
        setPermission(getNotificationPermissionStatus());
        if (granted) {
          notificationSent = sendLocalNotification(
            `🔔 nowaste (${reminder.type}) : ${reminder.productName}`,
            reminder.message
          );
        }
      } else if (Notification.permission === 'granted') {
        notificationSent = sendLocalNotification(
          `🔔 nowaste (${reminder.type}) : ${reminder.productName}`,
          reminder.message
        );
      }
    }

    // 3. Alerte visuelle toast
    if (notificationSent) {
      setSuccessToast(n.toastSentSuccess(reminder.productName));
    } else {
      setSuccessToast(n.toastSimulated(reminder.productName));
    }

    // 4. Déclencher le callback parent
    onTriggerSimulatedAlert(reminder);

    // 5. Vibration haptique sur mobile si supportée
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Ignorer si non supporté
      }
    }

    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermissionStatus());
    if (granted) {
      sendLocalNotification(
        n.activatedTitle,
        n.activatedBody(reminderDaysBefore)
      );
      setSuccessToast(n.toastPermissionGranted);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filterType === 'due') return r.isTriggered;
    if (filterType === 'upcoming') return !r.isTriggered;
    return true;
  });

  const dueCount = reminders.filter((r) => r.isTriggered).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {n.title}
              </h2>
              <p className="text-xs text-stone-500">
                {n.subtitle(reminderDaysBefore)}
              </p>
            </div>
          </div>
          <button
            id="btn-close-notifications-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Permission banner */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>{n.deviceNotifications}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {permission === 'granted' ? n.enabled : n.notEnabled}
              </span>
            </div>
            <p className="text-xs text-stone-600">
              {n.explanation(reminderDaysBefore)}
            </p>
            {permission !== 'granted' && isNotificationSupported() && (
              <button
                id="btn-enable-notifications"
                onClick={handleRequestPermission}
                className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all"
              >
                {n.enableButton}
              </button>
            )}
          </div>

          {/* Active Test Alert Banner (immediate visual confirmation inside the modal) */}
          {activeTestAlert && (
            <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg animate-in zoom-in-95 duration-200 space-y-2 border border-amber-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>{n.alertTriggered(activeTestAlert.type)}</span>
                </div>
                <button
                  onClick={() => setActiveTestAlert(null)}
                  className="p-1 rounded-full hover:bg-white/20 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-semibold leading-snug">
                {activeTestAlert.message}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-amber-100">
                <span>{formatDateFrench(activeTestAlert.expirationDate, lang)}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {n.testSucceeded}
                </span>
              </div>
            </div>
          )}

          {/* Toast feedback */}
          {successToast && !activeTestAlert && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2 text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {n.filterAll(reminders.length)}
            </button>
            <button
              onClick={() => setFilterType('due')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'due'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {n.filterDue(dueCount)}
            </button>
            <button
              onClick={() => setFilterType('upcoming')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'upcoming'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {n.filterUpcoming(reminders.length - dueCount)}
            </button>
          </div>

          {/* Reminders List */}
          <div className="space-y-2.5">
            {filteredReminders.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-xs">
                {n.emptyCategory}
              </div>
            ) : (
              filteredReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    reminder.isTriggered
                      ? reminder.type === 'J-0'
                        ? 'bg-red-50/70 border-red-200 text-red-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-white border-stone-200 text-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 mt-0.5 ${
                          reminder.type === 'J-0'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {reminder.type}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">
                          {reminder.productName}
                        </h4>
                        <p className="text-[11px] text-stone-600 mt-1">
                          {reminder.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            {n.scheduledOn(formatDateFrench(reminder.scheduledDate, lang))}
                          </span>
                          {reminder.isTriggered && (
                            <span className="font-bold text-red-600 flex items-center gap-0.5">
                              • {n.activeAlert}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      id={`btn-test-alert-${reminder.id}`}
                      onClick={() => handleTestAlert(reminder)}
                      title={n.testAlertTitle}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 active:scale-95"
                    >
                      <BellRing className="w-3 h-3 text-amber-700" />
                      <span>{n.testAlertButton}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            {n.footerOffline}
          </span>
          <button
            id="btn-close-notif"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800"
          >
            {n.close}
          </button>
        </div>
      </div>
    </div>
  );
};
