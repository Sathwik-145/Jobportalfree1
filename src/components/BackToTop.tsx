import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Floating button that appears after scrolling and returns to the top of the page. */
const BackToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fab grid h-11 w-11 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/50 hover:text-primary hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTop;
