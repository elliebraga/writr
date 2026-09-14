import React, { useState } from "react";
import {
  BookOpen,
  X,
  Plus,
  Search,
  CheckCircle2,
  ChevronRight,
  Minimize2,
  FileText,
  Sparkles,
} from "lucide-react";
import type { Chapter } from "../../types/book";
import Button from "../ui/Button";

interface FloatingChaptersMenuProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (chapter: Chapter) => void;
  onCreateChapter?: (title: string) => Promise<void> | void;
  totalBookWordCount?: number;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  isMobileView?: boolean;
}

export const FloatingChaptersMenu: React.FC<FloatingChaptersMenuProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onCreateChapter,
  totalBookWordCount = 0,
  isOpen,
  onToggle,
  isMobileView = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  const sortedChapters = [...chapters].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  const filteredChapters = searchQuery.trim()
    ? sortedChapters.filter((ch) =>
        ch.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : sortedChapters;

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChapterTitle.trim() || !onCreateChapter) return;

    setIsSubmitting(true);
    try {
      await onCreateChapter(newChapterTitle.trim());
      setNewChapterTitle("");
      setIsCreatingInline(false);
    } catch (err) {
      console.error("Erro ao criar capítulo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. ESTADO RECOLHIDO: Pílula Flutuante na Lateral Esquerda
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        className="fixed left-3 sm:left-5 top-28 sm:top-36 z-30 flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-lg hover:shadow-xl backdrop-blur-md rounded-full transition-all duration-200 cursor-pointer active:scale-95 group select-none"
        title="Abrir Guia de Capítulos Flutuante"
      >
        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold text-slate-700 font-funnel hidden sm:inline">
          Capítulos
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-mono">
          {chapters.length}
        </span>
      </button>
    );
  }

  // 2. CONTEÚDO DO PAINEL FLUTUANTE
  const panelContent = (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Header do Card Flutuante */}
      <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between bg-white/70 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold font-funnel text-slate-900 truncate">
                Capítulos
              </h4>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-blue-100/80 text-blue-700 rounded-full shrink-0">
                {chapters.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans truncate">
              {totalBookWordCount.toLocaleString("pt-BR")} palavras no total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Minimizar para pílula flutuante"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Barra de Ações: Busca e Novo Capítulo */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
        {chapters.length > 4 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar capítulo..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        )}

        {onCreateChapter && !isCreatingInline && (
          <button
            type="button"
            onClick={() => setIsCreatingInline(true)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200/80 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Capítulo</span>
          </button>
        )}

        {isCreatingInline && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-xs space-y-2 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Título do Capítulo
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInline(false);
                  setNewChapterTitle("");
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Ex: Capítulo 4: O Encontro..."
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />

            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInline(false);
                  setNewChapterTitle("");
                }}
                className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newChapterTitle.trim() || isSubmitting}
                className="!py-0.5 !px-2.5 !text-[11px] !rounded"
              >
                {isSubmitting ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de Capítulos com Rolagem Interna */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-6 px-3">
            <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-[11px] text-slate-500">Nenhum capítulo encontrado.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-blue-600 hover:underline mt-1 cursor-pointer"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          filteredChapters.map((ch, idx) => {
            const isActive = ch.id === activeChapterId;
            const chapterNumber = idx + 1;
            const paddedNumber = chapterNumber < 10 ? `0${chapterNumber}` : `${chapterNumber}`;

            return (
              <div
                key={ch.id}
                onClick={() => {
                  if (!isActive) {
                    onSelectChapter(ch);
                    if (isMobileView) onToggle(false);
                  }
                }}
                className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-50/90 border-blue-300 shadow-2xs text-blue-950"
                    : "bg-white hover:bg-slate-50/80 border-slate-200/70 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                    }`}
                  >
                    {paddedNumber}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h5
                        className={`text-xs truncate ${
                          isActive ? "text-blue-900 font-bold" : "text-slate-800 font-medium"
                        }`}
                      >
                        {ch.title.trim() || `Capítulo ${chapterNumber}`}
                      </h5>
                      {isActive && (
                        <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {(ch.word_count || 0).toLocaleString("pt-BR")} palavras
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5"
                  }`}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Footer do Card Flutuante */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Salvamento automático ao trocar</span>
        </div>
      </div>
    </div>
  );

  // 3. MODO MOBILE COM BACKDROP SUAVE
  if (isMobileView) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => onToggle(false)}
        />
        <div className="relative w-full max-w-sm max-h-[82vh] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 z-10">
          {panelContent}
        </div>
      </div>
    );
  }

  // 4. MODO DESKTOP: Painel Flutuante Retrátil ao Lado da Folha
  return (
    <div className="fixed left-4 sm:left-6 top-28 sm:top-36 z-30 w-72 lg:w-80 max-h-[calc(100vh-180px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {panelContent}
    </div>
  );
};
