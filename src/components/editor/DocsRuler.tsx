import React from "react";

interface DocsRulerProps {
  pageWidthMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  zoom: number; // 0.75, 1, 1.25 etc
}

export const DocsRuler: React.FC<DocsRulerProps> = ({
  pageWidthMm,
  marginLeftMm,
  marginRightMm,
  zoom,
}) => {
  // A cada 10mm temos 1cm
  const totalCm = Math.floor(pageWidthMm / 10);
  const leftMarginPercent = (marginLeftMm / pageWidthMm) * 100;
  const rightMarginPercent = (marginRightMm / pageWidthMm) * 100;

  return (
    <div
      className="mx-auto select-none overflow-hidden transition-all duration-300"
      style={{
        width: `${pageWidthMm * (zoom || 1)}mm`,
        maxWidth: "100%",
      }}
    >
      <div className="relative h-4 bg-slate-200/90 border-x border-t border-slate-300 rounded-t flex items-end">
        {/* Zona cinza da margem esquerda */}
        <div
          className="absolute inset-y-0 left-0 bg-slate-300/80 border-r border-slate-400/80 flex items-center justify-end pr-1"
          style={{ width: `${leftMarginPercent}%` }}
        >
          {/* Marcador triangular do Google Docs */}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-blue-600 translate-y-1" />
        </div>

        {/* Zona cinza da margem direita */}
        <div
          className="absolute inset-y-0 right-0 bg-slate-300/80 border-l border-slate-400/80 flex items-center justify-start pl-1"
          style={{ width: `${rightMarginPercent}%` }}
        >
          {/* Marcador triangular direito */}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-blue-600 translate-y-1" />
        </div>

        {/* Marcas graduadas de cada centímetro */}
        <div className="w-full flex justify-between px-1 pointer-events-none relative z-10">
          {Array.from({ length: totalCm + 1 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[7px] font-mono text-slate-600 leading-none">
                {i > 0 && i < totalCm && i % 2 === 0 ? i : ""}
              </span>
              <div
                className={`w-px bg-slate-400/70 ${
                  i % 2 === 0 ? "h-2" : "h-1"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
