import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Type Tool — its own app. Port 5190 (lab apps use 517x–518x).
export default defineConfig({
  plugins: [react()],
  server: { port: 5190, strictPort: true },
  // @lisse/react must share the app's single React copy (it has React as a
  // peer dep). Without dedupe, Vite pre-bundles a 2nd copy → "Invalid hook call".
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: { include: ["@lisse/react", "@lisse/core"] },
});
