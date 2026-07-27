import { resolve } from "node:path";
import { defineConfig } from "vite";

const isWatch = process.argv.includes("--watch");

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        codegen: resolve(import.meta.dirname, "src/codegen.ts"),
      },
      formats: ["es"],
    },
    outDir: "dist",
    // .d.ts は tsc が別プロセスで同じ dist に出力するため、vite 側で消すと watch 中に消える
    emptyOutDir: false,
    watch: isWatch ? { include: ["src/**/*"] } : null,
    rollupOptions: {
      external: ["zod", /^node:/],
    },
  },
});
