import { defineConfig } from "vitest/config";

// Hilos en vez de procesos: con varias pruebas de Core local (PGlite, Postgres
// en WASM) en procesos paralelos, Windows corta un proceso ("Worker exited
// unexpectedly"). Con hilos pasan las 229.
export default defineConfig({ test: { pool: "threads" } });
