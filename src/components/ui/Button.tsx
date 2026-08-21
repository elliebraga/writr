import * as React from "react";
import { Button as LettersButton, type ButtonProps as LettersButtonProps, type ButtonVariant as LettersButtonVariant } from "letters-ds";

export type ButtonVariant = "primary" | "brand" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<LettersButtonProps, "variant"> {
  variant?: ButtonVariant;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    let mappedVariant: LettersButtonVariant = "primary";
    if (variant === "brand") mappedVariant = "primary";
    else if (variant === "secondary") mappedVariant = "secondary";
    else if (variant === "outline") mappedVariant = "outline";
    else if (variant === "ghost") mappedVariant = "ghost";
    else if (variant === "danger") mappedVariant = "danger";
    else if (variant === "subtle") mappedVariant = "subtle";
    else mappedVariant = "primary";

    return <LettersButton ref={ref} variant={mappedVariant} className={className} {...props} />;
  }
);

Button.displayName = "Button";

export default Button;
export { Button };
