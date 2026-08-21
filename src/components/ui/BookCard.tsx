import * as React from "react";
import { Card as LettersCard } from "letters-ds";
import { cn } from "../../utils/cn";
import Badge, { type BadgeVariant } from "./Badge";

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
  isShared?: boolean;
  userRole?: string;
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
      isShared = false,
      userRole,
      onClick,
      ...props
    },
    ref
  ) => {
    const getBadgeVariant = (statusValue: string): BadgeVariant => {
      const lowerStatus = statusValue.toLowerCase();
      if (lowerStatus === "finalizado") return "success";
      if (lowerStatus === "lendo") return "warning";
      if (lowerStatus === "quero-ler") return "brand";
      return "default";
    };

    if (variant === "add") {
      return (
        <div ref={ref} onClick={onClick} {...props}>
          <LettersCard
            isHoverable
            isClickable
            className={cn(
              "flex flex-col items-center justify-center min-h-[320px] w-full bg-white border-2 border-dashed border-neutral-300 hover:border-neutral-900 group select-none transition-all rounded-card",
              className
            )}
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
          </LettersCard>
        </div>
      );
    }

    return (
      <div ref={ref} onClick={onClick} {...props}>
        <LettersCard
          isHoverable
          isClickable
          className={cn(
            "flex flex-col min-h-[320px] w-full bg-white transition-all select-none p-4 rounded-card",
            active ? "border-2 border-neutral-900 shadow-xs" : "border border-neutral-200 hover:border-neutral-400",
            className
          )}
        >
          <div className="aspect-[3/2] w-full bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center relative mb-3 shrink-0">
            {coverImage ? (
              <img src={coverImage} alt={title || "Obra"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-200" />
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-grow">
            {status && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={getBadgeVariant(status)}>{status}</Badge>
              </div>
            )}

            <h3 className="font-semibold text-base text-neutral-900 leading-tight tracking-tight mt-1 line-clamp-1">
              {title || "Sem título"}
            </h3>

            <p className="text-sm text-neutral-500 font-normal line-clamp-2 mt-0.5">
              {synopsis || "Sem sinopse"}
            </p>
          </div>

          <div className="mt-auto pt-4 flex items-end justify-between text-xs text-neutral-500 font-medium border-t border-neutral-100">
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
        </LettersCard>
      </div>
    );
  }
);

BookCard.displayName = "BookCard";

export default BookCard;
