import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thursdate.app',
  appName: 'Thursdate',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
