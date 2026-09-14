export type ExpirationUrgency = 'urgent' | 'warning' | 'safe' | 'expired';

export type ProductStatus = 'active' | 'consumed' | 'discarded';

export type DateType = 'DLC' | 'DDM' | 'UNKNOWN';

export type StorageLocation = 'frigo' | 'placard' | 'congelateur';

export type ProductCategory = 
  | 'frais'
  | 'sec'
  | 'surgele'
  | 'boisson'
  | 'autre'
  | 'cremerie'
  | 'viande_poisson'
  | 'fruits_legumes'
  | 'plats_prepares'
  | 'epicerie'
  | 'boissons'
  | 'boulangerie'
  | 'surgeles';

export interface GeminiExtractionResponse {
  nom_produit: string | null;
  date_peremption: string | null;
  categorie: 'frais' | 'sec' | 'surgele' | 'boisson' | 'autre';
  confiance: number;
  erreur: string | null;
}

export interface ProductItem {
  id: string;
  name: string;
  expirationDate: string; // ISO format: YYYY-MM-DD
  dateType: DateType;
  category: ProductCategory;
  storageLocation: StorageLocation;
  brand?: string;
  quantity: number;
  confidence?: number;
  rawDateText?: string;
  status: ProductStatus;
  createdAt: string;
  resolvedAt?: string;
  notes?: string;
  imageThumbnail?: string;
}

export interface ExtractedProductData {
  productName: string;
  expirationDate: string;
  dateType?: DateType;
  category?: ProductCategory;
  storageLocation?: StorageLocation;
  brand?: string;
  confidence: number;
  rawDateText?: string;
  error?: string;
}

export interface ScheduledReminder {
  id: string;
  productId: string;
  productName: string;
  expirationDate: string;
  type: `J-${number}` | 'J-0';
  scheduledDate: string;
  isTriggered: boolean;
  message: string;
}

export interface AntiWasteStats {
  totalSaved: number;
  totalDiscarded: number;
  activeCount: number;
  savedPercentage: number;
  estimatedMoneySaved: number;
}
