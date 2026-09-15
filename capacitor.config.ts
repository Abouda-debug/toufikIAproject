import type { CapacitorConfig } from '@capacitor/cli';

// appId : identifiant unique de l'application (format inversé de domaine).
// Doit rester STABLE une fois publié sur le Play Store (impossible à changer après coup).
// Remplace "com.nowaste.app" par ton propre identifiant si tu as un nom de domaine/marque dédié.
const config: CapacitorConfig = {
  appId: 'com.nowaste.app',
  appName: 'nowaste',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#F8FAF8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
