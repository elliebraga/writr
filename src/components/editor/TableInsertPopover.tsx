import React, { useState, useRef, useEffect } from "react";
import { Table as TableIcon, X } from "lucide-react";
import { Editor } from "@tiptap/react";

interface TableInsertPopoverProps {
  editor: Editor | null;
}

const MAX_ROWS = 8;
const MAX_COLS = 8;

export const TableInsertPopover: React.FC<TableInsertPopoverProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRows, setHoveredRows] = useState(0);
  const [hoveredCols, setHoveredCols] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleInsertTable = (rows: number, cols: number) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsOpen(false);
    setHoveredRows(0);
    setHoveredCols(0);
  };

  const isInsideTable = editor?.isActive("table") || false;

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Inserir Tabela"
        className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer ${
          isOpen || isInsideTable ? "bg-slate-100 text-slate-900" : "text-slate-600"
        }`}
      >
        <TableIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full left-3 sm:left-0 max-w-[calc(100vw-24px)] mt-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">Inserir Tabela</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center text-[11px] font-semibold text-slate-600 mb-2">
            {hoveredRows > 0 && hoveredCols > 0
              ? `${hoveredRows} × ${hoveredCols}`
              : "Selecione o tamanho"}
          </div>

          {/* Grade de Seleção Interativa */}
          <div
            className="grid gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${MAX_COLS}, minmax(0, 1fr))`,
            }}
            onMouseLeave={() => {
              setHoveredRows(0);
              setHoveredCols(0);
            }}
          >
            {Array.from({ length: MAX_ROWS }).map((_, rIdx) =>
              Array.from({ length: MAX_COLS }).map((_, cIdx) => {
                const row = rIdx + 1;
                const col = cIdx + 1;
                const isHighlighted = row <= hoveredRows && col <= hoveredCols;

                return (
                  <div
                    key={`${row}-${col}`}
                    onMouseEnter={() => {
                      setHoveredRows(row);
                      setHoveredCols(col);
                    }}
                    onClick={() => handleInsertTable(row, col)}
                    className={`w-4 h-4 rounded-xs border transition-all cursor-pointer ${
                      isHighlighted
                        ? "bg-slate-900 border-slate-900 scale-105"
                        : "bg-white border-slate-300 hover:border-slate-400"
                    }`}
                  />
                );
              })
            )}
          </div>

          {/* Controles de tabela se já estiver dentro de uma tabela */}
          {isInsideTable && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Ações da Tabela Ativa
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().addRowAfter().run();
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition-colors cursor-pointer"
                >
                  + Linha Abaixo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().addColumnAfter().run();
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition-colors cursor-pointer"
                >
                  + Coluna Direita
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().deleteRow().run();
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-left transition-colors cursor-pointer"
                >
                  Remover Linha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().deleteColumn().run();
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-left transition-colors cursor-pointer"
                >
                  Remover Coluna
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().deleteTable().run();
                    setIsOpen(false);
                  }}
                  className="col-span-2 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded text-center transition-colors cursor-pointer"
                >
                  Excluir Tabela Inteira
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
