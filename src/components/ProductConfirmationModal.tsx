import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
  Calendar,
  Check,
  Package,
  Refrigerator,
  Snowflake,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { ProductItem, ExtractedProductData, ProductCategory, StorageLocation, DateType } from '../types';
import { getExpirationUrgency, getUrgencyStyles, getDaysDifference, formatDateFrench } from '../utils/dateUtils';
import { useTranslations } from '../i18n';

interface ProductConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<ProductItem, 'id' | 'createdAt'>) => void;
  initialData?: ExtractedProductData | null;
  editingProduct?: ProductItem | null;
  onRetakePhoto?: () => void;
  imagePreview?: string;
}

const CATEGORY_IDS: ProductCategory[] = [
  'frais',
  'sec',
  'surgele',
  'boisson',
  'autre',
  'cremerie',
  'viande_poisson',
  'fruits_legumes',
  'plats_prepares',
  'epicerie',
  'surgeles',
];

export const ProductConfirmationModal: React.FC<ProductConfirmationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  editingProduct,
  onRetakePhoto,
  imagePreview,
}) => {
  const { t, lang } = useTranslations();
  const f = t.confirmation;
  const CATEGORIES = CATEGORY_IDS.map((id) => ({ id, label: t.categories[id] }));
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [dateType, setDateType] = useState<DateType>('DLC');
  const [category, setCategory] = useState<ProductCategory>('frais');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('frigo');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Confidence & Error verification
  const confidence = initialData?.confidence ?? (editingProduct?.confidence ?? 1);
  const hasError = !!initialData?.error;
  const isLowConfidence = confidence < 0.5 || hasError;

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setExpirationDate(editingProduct.expirationDate);
      setDateType(editingProduct.dateType || 'DLC');
      setCategory(editingProduct.category || 'cremerie');
      setStorageLocation(editingProduct.storageLocation || 'frigo');
      setBrand(editingProduct.brand || '');
      setQuantity(editingProduct.quantity || 1);
      setNotes(editingProduct.notes || '');
    } else if (initialData) {
      setName(initialData.productName || '');
      setExpirationDate(initialData.expirationDate || '');
      setDateType(initialData.dateType || 'DLC');
      setCategory(initialData.category || 'cremerie');
      setStorageLocation(initialData.storageLocation || 'frigo');
      setBrand(initialData.brand || '');
      setQuantity(1);
      setNotes(initialData.rawDateText ? f.readOnPackage(initialData.rawDateText) : '');
    } else {
      // Formulaire vide
      setName('');
      // Par défaut dans 5 jours
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 5);
      setExpirationDate(defaultDate.toISOString().split('T')[0]);
      setDateType('DLC');
      setCategory('cremerie');
      setStorageLocation('frigo');
      setBrand('');
      setQuantity(1);
      setNotes('');
    }
  }, [initialData, editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      expirationDate: expirationDate || new Date().toISOString().split('T')[0],
      dateType,
      category,
      storageLocation,
      brand: brand.trim() || undefined,
      quantity: Math.max(1, quantity),
      confidence,
      rawDateText: initialData?.rawDateText,
      status: 'active',
      notes: notes.trim() || undefined,
      imageThumbnail: imagePreview,
    });
  };

  const urgency = expirationDate ? getExpirationUrgency(expirationDate) : 'safe';
  const urgencyStyles = getUrgencyStyles(urgency, lang);
  const daysDiff = expirationDate ? getDaysDifference(expirationDate) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              {editingProduct ? <Calendar className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-emerald-700" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {editingProduct ? f.titleEdit : f.titleConfirm}
              </h2>
              <p className="text-xs text-stone-500">
                {editingProduct ? f.subtitleEdit : f.subtitleConfirm}
              </p>
            </div>
          </div>
          <button
            id="btn-close-confirmation-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Bandeau d'alerte obligatoire si confiance < 0.5 ou erreur */}
          {isLowConfidence && !editingProduct && (
            <div
              id="alert-low-confidence"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-amber-950 text-sm">
                    {f.verificationRecommended}
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    {initialData?.error || f.lowConfidenceGeneric(Math.round(confidence * 100))}
                  </p>
                </div>
              </div>

              {onRetakePhoto && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    id="btn-retake-photo"
                    onClick={onRetakePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {f.retakePhoto}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Miniature aperçu si disponible */}
          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 max-h-36 flex items-center justify-center">
              <img
                src={imagePreview}
                alt={f.scannedPackageAlt}
                className="w-full h-36 object-contain"
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded-full">
                {f.scannedPackage}
              </span>
            </div>
          )}

          {/* Champ 1 : Nom du produit */}
          <div>
            <label htmlFor="input-product-name" className="block text-xs font-bold text-stone-700 mb-1">
              {f.nameLabel}
            </label>
            <input
              id="input-product-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={f.namePlaceholder}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
          </div>

          {/* Champ 2 : Date de péremption avec prévisualisation du code couleur */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="input-expiration-date" className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-500" />
                {f.expirationLabel}
              </label>
              {/* Badge code couleur dynamique */}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${urgencyStyles.badgeBg}`}>
                {urgencyStyles.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                id="input-expiration-date"
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />

              {/* Sélecteur de type : DLC ou DDM */}
              <div className="flex rounded-xl overflow-hidden border border-stone-200 bg-stone-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  id="btn-select-dlc"
                  onClick={() => setDateType('DLC')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    dateType === 'DLC'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title={f.dlcTitle}
                >
                  {f.dlcOption}
                </button>
                <button
                  type="button"
                  id="btn-select-ddm"
                  onClick={() => setDateType('DDM')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    dateType === 'DDM'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title={f.ddmTitle}
                >
                  {f.ddmOption}
                </button>
              </div>
            </div>

            {expirationDate && (
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {daysDiff === 0
                    ? f.expiresToday
                    : daysDiff > 0
                    ? f.expiresInDays(daysDiff, formatDateFrench(expirationDate, lang))
                    : f.expiredSince(Math.abs(daysDiff))}
                </span>
              </p>
            )}
          </div>

          {/* Emplacement de stockage : Frigo, Placard, Congélateur */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {f.storageQuestion}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-storage-frigo"
                onClick={() => setStorageLocation('frigo')}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                  storageLocation === 'frigo'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Refrigerator className="w-4 h-4 text-blue-600" />
                <span>{t.storageLocations.frigo}</span>
              </button>

              <button
                type="button"
                id="btn-storage-placard"
                onClick={() => setStorageLocation('placard')}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                  storageLocation === 'placard'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Package className="w-4 h-4 text-amber-600" />
                <span>{t.storageLocations.placard}</span>
              </button>

              <button
                type="button"
                id="btn-storage-congelateur"
                onClick={() => setStorageLocation('congelateur')}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                  storageLocation === 'congelateur'
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Snowflake className="w-4 h-4 text-cyan-600" />
                <span>{t.storageLocations.congelateur}</span>
              </button>
            </div>
          </div>

          {/* Catégorie & Marque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-category" className="block text-xs font-bold text-stone-700 mb-1">
                {f.categoryLabel}
              </label>
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="input-brand" className="block text-xs font-bold text-stone-700 mb-1">
                {f.brandLabel}
              </label>
              <input
                id="input-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={f.brandPlaceholder}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
          </div>

          {/* Notes complémentaires */}
          <div>
            <label htmlFor="input-notes" className="block text-xs font-bold text-stone-700 mb-1">
              {f.notesLabel}
            </label>
            <input
              id="input-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={f.notesPlaceholder}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          {/* Bouton de validation rapide */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-save-product"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Check className="w-5 h-5" />
              {editingProduct ? f.saveEdit : f.saveNew}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
