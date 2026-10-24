import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, las peticiones a /v1 se reenvían a la API (APIDuengue): así no hace falta CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/v1": "http://127.0.0.1:8000" },
  },
  build: { outDir: "dist" },
});
