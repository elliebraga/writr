import React, { useState } from "react";
import { X, FileText, Sliders, Printer } from "lucide-react";
import type { PdfExportOptions, PageSize, PageOrientation } from "../../types/export";
import { DEFAULT_PDF_OPTIONS } from "../../types/export";
import Button from "../ui/Button";

interface PdfExportModalProps {
  isOpen: boolean;
  title: string;
  isBookExport?: boolean;
  onClose: () => void;
  onConfirmExport: (options: PdfExportOptions) => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  title,
  isBookExport = false,
  onClose,
  onConfirmExport,
}) => {
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_OPTIONS);
  const [marginPreset, setMarginPreset] = useState<"normal" | "narrow" | "wide" | "custom">("normal");

  if (!isOpen) return null;

  // Preset de margens
  const handleMarginPresetChange = (preset: "normal" | "narrow" | "wide" | "custom") => {
    setMarginPreset(preset);
    if (preset === "normal") {
      setOptions((prev) => ({
        ...prev,
        marginTopMm: 20,
        marginRightMm: 15,
        marginBottomMm: 20,
        marginLeftMm: 15,
      }));
    } else if (preset === "narrow") {
      setOptions((prev) => ({
        ...prev,
        marginTopMm: 10,
        marginRightMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 10,
      }));
    } else if (preset === "wide") {
      setOptions((prev) => ({
        ...prev,
        marginTopMm: 30,
        marginRightMm: 25,
        marginBottomMm: 30,
        marginLeftMm: 25,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmExport(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Exportar em PDF ({isBookExport ? "Obra Completa" : "Capítulo"})
              </h3>
              <p className="text-base text-slate-500 font-sans truncate max-w-xs">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800">
          
          {/* Seção 1: Medidas da Folha (Tamanho da Página) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Tamanho / Formato da Folha</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "A5", label: "A5 (Livro)", desc: "148 × 210 mm" },
                { id: "A4", label: "A4", desc: "210 × 297 mm" },
                { id: "Letter", label: "Carta", desc: "216 × 279 mm" },
                { id: "Pocket", label: "Bolso", desc: "125 × 180 mm" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, pageSize: fmt.id as PageSize }))}
                  className={`p-2.5 rounded-full border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                    options.pageSize === fmt.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-400 text-slate-800"
                  }`}
                >
                  <span className="text-xs font-semibold leading-tight">{fmt.label}</span>
                  <span className={`text-[10px] mt-0.5 ${options.pageSize === fmt.id ? "text-slate-300" : "text-slate-400"}`}>
                    {fmt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Seção 2: Orientação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Orientação da Página
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, orientation: "portrait" as PageOrientation }))}
                className={`py-2.5 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  options.orientation === "portrait"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-400 text-slate-700"
                }`}
              >
                <span>Vertical (Retrato)</span>
              </button>
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, orientation: "landscape" as PageOrientation }))}
                className={`py-2.5 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  options.orientation === "landscape"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-400 text-slate-700"
                }`}
              >
                <span>Horizontal (Paisagem)</span>
              </button>
            </div>
          </div>

          {/* Seção 3: Medidas das Margens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Medidas das Margens (mm)</span>
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                {(["normal", "narrow", "wide", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleMarginPresetChange(p)}
                    className={`px-2.5 py-1 rounded-full capitalize font-medium transition-colors ${
                      marginPreset === p
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {p === "normal" ? "Padrão" : p === "narrow" ? "Estreita" : p === "wide" ? "Larga" : "Custom"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Superior</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={options.marginTopMm}
                  onChange={(e) => {
                    setMarginPreset("custom");
                    setOptions((prev) => ({ ...prev, marginTopMm: Number(e.target.value) }));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Direita</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={options.marginRightMm}
                  onChange={(e) => {
                    setMarginPreset("custom");
                    setOptions((prev) => ({ ...prev, marginRightMm: Number(e.target.value) }));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Inferior</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={options.marginBottomMm}
                  onChange={(e) => {
                    setMarginPreset("custom");
                    setOptions((prev) => ({ ...prev, marginBottomMm: Number(e.target.value) }));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Esquerda</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={options.marginLeftMm}
                  onChange={(e) => {
                    setMarginPreset("custom");
                    setOptions((prev) => ({ ...prev, marginLeftMm: Number(e.target.value) }));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Tipografia e Espaçamento de Linha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tamanho da Fonte (pt)
              </label>
              <select
                value={options.fontSizePt}
                onChange={(e) => setOptions((prev) => ({ ...prev, fontSizePt: Number(e.target.value) }))}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
              >
                <option value={10}>10 pt (Compacto)</option>
                <option value={11}>11 pt (Padrão)</option>
                <option value={12}>12 pt (Editorial Recomendado)</option>
                <option value={14}>14 pt (Grande Leitura)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Espaçamento de Linhas
              </label>
              <select
                value={options.lineHeight}
                onChange={(e) => setOptions((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
              >
                <option value={1.25}>1.25x (Simples)</option>
                <option value={1.5}>1.5x (Editorial)</option>
                <option value={1.8}>1.8x (Confortável)</option>
                <option value={2.0}>2.0x (Duplo)</option>
              </select>
            </div>
          </div>

          {/* Seção 5: Número de Páginas */}
          <div className="flex items-center justify-between pt-1">
            <label htmlFor="showPageNumbers" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Exibir número de páginas no rodapé
            </label>
            <input
              id="showPageNumbers"
              type="checkbox"
              checked={options.showPageNumbers}
              onChange={(e) => setOptions((prev) => ({ ...prev, showPageNumbers: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Gerar & Exportar PDF
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
