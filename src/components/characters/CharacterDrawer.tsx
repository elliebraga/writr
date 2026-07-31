import React, { useState, useEffect, useRef } from "react";
import { X, User, Image as ImageIcon, Sparkles, Trash2, EyeOff, Flame, Heart, Compass, Camera, Upload, Calendar } from "lucide-react";
import type { Character, CharacterRoleType } from "../../types/character";
import Button from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";

interface CharacterDrawerProps {
  isOpen: boolean;
  characterToEdit?: Character | null;
  onClose: () => void;
  onSaveCharacter: (characterData: {
    id?: string;
    character_name: string;
    role_type: CharacterRoleType;
    character_sign?: string;
    character_personality?: string;
    character_motivations?: string;
    appearance?: string;
    secrets?: string;
    character_images?: string[];
    character_details?: string;
    summary?: string;
  }) => Promise<void> | void;
  onDeleteCharacter?: (characterId: string) => Promise<void> | void;
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

function parseDetails(rawDetails?: string | null) {
  if (!rawDetails) return { appearance: "", secrets: "", notes: "" };
  try {
    const parsed = JSON.parse(rawDetails);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        appearance: parsed.appearance || "",
        secrets: parsed.secrets || "",
        notes: parsed.notes || "",
      };
    }
  } catch (e) {
    // Se for texto simples
  }
  return { appearance: "", secrets: "", notes: rawDetails };
}

export const CharacterDrawer: React.FC<CharacterDrawerProps> = ({
  isOpen,
  characterToEdit,
  onClose,
  onSaveCharacter,
  onDeleteCharacter,
  onNavigateToTimeline,
}) => {
  const { showConfirm } = useDialog();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [characterName, setCharacterName] = useState("");
  const [roleType, setRoleType] = useState<CharacterRoleType>("Protagonista");
  const [imageUrl, setImageUrl] = useState("");
  const [characterSign, setCharacterSign] = useState("");
  const [personality, setPersonality] = useState("");
  const [appearance, setAppearance] = useState("");
  const [motivations, setMotivations] = useState("");
  const [secrets, setSecrets] = useState("");
  const [summary, setSummary] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterToEdit) {
      setCharacterName(characterToEdit.character_name || characterToEdit.name || "");
      setRoleType((characterToEdit.role_type as CharacterRoleType) || "Protagonista");
      
      const firstImg = characterToEdit.character_images && characterToEdit.character_images.length > 0
        ? characterToEdit.character_images[0]
        : characterToEdit.image_url || "";
      setImageUrl(firstImg);

      setCharacterSign(characterToEdit.character_sign || "");
      setPersonality(characterToEdit.character_personality || "");
      setMotivations(characterToEdit.character_motivations || "");

      const detailsObj = parseDetails(characterToEdit.character_details);
      setAppearance(characterToEdit.appearance || detailsObj.appearance);
      setSecrets(characterToEdit.secrets || detailsObj.secrets);
      setSummary(characterToEdit.summary || detailsObj.notes);
    } else {
      setCharacterName("");
      setRoleType("Protagonista");
      setImageUrl("");
      setCharacterSign("");
      setPersonality("");
      setAppearance("");
      setMotivations("");
      setSecrets("");
      setSummary("");
    }
    setError(null);
  }, [characterToEdit, isOpen]);

  if (!isOpen) return null;

  // Processa o arquivo selecionado localmente no computador
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem é muito grande. Escolha um arquivo de até 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        setImageUrl(base64String);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      });

      const imagesArray = imageUrl.trim() ? [imageUrl.trim()] : [];

      await onSaveCharacter({
        id: characterToEdit?.id,
        character_name: characterName.trim(),
        role_type: roleType,
        character_sign: characterSign.trim() || undefined,
        character_personality: personality.trim() || undefined,
        character_motivations: motivations.trim() || undefined,
        appearance: appearance.trim() || undefined,
        secrets: secrets.trim() || undefined,
        character_images: imagesArray,
        character_details: serializedDetails,
        summary: summary.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar ficha do personagem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!characterToEdit || !onDeleteCharacter) return;
    const currentName = characterToEdit.character_name || characterToEdit.name || "este personagem";
    
    const confirmed = await showConfirm(
      `Tem certeza que deseja excluir o personagem "${currentName}"?`,
      "Excluir Personagem",
      "Excluir",
      "Cancelar"
    );

    if (confirmed) {
      setIsSubmitting(true);
      try {
        await onDeleteCharacter(characterToEdit.id);
        onClose();
      } catch (err: any) {
        setError(err.message || "Erro ao excluir personagem.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop de Fundo */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Painel Lateral (Drawer Slide-Over) */}
      <aside className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
        <div className="w-screen max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 ease-out">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-funnel text-slate-900">
                  {characterToEdit ? "Ficha do Personagem" : "Novo Personagem"}
                </h3>
                <p className="text-base text-slate-500 font-sans">
                  {characterToEdit
                    ? "Edite todos os detalhes da ficha do personagem."
                    : "Preencha a ficha detalhada do novo personagem."}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Avatar Interativo com Upload do Computador */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Foto / Avatar do Personagem
              </label>
              <div className="flex items-center gap-4">
                {/* Botão Interativo do Avatar */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-slate-900 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  title="Clique para escolher uma imagem do seu computador"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  )}

                  {/* Overlay ao passar o mouse */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-full">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-semibold">Alterar</span>
                  </div>
                </div>

                {/* Campo de Upload e URL */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload do Computador</span>
                  </button>

                  <div className="relative">
                    <input
                      type="url"
                      placeholder="Ou cole uma URL da imagem..."
                      value={imageUrl.startsWith("data:") ? "" : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Nome do Personagem (Obrigatório) & Signo / Arquétipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome do Personagem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex: Elena Vance"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  <span>Signo / Arquétipo</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Áries / O Herói"
                  value={characterSign}
                  onChange={(e) => setCharacterSign(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            {/* Tipo de Personagem na História (Badges Pílula Selecionáveis) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Tipo de Personagem na História
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleType(r)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      roleType === r
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Aparência Física */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-slate-400" />
                <span>Aparência Física</span>
              </label>
              <textarea
                rows={3}
                placeholder="Altura, olhos, cabelos, vestimentas marcantes, cicatrizes ou postura..."
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white resize-none"
              />
            </div>

            {/* Motivações */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Motivações</span>
              </label>
              <textarea
                rows={3}
                placeholder="O que impulsiona o personagem? Desejos, objetivos principais ou forças motoras..."
                value={motivations}
                onChange={(e) => setMotivations(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white resize-none"
              />
            </div>

            {/* Segredos */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-purple-500" />
                <span>Segredos</span>
              </label>
              <textarea
                rows={3}
                placeholder="Segredos ocultos, passado misterioso, traumas não revelados ou medos profundos..."
                value={secrets}
                onChange={(e) => setSecrets(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white resize-none"
              />
            </div>

            {/* Personalidade */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Personalidade & Comportamento
              </label>
              <textarea
                rows={3}
                placeholder="Tracos de personalidade, modo de falar, virtudes, defeitos..."
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white resize-none"
              />
            </div>

            {/* Resumo Geral */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Resumo Geral / Apresentação Curta
              </label>
              <textarea
                rows={2}
                placeholder="Breve resumo síntese para exibição no card do personagem..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
              <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Imagens enviadas via upload são salvas na ficha do personagem no Supabase.</span>
            </div>
          </form>

          {/* Footer Fixo */}
          <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {characterToEdit && onNavigateToTimeline && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTimeline(characterToEdit.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Linha do Tempo</span>
                </button>
              )}

              {characterToEdit && onDeleteCharacter && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Salvar Ficha
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
