import * as React from "react";
import { cn } from "../../utils/cn";

export type BadgeVariant = "success" | "warning" | "brand" | "default" | "primary" | "danger" | "info" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  appearance?: "solid" | "soft" | "outline" | "dot";
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", appearance = "soft", icon, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide w-fit capitalize font-sans select-none";

    const variantStyles: Record<BadgeVariant, string> = {
      success: "bg-feedback-success-bg text-feedback-success-text border border-emerald-200/50",
      warning: "bg-feedback-warning-bg text-feedback-warning-text border border-amber-200/50",
      brand: "bg-brand-50 text-brand-600 border border-brand-200/50",
      primary: "bg-slate-900 text-white border border-slate-900",
      danger: "bg-red-50 text-red-700 border border-red-200/50",
      info: "bg-sky-50 text-sky-700 border border-sky-200/50",
      neutral: "bg-neutral-100 text-neutral-600 border border-neutral-200/50",
      default: "bg-neutral-100 text-neutral-600 border border-neutral-200/50",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
export { Badge };
