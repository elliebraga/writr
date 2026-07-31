import React, { useState, useEffect } from "react";
import { Plus, Calendar, MapPin, Trash2, Edit2, User, Filter } from "lucide-react";
import type { Book } from "../../types/book";
import type { Character } from "../../types/character";
import type { TimelineEvent } from "../../types/timeline";
import { characterService, timelineService } from "../../services";
import { NewEventModal } from "../../components/timeline/NewEventModal";
import { useDialog } from "../../components/ui/DialogProvider";
import Button from "../../components/ui/Button";
import { ensureValidUuid } from "../../utils/uuidUtils";

interface TimelineFlowProps {
  activeBook: Book;
  initialCharacterFilter?: string | null;
  onClearInitialFilter?: () => void;
}

export const TimelineFlow: React.FC<TimelineFlowProps> = ({
  activeBook,
  initialCharacterFilter,
  onClearInitialFilter,
}) => {
  const safeBookId = ensureValidUuid(activeBook.id);
  const { showConfirm } = useDialog();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtro de personagem selecionado
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    initialCharacterFilter || "all"
  );

  // Estado dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Carregar dados de personagens e eventos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const chars = await characterService.getCharacters(safeBookId);
        setCharacters(chars);

        const evs = await timelineService.getEvents(safeBookId);
        setEvents(evs);
      } catch (err) {
        console.error("Erro ao carregar dados da timeline:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [safeBookId]);

  // Se o filtro inicial mudar lá no pai, atualiza aqui
  useEffect(() => {
    if (initialCharacterFilter !== undefined) {
      setSelectedCharacterId(initialCharacterFilter || "all");
    }
  }, [initialCharacterFilter]);

  // Salvar evento (Criar ou Editar)
  const handleSaveEvent = async (eventData: {
    id?: string;
    id_character?: string | null;
    event_date: string;
    location: string;
    description: string;
  }) => {
    const saved = await timelineService.saveEvent(safeBookId, eventData);
    
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id || (eventData.id && e.id === eventData.id));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      } else {
        return [...prev, saved];
      }
    });

    setEditingEvent(null);
  };

  // Excluir evento
  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = await showConfirm(
      "Tem certeza que deseja excluir este evento da linha do tempo?",
      "Excluir Evento",
      "Excluir",
      "Cancelar"
    );

    if (confirmed) {
      const success = await timelineService.deleteEvent(safeBookId, eventId);
      if (success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    }
  };

  // Filtrar eventos de acordo com a seleção
  const filteredEvents = events.filter((e) => {
    if (selectedCharacterId === "all") return true;
    if (selectedCharacterId === "general") return !e.id_character;
    return e.id_character === selectedCharacterId;
  });

  // Encontrar nome do personagem pelo ID
  const getCharacterName = (charId?: string | null) => {
    if (!charId) return null;
    const char = characters.find((c) => c.id === charId);
    return char ? char.character_name || char.name : "Personagem";
  };

  // Encontrar avatar do personagem pelo ID
  const getCharacterAvatar = (charId?: string | null) => {
    if (!charId) return null;
    const char = characters.find((c) => c.id === charId);
    return char?.image_url || null;
  };

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header & Actions */}
      <div className="px-8 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white z-20 shrink-0">
        <div>
          <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-900" />
            <span>Linha do Tempo</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Visualize e ordene os marcos históricos e acontecimentos da sua narrativa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Filtro de Personagem */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCharacterId}
              onChange={(e) => {
                setSelectedCharacterId(e.target.value);
                if (e.target.value === "all" && onClearInitialFilter) {
                  onClearInitialFilter();
                }
              }}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Eventos</option>
              <option value="general">História Geral</option>
              <optgroup label="Personagens">
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.character_name || c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingEvent(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Main Whiteboard Canvas */}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] relative p-8 md:p-12">
        {isLoading ? (
          <div className="text-xs text-slate-400 py-16 text-center h-full flex items-center justify-center">
            Carregando linha do tempo...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs mt-8">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold font-funnel text-slate-900 tracking-tight mb-1">
              Nenhum evento registrado
            </h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed mb-5">
              {selectedCharacterId === "all"
                ? "Comece a traçar os acontecimentos cronológicos da sua história criando o primeiro evento."
                : "Não há eventos registrados para este filtro. Crie um evento associado a este perfil."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Criar Evento
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto relative pl-6 md:pl-10">
            {/* Linha Vertical da Time-axis */}
            <div className="absolute left-1.5 md:left-2 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-200" />

            {/* Loop nos eventos */}
            <div className="space-y-8">
              {filteredEvents.map((event) => {
                const isGeneral = !event.id_character;
                const charName = getCharacterName(event.id_character);
                const charAvatar = getCharacterAvatar(event.id_character);

                return (
                  <div key={event.id} className="relative group/item animate-in fade-in duration-200">
                    {/* Indicador / Bullet na linha do tempo */}
                    <div className={`absolute -left-[23px] md:-left-[39px] top-4 w-4 h-4 rounded-full border-2 bg-white transition-transform group-hover/item:scale-125 z-10 ${
                      isGeneral ? "border-slate-900" : "border-indigo-600"
                    }`} />

                    {/* Card de Evento */}
                    <div className="bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-xs relative">
                      {/* Ações (Editar/Excluir) */}
                      <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(event);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                          title="Editar evento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                          title="Excluir evento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Header do Card */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {/* Data / Época */}
                        <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-200 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
                          {event.event_date}
                        </span>

                        {/* Localização */}
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{event.location}</span>
                        </span>
                      </div>

                      {/* Acontecimento */}
                      <p className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line pr-10">
                        {event.description}
                      </p>

                      {/* Tag do Personagem Associado */}
                      {!isGeneral && charName && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded-full px-2 py-0.5">
                            {charAvatar ? (
                              <img
                                src={charAvatar}
                                alt={charName}
                                className="w-3 h-3 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-3 h-3 text-indigo-500" />
                            )}
                            <span>{charName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Evento */}
      <NewEventModal
        isOpen={isModalOpen}
        characters={characters}
        eventToEdit={editingEvent}
        defaultCharacterId={
          selectedCharacterId !== "all" && selectedCharacterId !== "general"
            ? selectedCharacterId
            : null
        }
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />
    </div>
  );
};
