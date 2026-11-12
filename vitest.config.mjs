import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// El test suite raíz valida la web/Core y reglas compartidas.
// Tooling local de Claude y pruebas node:test tienen su propio runner.
// Los tests puros del POS se mantienen y usan stubs de Tauri: nunca llaman al runtime nativo.
const tauriStub = fileURLToPath(new URL("./test/stubs/tauri-api.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@tauri-apps/api/core": tauriStub,
      "@tauri-apps/api/app": tauriStub,
    },
  },
  test: {
    pool: "threads",
    exclude: [
      ...configDefaults.exclude,
      "scripts/casaviva-revision/mod/hooks/**",
      "docs/nexo-business/entradas/prototipo/entrada-rules.test.js",
    ],
  },
});
