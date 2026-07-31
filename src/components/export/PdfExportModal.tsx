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

  // Obter dimensões reais da página em mm
  let pageW = 210;
  let pageH = 297;
  if (options.pageSize === "A5") {
    pageW = 148;
    pageH = 210;
  } else if (options.pageSize === "Letter") {
    pageW = 216;
    pageH = 279;
  } else if (options.pageSize === "Pocket") {
    pageW = 125;
    pageH = 180;
  }

  if (options.orientation === "landscape") {
    const temp = pageW;
    pageW = pageH;
    pageH = temp;
  }

  // Converter margens em mm para porcentagens relativas à página
  const mtPct = (options.marginTopMm / pageH) * 100;
  const mrPct = (options.marginRightMm / pageW) * 100;
  const mbPct = (options.marginBottomMm / pageH) * 100;
  const mlPct = (options.marginLeftMm / pageW) * 100;

  // Aspect ratio string para CSS
  const pageAspectRatio = `${pageW}/${pageH}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">
                Exportar em PDF ({isBookExport ? "Obra Completa" : "Capítulo"})
              </h3>
              <p className="text-xs text-slate-500 font-sans truncate max-w-xs">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 overflow-y-auto max-h-[70vh]">
          {/* Col 1: Form Settings */}
          <form id="pdf-export-form" onSubmit={handleSubmit} className="space-y-5 text-slate-800 pr-2">
            
            {/* Seção 1: Medidas da Folha (Tamanho da Página) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Tamanho / Formato da Folha</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "A5", label: "A5 (Livro)", desc: "148 × 210" },
                  { id: "A4", label: "A4", desc: "210 × 297" },
                  { id: "Letter", label: "Carta", desc: "216 × 279" },
                  { id: "Pocket", label: "Bolso", desc: "125 × 180" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOptions((prev) => ({ ...prev, pageSize: fmt.id as PageSize }))}
                    className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      options.pageSize === fmt.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-400 text-slate-800"
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">{fmt.label}</span>
                    <span className={`text-[9px] mt-0.5 ${options.pageSize === fmt.id ? "text-slate-300" : "text-slate-400"}`}>
                      {fmt.desc} mm
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
                  className={`py-2 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
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
                  className={`py-2 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
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
                <div className="flex items-center gap-1 text-[10px]">
                  {(["normal", "narrow", "wide", "custom"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleMarginPresetChange(p)}
                      className={`px-2 py-0.5 rounded-full capitalize font-semibold transition-colors ${
                        marginPreset === p
                          ? "bg-slate-900 text-white"
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
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Superior</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginTopMm}
                    onChange={(e) => {
                      setMarginPreset("custom");
                      setOptions((prev) => ({ ...prev, marginTopMm: Math.max(0, Number(e.target.value)) }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Direita</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginRightMm}
                    onChange={(e) => {
                      setMarginPreset("custom");
                      setOptions((prev) => ({ ...prev, marginRightMm: Math.max(0, Number(e.target.value)) }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Inferior</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginBottomMm}
                    onChange={(e) => {
                      setMarginPreset("custom");
                      setOptions((prev) => ({ ...prev, marginBottomMm: Math.max(0, Number(e.target.value)) }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Esquerda</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginLeftMm}
                    onChange={(e) => {
                      setMarginPreset("custom");
                      setOptions((prev) => ({ ...prev, marginLeftMm: Math.max(0, Number(e.target.value)) }));
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-full text-slate-900 bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value={10}>10 pt (Compacto)</option>
                  <option value={11}>11 pt (Padrão)</option>
                  <option value={12}>12 pt (Editorial)</option>
                  <option value={14}>14 pt (Grande)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Espaçamento de Linhas
                </label>
                <select
                  value={options.lineHeight}
                  onChange={(e) => setOptions((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-full text-slate-900 bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
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
          </form>

          {/* Col 2: Live Page Preview Panel */}
          <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 select-none min-h-[360px] relative overflow-hidden">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold absolute top-3.5 left-4">
              Visualização Prévia da Página
            </span>

            {/* Folha de papel miniaturizada */}
            <div 
              className="bg-white border border-slate-300 rounded-sm shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              style={{
                aspectRatio: pageAspectRatio,
                height: "260px",
                paddingTop: `${mtPct}%`,
                paddingRight: `${mrPct}%`,
                paddingBottom: `${mbPct}%`,
                paddingLeft: `${mlPct}%`,
              }}
            >
              {/* Guias das Margens (linha tracejada sutil) */}
              <div 
                className="absolute border border-dashed border-indigo-200/60 pointer-events-none rounded-xs"
                style={{
                  top: `${mtPct}%`,
                  right: `${mrPct}%`,
                  bottom: `${mbPct}%`,
                  left: `${mlPct}%`,
                }}
              />

              {/* Conteúdo Textual Falso */}
              <div className="flex-1 flex flex-col overflow-hidden justify-start">
                <div 
                  className="font-serif text-slate-800 font-bold leading-none mb-2 text-center select-none"
                  style={{
                    fontSize: `${Math.max(5, options.fontSizePt * 0.55)}px`,
                  }}
                >
                  Título do Capítulo
                </div>
                
                <div 
                  className="flex flex-col gap-1 overflow-hidden"
                  style={{
                    fontSize: `${options.fontSizePt * 0.35}px`,
                    lineHeight: options.lineHeight,
                  }}
                >
                  <p className="font-sans text-slate-400 text-justify text-[4.5px] leading-relaxed tracking-tight">
                    Era uma vez, em um reino distante, um escritor que buscava a formatação perfeita para o seu original. Ele sabia que o segredo de uma boa leitura dependia do balanço ideal entre o tamanho da folha, a tipografia e as margens da página.
                  </p>
                  <p className="font-sans text-slate-400 text-justify text-[4.5px] leading-relaxed tracking-tight">
                    Com este painel de visualização dinâmica, agora ele consegue antever a distribuição do texto impresso em tempo real. Qualquer mudança nas margens ou na fonte atualiza esta folha miniaturizada instantaneamente.
                  </p>
                </div>
              </div>

              {/* Rodapé (Número da Página) */}
              {options.showPageNumbers && (
                <div 
                  className="absolute bottom-1.5 left-0 right-0 text-center font-sans text-slate-400 select-none text-[5px]"
                >
                  1
                </div>
              )}
            </div>

            {/* Informações de Dimensão */}
            <span className="text-[10px] text-slate-500 font-semibold font-sans text-center">
              Página estimada: <strong className="text-slate-800">{pageW} × {pageH} mm</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-white">
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
            form="pdf-export-form"
            variant="primary"
            size="md"
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Gerar & Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
