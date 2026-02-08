import { resolve } from "node:path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

const isWatch = process.argv.includes("--watch");

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        codegen: resolve(__dirname, "src/codegen.ts"),
      },
      formats: ["es"],
    },
    outDir: "dist",
    watch: isWatch ? { include: ["src/**/*"] } : null,
    rollupOptions: {
      external: ["zod", /^node:/],
    },
  },
  plugins: [dts({ exclude: ["**/*.test.ts"] })],
});
