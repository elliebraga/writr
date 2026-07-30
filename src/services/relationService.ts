import { supabase } from "../supabaseClient";
import type { CharacterRelationLink } from "../types/relation";
import { ensureValidUuid } from "../utils/uuidUtils";

export const relationService = {
  // Buscar ligações de relacionamentos de uma obra
  async getRelations(bookId: string): Promise<CharacterRelationLink[]> {
    const safeBookId = ensureValidUuid(bookId);
    try {
      const { data, error } = await supabase
        .from("relationships")
        .select("*")
        .eq("id_book", safeBookId);

      if (error) {
        console.error("Erro ao buscar relacionamentos no Supabase:", error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((r: any) => ({
          id: ensureValidUuid(r.id),
          from_character_id: ensureValidUuid(r.from_character_id || r.character_id),
          to_character_id: ensureValidUuid(r.to_character_id || r.related_character_id),
          label: r.label || r.relationship_type || "Conexão",
          description: r.description || undefined,
          line_style: r.line_style || "solid",
          created_at: r.created_at,
        }));
      }

      return [];
    } catch (err) {
      console.error("Exceção ao buscar relacionamentos:", err);
      return [];
    }
  },

  // Criar uma nova ligação entre personagens
  async createRelation(
    bookId: string,
    relationData: {
      from_character_id: string;
      to_character_id: string;
      label: string;
      description?: string;
      line_style?: "solid" | "dashed";
    }
  ): Promise<CharacterRelationLink> {
    const safeBookId = ensureValidUuid(bookId);
    const generatedId = ensureValidUuid();
    const fromId = ensureValidUuid(relationData.from_character_id);
    const toId = ensureValidUuid(relationData.to_character_id);

    const newLink: CharacterRelationLink = {
      id: generatedId,
      from_character_id: fromId,
      to_character_id: toId,
      label: relationData.label,
      description: relationData.description,
      line_style: relationData.line_style || "solid",
      created_at: new Date().toISOString(),
    };

    try {
      const payload: any = {
        id: generatedId,
        id_book: safeBookId,
        character_id: fromId,
        related_character_id: toId,
        from_character_id: fromId,
        to_character_id: toId,
        label: relationData.label,
        description: relationData.description || null,
        line_style: relationData.line_style || "solid",
      };

      const { data, error } = await supabase
        .from("relationships")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        newLink.id = ensureValidUuid(data.id);
      } else if (error) {
        console.error("Erro no Supabase ao criar relação:", error.message);
      }
    } catch (err) {
      console.error("Exceção ao criar relação:", err);
    }

    return newLink;
  },

  // Excluir uma ligação
  async deleteRelation(relationId: string): Promise<boolean> {
    const safeRelationId = ensureValidUuid(relationId);
    try {
      const { error } = await supabase.from("relationships").delete().eq("id", safeRelationId);
      if (error) {
        console.error("Erro ao excluir relação:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir relação:", err);
      return false;
    }
  },

  // Limpar todas as ligações de uma obra
  async clearBookRelations(bookId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    try {
      const { error } = await supabase.from("relationships").delete().eq("id_book", safeBookId);
      if (error) {
        console.error("Erro ao limpar relações do livro:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao limpar relações:", err);
      return false;
    }
  },
};
