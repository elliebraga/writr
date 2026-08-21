import * as React from "react";
import { cn } from "../../utils/cn";

export type ButtonVariant = "primary" | "brand" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 ease-in-out cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "select-none active:scale-[0.98]"
    );

    const variantStyles: Record<ButtonVariant, string> = {
      primary: "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 border border-transparent",
      brand: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 border border-transparent",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 border border-transparent",
      outline: "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200",
      ghost: "bg-transparent text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent",
      subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-full gap-1.5 h-8",
      md: "px-4 py-2 text-sm rounded-full gap-2 h-10",
      lg: "px-6 py-3 text-sm rounded-full gap-2.5 h-12",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button };
