import { ProductItem, AntiWasteStats } from '../types';
import { getRelativeDateISO } from '../utils/dateUtils';

const STORAGE_KEY = 'nowaste_products_v1';
const STATS_KEY = 'nowaste_stats_v1';

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Yaourt nature Activia (x4)',
    expirationDate: getRelativeDateISO(1), // Demain -> Rouge
    dateType: 'DLC',
    category: 'cremerie',
    storageLocation: 'frigo',
    brand: 'Danone',
    quantity: 1,
    confidence: 0.96,
    rawDateText: `${getRelativeDateISO(1)} A CONSOMMER JUSQU'AU`,
    status: 'active',
    createdAt: new Date().toISOString(),
    notes: 'À finir pour le petit-déjeuner',
  },
  {
    id: 'prod-2',
    name: 'Jambon supérieur sans nitrite',
    expirationDate: getRelativeDateISO(2), // Dans 2 jours -> Rouge
    dateType: 'DLC',
    category: 'viande_poisson',
    storageLocation: 'frigo',
    brand: 'Fleury Michon',
    quantity: 1,
    confidence: 0.94,
    rawDateText: `DLC ${getRelativeDateISO(2)}`,
    status: 'active',
    createdAt: new Date().toISOString(),
    notes: 'Frigo étagère du milieu',
  },
  {
    id: 'prod-3',
    name: 'Salade mâche fraîche prête à l’emploi',
    expirationDate: getRelativeDateISO(4), // Dans 4 jours -> Orange
    dateType: 'DLC',
    category: 'fruits_legumes',
    storageLocation: 'frigo',
    brand: 'Bonduelle',
    quantity: 1,
    confidence: 0.92,
    rawDateText: `A consommer jusqu'au ${getRelativeDateISO(4)}`,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Crème fraîche épaisse 30% MG',
    expirationDate: getRelativeDateISO(6), // Dans 6 jours -> Orange
    dateType: 'DLC',
    category: 'cremerie',
    storageLocation: 'frigo',
    brand: 'Président',
    quantity: 1,
    confidence: 0.95,
    rawDateText: `DLC ${getRelativeDateISO(6)}`,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Lait demi-écrémé GrandLait (1L)',
    expirationDate: getRelativeDateISO(14), // Dans 14 jours -> Vert
    dateType: 'DDM',
    category: 'cremerie',
    storageLocation: 'placard',
    brand: 'Candia',
    quantity: 2,
    confidence: 0.98,
    rawDateText: `DDM ${getRelativeDateISO(14)}`,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Pavés de saumon frais d’Écosse',
    expirationDate: getRelativeDateISO(0), // Aujourd'hui -> Rouge
    dateType: 'DLC',
    category: 'viande_poisson',
    storageLocation: 'frigo',
    brand: 'Poissonnerie',
    quantity: 1,
    confidence: 0.89,
    rawDateText: `A consommer ce jour`,
    status: 'active',
    createdAt: new Date().toISOString(),
    notes: 'À cuisiner impérativement ce soir !',
  },
  // Produits déjà sauvés pour afficher les stats
  {
    id: 'prod-saved-1',
    name: 'Pâte brisée pur beurre',
    expirationDate: getRelativeDateISO(-2),
    dateType: 'DLC',
    category: 'epicerie',
    storageLocation: 'frigo',
    brand: 'Herta',
    quantity: 1,
    status: 'consumed',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'prod-saved-2',
    name: 'Mozzarella di Bufala Campana',
    expirationDate: getRelativeDateISO(-3),
    dateType: 'DLC',
    category: 'cremerie',
    storageLocation: 'frigo',
    brand: 'Galbani',
    quantity: 1,
    status: 'consumed',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'prod-saved-3',
    name: 'Houmous au sésame grillé',
    expirationDate: getRelativeDateISO(-4),
    dateType: 'DLC',
    category: 'plats_prepares',
    storageLocation: 'frigo',
    brand: 'Blini',
    quantity: 1,
    status: 'consumed',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }
];

export function getStoredProducts(): ProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Première ouverture : initialisation avec données de démo réalistes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur lecture localStorage products:', e);
    return INITIAL_PRODUCTS;
  }
}

export function saveProductsToStorage(products: ProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Erreur sauvegarde localStorage products:', e);
  }
}

// Barème moyen officiel par catégorie d'aliment (Source : moyennes INSEE / ADEME anti-gaspillage)
export const CATEGORY_PRICE_RATES: Record<string, { label: string; price: number }> = {
  viande_poisson: { label: 'Viandes & Poissons', price: 4.80 },
  cremerie: { label: 'Crèmerie & Produits laitiers', price: 2.60 },
  surgele: { label: 'Surgelés', price: 3.90 },
  surgeles: { label: 'Surgelés', price: 3.90 },
  plats_prepares: { label: 'Plats préparés & Traiteur', price: 3.70 },
  fruits_legumes: { label: 'Fruits & Légumes frais', price: 2.20 },
  boulangerie: { label: 'Boulangerie & Pâtes', price: 1.90 },
  boisson: { label: 'Boissons & Jus', price: 2.10 },
  boissons: { label: 'Boissons & Jus', price: 2.10 },
  epicerie: { label: 'Épicerie & Conserves', price: 2.40 },
  sec: { label: 'Épicerie sèche', price: 2.40 },
  frais: { label: 'Rayon Frais', price: 3.20 },
  autre: { label: 'Autre alimentation', price: 2.80 },
};

export function getProductEstimatedPrice(category: string): number {
  return CATEGORY_PRICE_RATES[category]?.price ?? CATEGORY_PRICE_RATES.autre.price;
}

export function calculateAntiWasteStats(products: ProductItem[]): AntiWasteStats {
  const activeCount = products.filter((p) => p.status === 'active').length;
  const savedItems = products.filter((p) => p.status === 'consumed');
  const discardedItems = products.filter((p) => p.status === 'discarded');

  const totalSaved = savedItems.length;
  const totalDiscarded = discardedItems.length;
  const totalResolved = totalSaved + totalDiscarded;
  
  const savedPercentage = totalResolved > 0 ? Math.round((totalSaved / totalResolved) * 100) : 100;
  
  // Calcul précis selon le barème moyen de chaque catégorie d'aliment (Option A)
  const estimatedMoneySaved = savedItems.reduce((acc, p) => {
    const unitPrice = getProductEstimatedPrice(p.category);
    const qty = p.quantity && p.quantity > 0 ? p.quantity : 1;
    return acc + (unitPrice * qty);
  }, 0);

  return {
    totalSaved,
    totalDiscarded,
    activeCount,
    savedPercentage,
    estimatedMoneySaved,
  };
}
