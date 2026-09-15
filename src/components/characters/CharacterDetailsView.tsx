import React, { useState, useEffect, useRef } from "react";
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
  Save,
  Upload,
} from "lucide-react";
import type { Character, CharacterRoleType, CharacterType } from "../../types/character";
import Button from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { characterService } from "../../services";

import { compressImageFile } from "../../utils/imageUtils";

interface CharacterDetailsViewProps {
  character: Character | null;
  isCreating?: boolean;
  bookName: string;
  onBack: () => void;
  onSave: (characterData: {
    id?: string;
    id_character_type?: string | null;
    character_name: string;
    role_type: CharacterRoleType;
    character_age?: string | number;
    character_personality?: string;
    character_motivations?: string;
    appearance?: string;
    secrets?: string;
    character_images?: string[];
    character_details?: string;
    summary?: string;
  }) => Promise<void> | void;
  onDelete?: (characterId: string) => Promise<void> | void;
  onNavigateToTimeline?: (characterId: string) => void;
}

const ROLE_OPTIONS: CharacterRoleType[] = [
  "Protagonista",
  "Antagonista",
  "Secundário",
  "Coadjuvante",
  "Mentor",
  "Outro",
];

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

function parseCharacterData(char?: Character | null) {
  if (!char) {
    return {
      appearance: "",
      secrets: "",
      summary: "",
      age: "",
      referenceImages: [],
      notes: "",
      mainImage: null,
    };
  }

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
  isCreating = false,
  bookName,
  onBack,
  onSave,
  onDelete,
  onNavigateToTimeline,
}) => {
  const { showConfirm } = useDialog();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refFileInputRef = useRef<HTMLInputElement | null>(null);

  // Modo de visualização vs Modo de edição
  const [isEditing, setIsEditing] = useState(isCreating);

  // Estados dos campos do formulário
  const [characterName, setCharacterName] = useState("");
  const [roleType, setRoleType] = useState<CharacterRoleType>("Protagonista");
  const [idCharacterType, setIdCharacterType] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<CharacterType[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [personality, setPersonality] = useState("");
  const [appearance, setAppearance] = useState("");
  const [motivations, setMotivations] = useState("");
  const [secrets, setSecrets] = useState("");
  const [summary, setSummary] = useState("");

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar catálogo de tipos de personagem do Supabase
  useEffect(() => {
    characterService.getCharacterTypes().then((types) => {
      if (types && types.length > 0) {
        setAvailableTypes(types);
      }
    });
  }, []);

  // Inicializa dados com base no personagem recebido
  useEffect(() => {
    if (character) {
      const parsed = parseCharacterData(character);
      setCharacterName(character.character_name || character.name || "");
      setRoleType((character.role_type as CharacterRoleType) || "Protagonista");
      setIdCharacterType(character.id_character_type || null);
      setImageUrl(parsed.mainImage || "");
      setReferenceImages(parsed.referenceImages.slice(0, 8));
      setAge(parsed.age || "");
      setPersonality(character.character_personality || "");
      setAppearance(parsed.appearance || "");
      setMotivations(character.character_motivations || "");
      setSecrets(parsed.secrets || "");
      setSummary(parsed.summary || "");
      setIsEditing(isCreating);
    } else {
      setCharacterName("");
      setRoleType("Protagonista");
      setIdCharacterType(null);
      setImageUrl("");
      setReferenceImages([]);
      setAge("");
      setPersonality("");
      setAppearance("");
      setMotivations("");
      setSecrets("");
      setSummary("");
      setIsEditing(true);
    }
    setError(null);
  }, [character, isCreating]);

  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 800, 800, 0.82);
      if (compressed) {
        setImageUrl(compressed);
        setError(null);
      }
    } catch {
      setError("Erro ao processar imagem.");
    }
  };

  const handleAddReferenceFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (referenceImages.length >= 8) {
      setError("Você já atingiu o limite máximo de 8 imagens de referência.");
      return;
    }

    const spaceLeft = 8 - referenceImages.length;
    const filesToProcess = files.slice(0, spaceLeft);

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.8);
        if (compressed) {
          setReferenceImages((prev) => {
            if (prev.length >= 8) return prev;
            return [...prev, compressed];
          });
          setError(null);
        }
      } catch {}
    }
  };

  const handleRemoveReferenceImage = (indexToRemove: number) => {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!characterName.trim()) {
      setError("O nome do personagem é obrigatório.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const serializedDetails = JSON.stringify({
        appearance: appearance.trim(),
        secrets: secrets.trim(),
        notes: summary.trim(),
        role_type: roleType,
        age: age.trim(),
        reference_images: referenceImages,
      });

      const imagesArray = [
        ...(imageUrl.trim() ? [imageUrl.trim()] : []),
        ...referenceImages,
      ];

      const finalTypeId =
        idCharacterType ||
        availableTypes.find((t) => t.tipo.toLowerCase() === roleType.toLowerCase())?.id ||
        null;

      await onSave({
        id: character?.id,
        id_character_type: finalTypeId,
        character_name: characterName.trim(),
        role_type: roleType,
        character_age: age.trim() || undefined,
        character_personality: personality.trim() || undefined,
        character_motivations: motivations.trim() || undefined,
        appearance: appearance.trim() || undefined,
        secrets: secrets.trim() || undefined,
        character_images: imagesArray,
        character_details: serializedDetails,
        summary: summary.trim() || undefined,
      });

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar ficha do personagem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!character || !onDelete) return;
    const currentName = character.character_name || character.name || "este personagem";

    const confirmed = await showConfirm(
      `Tem certeza que deseja excluir "${currentName}"? Esta ação removerá a ficha completa deste personagem.`,
      "Excluir Personagem",
      "Excluir",
      "Cancelar"
    );

    if (confirmed) {
      await onDelete(character.id);
      onBack();
    }
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      onBack();
    } else {
      // Restaura dados originais do personagem e sai do modo de edição
      if (character) {
        const parsed = parseCharacterData(character);
        setCharacterName(character.character_name || character.name || "");
        setRoleType((character.role_type as CharacterRoleType) || "Protagonista");
        setImageUrl(parsed.mainImage || "");
        setReferenceImages(parsed.referenceImages.slice(0, 8));
        setAge(parsed.age || "");
        setPersonality(character.character_personality || "");
        setAppearance(parsed.appearance || "");
        setMotivations(character.character_motivations || "");
        setSecrets(parsed.secrets || "");
        setSummary(parsed.summary || "");
      }
      setIsEditing(false);
      setError(null);
    }
  };

  const displayName = characterName.trim() || (isCreating ? "Novo Personagem" : "Personagem sem nome");

  return (
    <div className="flex-1 bg-[#fcfbf9] min-h-screen flex flex-col font-sans select-none overflow-y-auto">
      
      {/* Inputs Ocultos de Upload de Arquivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMainFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={refFileInputRef}
        onChange={handleAddReferenceFiles}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* 1. Barra Superior de Navegação e Ações (Sticky Header) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all shadow-2xs">
        
        {/* Esquerda: Botão Voltar + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={isEditing && isCreating ? onBack : isEditing ? handleCancelEdit : onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl transition-all cursor-pointer shrink-0"
            title={isEditing ? "Cancelar edição" : "Voltar para o elenco"}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isEditing ? "Cancelar" : "Voltar"}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
            <span className="truncate max-w-[120px] sm:max-w-[160px] text-neutral-500 font-medium">
              {bookName}
            </span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-neutral-500 font-medium">Elenco</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-neutral-900 font-semibold truncate">{displayName}</span>
            {isEditing && (
              <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200/60 uppercase tracking-wider">
                {isCreating ? "Novo" : "Editando"}
              </span>
            )}
          </div>
        </div>

        {/* Direita: Ações (Salvar / Cancelar / Editar / Linha do Tempo / Excluir) */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="!rounded-xl !text-xs !py-2 !px-3.5"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveSubmit()}
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
                className="!rounded-xl !text-xs !py-2 !px-4 shadow-sm"
              >
                {isCreating ? "Criar Personagem" : "Salvar Alterações"}
              </Button>
            </>
          ) : (
            <>
              {character && onNavigateToTimeline && (
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

              {character && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Excluir Personagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit3 className="w-4 h-4" />}
                className="!rounded-xl !text-xs !py-2 !px-4 shadow-sm"
              >
                Editar Ficha
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Banner de Erro Global */}
      {error && (
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 mt-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Container Central da Página */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        
        {/* ========================================================================= */}
        {/* MODO DE EDIÇÃO / PREENCHIMENTO NA PÁGINA */}
        {/* ========================================================================= */}
        {isEditing ? (
          <form onSubmit={handleSaveSubmit} className="space-y-8">
            
            {/* Hero Card de Edição: Foto Principal + Identificação */}
            <section className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                
                {/* Gestão do Retrato / Foto Principal */}
                <div className="w-full md:w-48 shrink-0 flex flex-col items-center gap-3">
                  <div className="relative group w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-neutral-400 bg-neutral-50 flex items-center justify-center transition-all shadow-2xs">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt="Foto Principal"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white/90 hover:bg-white text-neutral-800 rounded-xl transition-all shadow-sm cursor-pointer"
                            title="Trocar Foto"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-sm cursor-pointer"
                            title="Remover Foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center text-neutral-400 gap-2 p-4 text-center cursor-pointer hover:text-neutral-600 w-full h-full"
                      >
                        <User className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs font-semibold text-neutral-600">Adicionar Foto</span>
                        <span className="text-[10px] text-neutral-400 leading-tight">
                          PNG, JPG ou WEBP
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ações de Foto: Upload nativo */}
                  <div className="flex items-center gap-2 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageUrl ? "Trocar Foto" : "Enviar do Computador/Celular"}</span>
                    </button>

                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Campos Principais: Nome, Papel Dramático, Idade, Resumo */}
                <div className="flex-1 w-full space-y-5">
                  
                  {/* Nome do Personagem */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Nome do Personagem <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus={isCreating}
                      placeholder="Ex: Clara Albuquerque, Victor Vance..."
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      className="w-full text-xl sm:text-2xl font-bold font-funnel text-neutral-900 px-4 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Papel Dramático */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                        Papel Dramático
                      </label>
                      <select
                        value={roleType}
                        onChange={(e) => setRoleType(e.target.value as CharacterRoleType)}
                        className="w-full text-xs font-semibold text-neutral-800 px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Idade */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                        Idade / Fase da Vida
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 28 anos, Jovem Adulto..."
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full text-xs font-medium text-neutral-800 px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* Resumo / Apresentação Curta */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Resumo ou Frase de Apresentação
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Uma detetive experiente com intuição aguçada, assombrada por um caso não resolvido..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full text-xs sm:text-sm text-neutral-800 px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-2xl focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Grid de Seções Literárias da Ficha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Aparência Física & Estilo */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-neutral-900">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-funnel text-neutral-900">
                      Aparência Física & Estilo
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Altura, cabelos, roupas marcantes, postura, cicatrizes
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Descreva os traços visuais do personagem..."
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className="w-full text-xs sm:text-sm text-neutral-800 p-3 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Personalidade & Psicologia */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-neutral-900">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-funnel text-neutral-900">
                      Personalidade & Psicologia
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Virtudes, defeitos, manias, comportamento sob pressão
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Descreva o temperamento e padrões psicológicos..."
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="w-full text-xs sm:text-sm text-neutral-800 p-3 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Motivações & Objetivos */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-neutral-900">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-funnel text-neutral-900">
                      Motivações & Objetivos
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      O que quer alcançar na trama, o que mais teme perder
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Descreva o que move o personagem na história..."
                  value={motivations}
                  onChange={(e) => setMotivations(e.target.value)}
                  className="w-full text-xs sm:text-sm text-neutral-800 p-3 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Segredos & Fraquezas */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-neutral-900">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-funnel text-neutral-900">
                      Segredos & Fraquezas
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Dilemas morais, mistérios ocultos, vulnerabilidades
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Descreva segredos ou vulnerabilidades..."
                  value={secrets}
                  onChange={(e) => setSecrets(e.target.value)}
                  className="w-full text-xs sm:text-sm text-neutral-800 p-3 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Galeria de Referências Visuais (Moodboard) */}
            <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-funnel text-neutral-900">
                      Galeria de Referências Visuais
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Moodboard de figurinos, acessórios e referências ({referenceImages.length}/8)
                    </p>
                  </div>
                </div>

                {/* Botão para Adicionar Referências do Dispositivo */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={referenceImages.length >= 8}
                    onClick={() => refFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Fotos (Computador / Celular)</span>
                  </button>
                </div>
              </div>

              {/* Grade de Miniaturas */}
              {referenceImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {referenceImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100"
                    >
                      <img
                        src={imgUrl}
                        alt={`Referência ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(imgUrl)}
                          className="p-1.5 bg-white/90 hover:bg-white text-neutral-800 rounded-lg transition-all cursor-pointer"
                          title="Visualizar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveReferenceImage(idx)}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => refFileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50/50 transition-all text-neutral-400 gap-1.5"
                >
                  <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-xs font-medium text-neutral-600">
                    Nenhuma foto de referência adicionada
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Clique para enviar referências de figurino, arte ou cenários
                  </span>
                </div>
              )}
            </section>

            {/* Barra Inferior Fixa ou Flutuante para Salvar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="!rounded-xl !text-xs !px-5"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
                className="!rounded-xl !text-xs !px-6 shadow-sm"
              >
                {isCreating ? "Criar Personagem" : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        ) : (
          
          /* ========================================================================= */
          /* MODO DE VISUALIZAÇÃO ELEGANTE DA FICHA */
          /* ========================================================================= */
          <>
            {/* Banner Hero do Personagem */}
            <section className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                
                {/* Foto Principal / Retrato */}
                <div className="relative group shrink-0 mx-auto md:mx-0">
                  <div
                    onClick={() => imageUrl && setLightboxImage(imageUrl)}
                    className={`w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center shadow-xs transition-all ${
                      imageUrl ? "cursor-zoom-in hover:shadow-md" : ""
                    }`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
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

                  {imageUrl && (
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
                      {displayName}
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

                  {/* Rodapé do Hero */}
                  <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {character?.created_at
                        ? `Criado em: ${new Date(character.created_at).toLocaleDateString("pt-BR")}`
                        : "Ficha criada recentemente"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar dados</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Grid de Fichas e Detalhes Literários */}
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
                    onClick={() => setIsEditing(true)}
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
                    onClick={() => setIsEditing(true)}
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
                    onClick={() => setIsEditing(true)}
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
                    onClick={() => setIsEditing(true)}
                    className="mt-4 text-xs font-semibold text-slate-700 hover:text-slate-900 text-left hover:underline cursor-pointer"
                  >
                    + Adicionar segredos
                  </button>
                )}
              </section>
            </div>

            {/* Galeria de Referências Visuais (Moodboard) */}
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
                    onClick={() => setIsEditing(true)}
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
          </>
        )}
      </main>

      {/* 3. Lightbox Modal para Ampliação de Imagens */}
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
