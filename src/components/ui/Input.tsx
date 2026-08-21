import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  errorMessage?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, errorMessage, helperText, leftIcon, startIcon, rightIcon, endIcon, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const activeLeftIcon = leftIcon || startIcon;
    const activeRightIcon = rightIcon || endIcon;
    const activeError = error || errorMessage;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-semibold select-none transition-colors duration-200",
              activeError ? "text-feedback-danger-text" : "text-neutral-800",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {activeLeftIcon && (
            <div className="absolute left-4 text-neutral-400 pointer-events-none flex items-center justify-center">
              {activeLeftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={!!activeError}
            aria-describedby={activeError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              "w-full h-11 px-4 text-sm bg-white border font-normal transition-all duration-200 outline-none",
              "placeholder:text-neutral-400 text-neutral-800",
              "rounded-xl",
              "border-neutral-200",
              "focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
              "disabled:bg-neutral-50 disabled:border-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed",
              activeError && [
                "border-feedback-danger-text text-feedback-danger-text placeholder:text-feedback-danger-text/50",
                "focus:border-feedback-danger-text focus:ring-feedback-danger-text"
              ],
              activeLeftIcon && "pl-11",
              activeRightIcon && "pr-11",
              className
            )}
            {...props}
          />

          {activeRightIcon && (
            <div className="absolute right-4 text-neutral-400 flex items-center justify-center">
              {activeRightIcon}
            </div>
          )}
        </div>

        {activeError ? (
          <span id={`${inputId}-error`} role="alert" className="text-xs font-medium text-feedback-danger-text">
            {activeError}
          </span>
        ) : (
          helperText && (
            <span id={`${inputId}-helper`} className="text-xs text-neutral-500">
              {helperText}
            </span>
          )
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
export { Input };
