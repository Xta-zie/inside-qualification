"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inside-blue focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-inside-blue text-white shadow",
        secondary:
          "border-transparent bg-gray-100 text-gray-900",
        destructive:
          "border-transparent bg-inside-pink text-white shadow",
        outline:
          "text-gray-950 border-gray-200",
        success:
          "border-transparent bg-green-500 text-white shadow",
        warning:
          "border-transparent bg-inside-yellow text-gray-900 shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
