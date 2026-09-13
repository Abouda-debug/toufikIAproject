import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Refrigerator,
  Tag,
  Package,
  Layers,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { ProductItem, ProductCategory, StorageLocation, DateType, ExtractedProductData } from '../types';
import {
  getExpirationUrgency,
  getUrgencyStyles,
  formatDaysRemainingText,
  formatDateFrench,
  getRelativeDateISO,
} from '../utils/dateUtils';

interface ConfirmationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<ProductItem, 'id' | 'status' | 'createdAt'>, existingId?: string) => void;
  initialData?: ExtractedProductData | null;
  editingProduct?: ProductItem | null;
  onRetakePhoto: () => void;
}

export const ConfirmationFormModal: React.FC<ConfirmationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  editingProduct,
  onRetakePhoto,
}) => {
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [dateType, setDateType] = useState<DateType>('DLC');
  const [category, setCategory] = useState<ProductCategory>('cremerie');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('frigo');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState<number>(0.9);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchroniser l'état selon initialData ou editingProduct
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
      setConfidence(editingProduct.confidence || 0.9);
      setErrorMsg(null);
    } else if (initialData) {
      setName(initialData.productName || '');
      setExpirationDate(initialData.expirationDate || getRelativeDateISO(3));
      setDateType(initialData.dateType || 'DLC');
      setCategory(initialData.category || 'cremerie');
      setStorageLocation(initialData.storageLocation || 'frigo');
      setBrand(initialData.brand || '');
      setQuantity(1);
      setNotes('');
      setConfidence(initialData.confidence);
      setErrorMsg(initialData.error || null);
    } else {
      // Formulaire vierge pour ajout manuel rapide
      setName('');
      setExpirationDate(getRelativeDateISO(3));
      setDateType('DLC');
      setCategory('cremerie');
      setStorageLocation('frigo');
      setBrand('');
      setQuantity(1);
      setNotes('');
      setConfidence(1.0);
      setErrorMsg(null);
    }
  }, [initialData, editingProduct, isOpen]);

  if (!isOpen) return null;

  // Règle stricte du cahier des charges :
  // "Si confiance < 0.5 ou erreur non-null, affiche un bandeau d'alerte invitant a verifier/reprendre la photo"
  const isAlertNeeded = (confidence !== undefined && confidence < 0.5) || Boolean(errorMsg);

  // Urgence en direct selon la date sélectionnée
  const currentUrgency = getExpirationUrgency(expirationDate);
  const currentStyles = getUrgencyStyles(currentUrgency);
  const daysRemainingText = formatDaysRemainingText(expirationDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expirationDate) return;

    onSave(
      {
        name: name.trim(),
        expirationDate,
        dateType,
        category,
        storageLocation,
        brand: brand.trim() || undefined,
        quantity: Math.max(1, quantity),
        confidence,
        rawDateText: initialData?.rawDateText,
        notes: notes.trim() || undefined,
      },
      editingProduct?.id
    );
  };

  const handleQuickDate = (offsetDays: number) => {
    setExpirationDate(getRelativeDateISO(offsetDays));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              {editingProduct ? '✏️' : '✓'}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {editingProduct ? 'Modifier le produit' : 'Confirmation du produit'}
              </h2>
              <p className="text-xs text-stone-500">
                {editingProduct ? 'Ajustez les détails' : 'Champs pré-remplis par scan IA (< 10s)'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-confirmation"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* BANDEAU D'ALERTE : Spécification 3 (confiance < 0.5 ou erreur non-nulle) */}
          {isAlertNeeded && (
            <div
              id="alert-low-confidence"
              className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex flex-col gap-2.5 animate-in slide-in-from-top-2"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-xs uppercase tracking-wide text-amber-800">
                    Avertissement de fiabilité
                  </p>
                  <p className="text-xs text-amber-900 mt-0.5">
                    {errorMsg ||
                      `La date sur l'emballage est incertaine ou difficile à lire (score de confiance : ${(
                        confidence * 100
                      ).toFixed(0)}%).`}
                  </p>
                  <p className="text-xs font-semibold text-amber-950 mt-1">
                    Veuillez vérifier la date pré-remplie ci-dessous ou reprendre la photo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btn-retake-photo"
                  onClick={onRetakePhoto}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reprendre la photo
                </button>
                <span className="text-[11px] text-amber-700">ou corriger manuellement</span>
              </div>
            </div>
          )}

          {/* Aperçu direct du code couleur qui sera attribué */}
          <div className={`p-3 rounded-2xl border ${currentStyles.badgeBg} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${currentStyles.dotColor}`} />
              <div>
                <span className="text-xs font-bold block">{currentStyles.label}</span>
                <span className="text-[11px] opacity-90">{daysRemainingText}</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold">{formatDateFrench(expirationDate)}</span>
          </div>

          {/* Champ : Nom du produit */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nom du produit *
            </label>
            <input
              id="input-product-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Yaourt nature Activia x4"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
          </div>

          {/* Champ : Date de péremption & Raccourcis rapides */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                Date de péremption *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDateType('DLC')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    dateType === 'DLC'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  DLC (stricte)
                </button>
                <button
                  type="button"
                  onClick={() => setDateType('DDM')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    dateType === 'DDM'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  DDM (indicative)
                </button>
              </div>
            </div>

            <input
              id="input-expiration-date"
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />

            {/* Raccourcis temporels pour ajout rapide (< 10s) */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px]">
              <span className="text-stone-400 shrink-0 font-medium">Rapide :</span>
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 whitespace-nowrap"
              >
                Demain (+1j)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(3)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 whitespace-nowrap"
              >
                Dans 3j
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(7)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 whitespace-nowrap"
              >
                1 semaine (+7j)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(14)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 whitespace-nowrap"
              >
                2 semaines (+14j)
              </button>
            </div>
          </div>

          {/* Emplacement de stockage (Frigo, Placard, Congélateur) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Emplacement de conservation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-loc-frigo"
                onClick={() => setStorageLocation('frigo')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  storageLocation === 'frigo'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Refrigerator className="w-3.5 h-3.5 text-blue-600" />
                Frigo
              </button>
              <button
                type="button"
                id="btn-loc-placard"
                onClick={() => setStorageLocation('placard')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  storageLocation === 'placard'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-600" />
                Placard
              </button>
              <button
                type="button"
                id="btn-loc-congelateur"
                onClick={() => setStorageLocation('congelateur')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  storageLocation === 'congelateur'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                ❄️ Congélateur
              </button>
            </div>
          </div>

          {/* Marque & Catégorie */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Marque (optionnel)
              </label>
              <input
                id="input-product-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Danone, Herta"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Catégorie
              </label>
              <select
                id="select-product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                <option value="cremerie">Crèmerie / Laitage</option>
                <option value="viande_poisson">Viande & Poisson</option>
                <option value="fruits_legumes">Fruits & Légumes</option>
                <option value="plats_prepares">Plat cuisiné</option>
                <option value="epicerie">Épicerie</option>
                <option value="boissons">Boissons</option>
                <option value="boulangerie">Pain & Pâtisserie</option>
                <option value="surgeles">Surgelés</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Quantité & Note */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Quantité
              </label>
              <input
                id="input-product-quantity"
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Notes / Précision
              </label>
              <input
                id="input-product-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: ouvert hier, étage 2"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
          </div>

          {/* Bouton de confirmation principal : Moins de 10 secondes */}
          <div className="pt-2">
            <button
              id="btn-confirm-save-product"
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/15 transition-all"
            >
              <Check className="w-5 h-5" />
              {editingProduct ? 'Enregistrer les modifications' : 'Enregistrer le produit (1 clic)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
