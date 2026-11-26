import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const Page = lazyRouteComponent(() => import("@/pages/admin/ManagePromoBanners"));

export const Route = createFileRoute("/admin/promo-banners")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Promo banners · Admin | JobPortalFree" },
      { name: "description", content: "JobPortalFree admin: promo banners." },
      { property: "og:title", content: "Promo banners · Admin | JobPortalFree" },
      { property: "og:description", content: "JobPortalFree admin: promo banners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
