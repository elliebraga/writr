import React from "react";
import { FileText, Clock, Trash2 } from "lucide-react";
import type { Chapter } from "../../types/book";
import { useDialog } from "../ui/DialogProvider";

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  onSelect: (chapter: Chapter) => void;
  onDelete?: (chapterId: string) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  index,
  onSelect,
  onDelete,
}) => {
  const { showConfirm } = useDialog();
  // Estimativa de páginas (média de 250 palavras por página padrão)
  const estimatedPages = Math.max(1, Math.ceil((chapter.word_count || 0) / 250));

  // Stripar HTML da sinopse ou gerar resumo a partir do conteúdo
  const cleanExcerpt = React.useMemo(() => {
    if (chapter.synopsis && chapter.synopsis.trim()) return chapter.synopsis;
    if (!chapter.content) return "Sem conteúdo escrito ainda.";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = chapter.content;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > 140 ? text.substring(0, 140) + "..." : text || "Sem conteúdo escrito ainda.";
  }, [chapter.synopsis, chapter.content]);

  return (
    <div
      onClick={() => onSelect(chapter)}
      className="group relative bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between h-[210px] select-none hover:shadow-xs"
    >
      <div>
        {/* Header com Número do Capítulo e Ações */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-900 transition-colors">
            Capítulo {index + 1}
          </span>

          {onDelete && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const confirmed = await showConfirm(
                  `Deseja excluir o capítulo "${chapter.title || `Capítulo ${index + 1}`}"?`,
                  "Excluir Capítulo",
                  "Excluir",
                  "Cancelar"
                );
                if (confirmed) {
                  onDelete(chapter.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1 rounded-full hover:bg-slate-100"
              title="Excluir capítulo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Título do Capítulo */}
        <h3 className="text-base font-semibold font-funnel text-slate-900 leading-snug group-hover:translate-x-0.5 transition-transform line-clamp-1 mb-2">
          {chapter.title || `Capítulo ${index + 1}`}
        </h3>

        {/* Resumo / Sinopse */}
        <p className="text-sm text-slate-500 font-normal line-clamp-2 leading-relaxed">
          {cleanExcerpt}
        </p>
      </div>

      {/* Rodapé com Indicadores de Palavras e Páginas */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-1.5 text-slate-600">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>
            <strong className="text-slate-900 font-semibold">{chapter.word_count || 0}</strong> palavras
            <span className="text-slate-400 font-normal ml-1">({estimatedPages} {estimatedPages === 1 ? "pág" : "págs"})</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>
            {chapter.updated_at
              ? new Date(chapter.updated_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })
              : "Recente"}
          </span>
        </div>
      </div>
    </div>
  );
};
