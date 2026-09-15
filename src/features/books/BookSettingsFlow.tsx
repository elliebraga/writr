import React, { useState, useRef } from "react";
import type { Book, BookStatus } from "../../types/book";
import { bookService } from "../../services/bookService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useDialog } from "../../components/ui/DialogProvider";
import { compressImageFile } from "../../utils/imageUtils";
import {
  Save,
  Trash2,
  BookOpen,
  Image as ImageIcon,
  Target,
  FileText,
  AlertTriangle,
  Check,
  Upload,
} from "lucide-react";

interface BookSettingsFlowProps {
  activeBook: Book;
  onUpdateBook: (updated: Book) => void;
  onDeleteBook: (bookId: string) => void;
}

const STATUS_OPTIONS: { id: BookStatus; label: string; desc: string }[] = [
  { id: "rascunho", label: "Rascunho", desc: "Fase inicial de concepção e rascunho" },
  { id: "Writing", label: "Em Escrita", desc: "Produção ativa de capítulos" },
  { id: "Idea", label: "Ideia", desc: "Brainstorming e estruturação" },
  { id: "finalizado", label: "Finalizado", desc: "Obra concluída e revisada" },
];

export const BookSettingsFlow: React.FC<BookSettingsFlowProps> = ({
  activeBook,
  onUpdateBook,
  onDeleteBook,
}) => {
  const { showConfirm, showAlert } = useDialog();

  const [bookName, setBookName] = useState(activeBook.book_name || "");
  const [synopsis, setSynopsis] = useState(activeBook.synopsis || activeBook.resume || "");
  const [coverUrl, setCoverUrl] = useState(activeBook.cover_url || activeBook.image_ref || "");
  const [status, setStatus] = useState<BookStatus>(activeBook.status || "rascunho");
  const [expectedPages, setExpectedPages] = useState<number | string>(
    activeBook.expected_pages !== undefined && activeBook.expected_pages !== null
      ? activeBook.expected_pages
      : 100
  );
  const [wordGoal, setWordGoal] = useState<number | string>(
    activeBook.word_goal !== undefined && activeBook.word_goal !== null
      ? activeBook.word_goal
      : 25000
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImageFile(file, 900, 1200, 0.85);
      setCoverUrl(compressedBase64);
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      showAlert("Não foi possível carregar a imagem selecionada.", "Erro ao processar imagem");
    }
  };

  // Manipular salvamento das configurações
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bookName.trim()) {
      showAlert("Por favor, informe o título da obra.", "Nome Obrigatório");
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const parsedPages = expectedPages ? parseInt(expectedPages.toString(), 10) : 100;
      const parsedWords = wordGoal ? parseInt(wordGoal.toString(), 10) : 25000;

      const updated = await bookService.updateBook(activeBook.id, {
        book_name: bookName.trim(),
        synopsis: synopsis.trim(),
        resume: synopsis.trim(),
        cover_url: coverUrl.trim(),
        image_ref: coverUrl.trim(),
        status,
        expected_pages: isNaN(parsedPages) ? 100 : parsedPages,
        word_goal: isNaN(parsedWords) ? 25000 : parsedWords,
      });

      onUpdateBook(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar configurações:", err);
      showAlert(
        "Não foi possível sincronizar as alterações com o banco de dados.",
        "Erro ao Salvar"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir a obra
  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `Tem certeza que deseja excluir "${activeBook.book_name}"? Todos os capítulos, personagens e relações associados serão permanentemente excluídos. Esta ação não pode ser desfeita.`,
      "Excluir esta Obra?",
      "Sim, Excluir Obra",
      "Cancelar"
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const success = await bookService.deleteBook(activeBook.id);
      if (success) {
        onDeleteBook(activeBook.id);
      } else {
        showAlert(
          "Ocorreu uma falha ao tentar deletar a obra no Supabase.",
          "Erro ao Excluir"
        );
      }
    } catch (err) {
      console.error("Erro na exclusão:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full select-none animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
              Configurações da Obra
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
              {status}
            </span>
          </div>
          <p className="text-sm text-slate-600 font-sans mt-1">
            Personalize os parâmetros gerais, metas de páginas e informações de <strong className="text-slate-900 font-semibold">{activeBook.book_name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveSettings}
            isLoading={isSaving}
            leftIcon={savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          >
            {savedSuccess ? "Alterações Salvas!" : "Salvar Configurações"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* Bloco 1: Informações Básicas da Obra */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">Informações Principais</h3>
              <p className="text-xs text-slate-600">Título, status e apresentação geral da sua obra.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <Input
                label="Título da Obra *"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="Ex: O Nome do Vento, Crônicas de Gelo..."
                required
              />
            </div>

            {/* Status da Obra */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-800">Status do Projeto</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      status === opt.id
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 text-slate-900"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sinopse / Resumo */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-800">Sinopse da Obra</label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Descreva o enredo central, premissa ou sinopse da obra..."
                rows={4}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none text-neutral-800 placeholder:text-neutral-600 bg-white transition-all leading-relaxed resize-none"
              />
              <p className="text-[11px] text-slate-600">
                A sinopse é exibida no Dashboard e na visão geral da obra.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Metas & Objetivos de Escrita */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">Metas & Objetivos de Escrita</h3>
              <p className="text-xs text-slate-600">Defina o volume desejado para alimentar as metas do Dashboard.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Input
                label="Meta de Páginas Previstas"
                type="number"
                min={1}
                value={expectedPages}
                onChange={(e) => setExpectedPages(e.target.value)}
                placeholder="Ex: 150"
                helperText="Quantidade de páginas estimadas para a obra final."
              />
            </div>

            <div className="space-y-1.5">
              <Input
                label="Meta Total de Palavras (Objetivo)"
                type="number"
                min={100}
                step={500}
                value={wordGoal}
                onChange={(e) => setWordGoal(e.target.value)}
                placeholder="Ex: 40000"
                helperText="O objetivo geral de palavras que você pretende atingir."
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 text-xs text-slate-600">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              💡 <strong>Dica editorial:</strong> No padrão da indústria, 1 página diagramada equivale em média a <strong>250 palavras</strong>. Com uma meta de {wordGoal ? parseInt(wordGoal.toString(), 10).toLocaleString("pt-BR") : 0} palavras, o volume estimado corresponde a aproximadamente <strong>{Math.round((parseInt(wordGoal ? wordGoal.toString() : "0", 10) || 0) / 250)} páginas</strong>.
            </span>
          </div>
        </div>

        {/* Bloco 3: Imagem de Capa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">Capa do Livro</h3>
              <p className="text-xs text-slate-600">Envie uma imagem do seu computador ou celular para personalizar a capa da obra.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleCoverFileChange}
              className="hidden"
            />

            {/* Preview da Capa */}
            <div className="w-28 h-40 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative group">
              {coverUrl.trim() ? (
                <img
                  src={coverUrl.trim()}
                  alt="Pré-visualização da capa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <BookOpen className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-[10px] font-medium">Sem capa</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  {coverUrl ? "Trocar Imagem do Dispositivo" : "Selecionar do Dispositivo"}
                </Button>

                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverUrl("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Remover imagem de capa
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Formatos suportados: PNG, JPG ou WebP. A imagem é otimizada automaticamente para não pesar no seu livro.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          >
            {savedSuccess ? "Alterações Salvas!" : "Salvar Configurações"}
          </Button>
        </div>

        {/* Bloco 4: Zona de Perigo (Exclusão da Obra) */}
        <div className="border border-red-200 bg-red-50/40 rounded-2xl p-6 mt-12 space-y-4">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold font-funnel">Zona de Perigo</h3>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            A exclusão da obra é permanente. Todos os capítulos, personagens, cronogramas e dados vinculados a este livro serão apagados no banco de dados.
          </p>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Excluir Esta Obra Permanentemente
          </Button>
        </div>

      </form>
    </div>
  );
};
