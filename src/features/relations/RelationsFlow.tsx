import React, { useState, useEffect, useRef } from "react";
import { Share2, Plus, Sparkles, RefreshCw, Trash2, ZoomIn, ZoomOut, Maximize2, Users } from "lucide-react";
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

  // Carrega personagens e inicializa posições no whiteboard se necessário
  const fetchCharactersAndRelations = async () => {
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const loadedChars: Character[] = data.map((c: any) => ({
          ...c,
          id: ensureValidUuid(c.id),
          character_name: c.character_name || c.name || "Personagem",
          name: c.character_name || c.name || "Personagem",
          image_url: c.character_images && c.character_images.length > 0 ? c.character_images[0] : c.image_url,
        }));
        setCharacters(loadedChars);
        autoLayoutNodesIfNeeded(loadedChars);
      } else if (characters.length > 0) {
        autoLayoutNodesIfNeeded(characters);
      }
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

  // Início do arraste do nó
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

  // Criar nova conexão entre dois personagens
  const handleCreateRelation = (relationData: {
    from_character_id: string;
    to_character_id: string;
    label: string;
    line_style?: "solid" | "dashed";
  }) => {
    const newLink: CharacterRelationLink = {
      id: "link_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      from_character_id: relationData.from_character_id,
      to_character_id: relationData.to_character_id,
      label: relationData.label,
      line_style: relationData.line_style || "solid",
      created_at: new Date().toISOString(),
    };

    setRelationsData((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));
  };

  // Excluir uma conexão
  const handleDeleteLink = (linkId: string) => {
    setRelationsData((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
    }));
  };

  // Limpar todas as ligações
  const handleClearAllLinks = () => {
    if (confirm("Deseja remover todas as setas de ligação do whiteboard?")) {
      setRelationsData((prev) => ({
        ...prev,
        links: [],
      }));
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
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-30">
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
                Arraste os cards e conecte o elenco com setas interativas.
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
                const pos = relationsData.nodes[char.id] || { x: 100, y: 100 };
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
