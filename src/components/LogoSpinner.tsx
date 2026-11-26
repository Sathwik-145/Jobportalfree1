import defaultLogo from "@/assets/logo.png";
import { useBrandLogo } from "@/lib/themeSettings";

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizes = {
  sm: { box: "w-10 h-10", pad: "p-[3px]" },
  md: { box: "w-16 h-16", pad: "p-[4px]" },
  lg: { box: "w-24 h-24", pad: "p-[5px]" },
};

const LogoSpinner = ({ size = "md", text }: LogoSpinnerProps) => {
  const s = sizes[size];
  const logo = useBrandLogo(defaultLogo);
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`relative ${s.box}`}>
        {/* Spinning gradient ring (logo stays static) */}
        <div
          className={`absolute inset-0 rounded-full ${s.pad} animate-spin`}
          style={{
            background:
              "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)), hsl(var(--primary)))",
            animationDuration: "1.4s",
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </div>
        {/* Static logo in the centre */}
        <img
          src={logo}
          alt="Loading"
          className="absolute inset-[14%] w-[72%] h-[72%] rounded-full object-cover"
        />
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
};

export default LogoSpinner;
