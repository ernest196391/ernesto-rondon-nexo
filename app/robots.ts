import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://nexo.casavivadecuba.com/sitemap.xml",
    host: "https://nexo.casavivadecuba.com",
  };
}
