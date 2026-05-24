import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tagz.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/scan/",
          "/s/",
          "/login",
          "/register",
          "/forgot-password",
          "/verify-email",
          "/cart",
          "/order/",
          "/buy",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/scan/",
          "/s/",
          "/login",
          "/register",
          "/forgot-password",
          "/verify-email",
          "/cart",
          "/order/",
          "/buy",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
