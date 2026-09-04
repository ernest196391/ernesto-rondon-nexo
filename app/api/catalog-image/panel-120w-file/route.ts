import { GET as getPanelImage } from "../panel-120w/route";

export async function GET() {
  const response = await getPanelImage();
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "image/webp");
  headers.set("Content-Disposition", 'attachment; filename="panel-solar-plegable-120w.webp"');
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(response.body, { status: response.status, headers });
}
