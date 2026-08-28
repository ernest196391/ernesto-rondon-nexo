import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXO Tienda",
    short_name: "NEXO",
    description: "Productos y pedidos coordinados desde NEXO.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f3",
    theme_color: "#173d2e",
    lang: "es",
    icons: [
      {
        src: "/brand/nexo-symbol.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
