import type { MetadataRoute } from "next";

const baseUrl = "https://nexo.casavivadecuba.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/negocios", "/herramientas", "/sobre-mi", "/contacto"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/herramientas" ? 0.9 : 0.7,
  }));
}
