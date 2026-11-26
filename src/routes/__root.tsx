import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense, type ReactNode } from "react";

import appCss from "../styles.css?url";
import PageLoader from "../components/PageLoader";
import LogoSpinner from "../components/LogoSpinner";

// Browser-only providers (auth, themes, festival effects) mount after hydration.
const AppProviders = lazy(() => import("../components/AppProviders"));

function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-label="Loading">
      <LogoSpinner size="lg" />
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mx-auto">Error 404</p>
        <h1 className="mt-4 font-display text-6xl font-extrabold text-foreground">Lost the trail</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a href="/" className="btn-pill btn-pill-primary">Go home</a>
          <a href="/jobs" className="btn-pill btn-pill-ghost">Browse jobs</a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-pill btn-pill-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-pill btn-pill-ghost">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#14204a" },
      { title: "JobPortalFree | Free jobs, prep and CodeXam assessments" },
      { name: "description", content: "Find fresher jobs and internships, prepare with free resources, and take CodeXam assessments in one place." },
      { name: "author", content: "JobPortalFree" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_BOOT = `try{var t=localStorage.getItem("theme")||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}}catch(e){}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* Apply the saved light/dark choice before the first paint so pages never flash white. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? (
        <Suspense fallback={<BootScreen />}>
          <AppProviders>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </AppProviders>
        </Suspense>
      ) : (
        <BootScreen />
      )}
    </QueryClientProvider>
  );
}
