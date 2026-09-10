import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  EyeOff,
  Flame,
  Heart,
  Cake,
  Camera,
  Upload,
  Calendar,
  Plus,
  Maximize2,
  Link as LinkIcon,
} from "lucide-react";
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
    character_age?: string | number;
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
  if (!rawDetails) return { appearance: "", secrets: "", notes: "", reference_images: [], age: "" };
  try {
    const parsed = JSON.parse(rawDetails);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        appearance: parsed.appearance || "",
        secrets: parsed.secrets || "",
        notes: parsed.notes || "",
        age: parsed.age || parsed.character_age || "",
        reference_images: Array.isArray(parsed.reference_images) ? parsed.reference_images : [],
      };
    }
  } catch (e) {
    // Se for texto simples
  }
  return { appearance: "", secrets: "", notes: rawDetails, reference_images: [], age: "" };
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
  const refFileInputRef = useRef<HTMLInputElement | null>(null);

  const [characterName, setCharacterName] = useState("");
  const [roleType, setRoleType] = useState<CharacterRoleType>("Protagonista");
  const [imageUrl, setImageUrl] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [personality, setPersonality] = useState("");
  const [appearance, setAppearance] = useState("");
  const [motivations, setMotivations] = useState("");
  const [secrets, setSecrets] = useState("");
  const [summary, setSummary] = useState("");

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [refUrlInput, setRefUrlInput] = useState("");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterToEdit) {
      setCharacterName(characterToEdit.character_name || characterToEdit.name || "");
      setRoleType((characterToEdit.role_type as CharacterRoleType) || "Protagonista");

      const firstImg =
        characterToEdit.character_images && characterToEdit.character_images.length > 0
          ? characterToEdit.character_images[0]
          : characterToEdit.image_url || "";
      setImageUrl(firstImg);

      // Carrega imagens de referência adicionais (até 8)
      const detailsObj = parseDetails(characterToEdit.character_details);
      let refs: string[] = [];
      if (detailsObj.reference_images && detailsObj.reference_images.length > 0) {
        refs = detailsObj.reference_images;
      } else if (
        Array.isArray(characterToEdit.character_images) &&
        characterToEdit.character_images.length > 1
      ) {
        refs = characterToEdit.character_images.slice(1);
      }
      setReferenceImages(refs.slice(0, 8));

      const initialAge =
        characterToEdit.character_age !== undefined && characterToEdit.character_age !== null
          ? String(characterToEdit.character_age)
          : characterToEdit.age !== undefined && characterToEdit.age !== null
          ? String(characterToEdit.age)
          : detailsObj.age || "";
      setAge(initialAge);

      setPersonality(characterToEdit.character_personality || "");
      setMotivations(characterToEdit.character_motivations || "");

      setAppearance(characterToEdit.appearance || detailsObj.appearance);
      setSecrets(characterToEdit.secrets || detailsObj.secrets);
      setSummary(characterToEdit.summary || detailsObj.notes);
    } else {
      setCharacterName("");
      setRoleType("Protagonista");
      setImageUrl("");
      setReferenceImages([]);
      setAge("");
      setPersonality("");
      setAppearance("");
      setMotivations("");
      setSecrets("");
      setSummary("");
    }
    setShowUrlInput(false);
    setRefUrlInput("");
    setError(null);
  }, [characterToEdit, isOpen]);

  if (!isOpen) return null;

  // Utilitário para comprimir imagens pesadas antes de armazenar
  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsDataURL(file);
    });
  };

  // Processa o avatar principal
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file, 800, 800, 0.82);
      if (compressedBase64) {
        setImageUrl(compressedBase64);
        setError(null);
      }
    } catch (err) {
      setError("Erro ao processar imagem.");
    }
  };

  // Adiciona imagens de referência por arquivo (Upload)
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
        const compressedBase64 = await compressImage(file, 800, 800, 0.8);
        if (compressedBase64) {
          setReferenceImages((prev) => {
            if (prev.length >= 8) return prev;
            return [...prev, compressedBase64];
          });
          setError(null);
        }
      } catch (err) {}
    }

    if (refFileInputRef.current) refFileInputRef.current.value = "";
  };

  // Adiciona imagem de referência por URL
  const handleAddReferenceUrl = () => {
    if (!refUrlInput.trim()) return;
    if (referenceImages.length >= 8) {
      setError("Você já atingiu o limite máximo de 8 imagens de referência.");
      return;
    }

    setReferenceImages((prev) => [...prev, refUrlInput.trim()]);
    setRefUrlInput("");
    setShowUrlInput(false);
    setError(null);
  };

  // Remove uma imagem de referência específica
  const handleRemoveReferenceImage = (indexToRemove: number) => {
    setReferenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        role_type: roleType,
        age: age.trim(),
        reference_images: referenceImages,
      });

      const imagesArray = [
        ...(imageUrl.trim() ? [imageUrl.trim()] : []),
        ...referenceImages,
      ];

      await onSaveCharacter({
        id: characterToEdit?.id,
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
        <div className="w-screen md:w-[40vw] max-w-full md:max-w-none md:min-w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 ease-out">
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
                <p className="text-xs text-slate-500 font-sans">
                  {characterToEdit
                    ? "Edite os detalhes e imagens de referência."
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

            {/* Avatar Principal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Foto Principal / Cabeçalho do Card (Heading)
              </label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-slate-900 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  title="Clique para escolher a foto principal do computador"
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

                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-full">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-semibold">Alterar</span>
                  </div>
                </div>

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

            {/* SEÇÃO: Galeria de 8 Imagens de Referência */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <label className="text-xs font-bold text-slate-800 font-funnel">
                    Imagens de Referência
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {referenceImages.length} / 8
                  </span>
                </div>

                {referenceImages.length < 8 && (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={refFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddReferenceFiles}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => refFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      title="Adicionar fotos do computador"
                    >
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Upload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      title="Adicionar por Link URL"
                    >
                      <LinkIcon className="w-3 h-3 text-slate-500" />
                      <span>URL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Campo para colar URL de referência se acionado */}
              {showUrlInput && referenceImages.length < 8 && (
                <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                  <input
                    type="url"
                    placeholder="Cole a URL da imagem de referência..."
                    value={refUrlInput}
                    onChange={(e) => setRefUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddReferenceUrl();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddReferenceUrl}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Grid das Imagens de Referência */}
              <div className="grid grid-cols-4 gap-2.5">
                {referenceImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-400 transition-all"
                  >
                    <img
                      src={img}
                      alt={`Referência ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay de Ações ao passar o mouse */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewImage(img)}
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-full transition-transform hover:scale-105"
                        title="Ampliar Imagem"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveReferenceImage(idx)}
                        className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-105"
                        title="Remover Imagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Botão de Adição no Grid se houver espaço */}
                {referenceImages.length < 8 && (
                  <button
                    type="button"
                    onClick={() => refFileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                  >
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-semibold">Adicionar</span>
                  </button>
                )}
              </div>

              {referenceImages.length === 8 && (
                <p className="text-[11px] text-amber-600 font-medium mt-2">
                  Limite de 8 imagens de referência atingido.
                </p>
              )}
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
                  <Cake className="w-3.5 h-3.5 text-slate-400" />
                  <span>Idade</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 24 anos"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            {/* Tipo de Personagem na História */}
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
                placeholder="Altura, olhos, cabelos, vestimentas marcantes, cicatrizes..."
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
                placeholder="O que impulsiona o personagem? Desejos, objetivos principais..."
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
                placeholder="Segredos ocultos, passado misterioso, traumas não revelados..."
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
                placeholder="Traços de personalidade, modo de falar, virtudes, defeitos..."
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

      {/* Modal Lightbox de Preview da Imagem de Referência em Alta Resolução */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl">
            <img
              src={selectedPreviewImage}
              alt="Preview Referência"
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

