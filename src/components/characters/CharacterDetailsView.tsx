import React, { useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  User,
  Cake,
  Eye,
  Heart,
  Target,
  Key,
  Image as ImageIcon,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { Character } from "../../types/character";
import Button from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";

interface CharacterDetailsViewProps {
  character: Character;
  bookName: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: (characterId: string) => Promise<void> | void;
  onNavigateToTimeline?: (characterId: string) => void;
}

const getRoleBadgeStyles = (role?: string | null) => {
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

function parseCharacterData(char: Character) {
  let appearance = char.appearance || "";
  let secrets = char.secrets || "";
  let summary = char.summary || "";
  let age =
    char.character_age !== undefined && char.character_age !== null
      ? String(char.character_age)
      : char.age !== undefined && char.age !== null
      ? String(char.age)
      : "";
  let referenceImages: string[] = [];
  let notes = "";

  if (char.character_details) {
    try {
      const parsed = JSON.parse(char.character_details);
      if (typeof parsed === "object" && parsed !== null) {
        if (!appearance && parsed.appearance) appearance = parsed.appearance;
        if (!secrets && parsed.secrets) secrets = parsed.secrets;
        if (!summary && parsed.notes) summary = parsed.notes;
        if (!age && (parsed.age || parsed.character_age)) age = String(parsed.age || parsed.character_age);
        if (Array.isArray(parsed.reference_images)) referenceImages = parsed.reference_images;
        if (parsed.notes) notes = parsed.notes;
      }
    } catch (e) {}
  }

  if (
    referenceImages.length === 0 &&
    Array.isArray(char.character_images) &&
    char.character_images.length > 1
  ) {
    referenceImages = char.character_images.slice(1);
  }

  const mainImage =
    char.image_url ||
    (Array.isArray(char.character_images) && char.character_images.length > 0
      ? char.character_images[0]
      : null) ||
    char.header_url ||
    null;

  return {
    appearance,
    secrets,
    summary,
    age,
    referenceImages,
    notes,
    mainImage,
  };
}

export const CharacterDetailsView: React.FC<CharacterDetailsViewProps> = ({
  character,
  bookName,
  onBack,
  onEdit,
  onDelete,
  onNavigateToTimeline,
}) => {
  const { showConfirm } = useDialog();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const characterName = character.character_name || character.name || "Personagem sem nome";
  const roleType = character.role_type || "Protagonista";

  const {
    appearance,
    secrets,
    summary,
    age,
    referenceImages,
    mainImage,
  } = parseCharacterData(character);

  const personality = character.character_personality || "";
  const motivations = character.character_motivations || "";

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = await showConfirm(
      `Tem certeza que deseja excluir "${characterName}"? Esta ação removerá a ficha completa deste personagem.`,
      "Excluir Personagem",
      "Excluir",
      "Cancelar"
    );
    if (confirmed) {
      await onDelete(character.id);
      onBack();
    }
  };

  return (
    <div className="flex-1 bg-[#fcfbf9] min-h-screen flex flex-col font-sans select-none overflow-y-auto">
      
      {/* 1. Barra Superior de Navegação e Ações (Sticky Header) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
        
        {/* Esquerda: Botão Voltar + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl transition-all cursor-pointer shrink-0"
            title="Voltar para a lista de personagens"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
            <span className="truncate max-w-[120px] sm:max-w-[160px] text-neutral-500 font-medium">
              {bookName}
            </span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-neutral-500 font-medium">Elenco</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-neutral-900 font-semibold truncate">{characterName}</span>
          </div>
        </div>

        {/* Direita: Ações (Editar, Linha do Tempo, Excluir) */}
        <div className="flex items-center gap-2 shrink-0">
          {onNavigateToTimeline && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTimeline(character.id)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
              className="hidden md:flex !rounded-xl !text-xs !py-1.5"
            >
              Linha do Tempo
            </Button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Excluir Personagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Botão de Edição em Destaque Superior */}
          <Button
            variant="primary"
            size="sm"
            onClick={onEdit}
            leftIcon={<Edit3 className="w-4 h-4" />}
            className="!rounded-xl !text-xs !py-2 !px-4 shadow-sm"
          >
            Editar Ficha
          </Button>
        </div>
      </header>

      {/* 2. Container Central da Ficha */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Banner Hero do Personagem */}
        <section className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            
            {/* Foto Principal / Retrato */}
            <div className="relative group shrink-0 mx-auto md:mx-0">
              <div
                onClick={() => mainImage && setLightboxImage(mainImage)}
                className={`w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center shadow-xs transition-all ${
                  mainImage ? "cursor-zoom-in hover:shadow-md" : ""
                }`}
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={characterName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400 gap-2 p-4 text-center">
                    <User className="w-12 h-12 stroke-[1.5]" />
                    <span className="text-[11px] text-neutral-400">Sem foto principal</span>
                  </div>
                )}
              </div>

              {mainImage && (
                <div className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Informações Principais & Badges */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              <div>
                {/* Badges de Papel e Idade */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-2xs ${getRoleBadgeStyles(
                      roleType
                    )}`}
                  >
                    {roleType}
                  </span>

                  {age && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                      <Cake className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{age.includes("ano") ? age : `${age} anos`}</span>
                    </span>
                  )}
                </div>

                {/* Nome do Personagem */}
                <h1 className="text-3xl sm:text-4xl font-bold font-funnel text-neutral-900 tracking-tight mb-3">
                  {characterName}
                </h1>

                {/* Resumo / Conceito do Personagem */}
                {summary ? (
                  <p className="text-sm sm:text-base text-neutral-600 font-sans leading-relaxed italic border-l-2 border-neutral-300 pl-3.5 my-2">
                    "{summary}"
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 italic">
                    Nenhuma apresentação cadastrada ainda. Clique em Editar para adicionar um resumo.
                  </p>
                )}
              </div>

              {/* Botão de Atalho para Edição Rápida */}
              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>Criado em: {new Date(character.created_at).toLocaleDateString("pt-BR")}</span>
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar dados</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Grid de Fichas e Detalhes Literários */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Aparência Física & Estilo */}
          <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 text-neutral-900">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-funnel text-neutral-900">
                  Aparência Física & Estilo
                </h2>
              </div>

              {appearance ? (
                <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {appearance}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  Nenhuma descrição física adicionada. Altura, vestimenta, marcas registradas e traços visuais podem ser informados.
                </p>
              )}
            </div>

            {!appearance && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-4 text-xs font-semibold text-purple-600 hover:text-purple-700 text-left hover:underline cursor-pointer"
              >
                + Adicionar aparência física
              </button>
            )}
          </section>

          {/* Card: Personalidade & Psicologia */}
          <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 text-neutral-900">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-funnel text-neutral-900">
                  Personalidade & Psicologia
                </h2>
              </div>

              {personality ? (
                <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {personality}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  Nenhum traço de personalidade registrado. Descreva virtudes, defeitos, hábitos e comportamento sob pressão.
                </p>
              )}
            </div>

            {!personality && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 text-left hover:underline cursor-pointer"
              >
                + Adicionar traços de personalidade
              </button>
            )}
          </section>

          {/* Card: Motivações & Objetivos */}
          <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 text-neutral-900">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-funnel text-neutral-900">
                  Motivações & Objetivos
                </h2>
              </div>

              {motivations ? (
                <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {motivations}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  O que move esse personagem na trama? O que ele mais quer e o que mais teme perder?
                </p>
              )}
            </div>

            {!motivations && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 text-left hover:underline cursor-pointer"
              >
                + Adicionar motivações dramáticas
              </button>
            )}
          </section>

          {/* Card: Segredos & Fraquezas */}
          <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 text-neutral-900">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-funnel text-neutral-900">
                  Segredos & Fraquezas
                </h2>
              </div>

              {secrets ? (
                <p className="text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {secrets}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  Mistérios não revelados, dilemas morais, vulnerabilidades ou passados ocultos.
                </p>
              )}
            </div>

            {!secrets && (
              <button
                type="button"
                onClick={onEdit}
                className="mt-4 text-xs font-semibold text-slate-700 hover:text-slate-900 text-left hover:underline cursor-pointer"
              >
                + Adicionar segredos
              </button>
            )}
          </section>
        </div>

        {/* 4. Galeria de Referências Visuais (Moodboard / Figurinos) */}
        {referenceImages && referenceImages.length > 0 && (
          <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-funnel text-neutral-900">
                    Galeria de Referências Visuais
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {referenceImages.length} {referenceImages.length === 1 ? "imagem" : "imagens"} registradas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onEdit}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Gerenciar imagens
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {referenceImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(imgUrl)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 cursor-zoom-in hover:shadow-sm transition-all"
                >
                  <img
                    src={imgUrl}
                    alt={`Referência ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 5. Lightbox Modal para Ampliação de Imagens */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={lightboxImage}
            alt="Imagem ampliada"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
};
