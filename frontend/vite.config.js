import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = process.env.VITE_API_TARGET || "http://127.0.0.1:5050";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": backendTarget,
      "/health": backendTarget,
      "/predict": backendTarget
    }
  }
});
