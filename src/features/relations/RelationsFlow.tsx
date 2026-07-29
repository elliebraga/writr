import React, { useState, useEffect, useRef } from "react";
import { Share2, Plus, Sparkles, RefreshCw, Trash2, ZoomIn, ZoomOut, Maximize2, Users, GripHorizontal, User } from "lucide-react";
import type { Book } from "../../types/book";
import type { Character } from "../../types/character";
import type { CharacterRelationLink, NodePosition, RelationsData } from "../../types/relation";
import { RelationNodeCard, CARD_WIDTH, CARD_HEIGHT } from "../../components/relations/RelationNodeCard";
import { RelationLinkLayer } from "../../components/relations/RelationLinkLayer";
import { NewRelationModal } from "../../components/relations/NewRelationModal";
import { supabase } from "../../supabaseClient";
import Button from "../../components/ui/Button";
import { ensureValidUuid } from "../../utils/uuidUtils";

interface RelationsFlowProps {
  activeBook: Book;
  onNavigateToCharacters?: () => void;
}

export const RelationsFlow: React.FC<RelationsFlowProps> = ({
  activeBook,
  onNavigateToCharacters,
}) => {
  const safeBookId = ensureValidUuid(activeBook.id);
  const localStorageKey = `writr_relations_${safeBookId}`;
  const charStorageKey = `writr_characters_${safeBookId}`;

  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem(charStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [relationsData, setRelationsData] = useState<RelationsData>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : { nodes: {}, links: [] };
    } catch (e) {
      return { nodes: {}, links: [] };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | undefined>(undefined);

  // Controle de arraste de nós
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingCharId, setDraggingCharId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Salva no localStorage sempre que as relações mudarem
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(relationsData));
    } catch (e) {
      console.error("Erro ao salvar relações no localStorage:", e);
    }
  }, [relationsData, localStorageKey]);

  useEffect(() => {
    fetchCharactersAndRelations();
  }, [safeBookId]);

  // Carrega personagens e conexões do Supabase + localStorage
  const fetchCharactersAndRelations = async () => {
    try {
      // 1. Carrega Personagens
      const { data: charData, error: charError } = await supabase
        .from("characters")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      let loadedChars = characters;
      if (!charError && charData && charData.length > 0) {
        loadedChars = charData.map((c: any) => ({
          ...c,
          id: ensureValidUuid(c.id),
          character_name: c.character_name || c.name || "Personagem",
          name: c.character_name || c.name || "Personagem",
          image_url: c.character_images && c.character_images.length > 0 ? c.character_images[0] : c.image_url,
        }));
        setCharacters(loadedChars);
      }

      // 2. Carrega Conexões de Relacionamentos do Supabase
      const { data: relData, error: relError } = await supabase
        .from("relationships")
        .select("*")
        .eq("id_book", safeBookId);

      if (!relError && relData && relData.length > 0) {
        const remoteLinks: CharacterRelationLink[] = relData.map((r: any) => ({
          id: ensureValidUuid(r.id),
          from_character_id: ensureValidUuid(r.from_character_id || r.id_character_from),
          to_character_id: ensureValidUuid(r.to_character_id || r.id_character_to),
          label: r.label || r.relationship_type || "Conexão",
          description: r.description || undefined,
          line_style: r.line_style || "solid",
          created_at: r.created_at,
        }));

        setRelationsData((prev) => {
          const map = new Map<string, CharacterRelationLink>();
          prev.links.forEach((l) => map.set(l.id, l));
          remoteLinks.forEach((l) => map.set(l.id, l));
          const mergedLinks = Array.from(map.values());
          return { ...prev, links: mergedLinks };
        });
      }

      autoLayoutNodesIfNeeded(loadedChars);
    } catch (err) {
      if (characters.length > 0) {
        autoLayoutNodesIfNeeded(characters);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Posiciona automaticamente os personagens no canvas se não tiverem posições gravadas
  const autoLayoutNodesIfNeeded = (charList: Character[]) => {
    setRelationsData((prev) => {
      const updatedNodes = { ...prev.nodes };
      let changed = false;

      const cols = Math.ceil(Math.sqrt(charList.length));
      const startX = 60;
      const startY = 80;
      const spacingX = CARD_WIDTH + 60;
      const spacingY = CARD_HEIGHT + 70;

      charList.forEach((char, index) => {
        if (!updatedNodes[char.id]) {
          const col = index % cols;
          const row = Math.floor(index / cols);
          updatedNodes[char.id] = {
            x: startX + col * spacingX,
            y: startY + row * spacingY,
          };
          changed = true;
        }
      });

      return changed ? { ...prev, nodes: updatedNodes } : prev;
    });
  };

  // Arranjar nós no Canvas em Layout Automático (Matriz/Grade Organizada)
  const handleAutoLayout = () => {
    if (characters.length === 0) return;
    const updatedNodes: Record<string, NodePosition> = {};
    const cols = Math.ceil(Math.sqrt(characters.length));
    const startX = 80;
    const startY = 80;
    const spacingX = CARD_WIDTH + 80;
    const spacingY = CARD_HEIGHT + 80;

    characters.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      updatedNodes[char.id] = {
        x: startX + col * spacingX,
        y: startY + row * spacingY,
      };
    });

    setRelationsData((prev) => ({
      ...prev,
      nodes: updatedNodes,
    }));
  };

  // Adicionar ou focar personagem ao clicar na barra horizontal
  const handleAddOrFocusCharacterOnCanvas = (charId: string) => {
    setRelationsData((prev) => {
      if (prev.nodes[charId]) return prev;
      const count = Object.keys(prev.nodes).length;
      const newX = 80 + (count % 3) * (CARD_WIDTH + 60);
      const newY = 80 + Math.floor(count / 3) * (CARD_HEIGHT + 60);
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [charId]: { x: newX, y: newY },
        },
      };
    });
  };

  // Início do arraste do nó no Canvas
  const handleDragStart = (characterId: string, e: React.MouseEvent) => {
    const currentPos = relationsData.nodes[characterId] || { x: 100, y: 100 };
    setDraggingCharId(characterId);
    dragOffsetRef.current = {
      x: e.clientX / zoomLevel - currentPos.x,
      y: e.clientY / zoomLevel - currentPos.y,
    };
  };

  // Movimento de arraste no Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingCharId) return;
    const newX = Math.max(20, Math.round(e.clientX / zoomLevel - dragOffsetRef.current.x));
    const newY = Math.max(20, Math.round(e.clientY / zoomLevel - dragOffsetRef.current.y));

    setRelationsData((prev) => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [draggingCharId]: { x: newX, y: newY },
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggingCharId(null);
  };

  // Criar nova conexão no localStorage e sincronizar no Supabase
  const handleCreateRelation = async (relationData: {
    from_character_id: string;
    to_character_id: string;
    label: string;
    description?: string;
    line_style?: "solid" | "dashed";
  }) => {
    const generatedId = ensureValidUuid();

    const newLink: CharacterRelationLink = {
      id: generatedId,
      from_character_id: relationData.from_character_id,
      to_character_id: relationData.to_character_id,
      label: relationData.label,
      description: relationData.description,
      line_style: relationData.line_style || "solid",
      created_at: new Date().toISOString(),
    };

    // 1. Atualização instantânea no estado e localStorage
    setRelationsData((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));

    // 2. Sincronização no Supabase
    try {
      const payload: any = {
        id: generatedId,
        id_book: safeBookId,
        character_id: relationData.from_character_id,
        related_character_id: relationData.to_character_id,
        from_character_id: relationData.from_character_id,
        to_character_id: relationData.to_character_id,
        label: relationData.label,
        description: relationData.description || null,
        line_style: relationData.line_style || "solid",
      };

      const { data, error } = await supabase
        .from("relationships")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.log("Conexão mantida localmente (Supabase pendente):", error.message);
      } else if (data) {
        newLink.id = data.id;
      }
    } catch (err) {
      console.log("Conexão salva no armazenamento local.");
    }
  };

  // Excluir uma conexão do localStorage e Supabase
  const handleDeleteLink = async (linkId: string) => {
    const safeLinkId = ensureValidUuid(linkId);

    setRelationsData((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId && l.id !== safeLinkId),
    }));

    try {
      await supabase.from("relationships").delete().eq("id", safeLinkId);
    } catch (err) {
      console.log("Removido localmente.");
    }
  };

  // Limpar todas as ligações
  const handleClearAllLinks = async () => {
    if (confirm("Deseja remover todas as setas de ligação do whiteboard?")) {
      setRelationsData((prev) => ({
        ...prev,
        links: [],
      }));

      try {
        await supabase.from("relationships").delete().eq("id_book", safeBookId);
      } catch (err) {
        console.log("Ligações removidas localmente.");
      }
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col font-sans select-none overflow-hidden">
      
      {/* Modal Nova Ligação */}
      <NewRelationModal
        isOpen={isModalOpen}
        characters={characters}
        defaultFromId={connectFromId}
        onClose={() => {
          setIsModalOpen(false);
          setConnectFromId(undefined);
        }}
        onCreateRelation={handleCreateRelation}
      />

      {/* Condicional: Carregando vs Sem Personagens vs Whiteboard */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <Sparkles className="w-5 h-5 animate-pulse text-slate-400" />
          <span>Carregando árvore de relações...</span>
        </div>
      ) : characters.length === 0 ? (
        
        // 🔴 ROTA NÃO (Sem personagens criados ainda)
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 p-6">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
            <Share2 className="w-8 h-8 text-slate-400" />
          </div>

          <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight mb-2">
            Crie personagens para montar o mapa de relações
          </h2>

          <p className="text-base text-slate-500 font-sans leading-relaxed mb-8">
            Para ligar o elenco com setas e construir a árvore da história de <strong className="text-slate-800">{activeBook.book_name}</strong>, adicione primeiro os seus personagens.
          </p>

          {onNavigateToCharacters && (
            <Button
              variant="primary"
              size="lg"
              onClick={onNavigateToCharacters}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Ir para Personagens
            </Button>
          )}
        </div>
      ) : (
        
        // 🟢 ROTA SIM (Whiteboard Interativo)
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Header Superior do Whiteboard */}
          <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-30">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight">
                  Árvore & Relações de Personagens
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {relationsData.links.length} {relationsData.links.length === 1 ? "conexão" : "conexões"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Arraste o elenco do menu horizontal para o whiteboard e conecte com setas.
              </p>
            </div>

            {/* Ações de Ferramentas em Pílula */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setConnectFromId(undefined);
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Nova Conexão
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleAutoLayout}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Arranjar Grade
              </Button>

              {relationsData.links.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllLinks}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200/80 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Ligações</span>
                </button>
              )}

              {/* Controles de Zoom */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-full p-0.5 bg-slate-50 text-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 font-semibold text-[11px]">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Resetar zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* MENU HORIZONTAL DO ELENCO PARA DRAG & DROP NO WHITEBOARD */}
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 overflow-x-auto shrink-0 z-20 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Elenco (Arraste para soltar no whiteboard):</span>
            </span>

            <div className="flex items-center gap-2">
              {characters.map((char) => {
                const isOnCanvas = !!relationsData.nodes[char.id];
                const charName = char.character_name || char.name || "Personagem";
                const avatarUrl = char.image_url || (char.character_images && char.character_images[0]);

                return (
                  <div
                    key={char.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", char.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => handleAddOrFocusCharacterOnCanvas(char.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border cursor-grab active:cursor-grabbing transition-all shrink-0 select-none ${
                      isOnCanvas
                        ? "bg-white text-slate-900 border-slate-300 shadow-xs hover:border-slate-900"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Arraste para soltar no whiteboard ou clique para adicionar"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border border-slate-300">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={charName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-slate-500" />
                      )}
                    </div>

                    <span className="font-bold font-funnel truncate max-w-[110px]">
                      {charName}
                    </span>

                    {isOnCanvas && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Inserido no Whiteboard" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Área de Trabalho do Whiteboard (Canvas Infinito com Grid) */}
          <div
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={(e) => {
              if (e.touches[0]) {
                handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as any);
              }
            }}
            onTouchEnd={handleMouseUp}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const charId = e.dataTransfer.getData("text/plain");
              if (charId && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const dropX = Math.max(20, Math.round((e.clientX - rect.left) / zoomLevel - CARD_WIDTH / 2));
                const dropY = Math.max(20, Math.round((e.clientY - rect.top) / zoomLevel - CARD_HEIGHT / 2));

                setRelationsData((prev) => ({
                  ...prev,
                  nodes: {
                    ...prev.nodes,
                    [charId]: { x: dropX, y: dropY },
                  },
                }));
              }
            }}
            className="flex-1 relative bg-white overflow-auto cursor-crosshair select-none"
            style={{
              backgroundImage:
                "radial-gradient(#e2e8f0 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Layer Escalada por Zoom */}
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "0 0",
                width: "2500px",
                height: "2000px",
              }}
              className="relative w-full h-full min-h-[1200px]"
            >
              {/* Camada SVG de Ligações/Setas de Conexão */}
              <RelationLinkLayer
                nodes={relationsData.nodes}
                links={relationsData.links}
                onDeleteLink={handleDeleteLink}
              />

              {/* Nós de Cards de Personagens Arrastáveis */}
              {characters.map((char) => {
                const pos = relationsData.nodes[char.id];
                if (!pos) return null;

                return (
                  <RelationNodeCard
                    key={char.id}
                    character={char}
                    x={pos.x}
                    y={pos.y}
                    isSelected={draggingCharId === char.id}
                    onDragStart={handleDragStart}
                    onStartConnect={(fromId) => {
                      setConnectFromId(fromId);
                      setIsModalOpen(true);
                    }}
                    onRemoveFromCanvas={(charId) => {
                      setRelationsData((prev) => {
                        const newNodes = { ...prev.nodes };
                        delete newNodes[charId];
                        return {
                          ...prev,
                          nodes: newNodes,
                          links: prev.links.filter(
                            (l) => l.from_character_id !== charId && l.to_character_id !== charId
                          ),
                        };
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
