import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const LABEL: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

/** Cycles light → dark → system. */
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(NEXT[theme])}
      title={`Theme: ${LABEL[theme]} (click for ${LABEL[NEXT[theme]]})`}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[NEXT[theme]]}`}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
};

export default ThemeToggle;
