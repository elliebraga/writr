import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { FontSize } from "./FontSizeExtension";

import { Save, ArrowLeft, Download, FileText, Check, Sparkles, Sliders } from "lucide-react";
import { TiptapToolbar } from "./TiptapToolbar";
import type { Chapter } from "../../types/book";
import type { PdfExportOptions } from "../../types/export";
import { DEFAULT_PDF_OPTIONS } from "../../types/export";
import { exportChapterToPdf, exportChapterToDocx } from "../../utils/exportUtils";
import { PdfExportModal } from "../export/PdfExportModal";
import { PageFormatDrawer, type PageFormatOptions } from "./PageFormatDrawer";
import Button from "../ui/Button";
import { useChapterRealtime } from "../../hooks/useChapterRealtime";

interface TiptapEditorProps {
  chapter: Chapter;
  totalBookWordCount: number;
  onSave: (updatedChapter: Partial<Chapter> & { id: string }) => Promise<void> | void;
  onClose: () => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  chapter,
  totalBookWordCount,
  onSave,
  onClose,
}) => {
  const [chapterTitle, setChapterTitle] = useState(chapter.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPageDrawerOpen, setIsPageDrawerOpen] = useState(false);

  const handleRemoteContentChange = useCallback(({ html, title }: { html: string; title?: string }) => {
    if (editor && html && html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
    if (title && title !== chapterTitle) {
      setChapterTitle(title);
    }
  }, []);

  const { activeUsers, broadcastContentChange } = useChapterRealtime({
    chapterId: chapter.id,
    userName: "Escritor",
    onRemoteContentChange: handleRemoteContentChange,
  });

  const [pageFormatOptions, setPageFormatOptions] = useState<PageFormatOptions>(() => {
    try {
      const saved = localStorage.getItem("writr_page_format_options");
      if (saved) {
        return { ...DEFAULT_PDF_OPTIONS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return {
      ...DEFAULT_PDF_OPTIONS,
      fontFamily: "Figtree, sans-serif",
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem("writr_page_format_options", JSON.stringify(pageFormatOptions));
    } catch (e) {}
  }, [pageFormatOptions]);

  // Inicializa o Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      Image.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CharacterCount.configure(),
    ],
    content: chapter.content || "",
    onUpdate: ({ editor }) => {
      broadcastContentChange(editor.getHTML(), chapterTitle);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate focus:outline-none max-w-none min-h-[500px] text-slate-900",
      },
    },
  });

  useEffect(() => {
    setChapterTitle(chapter.title);
  }, [chapter.title]);

  const currentChapterWords = editor?.storage.characterCount.words() || 0;
  const otherChaptersWords = totalBookWordCount - (chapter.word_count || 0);
  const calculatedTotalBookWords = Math.max(0, otherChaptersWords) + currentChapterWords;

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const htmlContent = editor.getHTML();
      await onSave({
        id: chapter.id,
        title: chapterTitle.trim() || chapter.title,
        content: htmlContent,
        word_count: currentChapterWords,
        updated_at: new Date().toISOString(),
      });

      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    } catch (err) {
      console.error("Erro ao salvar capítulo:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPdfExport = (options: PdfExportOptions) => {
    exportChapterToPdf(chapterTitle, editor?.getHTML() || "", options);
  };

  // Cálculo das dimensões reais da folha em mm para a visualização no editor
  let pageWidthMm = 210; // A4 por padrão
  let pageHeightMm = 297;
  if (pageFormatOptions.pageSize === "A5") {
    pageWidthMm = 148;
    pageHeightMm = 210;
  } else if (pageFormatOptions.pageSize === "Letter") {
    pageWidthMm = 216;
    pageHeightMm = 279;
  } else if (pageFormatOptions.pageSize === "Pocket") {
    pageWidthMm = 125;
    pageHeightMm = 180;
  }

  if (pageFormatOptions.orientation === "landscape") {
    const tmp = pageWidthMm;
    pageWidthMm = pageHeightMm;
    pageHeightMm = tmp;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden select-none">
      
      {/* Modal de Configuração de PDF */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        title={chapterTitle}
        onClose={() => setIsPdfModalOpen(false)}
        onConfirmExport={handleConfirmPdfExport}
      />

      {/* Drawer de Formatador de Página */}
      <PageFormatDrawer
        isOpen={isPageDrawerOpen}
        onClose={() => setIsPageDrawerOpen(false)}
        options={pageFormatOptions}
        onChangeOptions={setPageFormatOptions}
        onExportPdf={() => exportChapterToPdf(chapterTitle, editor?.getHTML() || "", pageFormatOptions)}
      />

      {/* Header Fixo Distração Zero com Presença ao Vivo */}
      <header className="bg-white border-b border-slate-200 px-3 md:px-6 py-2.5 flex items-center justify-between gap-2 md:gap-4 z-40">
        
        {/* Esquerda: Voltar / Título do Capítulo */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-full transition-colors shrink-0"
            title="Sair para a lista de capítulos"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voltar à Lista</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

          <input
            type="text"
            value={chapterTitle}
            onChange={(e) => {
              const newTitle = e.target.value;
              setChapterTitle(newTitle);
              if (editor) broadcastContentChange(editor.getHTML(), newTitle);
            }}
            placeholder="Nome do Capítulo..."
            className="text-xs md:text-sm font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none px-1 py-0.5 truncate transition-colors w-full max-w-[140px] sm:max-w-xs md:max-w-md"
          />
        </div>

        {/* Direita: Usuários Online (Presença) + Formatador de Página, Exportar e Salvar */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Barra de Co-Autores Online em Tempo Real */}
          {activeUsers.length > 0 && (
            <div className="flex items-center -space-x-2 mr-1" title={`${activeUsers.length} co-autor(es) online neste documento`}>
              {activeUsers.slice(0, 4).map((user) => (
                <div
                  key={user.user_id}
                  className="w-7 h-7 rounded-full text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs transition-transform hover:scale-110 relative group"
                  style={{ backgroundColor: user.color }}
                >
                  {user.user_name[0].toUpperCase()}
                  <span className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-50">
                    {user.user_name} (Online)
                  </span>
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPageDrawerOpen(true)}
            leftIcon={<Sliders className="w-3.5 h-3.5 text-indigo-600" />}
          >
            <span className="hidden md:inline">Formatador de Página</span>
            <span className="md:hidden">Página</span>
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Exportar</span>
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    setIsPdfModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  <span>Exportar este Capítulo (PDF)</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportChapterToDocx(chapterTitle, editor?.getHTML() || "");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Exportar este Capítulo (DOCX)</span>
                </button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={isSavedNotice ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
          >
            {isSavedNotice ? "Salvo!" : "Salvar"}
          </Button>
        </div>
      </header>

      {/* Toolbar Tiptap Fixo no Topo */}
      <TiptapToolbar editor={editor} />

      {/* Área Principal de Escrita com Layout Dinâmico da Folha */}
      <main className="flex-1 overflow-y-auto bg-slate-100/60 py-8 px-4 flex justify-center">
        <div
          className="w-full bg-white border border-slate-200 rounded-lg shadow-sm min-h-[calc(100vh-220px)] my-auto select-text transition-all duration-300 relative overflow-hidden"
          style={
            {
              width: "100%",
              maxWidth: `min(100%, ${pageWidthMm}mm)`,
              paddingTop: `${pageFormatOptions.marginTopMm}mm`,
              paddingRight: `${pageFormatOptions.marginRightMm}mm`,
              paddingBottom: `${pageFormatOptions.marginBottomMm}mm`,
              paddingLeft: `${pageFormatOptions.marginLeftMm}mm`,
              fontFamily: pageFormatOptions.fontFamily,
              "--editor-font-family": pageFormatOptions.fontFamily,
              "--editor-font-size": `${pageFormatOptions.fontSizePt}pt`,
              "--editor-line-height": pageFormatOptions.lineHeight,
            } as React.CSSProperties
          }
        >
          {/* Guia visual pontilhada das margens ativas */}
          <div
            className="absolute inset-0 pointer-events-none border border-dashed border-indigo-200/50 rounded-xs transition-all duration-300"
            style={{
              top: `${pageFormatOptions.marginTopMm}mm`,
              right: `${pageFormatOptions.marginRightMm}mm`,
              bottom: `${pageFormatOptions.marginBottomMm}mm`,
              left: `${pageFormatOptions.marginLeftMm}mm`,
            }}
          />

          <style>{`
            .ProseMirror {
              font-family: var(--editor-font-family) !important;
              font-size: var(--editor-font-size) !important;
              line-height: var(--editor-line-height) !important;
              min-height: 100%;
            }
            .ProseMirror p {
              font-family: var(--editor-font-family) !important;
              font-size: var(--editor-font-size) !important;
              line-height: var(--editor-line-height) !important;
            }
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
              font-family: var(--editor-font-family) !important;
            }
          `}</style>
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Rodapé de Métricas e Status */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 z-40 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Palavras no Capítulo:</span>
            <strong className="text-slate-900 font-semibold">{currentChapterWords}</strong>
          </div>

          <div className="h-3 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total acumulado no Livro:</span>
            <strong className="text-slate-900 font-semibold">{calculatedTotalBookWords}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Modo Distração Zero Ativo</span>
        </div>
      </footer>
    </div>
  );
};
