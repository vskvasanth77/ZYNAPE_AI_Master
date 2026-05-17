import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    open: true,
    host: true,
  },
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
    minify: "esbuild",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main:      resolve(__dirname, "index.html"),
        solutions: resolve(__dirname, "solutions.html"),
        admin:     resolve(__dirname, "admin.html"),
      },
      output: {
        manualChunks: {
          three: ["three"],
          gsap: ["gsap"],
          lenis: ["lenis"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["three", "gsap", "gsap/ScrollTrigger", "gsap/Flip", "gsap/TextPlugin", "gsap/ScrollToPlugin", "lenis"],
  },
});
