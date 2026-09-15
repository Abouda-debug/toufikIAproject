import React, { useState, useEffect } from 'react';
import { X, Settings, Bell, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useTranslations } from '../i18n';
import { REMINDER_DELAY_OPTIONS } from '../utils/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderDaysBefore: number;
  onChangeReminderDays: (days: number) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  reminderDaysBefore,
  onChangeReminderDays,
  onClearAllData,
}) => {
  const { t } = useTranslations();
  const s = t.settings;
  // Confirmation intégrée à l'UI plutôt que window.confirm(), qui ne s'affiche pas
  // de façon fiable dans la WebView Android (pas de dialogue JS natif implémenté).
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsConfirmingClear(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {s.title}
              </h2>
              <p className="text-xs text-stone-500">{s.subtitle}</p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-emerald-700" />
            {s.reminderDelayLabel}
          </label>
          <p className="text-xs text-stone-500 -mt-1">{s.reminderDelayHint}</p>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {REMINDER_DELAY_OPTIONS.map((days) => (
              <button
                key={days}
                id={`btn-reminder-days-${days}`}
                type="button"
                onClick={() => onChangeReminderDays(days)}
                className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all ${
                  reminderDaysBefore === days
                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {reminderDaysBefore === days && <Check className="w-3.5 h-3.5" />}
                <span>{s.dayOption(days)}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              {s.dataLabel}
            </label>
            <p className="text-xs text-stone-500">{s.dataHint}</p>

            {isConfirmingClear ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
                <div className="flex items-start gap-2 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{s.clearDataConfirm}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-cancel-clear-data"
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-bold transition-all"
                  >
                    {s.clearDataCancelButton}
                  </button>
                  <button
                    id="btn-confirm-clear-data"
                    type="button"
                    onClick={() => {
                      onClearAllData();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                  >
                    {s.clearDataConfirmButton}
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-clear-all-data"
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="w-full mt-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
              >
                {s.clearDataButton}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800"
          >
            {s.close}
          </button>
        </div>
      </div>
    </div>
  );
};
