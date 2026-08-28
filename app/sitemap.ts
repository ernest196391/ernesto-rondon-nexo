import type { MetadataRoute } from "next";

const baseUrl = "https://nexotienda.casavivadecuba.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/marketplace", "/contacto"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/herramientas" ? 0.9 : 0.7,
  }));
}
