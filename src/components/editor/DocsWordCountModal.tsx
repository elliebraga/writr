import React from "react";
import { X, FileText, Clock } from "lucide-react";
import { Editor } from "@tiptap/react";

interface DocsWordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  pageSize?: string;
}

export const DocsWordCountModal: React.FC<DocsWordCountModalProps> = ({
  isOpen,
  onClose,
  editor,
}) => {
  if (!isOpen || !editor) return null;

  const text = editor.state.doc.textContent;
  const words = editor.storage.characterCount.words() || 0;
  const charactersWithSpaces = editor.storage.characterCount.characters() || 0;
  const charactersWithoutSpaces = text.replace(/\s+/g, "").length;

  // Estimativa aproximada de páginas (250 palavras por página padrão)
  const estimatedPages = Math.max(1, Math.ceil(words / 250));

  // Estimativa de tempo de leitura (média de 200 palavras por minuto)
  const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold font-funnel text-slate-900">
                Contagem de Palavras
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Páginas estimadas:</span>
              <strong className="text-slate-900 font-semibold">{estimatedPages}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Palavras:</span>
              <strong className="text-slate-900 font-semibold">{words}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Caracteres (com espaços):</span>
              <strong className="text-slate-900 font-semibold">{charactersWithSpaces}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Caracteres (sem espaços):</span>
              <strong className="text-slate-900 font-semibold">{charactersWithoutSpaces}</strong>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                Tempo de leitura:
              </span>
              <strong className="text-slate-900 font-semibold">~{readTimeMinutes} min</strong>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
