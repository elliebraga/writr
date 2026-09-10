import React, { useState, useRef, useEffect } from "react";
import {
  Save,
  Printer,
  FileDown,
  Undo,
  Redo,
  Sliders,
  FileText,
  Minus,
  Quote,
  CheckSquare,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Editor } from "@tiptap/react";

interface DocsMenuBarProps {
  editor: Editor | null;
  onSave: () => void;
  isSaving: boolean;
  isSavedNotice: boolean;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onOpenPageFormat: () => void;
  onOpenWordCount: () => void;
  onOpenImageModal: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  zoom: number;
  onChangeZoom: (zoom: number) => void;
  isMobileView?: boolean;
  onToggleMobileView?: () => void;
}

export const DocsMenuBar: React.FC<DocsMenuBarProps> = ({
  editor,
  onSave,
  isSaving,
  isSavedNotice,
  onExportPdf,
  onExportDocx,
  onOpenPageFormat,
  onOpenWordCount,
  onOpenImageModal,
  showRuler,
  onToggleRuler,
  zoom,
  onChangeZoom,
  isMobileView,
  onToggleMobileView,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handlePrint = () => {
    window.print();
    setActiveMenu(null);
  };

  return (
    <div
      ref={menuBarRef}
      className="flex items-center gap-0.5 text-xs select-none relative"
    >
      {/* 1. ARQUIVO */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("arquivo")}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors font-medium cursor-pointer ${
            activeMenu === "arquivo" ? "bg-slate-100 text-slate-900" : "text-slate-700"
          }`}
        >
          Arquivo
        </button>

        {activeMenu === "arquivo" && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                onSave();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>{isSaving ? "Salvando..." : isSavedNotice ? "Salvo!" : "Salvar Capítulo"}</span>
              </div>
              <span className="text-[10px] text-slate-600">Ctrl+S</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                onExportPdf();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-red-600" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => {
                onExportDocx();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Exportar Word (.docx)</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={handlePrint}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir</span>
              </div>
              <span className="text-[10px] text-slate-600">Ctrl+P</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                onOpenPageFormat();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Configuração da Página...</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. EDITAR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("editar")}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors font-medium cursor-pointer ${
            activeMenu === "editar" ? "bg-slate-100 text-slate-900" : "text-slate-700"
          }`}
        >
          Editar
        </button>

        {activeMenu === "editar" && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              disabled={!editor?.can().undo()}
              onClick={() => {
                editor?.chain().focus().undo().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Undo className="w-3.5 h-3.5" />
                <span>Desfazer</span>
              </div>
              <span className="text-[10px] text-slate-600">Ctrl+Z</span>
            </button>

            <button
              disabled={!editor?.can().redo()}
              onClick={() => {
                editor?.chain().focus().redo().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Redo className="w-3.5 h-3.5" />
                <span>Refazer</span>
              </div>
              <span className="text-[10px] text-slate-600">Ctrl+Y</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                editor?.chain().focus().selectAll().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Selecionar Tudo</span>
              <span className="text-[10px] text-slate-600">Ctrl+A</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().unsetAllMarks().clearNodes().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Limpar Formatação</span>
              <span className="text-[10px] text-slate-600">Ctrl+\</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. VER */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("ver")}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors font-medium cursor-pointer ${
            activeMenu === "ver" ? "bg-slate-100 text-slate-900" : "text-slate-700"
          }`}
        >
          Ver
        </button>

        {activeMenu === "ver" && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            {onToggleMobileView && (
              <>
                <button
                  onClick={() => {
                    onToggleMobileView();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <span>Layout de Impressão (A4)</span>
                  {!isMobileView && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <div className="h-px bg-slate-100 my-1" />
              </>
            )}

            <button
              onClick={() => {
                onToggleRuler();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Mostrar Régua</span>
              {showRuler && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Zoom da Folha
            </span>

            {[
              { label: "75%", val: 0.75 },
              { label: "90%", val: 0.9 },
              { label: "100% (Padrão)", val: 1.0 },
              { label: "125%", val: 1.25 },
              { label: "150%", val: 1.5 },
            ].map((z) => (
              <button
                key={z.val}
                onClick={() => {
                  onChangeZoom(z.val);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
              >
                <span>{z.label}</span>
                {zoom === z.val && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. INSERIR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("inserir")}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors font-medium cursor-pointer ${
            activeMenu === "inserir" ? "bg-slate-100 text-slate-900" : "text-slate-700"
          }`}
        >
          Inserir
        </button>

        {activeMenu === "inserir" && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                onOpenImageModal();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Imagem...</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <span className="w-3.5 h-3.5 font-bold flex items-center justify-center border border-slate-400 rounded-xs text-[9px]">
                田
              </span>
              <span>Tabela (3 × 3)</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleTaskList().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
              <span>Lista de Tarefas / Checklist</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleBlockquote().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5 text-slate-600" />
              <span>Bloco de Citação</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                editor?.chain().focus().setHorizontalRule().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 text-slate-600" />
              <span>Linha Divisória Horizontal</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. FORMATAR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("formatar")}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors font-medium cursor-pointer ${
            activeMenu === "formatar" ? "bg-slate-100 text-slate-900" : "text-slate-700"
          }`}
        >
          Formatar
        </button>

        {activeMenu === "formatar" && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                editor?.chain().focus().toggleBold().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span className="font-bold">Negrito</span>
              <span className="text-[10px] text-slate-600">Ctrl+B</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleItalic().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span className="italic">Itálico</span>
              <span className="text-[10px] text-slate-600">Ctrl+I</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleUnderline().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span className="underline">Sublinhado</span>
              <span className="text-[10px] text-slate-600">Ctrl+U</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleStrike().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span className="line-through">Tachado</span>
              <span className="text-[10px] text-slate-600">Alt+Shift+5</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                editor?.chain().focus().toggleSuperscript().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Sobrescrito (X²)</span>
              <span className="text-[10px] text-slate-600">Ctrl+.</span>
            </button>

            <button
              onClick={() => {
                editor?.chain().focus().toggleSubscript().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <span>Subscrito (X₂)</span>
              <span className="text-[10px] text-slate-600">Ctrl+,</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                onOpenPageFormat();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Formatação da Página...</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. FERRAMENTAS */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("ferramentas")}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors font-medium cursor-pointer ${
            activeMenu === "ferramentas" ? "bg-slate-100 text-slate-900" : "text-slate-700"
          }`}
        >
          Ferramentas
        </button>

        {activeMenu === "ferramentas" && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                onOpenWordCount();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Contagem de Palavras...</span>
              </div>
              <span className="text-[10px] text-slate-600">Ctrl+Shift+C</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
