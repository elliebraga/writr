import { supabase } from "../supabaseClient";
import type { TimelineEvent } from "../types/timeline";
import { ensureValidUuid } from "../utils/uuidUtils";

export const timelineService = {
  // Buscar eventos de linha do tempo de uma obra
  async getEvents(bookId: string): Promise<TimelineEvent[]> {
    const safeBookId = ensureValidUuid(bookId);
    const localStorageKey = `writr_timeline_${safeBookId}`;
    
    // Obter dados locais primeiro
    let localEvents: TimelineEvent[] = [];
    try {
      const saved = localStorage.getItem(localStorageKey);
      localEvents = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao ler eventos do localStorage:", e);
    }

    try {
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true }); // Ordena por criação por enquanto, o UI ordena por cronologia se desejado

      if (error) {
        console.error("Erro ao buscar eventos no Supabase:", error.message);
        return localEvents; // Fallback para local
      }

      if (data && data.length > 0) {
        const remoteEvents = data.map((e: any) => ({
          id: ensureValidUuid(e.id),
          id_book: safeBookId,
          id_character: e.id_character ? ensureValidUuid(e.id_character) : null,
          event_date: e.event_date || "",
          location: e.location || "",
          description: e.description || "",
          created_at: e.created_at,
          updated_at: e.updated_at,
        })) as TimelineEvent[];

        // Atualizar cache local com os dados remotos
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(remoteEvents));
        } catch (err) {
          console.error("Erro ao cachear eventos no localStorage:", err);
        }
        return remoteEvents;
      }

      return localEvents;
    } catch (err) {
      console.error("Exceção ao buscar eventos:", err);
      return localEvents;
    }
  },

  // Salvar (criar ou atualizar) evento
  async saveEvent(
    bookId: string,
    eventData: {
      id?: string;
      id_character?: string | null;
      event_date: string;
      location: string;
      description: string;
    }
  ): Promise<TimelineEvent> {
    const safeBookId = ensureValidUuid(bookId);
    const safeEventId = ensureValidUuid(eventData.id);
    const localStorageKey = `writr_timeline_${safeBookId}`;

    const payload: any = {
      id: safeEventId,
      id_book: safeBookId,
      id_character: eventData.id_character ? ensureValidUuid(eventData.id_character) : null,
      event_date: eventData.event_date,
      location: eventData.location,
      description: eventData.description,
      updated_at: new Date().toISOString(),
    };

    const savedRecord: TimelineEvent = {
      id: safeEventId,
      id_book: safeBookId,
      id_character: eventData.id_character ? ensureValidUuid(eventData.id_character) : null,
      event_date: eventData.event_date,
      location: eventData.location,
      description: eventData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Atualizar localStorage de forma síncrona
    try {
      const saved = localStorage.getItem(localStorageKey);
      let list: TimelineEvent[] = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((item) => item.id === safeEventId);
      if (index >= 0) {
        list[index] = { ...list[index], ...savedRecord };
      } else {
        list.push(savedRecord);
      }
      localStorage.setItem(localStorageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao atualizar localStorage:", e);
    }

    // 2. Persistir no Supabase
    try {
      const { data, error } = await supabase
        .from("timeline_events")
        .upsert([payload])
        .select()
        .single();

      if (!error && data) {
        savedRecord.id = ensureValidUuid(data.id);
        if (data.created_at) savedRecord.created_at = data.created_at;
        
        // Sincronizar ID retornado com localStorage
        try {
          const saved = localStorage.getItem(localStorageKey);
          if (saved) {
            let list: TimelineEvent[] = JSON.parse(saved);
            const idx = list.findIndex((item) => item.id === safeEventId);
            if (idx >= 0) {
              list[idx].id = savedRecord.id;
              if (data.created_at) list[idx].created_at = data.created_at;
              localStorage.setItem(localStorageKey, JSON.stringify(list));
            }
          }
        } catch (e) {
          console.error("Erro ao sincronizar localStorage com ID gerado:", e);
        }
      } else if (error) {
        console.error("Erro no Supabase ao salvar evento:", error.message);
      }
    } catch (err) {
      console.error("Exceção ao salvar evento no Supabase:", err);
    }

    return savedRecord;
  },

  // Excluir evento
  async deleteEvent(bookId: string, eventId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    const safeEventId = ensureValidUuid(eventId);
    const localStorageKey = `writr_timeline_${safeBookId}`;

    // 1. Atualizar localStorage
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        let list: TimelineEvent[] = JSON.parse(saved);
        list = list.filter((item) => item.id !== safeEventId);
        localStorage.setItem(localStorageKey, JSON.stringify(list));
      }
    } catch (e) {
      console.error("Erro ao atualizar localStorage para exclusão:", e);
    }

    // 2. Excluir no Supabase
    try {
      const { error } = await supabase
        .from("timeline_events")
        .delete()
        .eq("id", safeEventId);

      if (error) {
        console.error("Erro ao excluir evento no Supabase:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir evento no Supabase:", err);
      return false;
    }
  },

  // Limpar todos os eventos de um livro
  async clearBookEvents(bookId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    const localStorageKey = `writr_timeline_${safeBookId}`;

    // 1. Limpar localStorage
    try {
      localStorage.removeItem(localStorageKey);
    } catch (e) {
      console.error("Erro ao limpar localStorage do livro:", e);
    }

    // 2. Limpar no Supabase
    try {
      const { error } = await supabase
        .from("timeline_events")
        .delete()
        .eq("id_book", safeBookId);

      if (error) {
        console.error("Erro ao limpar eventos do livro no Supabase:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao limpar eventos do livro:", err);
      return false;
    }
  },
};
