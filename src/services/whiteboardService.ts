import { supabase } from "../supabaseClient";
import type { WhiteboardItem } from "../types/whiteboard";
import { ensureValidUuid, ensureParentBookExists } from "../utils/uuidUtils";

const LOCAL_KEY_PREFIX = "writr_whiteboard_";

export const whiteboardService = {
  // Buscar todos os itens do quadro de uma obra
  async getItems(bookId: string): Promise<WhiteboardItem[]> {
    const safeBookId = ensureValidUuid(bookId);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;

    let localItems: WhiteboardItem[] = [];
    try {
      const saved = localStorage.getItem(localKey);
      localItems = saved ? JSON.parse(saved) : [];
    } catch (e) {}

    try {
      const { data, error } = await supabase
        .from("whiteboard_items")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("⚠️ [Supabase] Tabela 'whiteboard_items' não encontrada ou inacessível, usando armazenamento local:", error.message);
        return localItems;
      }

      if (data && data.length > 0) {
        const remoteItems = data.map((item: any) => ({
          ...item,
          id: ensureValidUuid(item.id),
          id_book: safeBookId,
          type: item.type || "postit",
          title: item.title || "",
          content: item.content || "",
          x: typeof item.x === "number" ? item.x : parseFloat(item.x) || 100,
          y: typeof item.y === "number" ? item.y : parseFloat(item.y) || 100,
          color: item.color || "yellow",
          category: item.category || "ideia",
          created_at: item.created_at,
          updated_at: item.updated_at,
        })) as WhiteboardItem[];

        try {
          localStorage.setItem(localKey, JSON.stringify(remoteItems));
        } catch (e) {}

        return remoteItems;
      }

      return localItems;
    } catch (err) {
      console.error("Exceção ao buscar itens do whiteboard:", err);
      return localItems;
    }
  },

  // Salvar (criar ou atualizar) item no quadro
  async saveItem(
    bookId: string,
    itemData: Partial<WhiteboardItem> & { content: string }
  ): Promise<WhiteboardItem> {
    const safeBookId = ensureValidUuid(bookId);
    const safeItemId = ensureValidUuid(itemData.id);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;
    const now = new Date().toISOString();

    await ensureParentBookExists(safeBookId);

    const itemToSave: WhiteboardItem = {
      id: safeItemId,
      id_book: safeBookId,
      type: itemData.type || "postit",
      title: itemData.title || "",
      content: itemData.content,
      x: itemData.x ?? 100,
      y: itemData.y ?? 100,
      color: itemData.color || "yellow",
      category: itemData.category || "ideia",
      created_at: itemData.created_at || now,
      updated_at: now,
    };

    // 1. Salvar no localStorage de forma síncrona
    try {
      const currentList = await this.getItems(safeBookId);
      const existingIdx = currentList.findIndex((i) => i.id === safeItemId);
      let updatedList: WhiteboardItem[];

      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = itemToSave;
      } else {
        updatedList = [...currentList, itemToSave];
      }

      localStorage.setItem(localKey, JSON.stringify(updatedList));
    } catch (e) {
      console.error("Erro ao salvar whiteboard no localStorage:", e);
    }

    // 2. Persistir no Supabase com resiliência
    try {
      const payloadPrimary: any = {
        id: safeItemId,
        id_book: safeBookId,
        type: itemToSave.type,
        title: itemToSave.title,
        content: itemToSave.content,
        x: itemToSave.x,
        y: itemToSave.y,
        color: itemToSave.color,
        category: itemToSave.category,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("whiteboard_items")
        .upsert([payloadPrimary])
        .select()
        .single();

      if (!error && data) {
        console.log("✅ [Supabase] Item do whiteboard salvo com sucesso:", data.id);
        itemToSave.id = ensureValidUuid(data.id);
      } else if (error) {
        console.warn("⚠️ Erro no Supabase ao salvar item do whiteboard (tentando fallback):", error.message);
        
        // Payload simplificado fallback
        const payloadFallback: any = {
          id: safeItemId,
          id_book: safeBookId,
          content: itemToSave.content,
          x: itemToSave.x,
          y: itemToSave.y,
          color: itemToSave.color,
          updated_at: now,
        };

        const { data: fbData, error: fbErr } = await supabase
          .from("whiteboard_items")
          .upsert([payloadFallback])
          .select()
          .single();

        if (!fbErr && fbData) {
          console.log("✅ [Supabase] Item do whiteboard salvo via fallback:", fbData.id);
          itemToSave.id = ensureValidUuid(fbData.id);
        } else if (fbErr) {
          console.error("❌ [Supabase] Erro ao salvar item do whiteboard (fallback):", fbErr.message);
        }
      }
    } catch (err) {
      console.error("Exceção ao salvar item no Supabase:", err);
    }

    return itemToSave;
  },

  // Excluir item do quadro
  async deleteItem(bookId: string, itemId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    const safeItemId = ensureValidUuid(itemId);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;

    // 1. Atualizar localStorage
    try {
      const currentList = await this.getItems(safeBookId);
      const updatedList = currentList.filter((i) => i.id !== safeItemId);
      localStorage.setItem(localKey, JSON.stringify(updatedList));
    } catch (e) {
      console.error("Erro ao atualizar localStorage para exclusão:", e);
    }

    // 2. Excluir no Supabase
    try {
      const { error } = await supabase.from("whiteboard_items").delete().eq("id", safeItemId);
      if (error) {
        console.error("Erro ao excluir item do whiteboard no Supabase:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir item do whiteboard:", err);
      return false;
    }
  },

  // Limpar todo o quadro de uma obra
  async clearWhiteboard(bookId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;

    try {
      localStorage.removeItem(localKey);
    } catch (e) {}

    try {
      await supabase.from("whiteboard_items").delete().eq("id_book", safeBookId);
      return true;
    } catch (err) {
      console.error("Exceção ao limpar whiteboard no Supabase:", err);
      return false;
    }
  },
};
