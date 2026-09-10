import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface ColorPickerPopoverProps {
  label?: string;
  icon: React.ReactNode;
  currentColor?: string;
  defaultColorLabel?: string;
  onSelectColor: (color: string) => void;
  onClearColor: () => void;
  title: string;
}

const PRESET_COLORS = [
  // Linha 1: Neutros / Escala de cinza
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",

  // Linha 2: Vermelhos & Laranjas
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",

  // Linha 3: Tons Suaves / Pastéis (Ideais para Marca-Texto)
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc",
  "#f3e8fd",

  // Linha 4: Tons Médios
  "#dd7e6b",
  "#ea9999",
  "#f9cb9c",
  "#ffe599",
  "#b6d7a8",
  "#a2c4c9",
  "#9fc5e8",
  "#b4a7d6",
  "#d5a6bd",
  "#c084fc",

  // Linha 5: Tons Escuros Profundos
  "#a61c1c",
  "#cc0000",
  "#e69138",
  "#f1c232",
  "#6aa84f",
  "#45818e",
  "#3c78d8",
  "#3d85c6",
  "#674ea7",
  "#a64d79",
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  icon,
  currentColor,
  defaultColorLabel = "Automático / Sem Cor",
  onSelectColor,
  onClearColor,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(currentColor || "#000000");
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

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer ${
          isOpen ? "bg-slate-100 ring-1 ring-slate-300" : ""
        }`}
      >
        <span className="flex flex-col items-center">
          {icon}
          {currentColor && (
            <span
              className="w-3.5 h-1 rounded-full mt-0.5 border border-slate-300 shadow-2xs"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full left-3 sm:left-0 max-w-[calc(100vw-24px)] w-64 mt-1.5 p-3 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">{title}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão de Cor Padrão / Limpar */}
          <button
            type="button"
            onClick={() => {
              onClearColor();
              setIsOpen(false);
            }}
            className="w-full mb-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{defaultColorLabel}</span>
            {!currentColor && <Check className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          {/* Grade de Cores */}
          <div className="grid grid-cols-10 gap-1 mb-3">
            {PRESET_COLORS.map((color, index) => {
              const isSelected = currentColor?.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  onClick={() => {
                    onSelectColor(color);
                    setIsOpen(false);
                  }}
                  title={color}
                  className={`w-5 h-5 rounded-md border transition-transform hover:scale-115 flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? "border-slate-900 ring-2 ring-slate-900/30 shadow-xs"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <Check
                      className={`w-2.5 h-2.5 ${
                        color === "#ffffff" || color === "#f3f3f3" ? "text-slate-900" : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Cor Personalizada (HEX) */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Custom:</span>
            <input
              type="color"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="flex-1 px-2 py-0.5 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-900 text-slate-800 uppercase"
              placeholder="#000000"
            />
            <button
              type="button"
              onClick={() => {
                if (customHex) {
                  onSelectColor(customHex);
                  setIsOpen(false);
                }
              }}
              className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
