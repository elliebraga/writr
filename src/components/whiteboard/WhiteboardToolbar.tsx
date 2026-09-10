import React, { useState } from "react";
import { Plus, ZoomIn, ZoomOut, Trash2, Layout } from "lucide-react";
import type { PostItColor } from "../../types/whiteboard";
import { POSTIT_COLOR_MAP } from "../../types/whiteboard";

interface WhiteboardToolbarProps {
  zoomLevel: number;
  onAddPostIt: (color: PostItColor) => void;
  onAddSection: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClearAll: () => void;
}

const COLOR_PILLS: PostItColor[] = ["yellow", "mint", "lavender", "peach", "cyan", "pink", "slate"];

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  zoomLevel,
  onAddPostIt,
  onAddSection,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onClearAll,
}) => {
  const [selectedColor, setSelectedColor] = useState<PostItColor>("yellow");

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1rem)] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full shadow-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-3 select-none animate-in slide-in-from-bottom duration-300">
      
      {/* Seletor de Cores Rápidas */}
      <div className="flex items-center gap-1 sm:gap-1.5 border-r border-slate-200 pr-1.5 sm:pr-3 overflow-x-auto scrollbar-none max-w-[110px] sm:max-w-none shrink-0 py-0.5">
        {COLOR_PILLS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedColor(c)}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border transition-all shrink-0 ${
              selectedColor === c ? "scale-110 sm:scale-125 border-slate-900 shadow-xs ring-2 ring-slate-400" : "border-black/10 hover:scale-110"
            } ${POSTIT_COLOR_MAP[c].bg}`}
            title={`Cor: ${c}`}
          />
        ))}
      </div>

      {/* Botões de Ação Principal: + Post-it e + Seção */}
      <div className="flex items-center gap-1 sm:gap-2 border-r border-slate-200 pr-1.5 sm:pr-3 shrink-0">
        <button
          onClick={() => onAddPostIt(selectedColor)}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post-it</span>
        </button>

        <button
          onClick={onAddSection}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shrink-0"
          title="Adicionar divisor de seção ou ato"
        >
          <Layout className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Seção</span>
        </button>
      </div>

      {/* Controles de Zoom */}
      <div className="flex items-center gap-0.5 sm:gap-1 border-r border-slate-200 pr-1.5 sm:pr-3 shrink-0">
        <button
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.5}
          className="p-1 sm:p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
          title="Reduzir Zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          title="Redefinir Zoom para 100%"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          disabled={zoomLevel >= 2.0}
          className="p-1 sm:p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Limpar Quadro */}
      <button
        onClick={onClearAll}
        className="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors shrink-0"
        title="Limpar todos os post-its"
      >
        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};
