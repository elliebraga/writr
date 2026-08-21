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
        console.error("⚠️ [Supabase] Erro ao buscar personagens:", error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((c: any) => {
          let appearanceStr = c.appearance || null;
          let secretsStr = c.secrets || null;
          let summaryStr = c.summary || null;
          let roleTypeStr = c.role_type || null;

          if (c.character_details) {
            try {
              const parsed = typeof c.character_details === "string"
                ? JSON.parse(c.character_details)
                : c.character_details;
              if (typeof parsed === "object" && parsed !== null) {
                appearanceStr = appearanceStr || parsed.appearance || null;
                secretsStr = secretsStr || parsed.secrets || null;
                summaryStr = summaryStr || parsed.notes || null;
                roleTypeStr = roleTypeStr || parsed.role_type || null;
              }
            } catch (e) {
              summaryStr = summaryStr || c.character_details;
            }
          }

          const imgUrl = Array.isArray(c.character_images) && c.character_images.length > 0
            ? c.character_images[0]
            : c.image_url || c.character_images || null;

          return {
            ...c,
            id: ensureValidUuid(c.id),
            id_book: safeBookId,
            book_id: safeBookId,
            character_name: c.character_name || c.name || "Personagem sem nome",
            name: c.character_name || c.name || "Personagem sem nome",
            role_type: (roleTypeStr || c.role_type || "Protagonista") as CharacterRoleType,
            character_sign: c.character_sign || null,
            character_personality: c.character_personality || null,
            character_motivations: c.character_motivations || null,
            appearance: appearanceStr,
            secrets: secretsStr,
            summary: summaryStr,
            image_url: typeof imgUrl === "string" ? imgUrl : undefined,
          } as Character;
        });
      }

      return [];
    } catch (err) {
      console.error("Exceção ao buscar personagens:", err);
      return [];
    }
  },

  // Salvar (criar ou atualizar) personagem no Supabase
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

    // 1. Garantir que a obra pai existe no Supabase para evitar erro de FK (id_book)
    try {
      const { data: bookCheck } = await supabase
        .from("books")
        .select("id")
        .eq("id", safeBookId)
        .maybeSingle();

      if (!bookCheck) {
        console.log("ℹ️ [Supabase] Obra pai não encontrada no banco. Criando registro pai automaticamente...");
        await supabase.from("books").upsert([
          {
            id: safeBookId,
            book_name: "Obra",
            status: "rascunho",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.warn("⚠️ Aviso ao verificar obra no Supabase:", e);
    }

    // 2. Montar objeto JSON serializado de detalhes
    const serializedDetails = characterData.character_details || JSON.stringify({
      appearance: characterData.appearance || "",
      secrets: characterData.secrets || "",
      notes: characterData.summary || "",
      role_type: characterData.role_type || "Protagonista",
    });

    const payloadPrimary: any = {
      id: safeCharId,
      id_book: safeBookId,
      character_name: characterData.character_name,
      character_sign: characterData.character_sign || null,
      character_personality: characterData.character_personality || null,
      character_motivations: characterData.character_motivations || null,
      character_images: characterData.character_images || [],
      character_details: serializedDetails,
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
      character_details: serializedDetails,
      image_url: characterData.character_images && characterData.character_images.length > 0 ? characterData.character_images[0] : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Tentar persistência no Supabase com tratamento de fallback
    try {
      const { data, error } = await supabase
        .from("characters")
        .upsert([payloadPrimary])
        .select()
        .single();

      if (!error && data) {
        console.log("✅ [Supabase] Personagem salvo com sucesso:", data.id);
        savedRecord.id = ensureValidUuid(data.id);
      } else if (error) {
        console.warn("⚠️ Erro na primeira tentativa de upsert no Supabase:", error.message);
        
        // Tentar payload secundário simplificado (caso colunas adicionais não existam no esquema)
        const payloadFallback: any = {
          id: safeCharId,
          id_book: safeBookId,
          character_name: characterData.character_name,
          character_details: serializedDetails,
          updated_at: new Date().toISOString(),
        };

        const { data: fallbackData, error: fallbackError } = await supabase
          .from("characters")
          .upsert([payloadFallback])
          .select()
          .single();

        if (!fallbackError && fallbackData) {
          console.log("✅ [Supabase] Personagem salvo via payload fallback:", fallbackData.id);
          savedRecord.id = ensureValidUuid(fallbackData.id);
        } else if (fallbackError) {
          console.error("❌ [Supabase] Erro ao salvar personagem (fallback):", fallbackError.message, fallbackError.details);
        }
      }
    } catch (err) {
      console.error("❌ Exceção ao salvar personagem:", err);
    }

    return savedRecord;
  },

  // Excluir personagem
  async deleteCharacter(characterId: string): Promise<boolean> {
    const safeCharId = ensureValidUuid(characterId);
    try {
      const { error } = await supabase.from("characters").delete().eq("id", safeCharId);
      if (error) {
        console.error("Erro ao excluir personagem no Supabase:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir personagem:", err);
      return false;
    }
  },
};
