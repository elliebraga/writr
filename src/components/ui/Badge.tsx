import * as React from "react";
import { Badge as LettersBadge, type BadgeProps as LettersBadgeProps, type BadgeVariant as LettersBadgeVariant } from "letters-ds";

export type BadgeVariant = "success" | "warning" | "brand" | "default" | "primary" | "danger" | "info" | "neutral";

export interface BadgeProps extends Omit<LettersBadgeProps, "variant"> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", appearance = "soft", className, children, ...props }, ref) => {
    let mappedVariant: LettersBadgeVariant = "neutral";
    if (variant === "success") mappedVariant = "success";
    else if (variant === "warning") mappedVariant = "warning";
    else if (variant === "brand" || variant === "primary") mappedVariant = "primary";
    else if (variant === "danger") mappedVariant = "danger";
    else if (variant === "info") mappedVariant = "info";
    else mappedVariant = "neutral";

    return (
      <span ref={ref}>
        <LettersBadge variant={mappedVariant} appearance={appearance} className={className} {...props}>
          {children}
        </LettersBadge>
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
export { Badge };
