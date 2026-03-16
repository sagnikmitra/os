import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "pwa-icon-512.png", "pwa-icon-192.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      manifest: {
        name: "sgnk CareerOS — AI-Powered Career Platform",
        short_name: "CareerOS",
        description: "AI-powered career platform with 50+ tools for resume analysis, job matching, interview prep, and more.",
        theme_color: "#4f46e5",
        background_color: "#f5f6fa",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/dashboard",
        categories: ["productivity", "business", "education"],
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    target: "esnext",
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react/") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom")
          ) {
            return "react-vendor";
          }

          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("@supabase/")) return "supabase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("recharts")) return "charts";
          if (id.includes("html2canvas")) return "html2canvas";
          if (id.includes("jspdf")) return "jspdf";
          if (id.includes("jszip")) return "jszip";
          if (id.includes("@radix-ui/")) return "radix-ui";
          if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform/resolvers")) return "forms";
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
}));
