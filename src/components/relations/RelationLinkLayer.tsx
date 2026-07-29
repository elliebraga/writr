import React from "react";
import type { CharacterRelationLink, NodePosition } from "../../types/relation";
import { CARD_WIDTH, CARD_HEIGHT } from "./RelationNodeCard";
import { Trash2 } from "lucide-react";

interface RelationLinkLayerProps {
  nodes: Record<string, NodePosition>;
  links: CharacterRelationLink[];
  onDeleteLink?: (linkId: string) => void;
  onSelectLink?: (link: CharacterRelationLink) => void;
}

export const RelationLinkLayer: React.FC<RelationLinkLayerProps> = ({
  nodes,
  links,
  onDeleteLink,
  onSelectLink,
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        {/* Marcador de Seta de Ligação */}
        <marker
          id="relation-arrowhead"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
        </marker>

        {/* Seta Vermelha para Relações de Inimizade/Rivalidade */}
        <marker
          id="relation-arrowhead-danger"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
        </marker>
      </defs>

      {links.map((link) => {
        const fromNode = nodes[link.from_character_id];
        const toNode = nodes[link.to_character_id];

        if (!fromNode || !toNode) return null;

        // Ponto central do card de origem e destino
        const x1 = fromNode.x + CARD_WIDTH / 2;
        const y1 = fromNode.y + CARD_HEIGHT / 2;
        const x2 = toNode.x + CARD_WIDTH / 2;
        const y2 = toNode.y + CARD_HEIGHT / 2;

        // Cálculo da curva Bezier suave
        const dx = x2 - x1;
        const cx1 = x1 + dx * 0.5;
        const cy1 = y1;
        const cx2 = x1 + dx * 0.5;
        const cy2 = y2;

        const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

        // Ponto central aproximado para o Rótulo do Relacionamento
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const isDanger = link.label.toLowerCase().includes("inimig") || link.label.toLowerCase().includes("rival");
        const strokeColor = isDanger ? "#dc2626" : "#334155";
        const markerId = isDanger ? "url(#relation-arrowhead-danger)" : "url(#relation-arrowhead)";

        return (
          <g key={link.id} className="group">
            {/* Linha/Seta de Conexão */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeDasharray={link.line_style === "dashed" ? "6,6" : undefined}
              markerEnd={markerId}
              className="transition-all duration-200 opacity-80 group-hover:opacity-100 group-hover:stroke-width-3"
            />

            {/* Rótulo de Relacionamento (Badge Flutuante no Centro da Seta) */}
            <foreignObject
              x={midX - 70}
              y={midY - 16}
              width="140"
              height="32"
              className="pointer-events-auto overflow-visible"
            >
              <div className="flex items-center justify-center h-full">
                <div
                  onClick={() => onSelectLink && onSelectLink(link)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shadow-xs transition-all cursor-pointer select-none group/label ${
                    isDanger
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      : "bg-white text-slate-800 border-slate-300 hover:border-slate-900 hover:shadow-md"
                  }`}
                >
                  <span className="truncate max-w-[90px]">{link.label}</span>

                  {onDeleteLink && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir ligação "${link.label}"?`)) {
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
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
};
