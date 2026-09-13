export interface SamplePackaging {
  id: string;
  name: string;
  category: string;
  dateText: string;
  targetDate: string;
  isDifficultOrBlurry?: boolean;
  base64DataUrl: string;
}

/**
 * Génère une image de packaging réaliste encodée en base64 pour tester le scanner
 */
function createPackagingDataUrl(
  title: string,
  brand: string,
  dateText: string,
  bgGradient: [string, string],
  isBlurry = false
): string {
  const width = 600;
  const height = 400;
  
  const blurFilter = isBlurry
    ? '<filter id="blur"><feGaussianBlur stdDeviation="3.5" /></filter>'
    : '';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <pattern id="dotpattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.12)" />
    </pattern>
    ${blurFilter}
  </defs>

  <rect width="${width}" height="${height}" rx="24" fill="url(#grad)" />
  <rect width="${width}" height="${height}" rx="24" fill="url(#dotpattern)" />

  <!-- Label emballage -->
  <g ${isBlurry ? 'filter="url(#blur)"' : ''}>
    <!-- Badge Marque -->
    <rect x="50" y="40" width="160" height="38" rx="8" fill="#ffffff" opacity="0.95" />
    <text x="130" y="65" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#1b5e20" text-anchor="middle" letter-spacing="1">${brand.toUpperCase()}</text>

    <!-- Titre Produit -->
    <text x="50" y="125" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#ffffff">${title}</text>
    <text x="50" y="155" font-family="Arial, sans-serif" font-size="16" fill="#e2e8f0">Origine France • Format Familial</text>

    <!-- Zone Date Imprimée (Tampon jet d'encre typique d'usine) -->
    <rect x="50" y="210" width="500" height="130" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
    
    <rect x="70" y="228" width="110" height="24" rx="4" fill="#f1f5f9" />
    <text x="125" y="244" font-family="Courier New, monospace" font-size="12" font-weight="bold" fill="#475569" text-anchor="middle">DLC / EXP</text>
    
    <text x="70" y="285" font-family="Courier New, monospace" font-weight="900" font-size="26" fill="#0f172a" letter-spacing="2">
      ${dateText}
    </text>
    <text x="70" y="315" font-family="Courier New, monospace" font-size="14" fill="#64748b">
      LOT L26-089A 14:32 FR 44.026.001 CE
    </text>

    <!-- Faux code-barres -->
    <g transform="translate(430, 230)">
      <rect x="0" y="0" width="3" height="50" fill="#000" />
      <rect x="6" y="0" width="2" height="50" fill="#000" />
      <rect x="11" y="0" width="4" height="50" fill="#000" />
      <rect x="18" y="0" width="2" height="50" fill="#000" />
      <rect x="23" y="0" width="5" height="50" fill="#000" />
      <rect x="31" y="0" width="2" height="50" fill="#000" />
      <rect x="36" y="0" width="3" height="50" fill="#000" />
      <rect x="42" y="0" width="4" height="50" fill="#000" />
      <rect x="50" y="0" width="2" height="50" fill="#000" />
      <rect x="55" y="0" width="4" height="50" fill="#000" />
      <text x="30" y="65" font-family="monospace" font-size="9" fill="#334155" text-anchor="middle">3 564700 128945</text>
    </g>
  </g>

  ${isBlurry ? '<rect x="40" y="20" width="280" height="34" rx="8" fill="#dc2626" opacity="0.9" /><text x="180" y="42" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">⚠️ TEST DATE FLUE (CONFIANCE FAIBLE)</text>' : ''}
</svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Dates d'exemples calculées dynamiquement pour rester toujours pertinentes
function getFutureDate(days: number): { dateStr: string; textFormatted: string } {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    textFormatted: `${day}/${month}/${year}`,
  };
}

const dateJ1 = getFutureDate(1);
const dateJ3 = getFutureDate(3);
const dateJ6 = getFutureDate(6);
const dateJ18 = getFutureDate(18);

export const SAMPLE_PACKAGES: SamplePackaging[] = [
  {
    id: 'sample-yaourt',
    name: 'Yaourt nature ferme',
    category: 'cremerie',
    targetDate: dateJ1.dateStr,
    dateText: `A CONSOMMER JUSQU'AU ${dateJ1.textFormatted}`,
    base64DataUrl: createPackagingDataUrl(
      'Yaourt Nature Ferme (x4)',
      'Danone',
      `A CONSOMMER JUSQU'AU ${dateJ1.textFormatted}`,
      ['#0284c7', '#0369a1']
    ),
  },
  {
    id: 'sample-jambon',
    name: 'Jambon cuit supérieur',
    category: 'viande_poisson',
    targetDate: dateJ3.dateStr,
    dateText: `DLC : ${dateJ3.textFormatted}`,
    base64DataUrl: createPackagingDataUrl(
      'Jambon Cuit Supérieur -25% Sel',
      'Herta',
      `DLC : ${dateJ3.textFormatted}`,
      ['#e11d48', '#9f1239']
    ),
  },
  {
    id: 'sample-creme',
    name: 'Crème fraîche fluide 30%',
    category: 'cremerie',
    targetDate: dateJ6.dateStr,
    dateText: `A CONSOMMER AVANT LE ${dateJ6.textFormatted}`,
    base64DataUrl: createPackagingDataUrl(
      'Crème Fraîche Fluide Légère',
      'Président',
      `A CONSOMMER AVANT LE ${dateJ6.textFormatted}`,
      ['#059669', '#047857']
    ),
  },
  {
    id: 'sample-lait',
    name: 'Lait demi-écrémé UHT',
    category: 'cremerie',
    targetDate: dateJ18.dateStr,
    dateText: `DDM : ${dateJ18.textFormatted}`,
    base64DataUrl: createPackagingDataUrl(
      'Lait Demi-Écrémé de Montagne 1L',
      'Candia',
      `DDM : ${dateJ18.textFormatted}`,
      ['#2563eb', '#1d4ed8']
    ),
  },
  {
    id: 'sample-blurry',
    name: 'Emballage froissé / date floue',
    category: 'autre',
    targetDate: getFutureDate(2).dateStr,
    dateText: `??/??/202? (Illisible)`,
    isDifficultOrBlurry: true,
    base64DataUrl: createPackagingDataUrl(
      'Pâte feuilletée pur beurre',
      'Marque Repère',
      `EXP: ..??.202? FLOU`,
      ['#78716c', '#44403c'],
      true
    ),
  },
];
