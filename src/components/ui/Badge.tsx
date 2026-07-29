import * as React from "react";
import { cn } from "../../utils/cn";

export type BadgeVariant = "success" | "warning" | "brand" | "default";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide w-fit capitalize font-sans select-none";

    const variantStyles: Record<BadgeVariant, string> = {
      success: "bg-feedback-success-bg text-feedback-success-text",
      warning: "bg-feedback-warning-bg text-feedback-warning-text",
      brand: "bg-brand-50 text-brand-600",
      default: "bg-neutral-100 text-neutral-600",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
