import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface TiptapToolbarProps {
  editor: Editor | null;
}

export const TiptapToolbar: React.FC<TiptapToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  // Handler para trocar família de fonte
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    if (font === "default") {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font).run();
    }
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

  // Valor atual selecionado no dropdown de hierarquia
  const getCurrentHeadingValue = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "p";
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 select-none sticky top-0 z-30">
      <div className="flex flex-wrap items-center gap-1.5">
        
        {/* Dropdown Família de Fonte com Fontes Sistêmicas */}
        <div className="relative flex items-center">
          <select
            onChange={handleFontFamilyChange}
            className="h-8 pl-3 pr-7 text-xs font-medium bg-white border border-slate-200 rounded-full text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
            defaultValue="default"
          >
            <option value="default">Fonte: Sans (Figtree / Padrão)</option>

            <optgroup label="Sem Serifa (Sans-Serif)">
              <option value="system-ui, -apple-system, sans-serif">Sistema (System Sans)</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </optgroup>

            <optgroup label="Serifadas (Serif)">
              <option value="Fraunces, serif">Fraunces (Editorial)</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="Garamond, Georgia, serif">Garamond</option>
              <option value="'Palatino Linotype', Palatino, serif">Palatino</option>
            </optgroup>

            <optgroup label="Monospaçadas (Mono)">
              <option value="ui-monospace, Consolas, monospace">Sistema Mono</option>
              <option value="'Courier New', Courier, monospace">Courier New</option>
              <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
            </optgroup>
          </select>
        </div>

        {/* Divisor */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Dropdown Tamanhos & Hierarquia */}
        <div className="relative flex items-center">
          <select
            value={getCurrentHeadingValue()}
            onChange={handleHeadingChange}
            className="h-8 pl-3 pr-7 text-xs font-medium bg-white border border-slate-200 rounded-full text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="p">Corpo de Texto (P)</option>
            <option value="h1">Título 1 (H1)</option>
            <option value="h2">Título 2 (H2)</option>
            <option value="h3">Título 3 (H3)</option>
          </select>
        </div>

        {/* Divisor */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Estilos de Texto: Negrito, Itálico, Sublinhado, Riscado */}
        <div className="flex items-center gap-0.5 border border-slate-200 rounded-full p-0.5 px-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("bold")
                ? "bg-slate-900 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Negrito (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("italic")
                ? "bg-slate-900 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Itálico (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("underline")
                ? "bg-slate-900 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Sublinhado (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("strike")
                ? "bg-slate-900 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Riscado"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Divisor */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Alinhamento: Esquerda, Centro, Direita, Justificado */}
        <div className="flex items-center gap-0.5 border border-slate-200 rounded-full p-0.5 px-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: "left" })
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Alinhar à Esquerda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: "center" })
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Centralizar"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: "right" })
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Alinhar à Direita"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: "justify" })
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Justificar"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Divisor */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Listas & Citação */}
        <div className="flex items-center gap-0.5 border border-slate-200 rounded-full p-0.5 px-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("bulletList")
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Lista com Marcadores"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("orderedList")
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive("blockquote")
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Citação"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desfazer / Refazer */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
          title="Desfazer"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
          title="Refazer"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
