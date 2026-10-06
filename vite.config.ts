import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => ({
  plugins: mode === "selfhost" ? [react()] : [react(), cloudflare()],
  server: mode === "selfhost" ? { proxy: { "/api": "http://127.0.0.1:8080" } } : undefined,
  build: {
    outDir: mode === "selfhost" ? "dist/local" : undefined,
    target: "es2022",
    sourcemap: false,
  },
}));
