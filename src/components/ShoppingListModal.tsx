import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Trash2, Check } from 'lucide-react';
import { useTranslations } from '../i18n';
import { ShoppingListItem } from '../data/shoppingListStorage';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingListItem[];
  onAddItem: (name: string) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearChecked: () => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  items,
  onAddItem,
  onToggleItem,
  onRemoveItem,
  onClearChecked,
}) => {
  const { t } = useTranslations();
  const s = t.shoppingList;
  const [draft, setDraft] = useState('');

  if (!isOpen) return null;

  const uncheckedCount = items.filter((item) => !item.checked).length;
  const hasCheckedItems = items.some((item) => item.checked);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddItem(draft);
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {s.title}
              </h2>
              <p className="text-xs text-stone-500">{s.subtitle(uncheckedCount)}</p>
            </div>
          </div>
          <button
            id="btn-close-shopping-list-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add item form */}
        <form onSubmit={handleAdd} className="p-4 border-b border-stone-100 flex items-center gap-2">
          <input
            id="input-shopping-list-item"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={s.addPlaceholder}
            className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
          />
          <button
            id="btn-add-shopping-item"
            type="submit"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-xs bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
              <p className="font-semibold text-stone-500">{s.empty}</p>
              <p>{s.emptyHint}</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                  item.checked
                    ? 'bg-stone-50 border-stone-200'
                    : 'bg-white border-stone-200'
                }`}
              >
                <button
                  id={`btn-toggle-item-${item.id}`}
                  onClick={() => onToggleItem(item.id)}
                  className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    item.checked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-stone-300 text-transparent hover:border-emerald-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`flex-1 text-sm truncate ${
                    item.checked ? 'text-stone-400 line-through' : 'text-stone-800 font-medium'
                  }`}
                >
                  {item.name}
                </span>
                <button
                  id={`btn-remove-item-${item.id}`}
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-full text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
          <button
            id="btn-clear-checked-items"
            onClick={onClearChecked}
            disabled={!hasCheckedItems}
            className="text-xs font-semibold text-stone-500 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-stone-500 transition-colors"
          >
            {s.clearChecked}
          </button>
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
