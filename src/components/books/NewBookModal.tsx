import React, { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import type { BookStatus } from "../../types/book";
import Button from "../ui/Button";

interface NewBookModalProps {
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

export const NewBookModal: React.FC<NewBookModalProps> = ({
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Novo Livro</h3>
            <p className="text-xs text-slate-500">Cadastre uma nova obra para organizar seus capítulos.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Campo Título (Obrigatório) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Obra <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: O Segredo das Estrelas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantidade de Páginas Previstas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Páginas Previstas
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 250"
                value={expectedPages}
                onChange={(e) => setExpectedPages(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
              >
                <option value="Idea">Ideia (Idea)</option>
                <option value="Draft">Rascunho (Draft)</option>
                <option value="Writing">Em Escrita (Writing)</option>
              </select>
            </div>
          </div>

          {/* Capa do Livro (URL/Upload) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL da Imagem da Capa
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://exemplo.com/capa.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Sinopse */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sinopse / Resumo
            </label>
            <textarea
              rows={3}
              placeholder="Escreva uma breve apresentação da sua história..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Criar Obra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
