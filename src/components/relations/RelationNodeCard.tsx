import React from "react";
import { User, Link2, X } from "lucide-react";
import type { Character, CharacterRoleType } from "../../types/character";

interface RelationNodeCardProps {
  character: Character;
  x: number;
  y: number;
  isSelected?: boolean;
  onDragStart: (characterId: string, e: React.MouseEvent) => void;
  onStartConnect?: (characterId: string) => void;
  onRemoveFromCanvas?: (characterId: string) => void;
}

const getBadgeStyles = (role?: string | null) => {
  switch (role) {
    case "Protagonista":
      return "bg-slate-900 text-white border-slate-900";
    case "Antagonista":
      return "bg-red-50 text-red-700 border-red-200/80";
    case "Secundário":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Coadjuvante":
      return "bg-amber-50 text-amber-800 border-amber-200/80";
    case "Mentor":
      return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 100;

export const RelationNodeCard: React.FC<RelationNodeCardProps> = ({
  character,
  x,
  y,
  isSelected,
  onDragStart,
  onStartConnect,
  onRemoveFromCanvas,
}) => {
  const characterName = character.character_name || character.name || "Personagem";
  const roleType = (character.role_type as CharacterRoleType) || "Protagonista";
  const avatarUrl = character.image_url || (character.character_images && character.character_images[0]);

  return (
    <div
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      }}
      onMouseDown={(e) => onDragStart(character.id, e)}
      onTouchStart={(e) => {
        if (e.touches[0]) {
          onDragStart(character.id, { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as any);
        }
      }}
      className={`absolute top-0 left-0 bg-white border rounded-2xl p-3.5 shadow-sm transition-shadow select-none cursor-grab active:cursor-grabbing flex flex-col justify-between group z-20 ${
        isSelected
          ? "border-slate-900 ring-2 ring-slate-900/10 shadow-md"
          : "border-slate-200 hover:border-slate-400 hover:shadow-md"
      }`}
    >
      {/* Top Bar: Avatar, Name & Remove Button */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={characterName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold font-funnel text-slate-900 truncate leading-tight">
              {characterName}
            </h4>
            <span
              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${getBadgeStyles(
                roleType
              )}`}
            >
              {roleType}
            </span>
          </div>
        </div>

        {onRemoveFromCanvas && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromCanvas(character.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-all"
            title="Remover do canvas"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-medium">Nó de Conexão</span>
        {onStartConnect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartConnect(character.id);
            }}
            className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full transition-colors"
          >
            <Link2 className="w-3 h-3" />
            <span>Ligar &rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
};
