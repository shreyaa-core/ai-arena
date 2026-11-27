import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-highlight text-background font-semibold hover:brightness-105 shadow-[0_4px_14px_rgba(20,184,166,0.28)]",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        outline:
          "border border-border bg-secondary/80 text-foreground hover:border-highlight/70 hover:bg-accent",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:border-highlight/60 hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-highlight underline-offset-4 hover:underline",
        hero: "bg-amber-500 text-slate-950 font-semibold shadow-[0_6px_20px_rgba(245,158,11,0.35)] hover:bg-amber-400",
        subtle: "border border-border bg-card text-foreground hover:border-highlight/50 hover:bg-secondary",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-5 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  );
});

export { Button, buttonVariants };
