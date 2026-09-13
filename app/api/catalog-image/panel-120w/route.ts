import { readFile } from "node:fs/promises";
import path from "node:path";

const PANEL_IMAGE_PATH = path.join(
  process.cwd(),
  "public",
  "catalog",
  "owner",
  "panel-solar-plegable-120w.webp",
);

export async function GET() {
  const image = await readFile(PANEL_IMAGE_PATH);

  return new Response(image, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
