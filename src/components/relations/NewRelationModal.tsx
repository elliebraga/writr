import React, { useState, useEffect } from "react";
import { X, Link2, Sparkles } from "lucide-react";
import type { Character } from "../../types/character";
import type { RelationPresetType } from "../../types/relation";
import Button from "../ui/Button";

interface NewRelationModalProps {
  isOpen: boolean;
  characters: Character[];
  defaultFromId?: string;
  defaultToId?: string;
  onClose: () => void;
  onCreateRelation: (relationData: {
    from_character_id: string;
    to_character_id: string;
    label: string;
    line_style?: "solid" | "dashed";
  }) => void;
}

const PRESET_RELATIONS: RelationPresetType[] = [
  "Aliados",
  "Inimigos",
  "Família",
  "Amor",
  "Mentor",
  "Rival",
  "Outro",
];

export const NewRelationModal: React.FC<NewRelationModalProps> = ({
  isOpen,
  characters,
  defaultFromId,
  defaultToId,
  onClose,
  onCreateRelation,
}) => {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [label, setLabel] = useState<string>("Aliados");
  const [customLabel, setCustomLabel] = useState("");
  const [lineStyle, setLineStyle] = useState<"solid" | "dashed">("solid");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromId(defaultFromId || (characters[0]?.id || ""));
      setToId(
        defaultToId ||
          (characters.find((c) => c.id !== (defaultFromId || characters[0]?.id))?.id || "")
      );
      setLabel("Aliados");
      setCustomLabel("");
      setLineStyle("solid");
      setError(null);
    }
  }, [isOpen, defaultFromId, defaultToId, characters]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) {
      setError("Selecione os dois personagens para conectar.");
      return;
    }

    if (fromId === toId) {
      setError("Selecione dois personagens diferentes.");
      return;
    }

    const finalLabel = label === "Outro" ? customLabel.trim() || "Conexão" : label;

    onCreateRelation({
      from_character_id: fromId,
      to_character_id: toId,
      label: finalLabel,
      line_style: lineStyle,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 z-50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">
                Criar Ligação entre Personagens
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Conecte dois membros do elenco com uma seta de relacionamento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Seleção de Origem e Destino */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                De (Origem)
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-full bg-white text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.character_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Para (Destino / Seta)
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-full bg-white text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.character_name || c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preset de Relacionamentos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tipo / Rótulo do Relacionamento
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_RELATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLabel(r)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    label === r
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {label === "Outro" && (
              <input
                type="text"
                placeholder="Ex: Mestre & Aprendiz, Cúmplices..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
              />
            )}
          </div>

          {/* Estilo da Linha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estilo da Linha de Conexão
            </label>
            <div className="grid grid-cols-2 gap-2 mb-1.5">
              <button
                type="button"
                onClick={() => setLineStyle("solid")}
                className={`py-1.5 px-3 rounded-full border text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  lineStyle === "solid"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                <span className="w-3 h-0.5 bg-current inline-block" />
                <span>Linha Contínua</span>
              </button>
              <button
                type="button"
                onClick={() => setLineStyle("dashed")}
                className={`py-1.5 px-3 rounded-full border text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  lineStyle === "dashed"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                <span className="w-3 h-0.5 border-b border-dashed border-current inline-block" />
                <span>Linha Pontilhada</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-sans">
              {lineStyle === "solid"
                ? "💡 Contínua: Ligação direta, oficial ou ativa (ex: Irmãos, Aliados, Inimigos)."
                : "💡 Pontilhada: Ligação secreta, incerta, temporária ou do passado (ex: Ex-casal, Aliança Secreta)."}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
            <span>A seta apontará do personagem de origem para o personagem de destino.</span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              Criar Conexão
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
