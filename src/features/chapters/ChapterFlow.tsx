import React, { useState, useEffect } from "react";
import { Layers, Plus, FileDown } from "lucide-react";
import type { Book } from "../../types/book";
import type { Chapter } from "../../types/book";
import type { PdfExportOptions } from "../../types/export";
import { ChapterCard } from "../../components/chapters/ChapterCard";
import { NewChapterModal } from "../../components/chapters/NewChapterModal";
import { TiptapEditor } from "../../components/editor/TiptapEditor";
import { PdfExportModal } from "../../components/export/PdfExportModal";
import { exportBookToDocx, exportBookToPdf } from "../../utils/exportUtils";
import { supabase } from "../../supabaseClient";
import Button from "../../components/ui/Button";
import { ensureValidUuid } from "../../utils/uuidUtils";

interface ChapterFlowProps {
  activeBook: Book;
}

export const ChapterFlow: React.FC<ChapterFlowProps> = ({ activeBook }) => {
  const safeBookId = ensureValidUuid(activeBook.id);
  const localStorageKey = `writr_chapters_${safeBookId}`;

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Estados dos modais e modo de edição
  const [isNewChapterModalOpen, setIsNewChapterModalOpen] = useState(false);
  const [activeEditingChapter, setActiveEditingChapter] = useState<Chapter | null>(null);

  // Modal de Exportação do Livro Completo em PDF
  const [isBookPdfModalOpen, setIsBookPdfModalOpen] = useState(false);
  const [showExportBookMenu, setShowExportBookMenu] = useState(false);

  // Salva no localStorage sempre que chapters mudar
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(chapters));
    } catch (e) {
      console.error("Erro ao salvar capítulos no localStorage:", e);
    }
  }, [chapters, localStorageKey]);

  useEffect(() => {
    fetchChapters();
  }, [safeBookId]);

  // Carrega os capítulos do Supabase e mescla sem perder os salvos no localStorage
  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const remoteChapters: Chapter[] = data.map((c: any) => ({
          ...c,
          id: ensureValidUuid(c.id),
          id_book: safeBookId,
          book_id: safeBookId,
          title: c.title || "Capítulo Sem Título",
          content: c.text || c.content || "",
          text: c.text || c.content || "",
          word_count: c.word_count || (c.text || c.content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length || 0,
        }));

        setChapters((prev) => {
          const map = new Map<string, Chapter>();
          prev.forEach((ch) => map.set(ch.id, ch));
          remoteChapters.forEach((ch) => map.set(ch.id, ch));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      console.log("Capítulos salvos em modo local.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalBookWordCount = chapters.reduce(
    (acc, ch) => acc + (ch.word_count || 0),
    0
  );

  // Criar Novo Capítulo
  const handleCreateChapter = async (title: string) => {
    const generatedId = ensureValidUuid();

    const newChapter: Chapter = {
      id: generatedId,
      id_book: safeBookId,
      book_id: safeBookId,
      title: title.trim(),
      text: "",
      content: "",
      synopsis: "",
      word_count: 0,
      order_index: chapters.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setChapters((prev) => {
      const updated = [...prev, newChapter];
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const payload = {
        id: generatedId,
        id_book: safeBookId,
        title: newChapter.title,
        text: "",
      };

      const { data, error } = await supabase
        .from("chapters")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        newChapter.id = data.id;
      } else if (error) {
        console.log("Sincronização do capítulo no Supabase pendente:", error.message);
      }
    } catch (err) {
      console.log("Capítulo preservado localmente.");
    }

    setActiveEditingChapter(newChapter);
  };

  // Salvar Capítulo (ao editar no Tiptap)
  const handleSaveChapter = async (
    updatedData: Partial<Chapter> & { id: string }
  ) => {
    const safeChapterId = ensureValidUuid(updatedData.id);

    setChapters((prev) => {
      const updated = prev.map((ch) => (ch.id === updatedData.id || ch.id === safeChapterId ? { ...ch, ...updatedData, id: safeChapterId } : ch));
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (activeEditingChapter && (activeEditingChapter.id === updatedData.id || activeEditingChapter.id === safeChapterId)) {
      setActiveEditingChapter((prev) => (prev ? { ...prev, ...updatedData, id: safeChapterId } : null));
    }

    try {
      const payload: any = {
        title: updatedData.title,
        text: updatedData.content !== undefined ? updatedData.content : updatedData.text,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("chapters")
        .update(payload)
        .eq("id", safeChapterId);

      if (error) {
        console.log("Alterações salvas localmente (Supabase pendente):", error.message);
      }
    } catch (err) {
      console.log("Salvo com sucesso na memória local.");
    }
  };

  // Excluir Capítulo
  const handleDeleteChapter = async (chapterId: string) => {
    const safeChapterId = ensureValidUuid(chapterId);
    setChapters((prev) => {
      const updated = prev.filter((ch) => ch.id !== chapterId && ch.id !== safeChapterId);
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await supabase.from("chapters").delete().eq("id", safeChapterId);
    } catch (err) {
      console.log("Removido localmente.");
    }
  };

  const handleConfirmBookPdfExport = (options: PdfExportOptions) => {
    exportBookToPdf(activeBook.book_name, chapters, options);
  };

  // ROTA TELA COMPLETA DO EDITOR TIPTAP
  if (activeEditingChapter) {
    return (
      <TiptapEditor
        chapter={activeEditingChapter}
        totalBookWordCount={totalBookWordCount}
        onSave={handleSaveChapter}
        onClose={() => {
          setActiveEditingChapter(null);
          fetchChapters();
        }}
      />
    );
  }

  // ROTA PRINCIPAL DE GESTÃO DE CAPÍTULOS
  return (
    <div className="flex-1 bg-white min-h-screen p-6 md:p-10 flex flex-col font-sans select-none">
      
      <NewChapterModal
        isOpen={isNewChapterModalOpen}
        onClose={() => setIsNewChapterModalOpen(false)}
        onCreateChapter={handleCreateChapter}
      />

      <PdfExportModal
        isOpen={isBookPdfModalOpen}
        title={activeBook.book_name}
        isBookExport={true}
        onClose={() => setIsBookPdfModalOpen(false)}
        onConfirmExport={handleConfirmBookPdfExport}
      />

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <span>Carregando capítulos...</span>
        </div>
      ) : chapters.length === 0 ? (
        
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
            <Layers className="w-8 h-8 text-slate-400" />
          </div>

          <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight mb-2">
            Sua obra ainda não possui capítulos
          </h2>

          <p className="text-base text-slate-500 font-sans leading-relaxed mb-8">
            Comece a dar vida a <strong className="text-slate-800">{activeBook.book_name}</strong> criando o seu primeiro capítulo. O editor em tela cheia estará pronto para a sua escrita.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsNewChapterModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Adicionar Capítulo
          </Button>
        </div>
      ) : (
        
        <div className="max-w-6xl w-full mx-auto flex flex-col flex-1">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
                  Capítulos da Obra
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {chapters.length} {chapters.length === 1 ? "capítulo" : "capítulos"}
                </span>
              </div>
              <p className="text-base text-slate-500 font-sans mt-1">
                Total acumulado: <strong className="text-slate-900 font-semibold">{totalBookWordCount} palavras</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowExportBookMenu(!showExportBookMenu)}
                  leftIcon={<FileDown className="w-4 h-4" />}
                >
                  Exportar Obra
                </Button>

                {showExportBookMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        setShowExportBookMenu(false);
                        setIsBookPdfModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Exportar Livro Completo (PDF)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportBookMenu(false);
                        exportBookToDocx(activeBook.book_name, chapters);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Exportar Livro Completo (DOCX)</span>
                    </button>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsNewChapterModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Novo Capítulo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter, idx) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                index={idx}
                onSelect={(ch) => setActiveEditingChapter(ch)}
                onDelete={(id) => handleDeleteChapter(id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
