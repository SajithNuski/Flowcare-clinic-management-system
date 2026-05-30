import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request starting with /api will be forwarded to XAMPP
      // So fetch('/api/auth/login.php') actually calls
      // http://localhost/flowcare/backend/api/auth/login.php
      "/api": {
        target: "http://localhost",
        rewrite: (path) => path.replace("/api", "/flowcare/backend/api"),
        changeOrigin: true,
      },
    },
  },
});
