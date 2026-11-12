export async function invoke<T = unknown>(): Promise<T> {
  throw new Error("Tauri invoke is unavailable in root unit tests");
}

export async function getVersion(): Promise<string> {
  return "test";
}
