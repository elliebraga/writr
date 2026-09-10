import React, { useState } from "react";
import { X, Image as ImageIcon, BookOpen, Sparkles } from "lucide-react";
import type { BookStatus } from "../../types/book";
import Button from "../ui/Button";

interface NewBookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (bookData: {
    book_name: string;
    expected_pages?: number;
    synopsis?: string;
    cover_url?: string;
    status: BookStatus;
  }) => Promise<void> | void;
}

export const NewBookDrawer: React.FC<NewBookDrawerProps> = ({
  isOpen,
  onClose,
  onCreateBook,
}) => {
  const [title, setTitle] = useState("");
  const [expectedPages, setExpectedPages] = useState<string>("");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<BookStatus>("Draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("O título do livro é obrigatório.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onCreateBook({
        book_name: title.trim(),
        expected_pages: expectedPages ? parseInt(expectedPages, 10) : undefined,
        synopsis: synopsis.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
        status: status,
      });

      // Reset form
      setTitle("");
      setExpectedPages("");
      setSynopsis("");
      setCoverUrl("");
      setStatus("Draft");
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar livro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      
      {/* Backdrop de Fundo */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Painel Lateral (Drawer Slide-Over da Direita / Fullscreen no Mobile) */}
      <aside className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto max-w-full flex md:pl-10 z-50">
        <div className="w-full md:w-[40vw] max-w-full md:max-w-none md:min-w-[420px] bg-white md:border-l border-slate-200 shadow-2xl flex flex-col h-full h-[100dvh] animate-in slide-in-from-bottom md:slide-in-from-right duration-300 ease-out">
          
          {/* Drawer Header */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 pt-[max(0.875rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold font-funnel text-slate-900 truncate">Nova Obra</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-sans truncate">Cadastre um projeto para organizar capítulos.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Campo Título (Obrigatório) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Título da Obra <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="Ex: O Segredo das Estrelas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white"
              />
            </div>

            {/* Quantidade de Páginas Previstas & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Páginas Previstas
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 250"
                  value={expectedPages}
                  onChange={(e) => setExpectedPages(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookStatus)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 bg-white cursor-pointer"
                >
                  <option value="Idea">Ideia (Idea)</option>
                  <option value="Draft">Rascunho (Draft)</option>
                  <option value="Writing">Em Escrita (Writing)</option>
                </select>
              </div>
            </div>

            {/* Capa do Livro (URL) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL da Imagem de Capa
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://exemplo.com/capa.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-base md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white"
                />
                <ImageIcon className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Preview da Capa */}
            {coverUrl && (
              <div className="aspect-[3/2] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={coverUrl}
                  alt="Preview da Capa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Sinopse */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sinopse / Resumo
              </label>
              <textarea
                rows={4}
                placeholder="Escreva uma breve apresentação da sua história..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-600">
              <Sparkles className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Após criar a obra, você será redirecionado para a gestão de capítulos.</span>
            </div>
          </form>

          {/* Drawer Footer Fixo no Rodapé */}
          <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleSubmit}
              className="flex-1 sm:flex-initial"
            >
              Criar Obra
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
};
