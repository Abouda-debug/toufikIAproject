import React from 'react';
import { X, Settings, Bell, Check } from 'lucide-react';
import { useTranslations } from '../i18n';
import { REMINDER_DELAY_OPTIONS } from '../utils/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderDaysBefore: number;
  onChangeReminderDays: (days: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  reminderDaysBefore,
  onChangeReminderDays,
}) => {
  const { t } = useTranslations();
  const s = t.settings;

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
