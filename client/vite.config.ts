import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/appServer": "http://localhost:8080",
      "/server": "http://localhost:8080",
    },
  },
  build: {
    outDir: "build",
  },
});
