import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.golumo.app',
  appName: 'GoLumo',
  webDir: 'dist',

  // IMPORTANT: replace this with your real deployed URL (see README →
  // "Android APK banane ke steps"). The Android app is a thin native shell
  // that loads your live website — this is what makes login, AI features,
  // weather, etc. work exactly like the web version, no code duplication.
  server: {
    url: 'https://REPLACE-WITH-YOUR-DEPLOYED-URL.onrender.com',
    cleartext: false
  },

  android: {
    allowMixedContent: false
  }
};

export default config;
