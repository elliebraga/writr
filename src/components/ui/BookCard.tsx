import * as React from "react";
import { cn } from "../../utils/cn";
import Badge, { type BadgeVariant } from "./Badge.tsx";

export type BookCardVariant = "book" | "add";

export interface BookCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BookCardVariant;
  title?: string;
  synopsis?: string;
  coverImage?: string;
  status?: "finalizado" | "lendo" | "quero-ler" | string;
  pages?: number | string;
  updatedAt?: string;
  active?: boolean;
}

const BookCard = React.forwardRef<HTMLDivElement, BookCardProps>(
  (
    {
      className,
      variant = "book",
      title,
      synopsis,
      coverImage,
      status,
      pages,
      updatedAt,
      active = false,
      onClick,
      ...props
    },
    ref
  ) => {
    // 1. Estilos base e bordas. Para evitar deslocamento de layout (layout shift)
    // ao alternar a espessura da borda de 1px para 2px, ajustamos o preenchimento (padding) correspondente.
    const baseStyles = cn(
      "group relative flex flex-col w-full bg-white transition-all duration-200 ease-in-out cursor-pointer select-none overflow-hidden",
      "rounded-card font-sans", // radius-card do index.css (12px)
      active
        ? "border-2 border-neutral-900 p-[15px]" // Borda grossa ativa (offset com -1px padding)
        : "border border-neutral-200 hover:border-neutral-400 p-4" // Borda fina padrão
    );

    // Estado 2: Card de Adição ("add")
    if (variant === "add") {
      return (
        <div
          ref={ref}
          onClick={onClick}
          className={cn(baseStyles, "items-center justify-center min-h-[320px]", className)}
          {...props}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.2"
            stroke="currentColor"
            className="w-12 h-12 text-neutral-900 transition-transform duration-200 group-hover:scale-110"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      );
    }

    // Estado 1: Card de Livro comum ("book")
    // Mapeamento do status para os tokens de feedback definidos em index.css
    const getBadgeVariant = (statusValue: string): BadgeVariant => {
      const lowerStatus = statusValue.toLowerCase();
      if (lowerStatus === "finalizado") return "success";
      if (lowerStatus === "lendo") return "warning";
      if (lowerStatus === "quero-ler") return "brand";
      return "default";
    };

    return (
      <div ref={ref} onClick={onClick} className={cn(baseStyles, "min-h-[320px]", className)} {...props}>
        {/* Capa do livro */}
        <div className="aspect-[3/2] w-full bg-neutral-200 rounded-lg overflow-hidden flex items-center justify-center relative mb-3">
          {coverImage ? (
            <img src={coverImage} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-200" />
          )}
        </div>

        {/* Informações centrais */}
        <div className="flex flex-col gap-1.5 flex-grow">
          {status && (
            <Badge variant={getBadgeVariant(status)}>
              {status}
            </Badge>
          )}
          
          <h3 className="font-semibold text-base text-neutral-900 leading-tight tracking-tight mt-1 line-clamp-1">
            {title || "Sem título"}
          </h3>
          
          <p className="text-sm text-neutral-500 font-normal line-clamp-2 mt-0.5">
            {synopsis || "Sem sinopse"}
          </p>
        </div>

        {/* Rodapé */}
        <div className="mt-auto pt-4 flex items-end justify-between text-xs text-neutral-500 font-medium">
          <div>
            {pages !== undefined && (
              <span>
                {pages} {typeof pages === "number" ? (pages === 1 ? "página" : "páginas") : ""}
              </span>
            )}
          </div>
          
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] text-neutral-400 font-normal uppercase tracking-wider">
              atualizado em:
            </span>
            {updatedAt !== undefined && (
              <span className="font-semibold text-neutral-800 mt-0.5 min-h-[1rem]">
                {updatedAt}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BookCard.displayName = "BookCard";

export default BookCard;
