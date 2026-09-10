import React, { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Undo,
  Redo,
  Printer,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  RemoveFormatting,
  Image as ImageIcon,
  Plus,
  Minus as MinusIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from "lucide-react";
import { ImageInsertModal } from "./ImageInsertModal";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { TableInsertPopover } from "./TableInsertPopover";
import { GoogleFontModal } from "./GoogleFontModal";
import {
  getSavedCustomFonts,
  subscribeCustomFonts,
  type CustomFont,
} from "../../services/fontService";

interface TiptapToolbarProps {
  editor: Editor | null;
  zoom?: number;
  onChangeZoom?: (zoom: number) => void;
  onPrint?: () => void;
}

export const TiptapToolbar: React.FC<TiptapToolbarProps> = ({
  editor,
  zoom = 1.0,
  onChangeZoom,
  onPrint,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGoogleFontModalOpen, setIsGoogleFontModalOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  useEffect(() => {
    setCustomFonts(getSavedCustomFonts());
    const unsub = subscribeCustomFonts(() => {
      setCustomFonts(getSavedCustomFonts());
    });
    return unsub;
  }, []);

  if (!editor) return null;

  // Tamanho atual da fonte (numérico aproximado em pt ou px)
  const getCurrentFontSizeNumber = () => {
    const raw = editor.getAttributes("textStyle").fontSize;
    if (!raw) return 12;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 12 : parsed;
  };

  const currentFontSize = getCurrentFontSizeNumber();

  const handleSetFontSizeNumber = (newSize: number) => {
    const bounded = Math.max(8, Math.min(96, newSize));
    const sizeStr = `${bounded}pt`;

    if (editor.state.selection.empty) {
      const { from } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      const start = $from.start();
      const end = $from.end();
      if (start < end) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: start, to: end })
          .setFontSize(sizeStr)
          .setTextSelection(from)
          .run();
        return;
      }
    }

    editor.chain().focus().setFontSize(sizeStr).run();
  };

  // Identifica a fonte ativa no cursor
  const getCurrentFontFamily = () => {
    return editor.getAttributes("textStyle").fontFamily || "default";
  };

  // Handler para aplicar família de fonte
  const handleApplyFontFamily = (font: string) => {
    if (editor.state.selection.empty) {
      const { from } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      const start = $from.start();
      const end = $from.end();
      if (start < end) {
        if (font === "default") {
          editor
            .chain()
            .focus()
            .setTextSelection({ from: start, to: end })
            .unsetFontFamily()
            .setTextSelection(from)
            .run();
        } else {
          editor
            .chain()
            .focus()
            .setTextSelection({ from: start, to: end })
            .setFontFamily(font)
            .setTextSelection(from)
            .run();
        }
        return;
      }
    }

    if (font === "default") {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font).run();
    }
  };

  // Handler para trocar família de fonte no dropdown
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    if (font === "__OPEN_FONT_MODAL__") {
      setIsGoogleFontModalOpen(true);
      return;
    }
    handleApplyFontFamily(font);
  };

  // Handler para trocar hierarquia (H1, H2, H3, Parágrafo)
  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "p") {
      editor.chain().focus().setParagraph().run();
    } else if (val === "h1") {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (val === "h2") {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (val === "h3") {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }
  };

  const getCurrentHeadingValue = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "p";
  };

  // Cores de texto e marca-texto
  const currentTextColor = editor.getAttributes("textStyle").color;
  const currentHighlightColor = editor.getAttributes("highlight").color;

  const handleSetTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const handleClearTextColor = () => {
    editor.chain().focus().unsetColor().run();
  };

  const handleSetHighlightColor = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
  };

  const handleClearHighlightColor = () => {
    editor.chain().focus().unsetHighlight().run();
  };

  const handleInsertImage = (src: string) => {
    editor.chain().focus().setImage({ src }).run();
  };

  return (
    <>
      <ImageInsertModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onConfirm={handleInsertImage}
      />

      <div className="bg-[#edf2fa] border-b border-slate-200 px-3 py-1 flex items-center justify-between gap-1 select-none sticky top-0 z-30 min-w-0 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-full shrink min-w-0">
          
          {/* Ações Básicas: Desfazer / Refazer / Imprimir */}
          <div className="flex items-center">
            <button
              type="button"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
              title="Desfazer (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-slate-200/80 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
              title="Refazer (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-slate-200/80 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => (onPrint ? onPrint() : window.print())}
              title="Imprimir (Ctrl+P)"
              className="hidden md:flex p-1.5 rounded hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Seletor de Zoom (Apenas Desktop) */}
          {onChangeZoom && (
            <div className="hidden md:flex relative items-center">
              <select
                value={zoom}
                onChange={(e) => onChangeZoom(parseFloat(e.target.value))}
                className="h-7 px-2 text-xs font-medium bg-transparent hover:bg-slate-200/80 border border-transparent hover:border-slate-300 rounded text-slate-800 focus:outline-none focus:bg-white cursor-pointer"
                title="Zoom da Folha"
              >
                <option value={0.75}>75%</option>
                <option value={0.9}>90%</option>
                <option value={1.0}>100%</option>
                <option value={1.25}>125%</option>
                <option value={1.5}>150%</option>
              </select>
            </div>
          )}

          <div className="hidden md:block w-px h-4 bg-slate-300 mx-0.5" />

          {/* Hierarquia / Estilo de Parágrafo */}
          <div className="relative flex items-center">
            <select
              value={getCurrentHeadingValue()}
              onChange={handleHeadingChange}
              className="h-7 px-2 text-xs font-medium bg-transparent hover:bg-slate-200/80 border border-transparent hover:border-slate-300 rounded text-slate-800 focus:outline-none focus:bg-white cursor-pointer max-w-[125px]"
            >
              <option value="p">Texto normal</option>
              <option value="h1">Título 1 (H1)</option>
              <option value="h2">Título 2 (H2)</option>
              <option value="h3">Título 3 (H3)</option>
            </select>
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Família da Fonte */}
          <div className="relative flex items-center gap-0.5">
            <select
              value={getCurrentFontFamily()}
              onChange={handleFontFamilyChange}
              className="h-7 px-2 text-xs font-medium bg-transparent hover:bg-slate-200/80 border border-transparent hover:border-slate-300 rounded text-slate-800 focus:outline-none focus:bg-white cursor-pointer max-w-[140px] truncate"
              title="Fonte do Texto"
            >
              <option value="default">Fonte: Padrão da Obra</option>
              <option value="__OPEN_FONT_MODAL__">➕ Mais fontes (Google Fonts)...</option>

              {customFonts.length > 0 && (
                <optgroup label="✨ Fontes Adicionadas">
                  {customFonts.map((cf) => (
                    <option key={cf.name} value={cf.family}>
                      {cf.name}
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="Sem Serifa & Display">
                <option value="'Antonio', sans-serif">Antonio</option>
                <option value="Figtree, sans-serif">Figtree</option>
                <option value="'DM Sans', sans-serif">DM Sans</option>
                <option value="Inter, sans-serif">Inter</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="system-ui, -apple-system, sans-serif">Sistema Sans</option>
              </optgroup>

              <optgroup label="Serifadas (Literárias)">
                <option value="Fraunces, serif">Fraunces (Editorial)</option>
                <option value="Lora, serif">Lora (Romance)</option>
                <option value="Merriweather, serif">Merriweather</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'EB Garamond', Georgia, serif">EB Garamond</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                <option value="Cinzel, serif">Cinzel (Épico)</option>
              </optgroup>

              <optgroup label="Máquina de Escrever (Mono)">
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Courier New', Courier, monospace">Courier New</option>
                <option value="ui-monospace, monospace">Sistema Mono</option>
              </optgroup>
            </select>

            <button
              type="button"
              onClick={() => setIsGoogleFontModalOpen(true)}
              title="Adicionar mais fontes do Google Fonts"
              className="h-7 w-6 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-200/80 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tamanho da Fonte com botões - e + */}
          <div className="flex items-center gap-0.5 bg-transparent border border-transparent hover:border-slate-300 rounded hover:bg-slate-200/60 p-0.5">
            <button
              type="button"
              onClick={() => handleSetFontSizeNumber(currentFontSize - 1)}
              title="Diminuir tamanho da fonte"
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <MinusIcon className="w-3 h-3" />
            </button>

            <select
              value={`${currentFontSize}pt`}
              onChange={(e) => handleSetFontSizeNumber(parseInt(e.target.value, 10))}
              className="h-6 px-1 text-xs text-center font-medium bg-transparent border-none rounded text-slate-800 focus:outline-none cursor-pointer"
            >
              {[9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 30, 36, 48].map((s) => (
                <option key={s} value={`${s}pt`}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleSetFontSizeNumber(currentFontSize + 1)}
              title="Aumentar tamanho da fonte"
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Formatação Básica: B, I, U, S */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Negrito (Ctrl+B)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("bold")
                  ? "bg-slate-300 text-slate-900 font-bold"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Itálico (Ctrl+I)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("italic")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Sublinhado (Ctrl+U)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("underline")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Tachado"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("strike")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            {/* Cor do Texto (Popover) */}
            <ColorPickerPopover
              title="Cor do Texto"
              icon={<Baseline className="w-3.5 h-3.5 text-slate-700" />}
              currentColor={currentTextColor}
              defaultColorLabel="Preto Automático"
              onSelectColor={handleSetTextColor}
              onClearColor={handleClearTextColor}
            />

            {/* Cor de Destaque / Marca-texto (Popover) */}
            <ColorPickerPopover
              title="Cor de Destaque (Marca-texto)"
              icon={<Highlighter className="w-3.5 h-3.5 text-slate-700" />}
              currentColor={currentHighlightColor}
              defaultColorLabel="Nenhum (Sem Destaque)"
              onSelectColor={handleSetHighlightColor}
              onClearColor={handleClearHighlightColor}
            />
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Alinhamento */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              title="Alinhar à Esquerda (Ctrl+Shift+L)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive({ textAlign: "left" })
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              title="Centralizar (Ctrl+Shift+E)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive({ textAlign: "center" })
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Alinhar à Direita (Ctrl+Shift+R)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive({ textAlign: "right" })
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              title="Justificar (Ctrl+Shift+J)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive({ textAlign: "justify" })
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Listas & Checklist */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Lista com Marcadores"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("bulletList")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Lista Numerada"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("orderedList")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Lista de Tarefas / Checklist"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("taskList")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Inserções: Tabela, Imagem, Citação, Divisória */}
          <div className="flex items-center gap-0.5">
            <TableInsertPopover editor={editor} />

            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              title="Inserir Imagem"
              className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Bloco de Citação"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("blockquote")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Linha Divisória"
              className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Sobrescrito / Subscrito & Limpar Formatação */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              title="Sobrescrito (X²)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("superscript")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <SuperscriptIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              title="Subscrito (X₂)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                editor.isActive("subscript")
                  ? "bg-slate-300 text-slate-900"
                  : "hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <SubscriptIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              title="Limpar Formatação (Ctrl+\)"
              className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <GoogleFontModal
        isOpen={isGoogleFontModalOpen}
        onClose={() => setIsGoogleFontModalOpen(false)}
        onSelectFont={handleApplyFontFamily}
      />
    </>
  );
};
