// Thin navigation helpers on top of TanStack Router.
// Pages were written against a Link/useNavigate/useLocation style API; these helpers keep that
// shape while every route is a real TanStack file route.
import {
  Outlet as TanstackOutlet,
  useParams as useTanstackParams,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

type To = string | { pathname?: string; search?: string; hash?: string };
type NavOpts = { replace?: boolean; state?: unknown };
type SearchParamsInit = URLSearchParams | Record<string, string> | string;

function toHref(to: To): string {
  if (typeof to === "string") return to;
  return `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
}

export function useLocation() {
  const loc = useRouterState({ select: (s) => s.location });
  return useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.searchStr ?? "",
      hash: loc.hash ? `#${loc.hash}` : "",
      state: ((loc.state as any)?.__compat ?? null) as any,
      key: (loc.state as any)?.key ?? "default",
    }),
    [loc],
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: To | number, opts?: NavOpts) => {
      if (typeof to === "number") {
        router.history.go(to);
        return;
      }
      const href = toHref(to);
      const state = { __compat: opts?.state ?? null } as any;
      if (opts?.replace) router.history.replace(href, state);
      else router.history.push(href, state);
    },
    [router],
  );
}

export function Navigate({ to, replace, state }: { to: To; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useTanstackParams({ strict: false }) as unknown as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInit | ((prev: URLSearchParams) => SearchParamsInit), opts?: NavOpts) => void,
] {
  const loc = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const set = useCallback(
    (next: SearchParamsInit | ((prev: URLSearchParams) => SearchParamsInit), opts?: NavOpts) => {
      // Support the react-router style updater: setSearchParams(prev => ...).
      const value = typeof next === "function" ? next(new URLSearchParams(window.location.search)) : next;
      const sp = value instanceof URLSearchParams ? value : new URLSearchParams(value as any);
      const qs = sp.toString();
      navigate(`${loc.pathname}${qs ? `?${qs}` : ""}${loc.hash}`, opts);
    },
    [loc.pathname, loc.hash, navigate],
  );
  return [params, set];
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
  replace?: boolean;
  state?: unknown;
  children?: ReactNode;
};

function isModified(e: MouseEvent) {
  return e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.button !== 0;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, state, onClick, onMouseEnter, onTouchStart, onFocus, target, ...rest }, ref) => {
    const navigate = useNavigate();
    const router = useRouter();
    const href = toHref(to);
    // Start downloading the next page's code as soon as the visitor points at the link.
    const preload = () => {
      if (!href.startsWith("/") || (target && target !== "_self")) return;
      router.preloadRoute({ href } as any).catch(() => {});
    };
    return (
      <a
        ref={ref}
        href={href}
        target={target}
        onMouseEnter={(e) => { onMouseEnter?.(e); preload(); }}
        onTouchStart={(e) => { onTouchStart?.(e); preload(); }}
        onFocus={(e) => { onFocus?.(e); preload(); }}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || isModified(e) || (target && target !== "_self")) return;
          if (/^(https?:|mailto:|tel:)/.test(href)) return;
          e.preventDefault();
          navigate(href, { replace, state });
        }}
        {...rest}
      />
    );
  },
);
Link.displayName = "Link";

type NavState = { isActive: boolean; isPending: boolean };
export type NavLinkProps = Omit<LinkProps, "className" | "style" | "children"> & {
  end?: boolean;
  className?: string | ((s: NavState) => string | undefined);
  style?: CSSProperties | ((s: NavState) => CSSProperties | undefined);
  children?: ReactNode | ((s: NavState) => ReactNode);
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, end, className, style, children, ...rest }, ref) => {
    const { pathname } = useLocation();
    const target = toHref(to).split(/[?#]/)[0].replace(/\/+$/, "") || "/";
    const current = pathname.replace(/\/+$/, "") || "/";
    const isActive = end || target === "/" ? current === target : current === target || current.startsWith(`${target}/`);
    const s: NavState = { isActive, isPending: false };
    return (
      <Link
        ref={ref}
        to={to}
        aria-current={isActive ? "page" : undefined}
        className={typeof className === "function" ? className(s) : className}
        style={typeof style === "function" ? style(s) : style}
        {...rest}
      >
        {typeof children === "function" ? children(s) : children}
      </Link>
    );
  },
);
NavLink.displayName = "NavLink";

export const Outlet = TanstackOutlet;
