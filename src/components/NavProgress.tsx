import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** Thin bar at the top of the screen while the next page is getting ready. */
export default function NavProgress() {
  const loading = useRouterState({ select: (s) => s.status === "pending" || s.isLoading });
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setVisible(true), 120);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [loading]);
  return <div className="nav-progress" data-active={visible ? "true" : "false"} aria-hidden="true" />;
}
