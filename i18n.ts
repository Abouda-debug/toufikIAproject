/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Détecte la langue du téléphone/navigateur. 
// Si l'utilisateur est en français -> 'fr', sinon -> 'en' par défaut.
export function detectLanguage(): 'fr' | 'en' {
  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  return browserLang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export const translations = {
  fr: {
    sortedByDate: 'Aliments triés par date la plus proche',
    article: 'article',
    articles: 'articles',
    noMatchFilter: 'Aucun produit ne correspond aux filtres',
    emptyFridge: 'Votre frigo et placards sont vides',
    tryDifferentSearch: 'Essayez de modifier votre terme de recherche ou de réinitialiser le filtre.',
    emptyStateHint: 'Appuyez sur le bouton "+" pour prendre en photo un emballage alimentaire. L\u2019IA Gemini extraira automatiquement la date !',
    scanPackage: 'Scanner un emballage',
    manualAdd: 'Ajout manuel',
    quickEntry: 'Saisie rapide',
    scanButton: 'Scanner emballage',
    savedFromWaste: (name: string) => `🎉 "${name}" sauvé du gaspillage !`,
    markedDiscarded: (name: string) => `🗑️ "${name}" marqué comme jeté.`,
    productUpdated: (name: string) => `Produit "${name}" mis à jour !`,
    productSaved: (name: string) => `Produit "${name}" enregistré avec succès !`,
    dataReset: 'Données réinitialisées avec succès.',
    productRestored: 'Produit restauré dans votre stock actif.',
  },
  en: {
    sortedByDate: 'Items sorted by closest expiry date',
    article: 'item',
    articles: 'items',
    noMatchFilter: 'No products match the filters',
    emptyFridge: 'Your fridge and pantry are empty',
    tryDifferentSearch: 'Try changing your search term or resetting the filter.',
    emptyStateHint: 'Tap the "+" button to photograph a food package. Gemini AI will automatically extract the date!',
    scanPackage: 'Scan a package',
    manualAdd: 'Manual entry',
    quickEntry: 'Quick entry',
    scanButton: 'Scan package',
    savedFromWaste: (name: string) => `🎉 "${name}" saved from waste!`,
    markedDiscarded: (name: string) => `🗑️ "${name}" marked as discarded.`,
    productUpdated: (name: string) => `Product "${name}" updated!`,
    productSaved: (name: string) => `Product "${name}" saved successfully!`,
    dataReset: 'Data reset successfully.',
    productRestored: 'Product restored to your active stock.',
  },
};

export function useTranslations() {
  const lang = detectLanguage();
  return { t: translations[lang], lang };
}