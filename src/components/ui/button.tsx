import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-shine bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/92 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_hsl(var(--primary)/0.65)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-px hover:shadow-[0_14px_28px_-14px_hsl(var(--destructive)/0.7)]",
        outline: "border border-input bg-card hover:-translate-y-px hover:border-primary/50 hover:bg-primary/5 hover:text-foreground hover:shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85 hover:-translate-y-px hover:shadow-md",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "btn-shine rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_40px_-14px_hsl(var(--primary)/0.7)]",
        accent: "btn-shine rounded-full bg-accent text-accent-foreground shadow-[0_14px_30px_-14px_hsl(var(--accent)/0.8)] hover:-translate-y-px hover:brightness-105",
        ink: "bg-ink text-ink-foreground hover:bg-ink/90",
        soft: "bg-primary/10 text-primary hover:bg-primary/15",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-7 text-base",
        xl: "h-14 rounded-full px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
