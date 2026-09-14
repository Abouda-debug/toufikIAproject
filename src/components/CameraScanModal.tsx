import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  Upload,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  Scan,
  ExternalLink,
  Video,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SAMPLE_PACKAGES, SamplePackaging } from '../data/samplePackages';
import { ExtractedProductData } from '../types';
import { useTranslations } from '../i18n';
import { API_BASE_URL } from '../config';

// Sur l'app native (Capacitor), il n'y a pas de flux vidéo continu type getUserMedia :
// la caméra natale prend une photo à la fois via le plugin @capacitor/camera.
const isNativePlatform = Capacitor.isNativePlatform();

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (extractedData: ExtractedProductData, imagePreview?: string) => void;
  onManualAdd: () => void;
}

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  onManualAdd,
}) => {
  const { t } = useTranslations();
  const c = t.cameraScan;
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Auto-scan states
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>(c.alignHint);
  const [detectedDate, setDetectedDate] = useState<string | null>(null);
  const [scanPulse, setScanPulse] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SamplePackaging | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoScanTimerRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);
  const consecutiveScansRef = useRef(0);

  // Lister les caméras disponibles (PC webcams, caméras externes, etc.)
  const enumerateCameras = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Impossible de lister les caméras:', err);
    }
  };

  // Attacher le flux au composant vidéo
  const attachStreamToVideo = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Lecture vidéo bloquée par le navigateur:', err);
      });
    }
  };

  const startCamera = async (overrideDeviceId?: string, forceFacingMode?: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(c.errorNotSupported);
      setCameraActive(false);
      return;
    }

    const targetFacing = forceFacingMode || facingMode;
    const targetDevice = overrideDeviceId || selectedDeviceId;

    // Paliers de contraintes : essaie les options les plus précises puis se rabat sur du générique
    // Sur PC, { facingMode: 'environment' } échoue souvent avec OverconstrainedError.
    // L'ordre ci-dessous garantit que n'importe quelle webcam de PC démarrera.
    const constraintTiers: MediaStreamConstraints[] = [];

    // 1. Si un périphérique spécifique est sélectionné
    if (targetDevice) {
      constraintTiers.push({
        video: { deviceId: { exact: targetDevice } },
        audio: false,
      });
    }

    // 2. Avec facingMode idéal (non strict, pour ne pas crasher sur PC)
    constraintTiers.push({
      video: {
        facingMode: { ideal: targetFacing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    // 3. Mode webcam PC standard (caméra frontale / user)
    constraintTiers.push({
      video: {
        facingMode: 'user',
      },
      audio: false,
    });

    // 4. Contrainte minimale universelle (fonctionne sur 100% des webcams PC)
    constraintTiers.push({
      video: true,
      audio: false,
    });

    let activeStream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of constraintTiers) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (activeStream) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn('Tentative de démarrage caméra échouée avec contraintes:', constraints, err);
      }
    }

    if (!activeStream) {
      console.error('Toutes les tentatives caméra ont échoué:', lastError);
      let message = c.errorGeneric;
      if (lastError) {
        if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
          message = c.errorPermissionDenied;
        } else if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
          message = c.errorNotFound;
        } else if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
          message = c.errorDeviceBusy;
        } else if (lastError.name === 'OverconstrainedError') {
          message = c.errorOverconstrained;
        }
      }
      setCameraError(message);
      setCameraActive(false);
      return;
    }

    streamRef.current = activeStream;
    setCameraActive(true);

    // Attacher immédiatement au lecteur vidéo
    attachStreamToVideo(activeStream);

    // Mettre à jour la liste des périphériques
    enumerateCameras();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const stopAutoScan = () => {
    if (autoScanTimerRef.current !== null) {
      window.clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  };

  // Initialiser la caméra à l'ouverture (getUserMedia web uniquement ; le natif utilise une capture à la demande)
  useEffect(() => {
    if (isOpen) {
      setDetectedDate(null);
      setNetworkError(null);
      if (!isNativePlatform) {
        startCamera();
      }
    } else {
      stopCamera();
      stopAutoScan();
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setDetectedDate(null);
    }
    return () => {
      stopCamera();
      stopAutoScan();
    };
  }, [isOpen]);

  // Si le flux vidéo est prêt après montage du ref
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [cameraActive]);

  // Helper pour extraire une image base64 du flux vidéo courant
  const getFrameBase64 = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) return null;

    const canvas = document.createElement('canvas');
    // Taille optimale pour un envoi rapide à l'API Gemini
    const maxDim = 800;
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Analyse d'image avec Gemini (automatique ou manuelle)
  const processImageFrame = useCallback(
    async (imageBase64: string, isManual = false) => {
      if (isAnalyzingRef.current) return;
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      setScanPulse(true);
      setScanStatus(c.readingByGemini);

      try {
        const response = await fetch(`${API_BASE_URL}/api/scan-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64,
            mimeType: 'image/jpeg',
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || c.errorCommunication
          );
        }

        const data = result.data || {};
        const cat = data.categorie || 'frais';
        let storageLocation: 'frigo' | 'placard' | 'congelateur' = 'frigo';
        if (cat === 'sec') storageLocation = 'placard';
        else if (cat === 'surgele') storageLocation = 'congelateur';

        const confidenceScore = typeof data.confiance === 'number' ? data.confiance : 0;
        const hasDate = !!data.date_peremption;

        // Si une date a été trouvée ou capture manuelle demandée
        if (hasDate || isManual) {
          if (hasDate) {
            setDetectedDate(data.date_peremption);
            setScanStatus(c.dateDetected(data.date_peremption));
            try {
              if (navigator.vibrate) navigator.vibrate(100);
            } catch {
              // ignore
            }
          }

          stopAutoScan();

          let resolvedDate = data.date_peremption;
          if (!resolvedDate) {
            const fallback = new Date();
            fallback.setDate(fallback.getDate() + 3);
            resolvedDate = fallback.toISOString().split('T')[0];
          }

          const extracted: ExtractedProductData = {
            productName: data.nom_produit || '',
            expirationDate: resolvedDate,
            dateType: cat === 'sec' ? 'DDM' : 'DLC',
            category: cat,
            storageLocation,
            brand: data.nom_produit?.split(' ')[0] || '',
            confidence: confidenceScore,
            rawDateText: data.date_peremption || undefined,
            error: data.erreur || (!data.date_peremption ? c.errorNoDate : undefined),
          };

          setTimeout(() => {
            stopCamera();
            onScanComplete(extracted, imageBase64);
          }, hasDate ? 450 : 150);
          return;
        }

        consecutiveScansRef.current += 1;
        if (!isManual && consecutiveScansRef.current >= 3) {
          stopAutoScan();
          setAutoScanEnabled(false);
          setScanStatus(c.manualCaptureHint);
          return;
        }

        setScanStatus(
          consecutiveScansRef.current % 2 === 0
            ? c.searchingLive
            : c.stabilizeHint
        );
      } catch (err: any) {
        console.warn('Scan frame warning:', err);
        if (isManual) {
          // En capture manuelle, si l'IA subit un pic de charge temporaire ou un quota,
          // on ne bloque PAS l'utilisateur : on ouvre la confirmation avec la photo capturée
          const fallback = new Date();
          fallback.setDate(fallback.getDate() + 3);
          const extracted: ExtractedProductData = {
            productName: '',
            expirationDate: fallback.toISOString().split('T')[0],
            dateType: 'DLC',
            category: 'frais',
            storageLocation: 'frigo',
            confidence: 0,
            error: c.errorAiLimited,
          };
          stopCamera();
          onScanComplete(extracted, imageBase64);
          return;
        }
      } finally {
        setTimeout(() => setScanPulse(false), 300);
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    },
    [onScanComplete]
  );

  // Boucle de scan automatique en direct modérée (max 3 scans espacés pour préserver le quota)
  useEffect(() => {
    if (!isOpen || !cameraActive || !autoScanEnabled || detectedDate) {
      stopAutoScan();
      return;
    }

    stopAutoScan();
    autoScanTimerRef.current = window.setInterval(() => {
      if (!isAnalyzingRef.current && cameraActive && consecutiveScansRef.current < 3) {
        const frame = getFrameBase64();
        if (frame) {
          processImageFrame(frame, false);
        }
      }
    }, 3500);

    return () => {
      stopAutoScan();
    };
  }, [isOpen, cameraActive, autoScanEnabled, detectedDate, processImageFrame]);

  const handleManualCapture = () => {
    const frame = getFrameBase64();
    if (frame) {
      stopAutoScan();
      processImageFrame(frame, true);
    }
  };

  // Capture via l'appareil photo natif (Capacitor) : une photo à la fois, pas de flux continu
  const handleNativeCapture = async () => {
    try {
      const photo = await CapacitorCamera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 80,
        allowEditing: false,
      });
      if (photo.base64String) {
        processImageFrame(`data:image/jpeg;base64,${photo.base64String}`, true);
      }
    } catch (err) {
      console.warn('Capture caméra native annulée ou refusée:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        stopAutoScan();
        processImageFrame(base64, true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SamplePackaging) => {
    setSelectedSample(sample);
    stopAutoScan();
    processImageFrame(sample.base64DataUrl, true);
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const formatFriendlyError = (err: string | null): string => {
    if (!err) return '';
    if (err.includes('429') || err.includes('RESOURCE_EXHAUSTED') || err.includes('quota')) {
      return c.errorQuota;
    }
    if (err.includes('503') || err.includes('high demand') || err.includes('UNAVAILABLE')) {
      return c.errorOverloaded;
    }
    return err;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {c.title}
              </h2>
              <p className="text-xs text-stone-500">
                {c.subtitle}
              </p>
            </div>
          </div>
          <button
            id="btn-close-camera"
            onClick={onClose}
            aria-label={c.closeAria}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
          {/* Status badge & Auto-scan toggle (concept web : flux live getUserMedia, non applicable en natif) */}
          {!isNativePlatform && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  detectedDate
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : autoScanEnabled && cameraActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    detectedDate
                      ? 'bg-emerald-500 animate-ping'
                      : autoScanEnabled && cameraActive
                      ? 'bg-emerald-600 animate-pulse'
                      : 'bg-stone-400'
                  }`}
                />
                {detectedDate
                  ? c.statusRecognized
                  : cameraActive
                  ? autoScanEnabled
                    ? c.statusLiveActive
                    : c.statusManualMode
                  : c.statusWaiting}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {availableDevices.length > 1 && (
                <div className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-stone-400" />
                  <select
                    id="select-camera-device"
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="text-[11px] bg-stone-100 text-stone-700 rounded-lg px-2 py-1 border border-stone-200 focus:outline-none"
                  >
                    {availableDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || c.cameraOptionLabel(idx + 1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                id="btn-toggle-autoscan"
                onClick={() => setAutoScanEnabled((prev) => !prev)}
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    autoScanEnabled ? 'text-amber-500 fill-amber-500' : 'text-stone-400'
                  }`}
                />
                <span>{autoScanEnabled ? c.autoOn : c.autoOff}</span>
              </button>
            </div>
          </div>
          )}

          {/* Native capture card (Capacitor) : une photo à la fois via l'appareil photo du téléphone */}
          {isNativePlatform ? (
            <div className="relative aspect-4/3 bg-stone-950 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center gap-4 border-2 border-stone-800 p-6 text-center">
              <Camera className="w-12 h-12 text-emerald-400 stroke-1" />
              <p className="text-sm font-medium text-stone-200">{c.nativeCaptureHint}</p>
              <button
                id="btn-native-capture"
                disabled={isAnalyzing}
                onClick={handleNativeCapture}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-colors disabled:opacity-60"
              >
                <Camera className="w-4 h-4" />
                {c.nativeCaptureButton}
              </button>
            </div>
          ) : (
          <div
            className={`relative aspect-4/3 bg-stone-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 transition-all ${
              detectedDate
                ? 'border-emerald-500 ring-4 ring-emerald-400/30'
                : scanPulse
                ? 'border-emerald-400/80'
                : 'border-stone-800'
            }`}
          >
            {/* L'élément vidéo reste TOUJOURS monté dans le DOM pour garantir la liaison du flux vidéo */}
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {cameraActive ? (
              <>
                {/* Viseur / Cible de scan dynamique avec laser */}
                <div className="absolute inset-5 sm:inset-8 border-2 border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  {/* Coin supérieur */}
                  <div className="flex justify-between items-center">
                    <div className="w-3 h-3 border-t-2 border-l-2 border-emerald-300" />
                    <div className="text-[11px] font-bold text-emerald-300 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Scan className="w-3 h-3 text-emerald-400 animate-spin" />
                      <span>{scanStatus}</span>
                    </div>
                    <div className="w-3 h-3 border-t-2 border-r-2 border-emerald-300" />
                  </div>

                  {/* Ligne laser horizontale animée */}
                  <div className="relative w-full">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
                  </div>

                  {/* Coin inférieur */}
                  <div className="flex justify-between items-center text-[10px] text-stone-200">
                    <div className="w-3 h-3 border-b-2 border-l-2 border-emerald-300" />
                    <span className="bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                      {c.viewfinderHint}
                    </span>
                    <div className="w-3 h-3 border-b-2 border-r-2 border-emerald-300" />
                  </div>
                </div>

                {/* Date trouvée en surbrillance instantanée */}
                {detectedDate && (
                  <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-30 animate-in fade-in zoom-in-95">
                    <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-lg animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight">{c.recognizedTitle}</h3>
                    <p className="text-xl font-extrabold text-emerald-300 mt-1 font-mono">
                      {detectedDate}
                    </p>
                    <p className="text-xs text-stone-300 mt-1">
                      {c.openingConfirmation}
                    </p>
                  </div>
                )}

                {/* Bouton de bascule de caméra frontale/arrière */}
                <button
                  id="btn-toggle-camera"
                  onClick={toggleFacingMode}
                  title={c.toggleCameraTitle}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="p-6 text-center text-stone-300 space-y-3 max-w-sm">
                <Camera className="w-12 h-12 mx-auto text-stone-500 stroke-1" />
                <p className="text-sm font-medium text-stone-200">
                  {cameraError || c.connectingWebcam}
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    id="btn-retry-camera"
                    onClick={() => startCamera()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {c.retryWebcam}
                  </button>

                  <button
                    id="btn-open-new-tab"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                    title={c.openNewTabTitle}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {c.openNewTab}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Bandeau d'explication "Sans clic" (concept web : capture automatique en direct) */}
          {!isNativePlatform && (
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <p className="text-[11px] leading-tight text-emerald-900">
              <strong>{c.zeroClickTitle}</strong> {c.zeroClickBody('24/09/2026')}
            </p>
          </div>
          )}

          {/* Bandeau d'erreur réseau si besoin */}
          {networkError && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">{c.aiServiceTitle}</p>
                <p className="text-amber-800">{formatFriendlyError(networkError)}</p>
                <button
                  id="btn-fallback-manual-add"
                  onClick={() => {
                    onClose();
                    onManualAdd();
                  }}
                  className="mt-1 inline-flex items-center gap-1 font-bold text-emerald-700 underline"
                >
                  {c.continueManual}
                </button>
              </div>
            </div>
          )}

          {/* Actions alternatives : Déclencheur manuel optionnel & Import fichier */}
          <div className="flex items-center gap-2 pt-1">
            {cameraActive && (
              <button
                id="btn-take-photo"
                disabled={isAnalyzing}
                onClick={handleManualCapture}
                className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
                title={c.captureManualTitle}
              >
                <Camera className="w-3.5 h-3.5 text-stone-600" />
                <span>{c.captureManual}</span>
              </button>
            )}

            <button
              id="btn-upload-photo"
              disabled={isAnalyzing}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
            >
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              <span>{c.uploadPhoto}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Section d'échantillons d'emballages pour tester en 1 clic */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {c.sampleSectionTitle}
              </span>
              <span className="text-[10px] text-stone-400">{c.sampleSectionHint}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_PACKAGES.map((sample) => (
                <button
                  key={sample.id}
                  id={`btn-sample-${sample.id}`}
                  disabled={isAnalyzing}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col justify-between ${
                    sample.isDifficultOrBlurry
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-100 text-rose-900'
                      : 'bg-stone-50 border-stone-200 hover:bg-emerald-50 hover:border-emerald-300 text-stone-800'
                  }`}
                >
                  <span className="font-bold truncate">{sample.name}</span>
                  <span className="text-[10px] text-stone-500 truncate mt-0.5">
                    {sample.dateText}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Saisie manuelle directe */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-500">{c.footerNoWebcam}</span>
          <button
            id="btn-switch-manual"
            onClick={() => {
              onClose();
              onManualAdd();
            }}
            className="font-bold text-emerald-700 hover:text-emerald-900 underline"
          >
            {c.footerManualEntry}
          </button>
        </div>
      </div>
    </div>
  );
};
