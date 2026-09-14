/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// URL de base du backend (server.ts) qui relaie les appels à l'API Gemini.
// - Vide en développement web : les requêtes restent relatives (même origine que Vite/Express).
// - Doit pointer vers le backend déployé (ex: https://nowaste-api.onrender.com) pour la version
//   packagée Capacitor, qui n'a pas de serveur local sur l'appareil.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';
