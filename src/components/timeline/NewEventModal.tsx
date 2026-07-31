import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, FileText, Sparkles } from "lucide-react";
import type { Character } from "../../types/character";
import type { TimelineEvent } from "../../types/timeline";
import Button from "../ui/Button";

interface NewEventModalProps {
  isOpen: boolean;
  characters: Character[];
  eventToEdit?: TimelineEvent | null;
  defaultCharacterId?: string | null;
  onClose: () => void;
  onSave: (eventData: {
    id?: string;
    id_character?: string | null;
    event_date: string;
    location: string;
    description: string;
  }) => void;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  characters,
  eventToEdit,
  defaultCharacterId,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [characterId, setCharacterId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setDate(eventToEdit.event_date);
        setLocation(eventToEdit.location);
        setDescription(eventToEdit.description);
        setCharacterId(eventToEdit.id_character || "");
      } else {
        setDate("");
        setLocation("");
        setDescription("");
        setCharacterId(defaultCharacterId || "");
      }
      setError(null);
    }
  }, [isOpen, eventToEdit, defaultCharacterId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim()) {
      setError("Insira a data ou período do evento.");
      return;
    }
    if (!location.trim()) {
      setError("Insira o local do evento.");
      return;
    }
    if (!description.trim()) {
      setError("Descreva o acontecimento.");
      return;
    }

    onSave({
      id: eventToEdit?.id,
      id_character: characterId === "" ? null : characterId,
      event_date: date.trim(),
      location: location.trim(),
      description: description.trim(),
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
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">
                {eventToEdit ? "Editar Evento" : "Criar Novo Evento"}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Adicione um marco temporal na história do seu livro.
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Data / Época */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Data / Período Histórico</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Ano 243 d.C., Inverno de 1890, Infância"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* Localização */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Local do Acontecimento</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Reino de Valíria, Floresta Negra, Casa dos Tios"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-full focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* Acontecimento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Acontecimento / Descrição</span>
            </label>
            <textarea
              rows={3}
              placeholder="Descreva detalhadamente o que ocorreu nesta data e local..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white leading-relaxed resize-none"
            />
          </div>

          {/* Associação com Personagem */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vincular a um Personagem (Opcional)
            </label>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-full bg-white text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="">Nenhum (Evento Geral da História)</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.character_name || c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Eventos vinculados ajudam a construir a jornada individual de cada personagem.</span>
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
              {eventToEdit ? "Salvar Alterações" : "Adicionar Evento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
