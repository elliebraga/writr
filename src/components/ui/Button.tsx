import * as React from "react";
import { cn } from "../../utils/cn";

// Definição das variantes visuais suportadas
export type ButtonVariant = "primary" | "brand" | "secondary" | "outline" | "ghost";

// Definição dos tamanhos do botão
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
    // 1. Estilos base comuns a todos os botões (Acessibilidade, Transições, Flexbox)
    const baseStyles = cn(
      "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 ease-in-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "select-none active:scale-[0.98]"
    );

    // 2. Estilos específicos de variantes com base nos tokens do design
    const variantStyles: Record<ButtonVariant, string> = {
      // Tom escuro principal da imagem (Zinc 900)
      primary: "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 border border-transparent",
      // Azul de ação principal (Brand Blue 600)
      brand: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 border border-transparent",
      // Fundo cinza sutil das abas e botões secundários (Zinc 100)
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 border border-transparent",
      // Borda fina (Zinc 200) com fundo transparente/branco
      outline: "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200",
      // Sem bordas e com hover sutil
      ghost: "bg-transparent text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200",
    };

    // 3. Tamanhos e preenchimentos (Padding & Font-size - Todos em 14px / text-sm)
    const sizeStyles: Record<ButtonSize, string> = {
      // Cápsula compacta
      sm: "px-3 py-1.5 text-sm rounded-full gap-1.5 h-8",
      // Cápsula padrão (mais comum no layout)
      md: "px-4 py-2 text-sm rounded-full gap-2 h-10",
      // Cápsula expandida
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
        {/* Renderização do Loading Spinner */}
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

        {/* Ícone à esquerda */}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}

        {/* Conteúdo do Botão */}
        <span className="truncate">{children}</span>

        {/* Ícone à direita */}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
