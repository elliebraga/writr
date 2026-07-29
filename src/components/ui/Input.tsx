import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, leftIcon, rightIcon, disabled, id, ...props }, ref) => {
    // ID único para associar o label ao input (Acessibilidade)
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label do Input */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-semibold select-none transition-colors duration-200",
              error ? "text-feedback-danger-text" : "text-neutral-800",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Wrapper (Posicionamento dos ícones internos) */}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-neutral-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              // Estilos Base
              "w-full h-11 px-4 text-sm bg-white border font-normal transition-all duration-200 outline-none",
              "placeholder:text-neutral-400 text-neutral-800",
              "rounded-xl", // Border radius arredondado correspondente à imagem
              
              // Estado Default (Input 1 na imagem)
              "border-neutral-200",
              
              // Estado Foco/Ativo (Input 2 na imagem)
              "focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
              
              // Estado Desabilitado (Input 3 na imagem)
              "disabled:bg-neutral-50 disabled:border-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed",
              
              // Estado Erro (Input 4 na imagem)
              error && [
                "border-feedback-danger-text text-feedback-danger-text placeholder:text-feedback-danger-text/50",
                "focus:border-feedback-danger-text focus:ring-feedback-danger-text"
              ],
              
              // Espaçamento condicional caso existam ícones
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 text-neutral-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Mensagem de Erro ou Helper Text */}
        {error ? (
          <span id={`${inputId}-error`} role="alert" className="text-xs font-medium text-feedback-danger-text">
            {error}
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
