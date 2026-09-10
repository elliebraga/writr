import React from "react";
import { User, Trash2, Image as ImageIcon, Cake } from "lucide-react";
import type { Character } from "../../types/character";
import { useDialog } from "../ui/DialogProvider";

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onDelete?: (characterId: string) => Promise<void> | void;
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
}) => {
  const { showConfirm } = useDialog();
  const characterName = character.character_name || character.name || "Personagem sem nome";
  const roleType = character.role_type || "Protagonista";

  // A foto principal (avatar) é usada como a imagem de cabeçalho (heading banner) do card
  const headingImage =
    character.image_url ||
    (Array.isArray(character.character_images) && character.character_images.length > 0
      ? character.character_images[0]
      : null) ||
    character.header_url ||
    (() => {
      if (character.character_details) {
        try {
          const parsed = JSON.parse(character.character_details);
          if (parsed.header_url) return parsed.header_url;
        } catch (e) {}
      }
      return null;
    })();

  const refImagesCount = (() => {
    if (Array.isArray(character.character_images) && character.character_images.length > 1) {
      return character.character_images.length - 1;
    }
    if (character.character_details) {
      try {
        const parsed = JSON.parse(character.character_details);
        if (Array.isArray(parsed.reference_images)) {
          return parsed.reference_images.length;
        }
      } catch (e) {}
    }
    return 0;
  })();

  return (
    <div
      onClick={() => onSelect(character)}
      className="group relative bg-white border border-slate-200 hover:border-slate-400 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[270px] select-none hover:shadow-xs"
    >
      {/* Imagem de Cabeçalho (Foto Principal do Avatar) */}
      <div className="relative w-full h-32 bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
        {headingImage ? (
          <img
            src={headingImage}
            alt={characterName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-100 via-slate-50 to-slate-200 flex items-center justify-center">
            <User className="w-8 h-8 text-slate-400" />
          </div>
        )}

        {/* Gradiente de contraste no rodapé da imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        {/* Badges Flutuantes no Canto Inferior Esquerdo do Cabeçalho */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 z-10 flex-wrap">
          <span
            className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${getBadgeStyles(
              roleType
            )}`}
          >
            {roleType}
          </span>

          {refImagesCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 border border-white/50 shadow-2xs"
              title={`${refImagesCount} imagens de referência`}
            >
              <ImageIcon className="w-3 h-3 text-slate-600" />
              <span>{refImagesCount} ref</span>
            </span>
          )}
        </div>

        {/* Ações Flutuantes no Canto Superior Direito */}
        {onDelete && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
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
                  await onDelete(character.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-xs text-slate-700 hover:text-red-600 transition-all p-1.5 rounded-full hover:bg-white shadow-2xs cursor-pointer"
              title="Excluir personagem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal do Card */}
      <div className="p-4 pt-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold font-funnel text-slate-900 leading-tight group-hover:translate-x-0.5 transition-transform truncate">
            {characterName}
          </h3>

          {(character.character_age || character.age) && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
              <Cake className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {typeof (character.character_age || character.age) === "number" ||
                /^\d+$/.test(String(character.character_age || character.age).trim())
                  ? `${character.character_age || character.age} anos`
                  : character.character_age || character.age}
              </span>
            </div>
          )}

          <p className="text-xs text-slate-500 font-sans line-clamp-2 leading-relaxed mt-1.5">
            {character.summary && character.summary.trim()
              ? character.summary
              : "Nenhum resumo cadastrado para este personagem."}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Ficha de Personagem</span>
          <span className="group-hover:text-slate-900 transition-colors font-semibold">
            Editar Ficha &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
