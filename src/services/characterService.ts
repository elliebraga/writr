import { supabase } from "../supabaseClient";
import type { Character, CharacterRoleType, CharacterType } from "../types/character";
import { ensureValidUuid } from "../utils/uuidUtils";

let characterTypesCache: CharacterType[] | null = null;

export const characterService = {
  // Buscar catálogo de tipos de personagem do Supabase
  async getCharacterTypes(): Promise<CharacterType[]> {
    if (characterTypesCache && characterTypesCache.length > 0) {
      return characterTypesCache;
    }

    try {
      const { data, error } = await supabase
        .from("character_types")
        .select("id, tipo")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        characterTypesCache = data as CharacterType[];
        return characterTypesCache;
      }

      // Se a tabela estiver vazia, tenta semear os tipos padrão automaticamente
      if (!error && (!data || data.length === 0)) {
        const defaultTypes = [
          { tipo: "Protagonista" },
          { tipo: "Antagonista" },
          { tipo: "Secundário" },
          { tipo: "Coadjuvante" },
          { tipo: "Mentor" },
          { tipo: "Outro" },
        ];
        const { data: inserted } = await supabase
          .from("character_types")
          .insert(defaultTypes)
          .select("id, tipo");

        if (inserted && inserted.length > 0) {
          characterTypesCache = inserted as CharacterType[];
          return characterTypesCache;
        }
      }
    } catch (e) {
      console.warn("⚠️ Aviso ao buscar character_types no Supabase:", e);
    }

    return characterTypesCache || [];
  },

  // Buscar personagens de uma obra
  async getCharacters(bookId: string): Promise<Character[]> {
    const safeBookId = ensureValidUuid(bookId);
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*, character_types(id, tipo)")
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

          let ageVal = c.character_age || c.age || null;
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
                ageVal = ageVal || parsed.age || parsed.character_age || null;
              }
            } catch (e) {
              summaryStr = summaryStr || c.character_details;
            }
          }

          const typeRel = c.character_types;
          const resolvedTypeId = c.id_character_type || (typeRel ? typeRel.id : null);
          const resolvedRole = typeRel?.tipo || roleTypeStr || c.role_type || "Protagonista";

          if (typeRel && typeRel.id && typeRel.tipo) {
            if (!characterTypesCache) characterTypesCache = [];
            if (!characterTypesCache.some((t) => t.id === typeRel.id)) {
              characterTypesCache.push({ id: typeRel.id, tipo: typeRel.tipo });
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
            id_character_type: resolvedTypeId,
            character_name: c.character_name || c.name || "Personagem sem nome",
            name: c.character_name || c.name || "Personagem sem nome",
            role_type: (resolvedRole || "Protagonista") as CharacterRoleType,
            character_age: ageVal,
            age: ageVal,
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
      id_character_type?: string | null;
      character_name: string;
      role_type: CharacterRoleType;
      character_age?: string | number;
      age?: string | number;
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
        let currentUserId = null;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          currentUserId = sessionData?.session?.user?.id || null;
        } catch (authErr) {}

        await supabase.from("books").upsert([
          {
            id: safeBookId,
            id_user: currentUserId,
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

    // 2. Resolver id_character_type correspondente
    let resolvedTypeId: string | null = null;
    if (characterData.id_character_type) {
      resolvedTypeId = ensureValidUuid(characterData.id_character_type);
    } else if (characterData.role_type) {
      const types = await this.getCharacterTypes();
      const match = types.find(
        (t) => t.tipo.toLowerCase() === characterData.role_type.toLowerCase()
      );
      if (match) {
        resolvedTypeId = match.id;
      }
    }

    // 3. Montar objeto JSON serializado de detalhes (inclui idade)
    const ageValue =
      characterData.character_age !== undefined && characterData.character_age !== null
        ? characterData.character_age
        : characterData.age !== undefined && characterData.age !== null
        ? characterData.age
        : "";

    const serializedDetails = characterData.character_details || JSON.stringify({
      appearance: characterData.appearance || "",
      secrets: characterData.secrets || "",
      notes: characterData.summary || "",
      role_type: characterData.role_type || "Protagonista",
      age: ageValue ? String(ageValue).trim() : "",
    });

    const payloadPrimary: any = {
      id: safeCharId,
      id_book: safeBookId,
      character_name: characterData.character_name,
      character_personality: characterData.character_personality || null,
      character_motivations: characterData.character_motivations || null,
      character_images: characterData.character_images || [],
      character_details: serializedDetails,
      updated_at: new Date().toISOString(),
    };

    if (resolvedTypeId) {
      payloadPrimary.id_character_type = resolvedTypeId;
    }

    if (ageValue) {
      payloadPrimary.character_age = String(ageValue).trim();
    }

    const savedRecord: Character = {
      id: safeCharId,
      id_book: safeBookId,
      book_id: safeBookId,
      id_character_type: resolvedTypeId || characterData.id_character_type || null,
      character_name: characterData.character_name,
      name: characterData.character_name,
      role_type: characterData.role_type,
      character_age: ageValue || null,
      age: ageValue || null,
      character_personality: characterData.character_personality,
      character_motivations: characterData.character_motivations,
      appearance: characterData.appearance,
      secrets: characterData.secrets,
      summary: characterData.summary,
      character_details: serializedDetails,
      character_images: characterData.character_images,
      image_url: characterData.character_images && characterData.character_images.length > 0 ? characterData.character_images[0] : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. Tentar persistência no Supabase com suporte a insert/update direto
    try {
      let existsInDb = false;
      if (characterData.id) {
        const { data: existingChar } = await supabase
          .from("characters")
          .select("id")
          .eq("id", safeCharId)
          .maybeSingle();
        existsInDb = !!existingChar;
      }

      const saveOperation = existsInDb
        ? supabase.from("characters").update(payloadPrimary).eq("id", safeCharId).select().maybeSingle()
        : supabase.from("characters").insert([payloadPrimary]).select().maybeSingle();

      const { data, error } = await saveOperation;

      if (!error && data) {
        console.log("✅ [Supabase] Personagem salvo com sucesso:", data.id);
        savedRecord.id = ensureValidUuid(data.id);
        if (data.id_character_type) {
          savedRecord.id_character_type = data.id_character_type;
        }
      } else {
        if (error) {
          console.warn("⚠️ Erro na primeira tentativa de salvar no Supabase:", error.message);
        }

        // Tentar payload secundário simplificado (caso colunas adicionais não existam no esquema)
        const payloadFallback: any = {
          id: safeCharId,
          id_book: safeBookId,
          character_name: characterData.character_name,
          character_details: serializedDetails,
          updated_at: new Date().toISOString(),
        };

        if (resolvedTypeId && !error?.message?.includes("fk_characters_type")) {
          payloadFallback.id_character_type = resolvedTypeId;
        }

        const fallbackOperation = existsInDb
          ? supabase.from("characters").update(payloadFallback).eq("id", safeCharId).select().maybeSingle()
          : supabase.from("characters").insert([payloadFallback]).select().maybeSingle();

        const { data: fallbackData, error: fallbackError } = await fallbackOperation;

        if (!fallbackError && fallbackData) {
          console.log("✅ [Supabase] Personagem salvo via payload fallback:", fallbackData.id);
          savedRecord.id = ensureValidUuid(fallbackData.id);
          if (fallbackData.id_character_type) {
            savedRecord.id_character_type = fallbackData.id_character_type;
          }
        } else if (fallbackError) {
          console.error("❌ [Supabase] Erro ao salvar personagem (fallback):", fallbackError.message, fallbackError.details);
        }
      }
    } catch (err) {
      console.error("❌ Exceção ao salvar personagem:", err);
    }

    return savedRecord;
  },

  // Excluir personagem com tratamento resiliente e limpeza de vínculos (FKs)
  async deleteCharacter(characterId: string, bookId?: string): Promise<boolean> {
    const safeCharId = ensureValidUuid(characterId);
    console.log("🗑️ [characterService] Iniciando exclusão de personagem no banco de dados:", safeCharId);

    try {
      // 1. Limpar relacionamentos que referenciam este personagem para evitar violação de FK
      try {
        await supabase
          .from("relationships")
          .delete()
          .or(`from_character_id.eq.${safeCharId},to_character_id.eq.${safeCharId}`);
      } catch (relErr) {
        console.warn("⚠️ [Supabase] Aviso ao remover relacionamentos do personagem:", relErr);
      }

      // 2. Desvincular eventos de timeline que apontam para este personagem
      try {
        await supabase
          .from("timeline_events")
          .update({ id_character: null })
          .eq("id_character", safeCharId);
      } catch (tErr) {
        console.warn("⚠️ [Supabase] Aviso ao desvincular da timeline:", tErr);
      }

      // 3. Excluir o registro do personagem na tabela characters
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", safeCharId);

      if (error) {
        console.error("❌ [Supabase] Erro ao excluir personagem:", error.message, error.details);

        // Fallback: tentar exclusão combinada com id_book se disponível
        if (bookId) {
          const safeBookId = ensureValidUuid(bookId);
          const { error: fbErr } = await supabase
            .from("characters")
            .delete()
            .match({ id: safeCharId, id_book: safeBookId });

          if (!fbErr) {
            console.log("✅ [Supabase] Personagem excluído via fallback com id_book:", safeCharId);
            return true;
          }
        }
        return false;
      }

      console.log("✅ [Supabase] Personagem excluído com sucesso:", safeCharId);
      return true;
    } catch (err) {
      console.error("❌ [characterService] Exceção ao excluir personagem:", err);
      return false;
    }
  },
};
