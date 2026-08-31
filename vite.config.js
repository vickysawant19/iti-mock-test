import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-dom") ||
              id.includes("react-router-dom") ||
              id.includes("@reduxjs") ||
              id.includes("react-redux") ||
              id.includes("react/")
            ) {
              return "vendor-react";
            }
            if (id.includes("@google/genai")) {
              return "vendor-genai";
            }
            if (id.includes("xlsx") || id.includes("react-to-print")) {
              return "vendor-export";
            }
            if (id.includes("leaflet")) {
              return "vendor-maps";
            }
            if (id.includes("quill") || id.includes("react-quill")) {
              return "vendor-editor";
            }
            if (
              id.includes("react-dropzone") ||
              id.includes("react-hook-form") ||
              id.includes("cmdk")
            ) {
              return "vendor-forms";
            }
            if (id.includes("moment") || id.includes("date-fns")) {
              return "vendor-dates";
            }
            if (id.includes("recharts") || id.includes("d3") || id.includes("victory")) {
              return "vendor-charts";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("react-icons")) {
              return "vendor-ui";
            }
            if (id.includes("appwrite")) {
              return "vendor-appwrite";
            }
            return "vendor-misc";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/v1": {
        target: "https://auth.itimitra.in",
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
        ws: true, // ← proxy WebSocket upgrades (Appwrite Realtime)
        secure: false, // allow self-signed certs if any
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // 5MB cache limit
        maximumFileSizeToCacheInBytes: 5000000,
        // your normal SPA fallback
        navigateFallback: "/index.html",
        // don’t redirect sitemap.xml, robots.txt, or API routes to the SPA
        navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/v1/],
      },
      manifest: {
        id: "/",
        name: "ITI Mitra",
        short_name: "ITI Test",
        description: "An online platform for ITI students to take mock exams.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
    // Dev middleware to serve sitemap.xml
    {
      name: "sitemap-middleware",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/sitemap.xml") {
            const sitemap = fs.readFileSync(
              path.resolve(__dirname, "public/sitemap.xml"),
              "utf-8",
            );
            res.setHeader("Content-Type", "application/xml");
            res.end(sitemap);
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
