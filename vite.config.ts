// Plain Vite config for TanStack Start, built for Cloudflare Workers.
//
// Plugin order matters: tailwind -> tsconfig paths -> TanStack Start -> Nitro (build only) -> React.
// Never set ssr.external or resolve.external: a Worker has no runtime module resolution, so the
// build would fail. Never add compression plugins: Cloudflare compresses at the edge.
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => {
  // Make every VITE_* variable available as a static import.meta.env.* value in client AND server bundles.
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: { host: "::", port: 5173 },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      // Only needed to produce the deployable Worker; skipped in `vite dev`.
      ...(command === "build"
        ? [
            nitro({
              preset: "cloudflare-module",
              cloudflare: {
                // Node built-ins used by server code (node:crypto, node:process).
                nodeCompat: true,
                // Write wrangler.json so `wrangler deploy` works straight after the build.
                deployConfig: true,
                // Pin the Worker name so it always matches the Worker in the Cloudflare dashboard
                // (otherwise it can be derived from the git repo name, and runtime secrets would not apply).
                wrangler: { name: "jobportalfree" },
              },
            }),
          ]
        : []),
      viteReact(),
    ],
  };
});
