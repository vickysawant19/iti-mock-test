import path from "path"
import fs from "fs"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
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
        navigateFallback: '/',
        // don’t redirect sitemap.xml or robots.txt to the SPA
        navigateFallbackDenylist: [
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/
        ],
      },
      manifest: {
        id: "/",
        name: "ITI Mock Test",
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
              "utf-8"
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
