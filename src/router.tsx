import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import PageLoader from "./components/PageLoader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Load the next page's code on hover/touch and keep the current page on screen until it is ready.
    defaultPreload: "intent",
    defaultPendingMs: 600,
    defaultPendingComponent: PageLoader,
  });

  return router;
};
