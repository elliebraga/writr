import React, { useState, useRef } from "react";
import { Trash2, Palette } from "lucide-react";
import type { WhiteboardItem, PostItColor, WhiteboardCategory } from "../../types/whiteboard";
import { POSTIT_COLOR_MAP } from "../../types/whiteboard";

interface PostItNoteProps {
  item: WhiteboardItem;
  onUpdate: (updated: Partial<WhiteboardItem> & { id: string }) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}

const CATEGORY_LABELS: Record<WhiteboardCategory, { label: string; icon: string }> = {
  ideia: { label: "Ideia", icon: "💡" },
  virada: { label: "Ponto de Virada", icon: "⚡" },
  cena: { label: "Cena Chave", icon: "🎬" },
  pesquisa: { label: "Pesquisa", icon: "🔍" },
  duvida: { label: "Pergunta / Dúvida", icon: "❓" },
  geral: { label: "Geral", icon: "📌" },
};

const COLOR_OPTIONS: PostItColor[] = ["yellow", "mint", "lavender", "peach", "cyan", "pink", "slate"];

export const PostItNote: React.FC<PostItNoteProps> = ({
  item,
  onUpdate,
  onDelete,
  onDragStart,
}) => {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const colors = POSTIT_COLOR_MAP[item.color] || POSTIT_COLOR_MAP.yellow;
  const currentCategory = item.category || "ideia";

  if (item.type === "section") {
    return (
      <div
        style={{
          transform: `translate(${item.x}px, ${item.y}px)`,
        }}
        className="absolute z-10 cursor-move select-none group"
        onMouseDown={(e) => onDragStart(item.id, e)}
      >
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xs border-2 border-slate-900 rounded-full px-5 py-2 shadow-md">
          <input
            type="text"
            value={item.title || item.content}
            onChange={(e) => onUpdate({ id: item.id, title: e.target.value, content: e.target.value })}
            placeholder="Título da Seção / Ato..."
            className="text-sm font-bold font-funnel text-slate-900 bg-transparent focus:outline-none w-48"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="text-slate-600 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100"
            title="Excluir Seção"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        transform: `translate(${item.x}px, ${item.y}px)`,
      }}
      className={`absolute z-10 w-64 ${colors.bg} border ${colors.border} rounded-2xl shadow-md hover:shadow-lg transition-shadow select-none group flex flex-col overflow-hidden`}
    >
      {/* Header do Post-it (Arraste + Categoria + Ações) */}
      <div
        onMouseDown={(e) => onDragStart(item.id, e)}
        className={`px-3.5 py-2 ${colors.header} flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-black/5`}
      >
        {/* Badge da Categoria */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingCategory(!isEditingCategory);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold tracking-tight rounded-full px-2 py-0.5 bg-white/60 hover:bg-white transition-colors text-slate-800"
          >
            <span>{CATEGORY_LABELS[currentCategory].icon}</span>
            <span>{CATEGORY_LABELS[currentCategory].label}</span>
          </button>

          {isEditingCategory && (
            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-30 text-xs">
              {(Object.keys(CATEGORY_LABELS) as WhiteboardCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ id: item.id, category: cat });
                    setIsEditingCategory(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{CATEGORY_LABELS[cat].icon}</span>
                  <span>{CATEGORY_LABELS[cat].label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ferramentas: Cor & Excluir */}
        <div className="flex items-center gap-1">
          {/* Seletor de Cores */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsColorPickerOpen(!isColorPickerOpen);
              }}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-white/50 transition-colors"
              title="Trocar cor"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {isColorPickerOpen && (
              <div className="absolute right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xl flex gap-1.5 z-30">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ id: item.id, color: c });
                      setIsColorPickerOpen(false);
                    }}
                    className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 ${
                      POSTIT_COLOR_MAP[c].bg
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1 text-slate-600 hover:text-red-600 rounded-full hover:bg-white/50 transition-colors"
            title="Excluir Post-it"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Corpo Editável do Post-it */}
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <input
          type="text"
          value={item.title || ""}
          onChange={(e) => onUpdate({ id: item.id, title: e.target.value })}
          placeholder="Título / Tópico..."
          className={`w-full text-xs font-bold font-funnel bg-transparent focus:outline-none ${colors.text} placeholder:text-black/30 border-b border-black/5 pb-1`}
        />

        <textarea
          ref={textareaRef}
          rows={3}
          value={item.content}
          onChange={(e) => onUpdate({ id: item.id, content: e.target.value })}
          placeholder="Escreva sua ideia, notas ou gancho aqui..."
          className={`w-full text-xs font-sans bg-transparent focus:outline-none resize-none ${colors.text} placeholder:text-black/30 leading-relaxed`}
        />
      </div>
    </div>
  );
};
