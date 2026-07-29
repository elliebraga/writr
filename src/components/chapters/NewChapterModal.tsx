import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import Button from "../ui/Button";

interface NewChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChapter: (title: string) => void;
}

export const NewChapterModal: React.FC<NewChapterModalProps> = ({
  isOpen,
  onClose,
  onCreateChapter,
}) => {
  const [title, setTitle] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateChapter(title.trim());
    setTitle("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-semibold text-slate-900">Novo Capítulo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome do Capítulo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="Ex: Capítulo 1 - O Despertar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <p className="text-base text-slate-500 font-sans mt-1.5">
              Você será redirecionado diretamente para o editor de texto em tela cheia.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!title.trim()}
            >
              Criar & Escrever
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
