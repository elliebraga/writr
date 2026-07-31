import React from "react";
import { User, Trash2, Calendar } from "lucide-react";
import type { Character } from "../../types/character";
import { useDialog } from "../ui/DialogProvider";

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  onNavigateToTimeline?: (characterId: string) => void;
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

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onSelect,
  onDelete,
  onNavigateToTimeline,
}) => {
  const { showConfirm } = useDialog();
  const characterName = character.character_name || character.name || "Personagem sem nome";
  const roleType = character.role_type || "Protagonista";

  return (
    <div
      onClick={() => onSelect(character)}
      className="group relative bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between h-[230px] select-none hover:shadow-xs"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {character.image_url ? (
                <img
                  src={character.image_url}
                  alt={characterName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold font-funnel text-slate-900 leading-tight group-hover:translate-x-0.5 transition-transform truncate">
                {characterName}
              </h3>
              
              <span
                className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mt-1.5 ${getBadgeStyles(
                  roleType
                )}`}
              >
                {roleType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onNavigateToTimeline && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTimeline(character.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 transition-all p-1.5 rounded-full hover:bg-slate-100"
                title="Ver Linha do Tempo"
              >
                <Calendar className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await showConfirm(
                    `Deseja excluir o personagem "${characterName}"?`,
                    "Excluir Personagem",
                    "Excluir",
                    "Cancelar"
                  );
                  if (confirmed) {
                    onDelete(character.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1.5 rounded-full hover:bg-slate-100"
                title="Excluir personagem"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500 font-sans line-clamp-3 leading-relaxed mt-2">
          {character.summary && character.summary.trim()
            ? character.summary
            : "Nenhum resumo cadastrado para este personagem."}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>Ficha de Personagem</span>
        <span className="group-hover:text-slate-900 transition-colors font-semibold">
          Editar Ficha &rarr;
        </span>
      </div>
    </div>
  );
};
