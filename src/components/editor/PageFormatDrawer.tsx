import React from "react";
import { X, FileText, Sliders, Printer, Type, Layout, Check, Sparkles } from "lucide-react";
import type { PdfExportOptions, PageSize, PageOrientation } from "../../types/export";
import Button from "../ui/Button";

export interface PageFormatOptions extends PdfExportOptions {
  fontFamily: string;
}

interface PageFormatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  options: PageFormatOptions;
  onChangeOptions: (newOptions: PageFormatOptions) => void;
  onExportPdf?: () => void;
}

export const PageFormatDrawer: React.FC<PageFormatDrawerProps> = ({
  isOpen,
  onClose,
  options,
  onChangeOptions,
  onExportPdf,
}) => {
  if (!isOpen) return null;

  const handleMarginPresetChange = (preset: "normal" | "narrow" | "wide") => {
    if (preset === "normal") {
      onChangeOptions({
        ...options,
        marginTopMm: 20,
        marginRightMm: 15,
        marginBottomMm: 20,
        marginLeftMm: 15,
      });
    } else if (preset === "narrow") {
      onChangeOptions({
        ...options,
        marginTopMm: 10,
        marginRightMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 10,
      });
    } else if (preset === "wide") {
      onChangeOptions({
        ...options,
        marginTopMm: 30,
        marginRightMm: 25,
        marginBottomMm: 30,
        marginLeftMm: 25,
      });
    }
  };

  // Cálculo de dimensões da pré-visualização em mm
  let pageW = 148;
  let pageH = 210;
  if (options.pageSize === "A4") {
    pageW = 210;
    pageH = 297;
  } else if (options.pageSize === "Letter") {
    pageW = 216;
    pageH = 279;
  } else if (options.pageSize === "Pocket") {
    pageW = 125;
    pageH = 180;
  }

  if (options.orientation === "landscape") {
    const tmp = pageW;
    pageW = pageH;
    pageH = tmp;
  }

  const mtPct = (options.marginTopMm / pageH) * 100;
  const mrPct = (options.marginRightMm / pageW) * 100;
  const mbPct = (options.marginBottomMm / pageH) * 100;
  const mlPct = (options.marginLeftMm / pageW) * 100;
  const pageAspectRatio = `${pageW}/${pageH}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Slide-Over */}
      <aside className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10 z-50">
        <div className="w-screen md:w-[40vw] max-w-full md:max-w-none md:min-w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 ease-out">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-funnel text-slate-900">Formatador de Página</h3>
                <p className="text-xs text-slate-600 font-sans">Ajuste o layout, margens e PDF do editor.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Visualização Prévia Miniaturizada */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mb-3 self-start">
                Visualização Prévia da Página
              </span>

              <div
                className="bg-white border border-slate-300 rounded-sm shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                style={{
                  aspectRatio: pageAspectRatio,
                  height: "190px",
                  paddingTop: `${mtPct}%`,
                  paddingRight: `${mrPct}%`,
                  paddingBottom: `${mbPct}%`,
                  paddingLeft: `${mlPct}%`,
                }}
              >
                {/* Linha pontilhada de margem */}
                <div
                  className="absolute border border-dashed border-indigo-300/70 pointer-events-none rounded-xs"
                  style={{
                    top: `${mtPct}%`,
                    right: `${mrPct}%`,
                    bottom: `${mbPct}%`,
                    left: `${mlPct}%`,
                  }}
                />

                {/* Conteúdo Falso */}
                <div className="flex-1 flex flex-col overflow-hidden justify-start">
                  {options.showHeader !== false && (
                    <div
                      className="font-bold text-slate-800 leading-none mb-1.5 text-center truncate"
                      style={{
                        fontFamily: options.fontFamily || "sans-serif",
                        fontSize: `${Math.max(5, options.fontSizePt * 0.45)}px`,
                      }}
                    >
                      Capítulo 1: Título da Página
                    </div>
                  )}

                  <div
                    className="flex flex-col gap-1 overflow-hidden"
                    style={{
                      fontFamily: options.fontFamily || "sans-serif",
                      fontSize: `${options.fontSizePt * 0.3}px`,
                      lineHeight: options.lineHeight,
                    }}
                  >
                    <p className="text-slate-600 text-justify text-[4px] leading-relaxed">
                      Este é um modelo de pré-visualização ao vivo do seu documento. Ajuste as margens, fontes e formato da folha para visualizar o resultado imediato.
                    </p>
                  </div>
                </div>

                {/* Rodapé (Página) */}
                {options.showPageNumbers && (
                  <div className="absolute bottom-1 left-0 right-0 text-center font-sans text-slate-600 text-[5px]">
                    1
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-600 font-semibold mt-2">
                Dimensões: <strong className="text-slate-800">{pageW} × {pageH} mm</strong>
              </span>
            </div>

            {/* 1. Formato da Folha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Tamanho da Folha</span>
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
                    onClick={() => onChangeOptions({ ...options, pageSize: fmt.id as PageSize })}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      options.pageSize === fmt.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-400 text-slate-800"
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">{fmt.label}</span>
                    <span className={`text-[9px] mt-0.5 ${options.pageSize === fmt.id ? "text-slate-300" : "text-slate-600"}`}>
                      {fmt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Orientação */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-slate-600" />
                <span>Orientação</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onChangeOptions({ ...options, orientation: "portrait" as PageOrientation })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    options.orientation === "portrait"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-400 text-slate-700"
                  }`}
                >
                  <span>Retrato (Vertical)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOptions({ ...options, orientation: "landscape" as PageOrientation })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    options.orientation === "landscape"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-400 text-slate-700"
                  }`}
                >
                  <span>Paisagem (Horizontal)</span>
                </button>
              </div>
            </div>

            {/* 3. Margens */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                  <span>Margens da Página (mm)</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  {(["normal", "narrow", "wide"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleMarginPresetChange(p)}
                      className="px-2 py-0.5 rounded-full capitalize font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      {p === "normal" ? "Padrão" : p === "narrow" ? "Estreita" : "Larga"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[9px] text-slate-600 font-bold uppercase block mb-1">Superior</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginTopMm}
                    onChange={(e) => onChangeOptions({ ...options, marginTopMm: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-600 font-bold uppercase block mb-1">Direita</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginRightMm}
                    onChange={(e) => onChangeOptions({ ...options, marginRightMm: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-600 font-bold uppercase block mb-1">Inferior</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginBottomMm}
                    onChange={(e) => onChangeOptions({ ...options, marginBottomMm: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-600 font-bold uppercase block mb-1">Esquerda</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.marginLeftMm}
                    onChange={(e) => onChangeOptions({ ...options, marginLeftMm: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 4. Tipografia & Espaçamento */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-600" />
                  <span>Família Tipográfica da Página</span>
                </label>
                <select
                  value={options.fontFamily}
                  onChange={(e) => onChangeOptions({ ...options, fontFamily: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 cursor-pointer font-sans"
                >
                  <optgroup label="Sem Serifa (Modernas / Sans)">
                    <option value="Figtree, sans-serif">Figtree (Padrão Writr)</option>
                    <option value="'DM Sans', sans-serif">DM Sans (Minimalista)</option>
                    <option value="Inter, sans-serif">Inter (Moderno Sans)</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="system-ui, sans-serif">Sistema Sans</option>
                  </optgroup>

                  <optgroup label="Serifadas (Literárias & Livros)">
                    <option value="Fraunces, serif">Fraunces (Editorial)</option>
                    <option value="Lora, serif">Lora (Clássico Romance)</option>
                    <option value="Merriweather, serif">Merriweather (Leitura Longa)</option>
                    <option value="'Playfair Display', serif">Playfair Display (Elegante)</option>
                    <option value="'EB Garamond', Georgia, serif">EB Garamond (Livro)</option>
                    <option value="Georgia, serif">Georgia (Editorial Serif)</option>
                    <option value="'Times New Roman', serif">Times New Roman (Clássico)</option>
                    <option value="Cinzel, serif">Cinzel (Épico / Fantasia)</option>
                  </optgroup>

                  <optgroup label="Monospaçadas (Máquina de Escrever)">
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="'Courier New', monospace">Courier New (Rascunho Mono)</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tamanho da Fonte (pt)
                  </label>
                  <select
                    value={options.fontSizePt}
                    onChange={(e) => onChangeOptions({ ...options, fontSizePt: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
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
                    onChange={(e) => onChangeOptions({ ...options, lineHeight: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value={1.25}>1.25x (Simples)</option>
                    <option value={1.5}>1.5x (Editorial)</option>
                    <option value={1.8}>1.8x (Confortável)</option>
                    <option value={2.0}>2.0x (Duplo)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Opções de Cabeçalho e PDF */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-900 block">Opções de Cabeçalho & Impressão PDF</span>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label htmlFor="drawerShowHeader" className="text-xs font-semibold text-slate-800 cursor-pointer block">
                    Exibir cabeçalho do capítulo
                  </label>
                  <span className="text-[10px] text-slate-600">Imprime o título no topo da folha PDF</span>
                </div>
                <input
                  id="drawerShowHeader"
                  type="checkbox"
                  checked={options.showHeader !== false}
                  onChange={(e) => onChangeOptions({ ...options, showHeader: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label htmlFor="drawerShowPageNumbers" className="text-xs font-semibold text-slate-800 cursor-pointer block">
                    Exibir número de páginas no rodapé
                  </label>
                  <span className="text-[10px] text-slate-600">Insere a numeração centralizada no PDF</span>
                </div>
                <input
                  id="drawerShowPageNumbers"
                  type="checkbox"
                  checked={options.showPageNumbers}
                  onChange={(e) => onChangeOptions({ ...options, showPageNumbers: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-2 text-[11px] text-indigo-700">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>As alterações de margens e tipografia se aplicam em tempo real à tela de escrita do editor.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Aplicar ao Editor
            </Button>

            {onExportPdf && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Gerar PDF
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
