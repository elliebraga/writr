import React, { useState, useEffect } from "react";
import { Plus, Search, MapPin, Edit3, Trash2, Compass } from "lucide-react";
import type { Book } from "../../types/book";
import type { Character } from "../../types/character";
import type { Scenario } from "../../types/scenario";
import { scenarioService } from "../../services/scenarioService";
import { ScenarioDrawer } from "../../components/scenarios/ScenarioDrawer";
import Button from "../../components/ui/Button";

interface ScenarioFlowProps {
  activeBook: Book;
  characters: Character[];
}

export const ScenarioFlow: React.FC<ScenarioFlowProps> = ({ activeBook, characters }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("Todos");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  const loadScenarios = async () => {
    setIsLoading(true);
    try {
      const data = await scenarioService.getScenarios(activeBook.id);
      setScenarios(data);
    } catch (err) {
      console.error("Erro ao carregar cenários:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [activeBook.id]);

  const handleCreateNew = () => {
    setEditingScenario(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (scenarioId: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cenário "${name}"?`)) return;

    try {
      await scenarioService.deleteScenario(activeBook.id, scenarioId);
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    } catch (err) {
      console.error("Erro ao excluir cenário:", err);
    }
  };

  const handleSaveScenario = async (scenarioData: Partial<Scenario> & { name: string }) => {
    await scenarioService.saveScenario(activeBook.id, scenarioData);
    await loadScenarios();
  };


  // Filtragem de Cenários
  const filteredScenarios = scenarios.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.sensory_details && s.sensory_details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedTypeFilter === "Todos" || s.type === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  const availableTypes = [
    "Todos",
    "Cidade",
    "Edifício",
    "Reino / Região",
    "Floresta / Natureza",
    "Interior",
    "Fantástico / Mágico",
    "Outro",
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto select-none p-6 md:p-8">
      {/* Header da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
              Cenários & Locais da Obra
            </h1>
          </div>
          <p className="text-sm text-slate-600 font-sans max-w-xl">
            Mapeie reinos, edifícios, cidades e todos os locais marcantes da sua narrativa com referências visuais e personagens associados.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleCreateNew}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Novo Cenário
        </Button>
      </div>

      {/* Barra de Busca & Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cenário por nome ou descrição..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full text-slate-900 bg-white focus:outline-none focus:border-slate-900 transition-colors"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedTypeFilter === type
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal / Grid de Cenários */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-16 text-slate-600 text-sm">
          Carregando cenários...
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-funnel text-slate-900 mb-1">
            {searchTerm || selectedTypeFilter !== "Todos"
              ? "Nenhum cenário encontrado"
              : "Nenhum cenário cadastrado ainda"}
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            {searchTerm || selectedTypeFilter !== "Todos"
              ? "Tente mudar os termos da busca ou os filtros acima."
              : "Crie o primeiro cenário para mapear a geografia e atmosfera da sua história."}
          </p>
          {!searchTerm && selectedTypeFilter === "Todos" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Criar Primeiro Cenário
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredScenarios.map((scenario) => {
            const hasImages = scenario.images && scenario.images.length > 0;
            const coverImage = hasImages ? scenario.images![0] : null;

            // Encontrar os objetos completos dos personagens vinculados
            const linkedCharacters = characters.filter((c) =>
              scenario.associated_character_ids?.includes(c.id)
            );

            return (
              <div
                key={scenario.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Imagem de Capa do Cenário ou Banner Estilizado */}
                {coverImage ? (
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img
                      src={coverImage}
                      alt={scenario.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900 backdrop-blur-xs">
                      {scenario.type || "Local"}
                    </span>
                  </div>
                ) : (
                  <div className="h-28 bg-slate-900 p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-white/40">
                      <Compass className="w-8 h-8" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-white backdrop-blur-xs">
                        {scenario.type || "Local"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Corpo do Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold font-funnel text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                      {scenario.name}
                    </h3>

                    {scenario.description ? (
                      <p className="text-xs text-slate-600 font-sans line-clamp-3 leading-relaxed">
                        {scenario.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 italic">
                        Sem descrição cadastrada.
                      </p>
                    )}
                  </div>

                  {/* Detalhes Sensoriais (Snippet se houver) */}
                  {scenario.sensory_details && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-sans italic line-clamp-2">
                      ✨ {scenario.sensory_details}
                    </div>
                  )}

                  {/* Personagens no Local & Ações */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Avatares dos Personagens Vinculados */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      {linkedCharacters.length > 0 ? (
                        <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                          {linkedCharacters.slice(0, 4).map((char) => (
                            <div
                              key={char.id}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 shrink-0"
                              title={char.character_name}
                            >
                              {char.image_url ? (
                                <img
                                  src={char.image_url}
                                  alt={char.character_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-slate-700">
                                  {char.character_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))}
                          {linkedCharacters.length > 4 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white text-[9px] font-bold text-slate-600">
                              +{linkedCharacters.length - 4}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600">
                          Nenhum personagem vinculado
                        </span>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(scenario)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                        title="Editar Cenário"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(scenario.id, scenario.name)}
                        className="p-1.5 text-slate-600 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors"
                        title="Excluir Cenário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer de Edição / Criação */}
      <ScenarioDrawer
        isOpen={isDrawerOpen}
        scenario={editingScenario}
        characters={characters}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveScenario}
        onDelete={async (id) => {
          await handleDelete(id, editingScenario?.name || "");
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
};
