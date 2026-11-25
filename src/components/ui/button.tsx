import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-highlight text-background font-semibold hover:brightness-105 shadow-[0_0_16px_-4px_oklch(0.81_0.14_205/0.45)]",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        outline:
          "border border-primary/50 bg-secondary text-foreground hover:border-highlight/70 hover:bg-accent",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:border-primary/60 hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-highlight underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground font-semibold shadow-[0_0_22px_-4px_oklch(0.515_0.235_272/0.65)] hover:brightness-110",
        subtle: "border border-border bg-card text-foreground hover:border-highlight/50 hover:bg-secondary",
        paper:
          "border border-primary/45 bg-secondary text-foreground hover:border-highlight/70 hover:bg-accent",
        paperPrimary:
          "bg-primary text-primary-foreground font-semibold shadow-[0_0_20px_-4px_oklch(0.515_0.235_272/0.6)] hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-5 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
