import React, { useState } from 'react';
import { ChefHat, Sparkles } from 'lucide-react';
import { useTranslations } from '../i18n';
import { API_BASE_URL } from '../config';

interface RecipeSuggestion {
  title: string;
  recipe: string;
}

interface RecipeSuggestionCardProps {
  productNames: string[];
}

export const RecipeSuggestionCard: React.FC<RecipeSuggestionCardProps> = ({ productNames }) => {
  const { t, lang } = useTranslations();
  const r = t.recipe;
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<RecipeSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (productNames.length === 0) return null;

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/suggest-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productNames, lang }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || r.errorGeneric);
      }
      setSuggestion(result.data);
    } catch {
      setError(r.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 mt-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-amber-950">{r.cardTitle}</h3>
          <p className="text-xs text-amber-700">{r.cardHint(productNames.length)}</p>
        </div>
      </div>

      {suggestion && (
        <div className="bg-white/70 rounded-xl p-3 text-stone-800 space-y-1 animate-in fade-in">
          <p className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {suggestion.title}
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-line text-stone-700">
            {suggestion.recipe}
          </p>
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-rose-700 font-medium">{error}</p>
      )}

      <button
        id="btn-suggest-recipe"
        onClick={fetchSuggestion}
        disabled={loading}
        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
      >
        <ChefHat className="w-3.5 h-3.5" />
        {loading ? r.loading : suggestion ? r.tryAgain : r.suggestButton}
      </button>
    </div>
  );
};
