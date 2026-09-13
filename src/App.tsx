/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Camera,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ProductItem,
  ExtractedProductData,
  ScheduledReminder,
} from './types';
import {
  getStoredProducts,
  saveProductsToStorage,
  calculateAntiWasteStats,
  INITIAL_PRODUCTS,
} from './data/productStorage';
import {
  getDaysDifference,
  getExpirationUrgency,
  formatDateFrench,
} from './utils/dateUtils';
import {
  getScheduledReminders,
  sendLocalNotification,
} from './utils/notificationService';
import { TopAppBar } from './components/TopAppBar';
import { AntiWasteHeader } from './components/AntiWasteHeader';
import { ProductCard } from './components/ProductCard';
import { CameraScanModal } from './components/CameraScanModal';
import { ProductConfirmationModal } from './components/ProductConfirmationModal';
import { NotificationsModal } from './components/NotificationsModal';
import { StatsModal } from './components/StatsModal';
import { useTranslations } from './i18n';
const { t } = useTranslations();
export default function App() {
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'warning' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Transient data for confirmation & editing
  const [extractedData, setExtractedData] = useState<ExtractedProductData | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | undefined>(undefined);

  // In-app alert banner / toast for instant feedback
  const [activeToast, setActiveToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // Save to persistent local storage on every change
  useEffect(() => {
    saveProductsToStorage(products);
  }, [products]);

  // Toast auto-dismiss
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setActiveToast({ id: Date.now().toString(), message, type });
  };

  // Anti-waste statistics calculation
  const stats = useMemo(() => calculateAntiWasteStats(products), [products]);

  // Active products strictly sorted by closest expiration date (Requirement 1)
  const activeProductsSorted = useMemo(() => {
    const active = products.filter((p) => p.status === 'active');
    return active.sort((a, b) => {
      // Comparer par date d'expiration croissante (la plus proche d'abord)
      return a.expirationDate.localeCompare(b.expirationDate);
    });
  }, [products]);

  // Counts by color code
  const counts = useMemo(() => {
    let urgent = 0; // <= 2 jours (Rouge)
    let warning = 0; // <= 7 jours (Orange)
    let safe = 0; // > 7 jours (Vert)

    for (const p of activeProductsSorted) {
      const urgency = getExpirationUrgency(p.expirationDate);
      if (urgency === 'urgent' || urgency === 'expired') urgent++;
      else if (urgency === 'warning') warning++;
      else safe++;
    }

    return { urgent, warning, safe, total: activeProductsSorted.length };
  }, [activeProductsSorted]);

  // Scheduled reminders list (J-3 and J-0)
  const scheduledReminders = useMemo(() => {
    return getScheduledReminders(products);
  }, [products]);

  // Filtered products based on category chips and search term
  const displayedProducts = useMemo(() => {
    return activeProductsSorted.filter((product) => {
      // Filtre par catégorie de date / urgence
      if (activeFilter !== 'all') {
        const urgency = getExpirationUrgency(product.expirationDate);
        if (activeFilter === 'urgent' && urgency !== 'urgent' && urgency !== 'expired') return false;
        if (activeFilter === 'warning' && urgency !== 'warning') return false;
        if (activeFilter === 'safe' && urgency !== 'safe') return false;
      }

      // Filtre par recherche textuelle
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesCategory) return false;
      }

      return true;
    });
  }, [activeProductsSorted, activeFilter, searchQuery]);

  // Actions: Swipe to Mark "Consommé" (Sauvé !)
  const handleMarkConsumed = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'consumed', resolvedAt: new Date().toISOString() }
          : p
      )
    );
    showToast(t.savedFromWaste(target?.name || 'Produit'), 'success');
  };

  // Actions: Swipe to Mark "Jeté"
  const handleMarkDiscarded = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'discarded', resolvedAt: new Date().toISOString() }
          : p
      )
    );
    showToast(t.markedDiscarded(target?.name || 'Produit'), 'warning');
  };

  // Actions: Start Camera Scan
  const handleOpenScanner = () => {
    setExtractedData(null);
    setEditingProduct(null);
    setCapturedImagePreview(undefined);
    setIsCameraOpen(true);
  };

  // Actions: Callback when camera scan succeeds
  const handleScanComplete = (
    data: ExtractedProductData,
    imagePreview?: string
  ) => {
    setIsCameraOpen(false);
    setExtractedData(data);
    setEditingProduct(null);
    setCapturedImagePreview(imagePreview);
    setIsConfirmationOpen(true);
  };

  // Actions: Manual Add without camera
  const handleManualAdd = () => {
    setIsCameraOpen(false);
    setExtractedData(null);
    setEditingProduct(null);
    setCapturedImagePreview(undefined);
    setIsConfirmationOpen(true);
  };

  // Actions: Edit existing product
  const handleEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setExtractedData(null);
    setCapturedImagePreview(product.imageThumbnail);
    setIsConfirmationOpen(true);
  };

  // Actions: Save confirmed product (from scan or manual add)
 const handleSaveProduct = (productData: Omit<ProductItem, 'id' | 'createdAt'>) => {
  if (editingProduct) {
    setProducts((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? { ...p, ...productData } : p))
    );
    showToast(t.productUpdated(productData.name), 'success');
  } else {
    const newProduct: ProductItem = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(t.productSaved(productData.name), 'success');
  }
  setIsConfirmationOpen(false);
        ...productData,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Produit "${productData.name}" enregistré avec succès !`, 'success');
    }
    setIsConfirmationOpen(false);
    }
    setIsConfirmationOpen(false);
    setEditingProduct(null);
    setExtractedData(null);
  };

  // Actions: Retake photo
  const handleRetakePhoto = () => {
    setIsConfirmationOpen(false);
    setIsCameraOpen(true);
  };

  // Actions: Reset with initial demo data
  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setIsStatsOpen(false);
    showToast(t.dataReset, 'info');
  };

  // Actions: Restore a consumed or discarded product back to active
  const handleRestoreProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'active', resolvedAt: undefined } : p))
    );
    showToast(t.productRestored, 'info');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col font-['Plus_Jakarta_Sans',system-ui,-apple-system,sans-serif] text-[#191C1A]">
      {/* Top Application Bar (Clean Jetpack Compose style) */}
      <TopAppBar
        stats={stats}
        urgentCount={counts.urgent}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Main Content View (Single-View Constraint, highly focused) */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pb-28 pt-2">
        {/* Anti-Waste Impact & Color-Code Filter Header */}
        <AntiWasteHeader
          stats={stats}
          urgentCount={counts.urgent}
          warningCount={counts.warning}
          safeCount={counts.safe}
          totalActiveCount={counts.total}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Section Title & Quick Action info */}
        <div className="flex items-center justify-between mt-5 mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>{t.sortedByDate}</span>
          </h2>
          <span className="text-xs text-stone-400 font-medium">
            {displayedProducts.length > 1 ? t.articles : t.article}
          </span>
        </div>

        {/* Product Items List (Requirement 1: Sorted by closest expiration date with color codes) */}
        {displayedProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center space-y-3 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {searchQuery || activeFilter !== 'all'
                  ? 'Aucun produit ne correspond aux filtres'
                  : t.emptyFridge}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                {searchQuery || activeFilter !== 'all'
                 ? t.tryDifferentSearch
: t.emptyStateHint}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                id="btn-empty-scan"
                onClick={handleOpenScanner}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-sm"
              >
                <Camera className="w-4 h-4" />
                {t.scanPackage}
              </button>
              <button
                id="btn-empty-manual"
                onClick={handleManualAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-all"
              >
                {t.manualAdd}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onMarkConsumed={handleMarkConsumed}
                onMarkDiscarded={handleMarkDiscarded}
                onEdit={handleEditProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* Jetpack Compose Style Floating Action Button (FAB) (Requirement 2: Bouton flottant '+' qui ouvre la caméra) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Secondary quick manual add button */}
        <button
          id="btn-quick-manual-add"
          onClick={handleManualAdd}
          title="Ajout rapide manuel"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-3 rounded-full bg-white text-stone-700 hover:text-stone-900 font-bold text-xs shadow-lg shadow-stone-900/10 border border-stone-200 hover:bg-stone-50 active:scale-95 transition-all"
        >
          <span>{t.quickEntry}</span>
        </button>

        {/* Main Floating Action Button (FAB) */}
        <button
          id="fab-add-product"
          onClick={handleOpenScanner}
          aria-label="Prendre en photo un emballage pour ajouter un produit"
          className="group relative flex items-center gap-2 px-4 py-3.5 sm:px-5 sm:py-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-950/20 active:scale-95 transition-all"
        >
          <Camera className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="font-extrabold tracking-tight">{t.scanButton}</span>
                   <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
            +
          </span>
        </button>
      </div>

      {/* In-app Toast / Notification feedback */}
      {activeToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/95 backdrop-blur-md text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm w-full mx-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 truncate">{activeToast.message}</span>
          <button
            onClick={() => setActiveToast(null)}
            className="text-stone-400 hover:text-white p-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Modals */}
      <CameraScanModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanComplete={handleScanComplete}
        onManualAdd={handleManualAdd}
      />

      <ProductConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          setEditingProduct(null);
          setExtractedData(null);
        }}
        onSave={handleSaveProduct}
        initialData={extractedData}
        editingProduct={editingProduct}
        onRetakePhoto={handleRetakePhoto}
        imagePreview={capturedImagePreview}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        reminders={scheduledReminders}
        onTriggerSimulatedAlert={(reminder) => {
          showToast(`🔔 Alerte ${reminder.type} : "${reminder.productName}" !`, 'warning');
        }}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        products={products}
        onResetData={handleResetData}
        onRestoreProduct={handleRestoreProduct}
      />
    </div>
  );
}
