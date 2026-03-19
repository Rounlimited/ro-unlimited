import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rounlimited.admin',
  appName: 'RO Admin',
  webDir: 'public',
  server: {
    url: 'https://rounlimited.com/admin',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: '../twa/ro-admin.keystore',
      keystoreAlias: 'ro-admin',
      keystorePassword: 'rounlimited2026',
      keystoreAliasPassword: 'rounlimited2026',
      signingType: 'apksigner',
    }
  }
};

export default config;
