import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://nexotienda.casavivadecuba.com/sitemap.xml",
    host: "https://nexotienda.casavivadecuba.com",
  };
}
