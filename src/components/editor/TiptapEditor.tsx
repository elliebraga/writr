import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Image from "@tiptap/extension-image";
import { FontSize } from "./FontSizeExtension";

import { PaginationPlus } from "tiptap-pagination-plus";

import {
  Save,
  ArrowLeft,
  Download,
  FileText,
  Check,
  Sparkles,
  Sliders,
  Cloud,
  CloudCheck,
  FileText as DocumentIcon,
  MoreVertical,
  Smartphone,
  Undo,
  Redo,
  X,
  BookOpen,
} from "lucide-react";
import { TiptapToolbar } from "./TiptapToolbar";
import { DocsMenuBar } from "./DocsMenuBar";
import { DocsRuler } from "./DocsRuler";
import { DocsWordCountModal } from "./DocsWordCountModal";
import { FloatingChaptersMenu } from "./FloatingChaptersMenu";
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
  chapters?: Chapter[];
  onSelectChapter?: (chapter: Chapter) => void;
  onCreateChapter?: (title: string) => Promise<void> | void;
  onSave: (updatedChapter: Partial<Chapter> & { id: string }) => Promise<void> | void;
  onClose: () => void;
}

const MM_TO_PX = 3.779527559;

function getPageDimensions(options: PageFormatOptions, zoom: number, isMobile: boolean) {
  let wMm = 210; // A4 por padrão
  let hMm = 297;
  if (options.pageSize === "A5") {
    wMm = 148;
    hMm = 210;
  } else if (options.pageSize === "Letter") {
    wMm = 216;
    hMm = 279;
  } else if (options.pageSize === "Pocket") {
    wMm = 125;
    hMm = 180;
  }

  if (options.orientation === "landscape") {
    const tmp = wMm;
    wMm = hMm;
    hMm = tmp;
  }

  let widthPx = Math.round(wMm * MM_TO_PX * zoom);
  let heightPx = Math.round(hMm * MM_TO_PX * zoom);
  let marginTopPx = Math.round(options.marginTopMm * MM_TO_PX * zoom);
  let marginBottomPx = Math.round(options.marginBottomMm * MM_TO_PX * zoom);
  let marginLeftPx = Math.round(options.marginLeftMm * MM_TO_PX * zoom);
  let marginRightPx = Math.round(options.marginRightMm * MM_TO_PX * zoom);

  if (isMobile && typeof window !== "undefined") {
    const availableWidth = Math.max(300, window.innerWidth - 24);
    if (widthPx > availableWidth) {
      const scale = availableWidth / widthPx;
      widthPx = availableWidth;
      heightPx = Math.round(heightPx * scale);
      marginTopPx = Math.max(16, Math.round(marginTopPx * scale));
      marginBottomPx = Math.max(16, Math.round(marginBottomPx * scale));
      marginLeftPx = Math.max(16, Math.round(marginLeftPx * scale));
      marginRightPx = Math.max(16, Math.round(marginRightPx * scale));
    }
  }

  return {
    pageWidthMm: wMm,
    pageHeightMm: hMm,
    pageWidthPx: widthPx,
    pageHeightPx: heightPx,
    marginTopPx,
    marginBottomPx,
    marginLeftPx,
    marginRightPx,
  };
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  chapter,
  totalBookWordCount,
  chapters,
  onSelectChapter,
  onCreateChapter,
  onSave,
  onClose,
}) => {
  const [chapterTitle, setChapterTitle] = useState(chapter.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPageDrawerOpen, setIsPageDrawerOpen] = useState(false);
  const [isWordCountModalOpen, setIsWordCountModalOpen] = useState(false);
  const [isChaptersGuideOpen, setIsChaptersGuideOpen] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const pageDims = getPageDimensions(pageFormatOptions, zoom, isMobileView);
  const { pageWidthMm } = pageDims;

  // Inicializa o Tiptap Editor com suporte completo ao Google Docs e paginação dinâmica
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
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      Image.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CharacterCount.configure(),
      PaginationPlus.configure({
        enabled: true,
        pageBreakBackground: "#f0f4f9",
        pageGapBorderColor: "#cbd5e1",
        pageGapBorderSize: 1,
        pageHeight: pageDims.pageHeightPx,
        pageWidth: pageDims.pageWidthPx,
        marginTop: pageDims.marginTopPx,
        marginBottom: pageDims.marginBottomPx,
        marginLeft: pageDims.marginLeftPx,
        marginRight: pageDims.marginRightPx,
        pageGap: 24,
        contentMarginTop: 8,
        contentMarginBottom: 8,
        footerRight: "Página {page}",
        footerLeft: "",
        headerRight: "",
        headerLeft: "",
      }),
    ],
    content: chapter.content || "",
    onUpdate: ({ editor }) => {
      broadcastContentChange(editor.getHTML(), chapterTitle);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate focus:outline-none max-w-none text-slate-900",
      },
    },
  });

  useEffect(() => {
    setChapterTitle(chapter.title);
    if (editor) {
      const currentHTML = editor.getHTML();
      const targetContent = chapter.content || "";
      if (currentHTML !== targetContent) {
        editor.commands.setContent(targetContent, { emitUpdate: false });
      }
    }
  }, [chapter.id, chapter.title, chapter.content, editor]);

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

  const handleSelectChapter = async (targetChapter: Chapter) => {
    if (targetChapter.id === chapter.id) return;
    if (editor) {
      await handleSave();
    }
    if (onSelectChapter) {
      onSelectChapter(targetChapter);
    }
  };

  const handleConfirmPdfExport = (options: PdfExportOptions) => {
    exportChapterToPdf(chapterTitle, editor?.getHTML() || "", options);
  };

  // Sincroniza dimensões de página e margens dinamicamente com a extensão de paginação
  useEffect(() => {
    if (!editor) return;
    const currentDims = getPageDimensions(pageFormatOptions, zoom, isMobileView);
    editor.commands.updatePageWidth(currentDims.pageWidthPx);
    editor.commands.updatePageHeight(currentDims.pageHeightPx);
    editor.commands.updateMargins({
      top: currentDims.marginTopPx,
      bottom: currentDims.marginBottomPx,
      left: currentDims.marginLeftPx,
      right: currentDims.marginRightPx,
    });
    // Força re-renderização das decorações de página
    editor.view.dispatch(editor.state.tr);
  }, [editor, pageFormatOptions, zoom, isMobileView]);

  // Contagem dinâmica de páginas ativas no editor
  const [pageCount, setPageCount] = useState(1);
  useEffect(() => {
    if (!editor) return;
    const updateCount = () => {
      const breaks = editor.view?.dom?.querySelectorAll(".rm-page-break");
      const count = breaks && breaks.length > 0 ? breaks.length : 1;
      setPageCount(count);
    };
    updateCount();
    editor.on("update", updateCount);
    return () => {
      editor.off("update", updateCount);
    };
  }, [editor]);

  return (
    <div className="fixed inset-0 z-50 bg-[#f0f4f9] flex flex-col h-screen w-screen overflow-hidden select-none">
      
      {/* Modal de Contagem de Palavras */}
      <DocsWordCountModal
        isOpen={isWordCountModalOpen}
        onClose={() => setIsWordCountModalOpen(false)}
        editor={editor}
        pageSize={pageFormatOptions.pageSize}
      />

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

      {/* Menu Flutuante Retrátil de Capítulos */}
      {chapters && (
        <FloatingChaptersMenu
          isOpen={isChaptersGuideOpen}
          onToggle={setIsChaptersGuideOpen}
          chapters={chapters}
          activeChapterId={chapter.id}
          onSelectChapter={handleSelectChapter}
          onCreateChapter={onCreateChapter}
          totalBookWordCount={totalBookWordCount}
          isMobileView={isMobileView}
        />
      )}

      {/* Top Header Mobile (iPhone / Smartphones < 768px) */}
      <header className="flex md:hidden bg-white border-b border-slate-200 px-3 py-2 items-center justify-between gap-2 z-40 sticky top-0 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-full transition-colors shrink-0 cursor-pointer"
            title="Voltar para capítulos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {chapters && chapters.length > 0 && (
            <button
              type="button"
              onClick={() => setIsChaptersGuideOpen(true)}
              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer flex items-center gap-1"
              title="Abrir Guia de Capítulos"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[10px] font-bold px-1 py-0.2 bg-blue-200/70 text-blue-800 rounded-full leading-none">
                {chapters.length}
              </span>
            </button>
          )}

          <input
            type="text"
            value={chapterTitle}
            onChange={(e) => {
              const newTitle = e.target.value;
              setChapterTitle(newTitle);
              if (editor) broadcastContentChange(editor.getHTML(), newTitle);
            }}
            placeholder="Título do capítulo..."
            className="text-base font-semibold text-slate-900 bg-transparent border border-transparent focus:bg-slate-50 focus:border-blue-400 rounded px-1.5 py-0.5 min-w-0 flex-1 truncate"
            title="Renomear Capítulo"
          />

          {/* Status de Nuvem Mobile */}
          <div className="shrink-0 flex items-center">
            {isSaving ? (
              <span title="Salvando na nuvem..." className="text-blue-600 animate-pulse">
                <Cloud className="w-4 h-4" />
              </span>
            ) : isSavedNotice ? (
              <span title="Salvo no Supabase" className="text-emerald-600">
                <Check className="w-4 h-4" />
              </span>
            ) : (
              <span title="Sincronizado na nuvem" className="text-slate-600">
                <CloudCheck className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* Ações Rápidas Mobile: Undo / Redo / Salvar / Menu Opções */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-25 rounded transition-colors cursor-pointer"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-25 rounded transition-colors cursor-pointer"
            title="Refazer (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`p-1.5 rounded-lg text-white font-medium text-xs flex items-center justify-center transition-all cursor-pointer ${
              isSavedNotice ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
            title="Salvar Capítulo"
          >
            {isSavedNotice ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Opções do Documento"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Top Header Desktop (Telas a partir de 768px) */}
      <header className="hidden md:flex bg-white border-b border-slate-200 px-3 py-1.5 items-center justify-between gap-3 z-40">
        
        {/* Esquerda: Voltar + Botão Capítulos + Ícone Documento + Título + Menu Bar */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors shrink-0 cursor-pointer"
            title="Sair para a lista de capítulos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {chapters && chapters.length > 0 && (
            <button
              type="button"
              onClick={() => setIsChaptersGuideOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all cursor-pointer shadow-2xs mr-1 shrink-0"
              title="Abrir Guia de Capítulos do Livro"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Capítulos</span>
              <span className="bg-blue-200/60 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {chapters.length}
              </span>
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <DocumentIcon className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0">
            {/* Linha Superior: Nome do Capítulo + Status de Sincronização */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setChapterTitle(newTitle);
                  if (editor) broadcastContentChange(editor.getHTML(), newTitle);
                }}
                placeholder="Documento sem título..."
                className="text-sm font-semibold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 transition-all w-full max-w-[180px] sm:max-w-xs md:max-w-md truncate"
                title="Renomear Capítulo"
              />

              {/* Status de Nuvem do Google Docs */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-600">
                {isSaving ? (
                  <span className="flex items-center gap-1 text-blue-600 font-medium animate-pulse">
                    <Cloud className="w-3.5 h-3.5" />
                    Salvando...
                  </span>
                ) : isSavedNotice ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Salvo no Supabase
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-600" title="Todas as alterações são sincronizadas na nuvem">
                    <CloudCheck className="w-3.5 h-3.5 text-slate-600" />
                    Salvo na nuvem
                  </span>
                )}
              </div>
            </div>

            {/* Linha Inferior: Menus Clássicos do Google Docs */}
            <DocsMenuBar
              editor={editor}
              onSave={handleSave}
              isSaving={isSaving}
              isSavedNotice={isSavedNotice}
              onExportPdf={() => setIsPdfModalOpen(true)}
              onExportDocx={() => exportChapterToDocx(chapterTitle, editor?.getHTML() || "")}
              onOpenPageFormat={() => setIsPageDrawerOpen(true)}
              onOpenWordCount={() => setIsWordCountModalOpen(true)}
              onOpenChaptersGuide={() => setIsChaptersGuideOpen(true)}
              onOpenImageModal={() => {
                // acionado via menu
              }}
              showRuler={showRuler}
              onToggleRuler={() => setShowRuler(!showRuler)}
              zoom={zoom}
              onChangeZoom={setZoom}
              isMobileView={isMobileView}
              onToggleMobileView={() => setIsMobileView(!isMobileView)}
            />
          </div>
        </div>

        {/* Direita: Co-Autores + Botão Formatar Página + Exportar + Salvar */}
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
            <span className="hidden md:inline">Configurar Página</span>
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
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    setIsPdfModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  <span>Exportar este Capítulo (PDF)</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportChapterToDocx(chapterTitle, editor?.getHTML() || "");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
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

      {/* Toolbar Ribbon Estilo Google Docs */}
      <TiptapToolbar
        editor={editor}
        zoom={zoom}
        onChangeZoom={setZoom}
        onPrint={() => window.print()}
      />

      {/* Bottom Sheet Mobile: Menu de Ações e Configurações */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
            
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-sm font-bold font-funnel text-slate-900 truncate">Opções do Documento</h3>
                <p className="text-[11px] text-slate-600 truncate">{chapterTitle || "Documento sem título"}</p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Modo Móvel Fluido */}
            <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Modo Celular Fluido</div>
                  <div className="text-[10px] text-slate-600">Texto ajustado à tela sem precisar de zoom</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileView(!isMobileView)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isMobileView ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isMobileView ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Lista de Ações do Documento */}
            <div className="space-y-1 text-xs">
              {chapters && chapters.length > 0 && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsChaptersGuideOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 font-semibold text-left cursor-pointer border border-blue-200/60"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Guia de Capítulos</span>
                    <span className="bg-blue-200/70 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {chapters.length}
                    </span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  handleSave();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-left cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Salvar Capítulo</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPageDrawerOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-left cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Configurar Página & Margens</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsWordCountModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Contagem de Palavras & Estatísticas</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPdfModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-red-600" />
                <span>Exportar como PDF</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  exportChapterToDocx(chapterTitle, editor?.getHTML() || "");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Exportar como Word (.docx)</span>
              </button>
            </div>

            {/* Co-autores se houver */}
            {activeUsers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-600 mb-2">
                  Co-autores online ({activeUsers.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeUsers.map((u) => (
                    <span
                      key={u.user_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: u.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {u.user_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área Principal de Escrita com Régua e Folhas Paginadas estilo Google Docs */}
      <main
        className={`flex-1 overflow-y-auto flex flex-col items-center transition-colors ${
          isMobileView ? "bg-[#f0f4f9] py-3 px-2" : "bg-[#f0f4f9] py-6 px-4"
        }`}
        style={{
          "--editor-font-family": pageFormatOptions.fontFamily,
          "--editor-font-size": `${pageFormatOptions.fontSizePt * zoom}pt`,
          "--editor-line-height": pageFormatOptions.lineHeight || "1.6",
        } as React.CSSProperties}
      >
        
        {/* Régua Superior do Google Docs (Apenas visível no Layout de Impressão) */}
        {showRuler && !isMobileView && (
          <div className="mb-3 w-full flex justify-center sticky top-0 z-30 pb-1">
            <DocsRuler
              pageWidthMm={pageWidthMm}
              marginLeftMm={pageFormatOptions.marginLeftMm}
              marginRightMm={pageFormatOptions.marginRightMm}
              zoom={zoom}
            />
          </div>
        )}

        {/* Folha de Papel Paginada Dinamicamente com Quebra e Margens Reais */}
        <div className="w-full flex justify-center pb-24 select-text">
          <style>{`
            .ProseMirror.rm-with-pagination {
              background-color: #ffffff !important;
              box-shadow: 0 1px 3px 1px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.30) !important;
              border-radius: 2px;
              box-sizing: border-box;
              margin: 0 auto;
              min-height: var(--rm-page-height, 1123px);
              position: relative;
              outline: none !important;
              font-family: var(--editor-font-family, 'Figtree', sans-serif) !important;
              font-size: var(--editor-font-size, 12pt);
              line-height: var(--editor-line-height, 1.6);
            }

            /* Espaçamento e sombra realista entre as páginas (estilo Google Docs) */
            .rm-pagination-gap {
              box-shadow: inset 0 3px 4px -2px rgba(60,64,67,0.15), inset 0 -3px 4px -2px rgba(60,64,67,0.15);
              cursor: default;
              user-select: none;
            }

            /* Rodapé e Cabeçalho de páginas */
            .rm-page-footer, .rm-page-header {
              font-size: 11px;
              color: #94a3b8;
              font-family: var(--editor-font-family, 'Figtree', sans-serif);
              line-height: 1;
              user-select: none;
            }

            .rm-page-footer-right, .rm-page-footer-left, .rm-page-header-right, .rm-page-header-left {
              font-size: 11px;
              color: #94a3b8;
            }

            .rm-page-number, .rm-page-number-plus {
              font-weight: 500;
              color: #64748b;
            }

            .ProseMirror p, .ProseMirror li {
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
            }

            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
              font-family: inherit;
              line-height: 1.3;
            }
          `}</style>

          <EditorContent editor={editor} className="w-full flex justify-center" />
        </div>
      </main>

      {/* Rodapé de Métricas e Status */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-600 z-40 select-none">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsWordCountModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
            title="Clique para ver estatísticas detalhadas"
          >
            <span className="text-slate-600">Palavras:</span>
            <strong className="text-slate-900 font-semibold">{currentChapterWords}</strong>
          </button>

          <div className="h-3 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">Total no Livro:</span>
            <strong className="text-slate-900 font-semibold">{calculatedTotalBookWords}</strong>
          </div>

          <div className="h-3 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">Páginas:</span>
            <strong className="text-slate-900 font-semibold">{pageCount}</strong>
          </div>

          <div className="h-3 w-px bg-slate-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
            <span>Tamanho:</span>
            <strong className="text-slate-700 font-medium">
              {pageFormatOptions.pageSize} ({pageFormatOptions.orientation === "landscape" ? "Paisagem" : "Retrato"})
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom(zoom === 1.0 ? 1.25 : 1.0)}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zoom: {Math.round(zoom * 100)}%
          </button>

          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-slate-600" />
            <span>Writr Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
