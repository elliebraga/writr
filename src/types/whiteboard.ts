export type PostItColor = "yellow" | "mint" | "lavender" | "peach" | "cyan" | "pink" | "slate";

export type WhiteboardCategory = "ideia" | "virada" | "cena" | "pesquisa" | "duvida" | "geral";

export interface WhiteboardItem {
  id: string;
  id_book: string;
  type: "postit" | "section";
  title?: string;
  content: string;
  x: number;
  y: number;
  color: PostItColor;
  category?: WhiteboardCategory;
  width?: number;
  height?: number;
  created_at?: string;
  updated_at?: string;
}

export const POSTIT_COLOR_MAP: Record<PostItColor, { bg: string; border: string; text: string; header: string }> = {
  yellow: {
    bg: "bg-amber-50",
    border: "border-amber-200 hover:border-amber-400",
    text: "text-amber-950",
    header: "bg-amber-100/80 text-amber-900",
  },
  mint: {
    bg: "bg-emerald-50",
    border: "border-emerald-200 hover:border-emerald-400",
    text: "text-emerald-950",
    header: "bg-emerald-100/80 text-emerald-900",
  },
  lavender: {
    bg: "bg-purple-50",
    border: "border-purple-200 hover:border-purple-400",
    text: "text-purple-950",
    header: "bg-purple-100/80 text-purple-900",
  },
  peach: {
    bg: "bg-orange-50",
    border: "border-orange-200 hover:border-orange-400",
    text: "text-orange-950",
    header: "bg-orange-100/80 text-orange-900",
  },
  cyan: {
    bg: "bg-sky-50",
    border: "border-sky-200 hover:border-sky-400",
    text: "text-sky-950",
    header: "bg-sky-100/80 text-sky-900",
  },
  pink: {
    bg: "bg-rose-50",
    border: "border-rose-200 hover:border-rose-400",
    text: "text-rose-950",
    header: "bg-rose-100/80 text-rose-900",
  },
  slate: {
    bg: "bg-slate-50",
    border: "border-slate-300 hover:border-slate-400",
    text: "text-slate-900",
    header: "bg-slate-200/80 text-slate-800",
  },
};
