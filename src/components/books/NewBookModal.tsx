import React, { useState, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import type { BookStatus } from "../../types/book";
import Button from "../ui/Button";
import { compressImageFile } from "../../utils/imageUtils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 800, 1200, 0.85);
      setCoverUrl(compressed);
      setError(null);
    } catch {
      setError("Erro ao processar imagem de capa.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Novo Livro</h3>
            <p className="text-xs text-slate-600">Cadastre uma nova obra para organizar seus capítulos.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white"
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
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white"
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

          {/* Capa do Livro (Upload do Computador/Celular) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Capa da Obra
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {coverUrl ? (
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-14 h-20 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 shrink-0 shadow-2xs">
                  <img
                    src={coverUrl}
                    alt="Pré-visualização da Capa"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-800 truncate">Imagem selecionada</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Trocar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverUrl("")}
                      className="text-xs font-medium px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Selecionar Imagem do Computador ou Celular
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formatos suportados: PNG, JPG ou WEBP
                  </p>
                </div>
              </div>
            )}
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
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-600 bg-white resize-none"
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
