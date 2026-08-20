import React, { useState, useEffect, useRef } from "react";
import type { Book } from "../../types/book";
import type { WhiteboardItem, PostItColor } from "../../types/whiteboard";
import { PostItNote } from "../../components/whiteboard/PostItNote";
import { WhiteboardToolbar } from "../../components/whiteboard/WhiteboardToolbar";
import { whiteboardService } from "../../services";
import { ensureValidUuid } from "../../utils/uuidUtils";
import { useDialog } from "../../components/ui/DialogProvider";
import Button from "../../components/ui/Button";
import { StickyNote, Plus } from "lucide-react";

interface WhiteboardFlowProps {
  activeBook: Book;
}

export const WhiteboardFlow: React.FC<WhiteboardFlowProps> = ({ activeBook }) => {
  const safeBookId = ensureValidUuid(activeBook.id);
  const { showConfirm } = useDialog();

  const [items, setItems] = useState<WhiteboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Estado de arrasto de Post-it
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);

  // Estado de pan do canvas
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; initialPanX: number; initialPanY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadItems();
  }, [safeBookId]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await whiteboardService.getItems(safeBookId);
      setItems(data);
    } catch (e) {
      console.error("Erro ao carregar itens do whiteboard:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar novo Post-it
  const handleAddPostIt = async (color: PostItColor = "yellow") => {
    const newItem = await whiteboardService.saveItem(safeBookId, {
      type: "postit",
      title: "",
      content: "",
      x: 120 + items.length * 20 - panOffset.x,
      y: 120 + items.length * 20 - panOffset.y,
      color: color,
      category: "ideia",
    });

    setItems((prev) => [...prev, newItem]);
  };

  // Adicionar nova Seção
  const handleAddSection = async () => {
    const newSection = await whiteboardService.saveItem(safeBookId, {
      type: "section",
      title: "Ato I - Introdução",
      content: "Ato I - Introdução",
      x: 150 - panOffset.x,
      y: 80 - panOffset.y,
      color: "slate",
    });

    setItems((prev) => [...prev, newSection]);
  };

  // Atualizar item (conteúdo, cor, posição)
  const handleUpdateItem = async (updated: Partial<WhiteboardItem> & { id: string }) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );

    const target = items.find((i) => i.id === updated.id);
    if (target) {
      await whiteboardService.saveItem(safeBookId, {
        ...target,
        ...updated,
      });
    }
  };

  // Excluir item
  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await whiteboardService.deleteItem(safeBookId, id);
  };

  // Limpar todo o quadro
  const handleClearAll = async () => {
    const confirmed = await showConfirm(
      "Tem certeza que deseja apagar todos os Post-its e notas deste quadro?",
      "Limpar Quadro de Ideias",
      "Limpar Tudo",
      "Cancelar"
    );

    if (confirmed) {
      setItems([]);
      await whiteboardService.clearWhiteboard(safeBookId);
    }
  };

  // Início de arrasto de um Post-it
  const handleDragStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setDraggingId(id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: item.x,
      initialY: item.y,
    };
  };

  // Movimento de arrasto do Post-it
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId && dragStartRef.current) {
      const deltaX = (e.clientX - dragStartRef.current.mouseX) / zoomLevel;
      const deltaY = (e.clientY - dragStartRef.current.mouseY) / zoomLevel;

      const newX = dragStartRef.current.initialX + deltaX;
      const newY = dragStartRef.current.initialY + deltaY;

      setItems((prev) =>
        prev.map((i) => (i.id === draggingId ? { ...i, x: newX, y: newY } : i))
      );
      return;
    }

    if (isPanningCanvas && panStartRef.current) {
      const deltaX = e.clientX - panStartRef.current.mouseX;
      const deltaY = e.clientY - panStartRef.current.mouseY;

      setPanOffset({
        x: panStartRef.current.initialPanX + deltaX,
        y: panStartRef.current.initialPanY + deltaY,
      });
    }
  };

  // Fim do arrasto (Salva a posição final no Supabase)
  const handleMouseUp = () => {
    if (draggingId) {
      const target = items.find((i) => i.id === draggingId);
      if (target) {
        whiteboardService.saveItem(safeBookId, target);
      }
      setDraggingId(null);
      dragStartRef.current = null;
    }

    if (isPanningCanvas) {
      setIsPanningCanvas(false);
      panStartRef.current = null;
    }
  };

  // Início do Pan do fundo do canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).id === "canvas-bg") {
      setIsPanningCanvas(true);
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        initialPanX: panOffset.x,
        initialPanY: panOffset.y,
      };
    }
  };

  return (
    <div className="flex-1 h-screen bg-slate-50 relative overflow-hidden select-none flex flex-col font-sans">
      
      {/* Header Superior do Quadro de Ideias */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-funnel text-slate-900">
                Quadro de Ideias & Enredo
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {items.length} {items.length === 1 ? "nota" : "notas"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Organização livre de post-its, ganchos dramáticos e pontos de virada para <strong className="text-slate-800">{activeBook.book_name}</strong>.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => handleAddPostIt("yellow")}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Novo Post-it
        </Button>
      </div>

      {/* Área do Canvas Infinito com Grade de Pontos (Dots Grid) */}
      <div
        ref={containerRef}
        id="canvas-bg"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative overflow-hidden ${
          isPanningCanvas ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
      >
        {/* Layer de Zoom e Pan contendo os Post-its */}
        <div
          className="absolute inset-0 origin-top-left pointer-events-auto"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {items.map((item) => (
            <PostItNote
              key={item.id}
              item={item}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onDragStart={handleDragStart}
            />
          ))}
        </div>

        {/* Estado Vazio: Nenhum Post-it criado ainda */}
        {!isLoading && items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <StickyNote className="w-8 h-8 text-amber-500" />
            </div>

            <h3 className="text-xl font-bold font-funnel text-slate-900 mb-2">
              Seu Quadro de Ideias está em branco
            </h3>

            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
              Crie Post-its coloridos para estruturar os pontos de virada, mistérios e ideias do seu livro.
            </p>

            <div className="pointer-events-auto">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAddPostIt("yellow")}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Criar Primeiro Post-it
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Ferramentas Flutuante (Estilo FigJam / Miro) */}
      <WhiteboardToolbar
        zoomLevel={zoomLevel}
        onAddPostIt={handleAddPostIt}
        onAddSection={handleAddSection}
        onZoomIn={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
        onZoomOut={() => setZoomLevel((z) => Math.max(0.5, z - 0.15))}
        onResetZoom={() => setZoomLevel(1)}
        onClearAll={handleClearAll}
      />
    </div>
  );
};
