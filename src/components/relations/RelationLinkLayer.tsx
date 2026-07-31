import React, { useState } from "react";
import type { CharacterRelationLink, NodePosition } from "../../types/relation";
import { CARD_WIDTH, CARD_HEIGHT } from "./RelationNodeCard";
import { Trash2, Info } from "lucide-react";
import { useDialog } from "../ui/DialogProvider";

interface RelationLinkLayerProps {
  nodes: Record<string, NodePosition>;
  links: CharacterRelationLink[];
  onDeleteLink?: (linkId: string) => void;
  onSelectLink?: (link: CharacterRelationLink) => void;
}

// Calcula a interseção precisa com a borda externa do card de destino
function calculateCardEdgeIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { targetX: number; targetY: number } {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hw = CARD_WIDTH / 2 + 6; // 6px de folga para ponta da seta no estilo rascunho
  const hh = CARD_HEIGHT / 2 + 6;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const tan = Math.abs(sin / (cos || 0.0001));
  const cardTan = hh / hw;

  let offsetX = 0;
  let offsetY = 0;

  if (tan <= cardTan) {
    // Interseção na borda esquerda ou direita do card
    offsetX = hw * (x2 > x1 ? -1 : 1);
    offsetY = Math.abs(hw * tan) * (y2 > y1 ? -1 : 1);
  } else {
    // Interseção na borda superior ou inferior do card
    offsetY = hh * (y2 > y1 ? -1 : 1);
    offsetX = Math.abs(hh / (tan || 0.0001)) * (x2 > x1 ? -1 : 1);
  }

  return {
    targetX: x2 + offsetX,
    targetY: y2 + offsetY,
  };
}

export const RelationLinkLayer: React.FC<RelationLinkLayerProps> = ({
  nodes,
  links,
  onDeleteLink,
  onSelectLink,
}) => {
  const { showConfirm } = useDialog();
  const [activeTooltipLinkId, setActiveTooltipLinkId] = useState<string | null>(null);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        {/* Seta Delicada Estilo Doodle / Rascunho à Mão Livre */}
        <marker
          id="relation-arrowhead-doodle"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path
            d="M 1.5 1.5 L 6.5 4 L 1.5 6.5"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>

        {/* Seta Doodle Vermelha para Rivalidades */}
        <marker
          id="relation-arrowhead-doodle-danger"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path
            d="M 1.5 1.5 L 6.5 4 L 1.5 6.5"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {links.map((link) => {
        const fromNode = nodes[link.from_character_id];
        const toNode = nodes[link.to_character_id];

        if (!fromNode || !toNode) return null;

        // Ponto central do card de origem
        const x1 = fromNode.x + CARD_WIDTH / 2;
        const y1 = fromNode.y + CARD_HEIGHT / 2;

        // Ponto central do card de destino
        const cx2 = toNode.x + CARD_WIDTH / 2;
        const cy2 = toNode.y + CARD_HEIGHT / 2;

        // Cálculo da interseção exata com a borda externa do card
        const { targetX, targetY } = calculateCardEdgeIntersection(x1, y1, cx2, cy2);

        // Traço Curvo Orgânico Estilo Rascunho / Doodle
        const dx = targetX - x1;
        
        // Leve curvatura orgânica artesanal
        const organicOffset = Math.sin((x1 + targetY) * 0.01) * 12;
        const cx1 = x1 + dx * 0.5;
        const cy1 = y1 + organicOffset;
        const cx2Control = x1 + dx * 0.5;
        const cy2Control = targetY - organicOffset;

        const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2Control} ${cy2Control}, ${targetX} ${targetY}`;

        // Ponto médio da linha para posicionar a Badge
        const midX = (x1 + targetX) / 2;
        const midY = (y1 + targetY) / 2;

        const isDanger =
          link.label.toLowerCase().includes("inimig") ||
          link.label.toLowerCase().includes("rival");
        const strokeColor = isDanger ? "#dc2626" : "#334155";
        const markerId = isDanger
          ? "url(#relation-arrowhead-doodle-danger)"
          : "url(#relation-arrowhead-doodle)";

        const isTooltipOpen = activeTooltipLinkId === link.id;

        return (
          <g key={link.id} className="group">
            {/* Traço Organico Estilo Rascunho / Doodle */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={link.line_style === "dashed" ? "5,5" : undefined}
              markerEnd={markerId}
              className="transition-all duration-200 opacity-80 group-hover:opacity-100 group-hover:stroke-width-2.5"
            />

            {/* Badge Rótulo do Relacionamento no Centro da Seta */}
            <foreignObject
              x={midX - 90}
              y={midY - 20}
              width="180"
              height="80"
              className="pointer-events-auto overflow-visible"
            >
              <div className="flex flex-col items-center justify-start h-full">
                <div
                  onClick={() => {
                    setActiveTooltipLinkId((prev) => (prev === link.id ? null : link.id));
                    onSelectLink?.(link);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shadow-xs transition-all cursor-pointer select-none group/label ${
                    isDanger
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-900 hover:shadow-md"
                  }`}
                >
                  <span className="truncate max-w-[110px]">{link.label}</span>

                  {link.description && (
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  )}

                  {onDeleteLink && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await showConfirm(
                          `Excluir conexão "${link.label}"?`,
                          "Excluir Conexão",
                          "Excluir",
                          "Cancelar"
                        );
                        if (confirmed) {
                          onDeleteLink(link.id);
                        }
                      }}
                      className="opacity-0 group-hover/label:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-0.5"
                      title="Excluir ligação"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Card Popover / Tooltip da Descrição Detalhada */}
                {(isTooltipOpen && link.description) && (
                  <div className="mt-1 bg-slate-900 text-white p-2.5 rounded-xl text-[11px] shadow-lg max-w-[170px] text-center leading-tight animate-in fade-in zoom-in-95 duration-150 border border-slate-700">
                    <p className="font-normal font-sans text-slate-200">{link.description}</p>
                  </div>
                )}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
};
