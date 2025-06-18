// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// // https://vite.dev/config/ 
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     headers: {
//       'Cross-Origin-Opener-Policy': 'same-origin',
//       'Cross-Origin-Embedder-Policy': 'require-corp',
//     }
//   }
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mkcert()],
  server: {
    host: "0.0.0.0", // Cho phép truy cập qua IP LAN như 192.168.xx.xx
    port: 5173, // Có thể đổi nếu cần
    https: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
});
