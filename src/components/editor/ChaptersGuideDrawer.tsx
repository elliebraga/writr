import React, { useState } from "react";
import {
  X,
  BookOpen,
  Plus,
  FileText,
  Search,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { Chapter } from "../../types/book";
import Button from "../ui/Button";

interface ChaptersGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (chapter: Chapter) => void;
  onCreateChapter?: (title: string) => Promise<void> | void;
  totalBookWordCount?: number;
}

export const ChaptersGuideDrawer: React.FC<ChaptersGuideDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  activeChapterId,
  onSelectChapter,
  onCreateChapter,
  totalBookWordCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      console.error("Erro ao criar capítulo na guia:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer deslizante a partir da esquerda */}
      <aside className="fixed inset-y-0 left-0 max-w-full flex z-50">
        <div className="w-screen max-w-xs sm:max-w-sm md:max-w-md bg-white border-r border-slate-200 shadow-2xl flex flex-col h-full h-[100dvh] animate-in slide-in-from-left duration-300 ease-out">
          
          {/* Header */}
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 pt-[max(0.875rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-funnel text-slate-900 truncate">
                    Guia de Capítulos
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 shrink-0">
                    {chapters.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans truncate">
                  {totalBookWordCount.toLocaleString("pt-BR")} palavras no livro
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Ações: Busca & Adicionar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 space-y-2.5 shrink-0">
            {chapters.length > 4 && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar capítulo por título..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            )}

            {onCreateChapter && !isCreatingInline && (
              <button
                type="button"
                onClick={() => setIsCreatingInline(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200/80 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Capítulo</span>
              </button>
            )}

            {isCreatingInline && (
              <form
                onSubmit={handleCreate}
                className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm space-y-2.5 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Novo Capítulo
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingInline(false);
                      setNewChapterTitle("");
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  autoFocus
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Ex: Capítulo 4: O Encontro..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingInline(false);
                      setNewChapterTitle("");
                    }}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newChapterTitle.trim() || isSubmitting}
                    className="!py-1 !text-xs !rounded-lg"
                  >
                    {isSubmitting ? "Criando..." : "Criar & Escrever"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Lista de Capítulos */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
            {filteredChapters.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Nenhum capítulo encontrado.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-blue-600 hover:underline mt-1 cursor-pointer"
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
                        onClose();
                      }
                    }}
                    className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50/80 border-blue-300 shadow-xs text-blue-950"
                        : "bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Número do Capítulo */}
                      <span
                        className={`text-[11px] font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                        }`}
                      >
                        {paddedNumber}
                      </span>

                      {/* Título e Palavras */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-semibold truncate ${
                              isActive ? "text-blue-900 font-bold" : "text-slate-800"
                            }`}
                          >
                            {ch.title.trim() || `Capítulo ${chapterNumber}`}
                          </h4>
                          {isActive && (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              Editando
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>
                            {(ch.word_count || 0).toLocaleString("pt-BR")} palavras
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
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

          {/* Footer do Drawer */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Alternância com salvamento automático</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
