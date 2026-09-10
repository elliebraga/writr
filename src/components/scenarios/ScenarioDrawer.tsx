import React, { useState, useEffect } from "react";
import { X, MapPin, Image as ImageIcon, Users, Plus, Trash2, Check } from "lucide-react";
import type { Scenario, ScenarioType } from "../../types/scenario";
import type { Character } from "../../types/character";
import Button from "../ui/Button";


interface ScenarioDrawerProps {
  isOpen: boolean;
  scenario?: Scenario | null;
  characters: Character[];
  onClose: () => void;
  onSave: (scenarioData: Partial<Scenario> & { name: string }) => Promise<void> | void;
}

const SCENARIO_TYPES: ScenarioType[] = [
  "Cidade",
  "Edifício",
  "Reino / Região",
  "Floresta / Natureza",
  "Interior",
  "Fantástico / Mágico",
  "Outro",
];

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  scenario,
  characters,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<ScenarioType>("Outro");
  const [description, setDescription] = useState("");
  const [sensoryDetails, setSensoryDetails] = useState("");
  const [historyNotes, setHistoryNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [associatedCharacterIds, setAssociatedCharacterIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (scenario) {
      setName(scenario.name || "");
      setType((scenario.type as ScenarioType) || "Outro");
      setDescription(scenario.description || "");
      setSensoryDetails(scenario.sensory_details || "");
      setHistoryNotes(scenario.history_notes || "");
      setImages(scenario.images || []);
      setAssociatedCharacterIds(scenario.associated_character_ids || []);
    } else {
      setName("");
      setType("Cidade");
      setDescription("");
      setSensoryDetails("");
      setHistoryNotes("");
      setImages([]);
      setAssociatedCharacterIds([]);
    }
    setNewImageUrl("");
  }, [scenario, isOpen]);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    if (!images.includes(url)) {
      setImages((prev) => [...prev, url]);
    }
    setNewImageUrl("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const toggleCharacterAssociation = (charId: string) => {
    setAssociatedCharacterIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: scenario?.id,
        name: name.trim(),
        type,
        description: description.trim() || null,
        sensory_details: sensoryDetails.trim() || null,
        history_notes: historyNotes.trim() || null,
        images,
        associated_character_ids: associatedCharacterIds,
      });
      onClose();
    } catch (err) {
      console.error("Erro ao salvar cenário:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Slide-Over */}
      <aside className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10 z-50">
        <div className="w-screen md:w-[40vw] max-w-full md:max-w-none md:min-w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 ease-out">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-funnel text-slate-900">
                  {scenario ? "Editar Cenário" : "Novo Cenário / Local"}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Mapeie locais, referências visuais e personagens vinculados.
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

          {/* Form Content */}
          <form id="scenario-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Nome & Tipo */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Cenário / Local <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Castelo das Sombras, Taverna do Dragão..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 transition-colors font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Tipo de Local
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIO_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        type === t
                          ? "bg-slate-900 text-white font-semibold shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Descrição Visual e Atmosfera */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Visual e Atmosfera
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a arquitetura, cores principais, tamanho e sensação geral ao entrar neste local..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 transition-colors resize-y"
              />
            </div>

            {/* 3. Detalhes Sensoriais */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detalhes Sensoriais (Sons, Cheiros, Clima, Iluminação)
              </label>
              <textarea
                rows={2}
                value={sensoryDetails}
                onChange={(e) => setSensoryDetails(e.target.value)}
                placeholder="Ex: Cheiro forte de maresia e fumo de cachimbo. Som constante de ondas batendo na madeira..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 transition-colors resize-y"
              />
            </div>

            {/* 4. História & Notas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                História, Regras & Notas Especiais
              </label>
              <textarea
                rows={2}
                value={historyNotes}
                onChange={(e) => setHistoryNotes(e.target.value)}
                placeholder="Segredos do local, eventos históricos importantes ocorridos aqui ou regras mágicas/sociais..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900 transition-colors resize-y"
              />
            </div>

            {/* 5. Galeria de Imagens de Referência */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>Imagens de Referência (URLs)</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem-do-cenario.jpg"
                  className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:border-slate-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImage}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Adicionar
                </Button>
              </div>

              {/* Grid de Imagens Carregadas */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200"
                    >
                      <img
                        src={imgUrl}
                        alt={`Referência ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Personagens Vinculados ao Local */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Personagens Frequentes / Nativos deste Local</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {associatedCharacterIds.length} selecionado(s)
                </span>
              </label>

              {characters.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Nenhum personagem cadastrado nesta obra ainda. Crie personagens na aba "Personagens" para vinculá-los aqui.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {characters.map((char) => {
                    const isSelected = associatedCharacterIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => toggleCharacterAssociation(char.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white font-semibold shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {char.image_url ? (
                          <img
                            src={char.image_url}
                            alt={char.character_name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-700">
                            {char.character_name.charAt(0)}
                          </div>
                        )}
                        <span>{char.character_name}</span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              type="submit"
              form="scenario-form"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              {scenario ? "Salvar Alterações" : "Criar Cenário"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
};
