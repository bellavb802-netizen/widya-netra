import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import os from 'node:os'

const networkInterfaces = Object.values(os.networkInterfaces()).flat()
const devServerHost = networkInterfaces.find((networkInterface) => {
  if (!networkInterface || networkInterface.internal || networkInterface.family !== 'IPv4') return false
  const [first, second] = networkInterface.address.split('.').map(Number)
  return first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
})?.address || 'localhost'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_DEV_SERVER_HOST': JSON.stringify(devServerHost),
  },
  server: {
    host: '0.0.0.0',
  },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});
