import { supabase } from "../supabaseClient";
import type { Chapter } from "../types/book";
import { ensureValidUuid } from "../utils/uuidUtils";

export const chapterService = {
  // Buscar capítulos de uma obra
  async getChapters(bookId: string): Promise<Chapter[]> {
    const safeBookId = ensureValidUuid(bookId);
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar capítulos no Supabase:", error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((c: any, index: number) => ({
          ...c,
          id: ensureValidUuid(c.id),
          id_book: safeBookId,
          book_id: safeBookId,
          title: c.title || `Capítulo ${index + 1}`,
          content: c.text || c.content || "",
          text: c.text || c.content || "",
          word_count: c.word_count || 0,
          order_index: c.order_index ?? index,
        })) as Chapter[];
      }

      return [];
    } catch (err) {
      console.error("Exceção ao buscar capítulos:", err);
      return [];
    }
  },

  // Criar um novo capítulo
  async createChapter(bookId: string, title: string, orderIndex: number = 0): Promise<Chapter> {
    const safeBookId = ensureValidUuid(bookId);
    const generatedId = ensureValidUuid();

    const newChapter: Chapter = {
      id: generatedId,
      id_book: safeBookId,
      book_id: safeBookId,
      title: title.trim() || "Capítulo sem título",
      text: "",
      content: "",
      word_count: 0,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const payload = {
        id: generatedId,
        id_book: safeBookId,
        title: newChapter.title,
        text: "",
      };

      const { data, error } = await supabase
        .from("chapters")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        newChapter.id = ensureValidUuid(data.id);
      } else if (error) {
        console.error("Erro no Supabase ao criar capítulo:", error.message);
      }
    } catch (err) {
      console.error("Exceção ao criar capítulo:", err);
    }

    return newChapter;
  },

  // Atualizar capítulo (título / conteúdo)
  async updateChapter(chapterId: string, updatedData: { title?: string; text?: string; content?: string }): Promise<boolean> {
    const safeChapterId = ensureValidUuid(chapterId);

    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updatedData.title !== undefined) payload.title = updatedData.title;
      if (updatedData.text !== undefined || updatedData.content !== undefined) {
        payload.text = updatedData.text !== undefined ? updatedData.text : updatedData.content;
      }

      const { error } = await supabase
        .from("chapters")
        .update(payload)
        .eq("id", safeChapterId);

      if (error) {
        console.error("Erro ao atualizar capítulo no Supabase:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Exceção ao atualizar capítulo:", err);
      return false;
    }
  },

  // Excluir capítulo
  async deleteChapter(chapterId: string): Promise<boolean> {
    const safeChapterId = ensureValidUuid(chapterId);
    try {
      const { error } = await supabase.from("chapters").delete().eq("id", safeChapterId);
      if (error) {
        console.error("Erro ao excluir capítulo:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir capítulo:", err);
      return false;
    }
  },
};
