import { supabase } from "../supabaseClient";
import type { Character, CharacterRoleType } from "../types/character";
import { ensureValidUuid } from "../utils/uuidUtils";

export const characterService = {
  // Buscar personagens de uma obra
  async getCharacters(bookId: string): Promise<Character[]> {
    const safeBookId = ensureValidUuid(bookId);
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar personagens no Supabase:", error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((c: any) => {
          let appearanceStr = c.appearance || null;
          let secretsStr = c.secrets || null;
          let summaryStr = c.summary || null;

          if (c.character_details) {
            try {
              const parsed = JSON.parse(c.character_details);
              if (typeof parsed === "object" && parsed !== null) {
                appearanceStr = appearanceStr || parsed.appearance || null;
                secretsStr = secretsStr || parsed.secrets || null;
                summaryStr = summaryStr || parsed.notes || null;
              }
            } catch (e) {
              summaryStr = summaryStr || c.character_details;
            }
          }

          const imgUrl = c.character_images && c.character_images.length > 0
            ? c.character_images[0]
            : c.image_url || null;

          return {
            ...c,
            id: ensureValidUuid(c.id),
            id_book: safeBookId,
            book_id: safeBookId,
            character_name: c.character_name || c.name || "Personagem sem nome",
            name: c.character_name || c.name || "Personagem sem nome",
            role_type: c.role_type || "Secondary",
            appearance: appearanceStr,
            secrets: secretsStr,
            summary: summaryStr,
            image_url: imgUrl,
          } as Character;
        });
      }

      return [];
    } catch (err) {
      console.error("Exceção ao buscar personagens:", err);
      return [];
    }
  },

  // Salvar (criar ou atualizar) personagem
  async saveCharacter(
    bookId: string,
    characterData: {
      id?: string;
      character_name: string;
      role_type: CharacterRoleType;
      character_sign?: string;
      character_personality?: string;
      character_motivations?: string;
      appearance?: string;
      secrets?: string;
      character_images?: string[];
      character_details?: string;
      summary?: string;
    }
  ): Promise<Character> {
    const safeBookId = ensureValidUuid(bookId);
    const safeCharId = ensureValidUuid(characterData.id);

    const payload: any = {
      id: safeCharId,
      id_book: safeBookId,
      character_name: characterData.character_name,
      character_sign: characterData.character_sign || null,
      character_personality: characterData.character_personality || null,
      character_motivations: characterData.character_motivations || null,
      character_images: characterData.character_images || [],
      character_details: characterData.character_details || null,
      updated_at: new Date().toISOString(),
    };

    const savedRecord: Character = {
      id: safeCharId,
      id_book: safeBookId,
      book_id: safeBookId,
      character_name: characterData.character_name,
      name: characterData.character_name,
      role_type: characterData.role_type,
      character_sign: characterData.character_sign,
      character_personality: characterData.character_personality,
      character_motivations: characterData.character_motivations,
      appearance: characterData.appearance,
      secrets: characterData.secrets,
      summary: characterData.summary,
      image_url: characterData.character_images && characterData.character_images.length > 0 ? characterData.character_images[0] : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("characters")
        .upsert([payload])
        .select()
        .single();

      if (!error && data) {
        savedRecord.id = ensureValidUuid(data.id);
      } else if (error) {
        console.error("Erro no Supabase ao salvar personagem:", error.message);
      }
    } catch (err) {
      console.error("Exceção ao salvar personagem:", err);
    }

    return savedRecord;
  },

  // Excluir personagem
  async deleteCharacter(characterId: string): Promise<boolean> {
    const safeCharId = ensureValidUuid(characterId);
    try {
      const { error } = await supabase.from("characters").delete().eq("id", safeCharId);
      if (error) {
        console.error("Erro ao excluir personagem:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir personagem:", err);
      return false;
    }
  },
};
