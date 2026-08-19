import { supabase } from "../supabaseClient";
import type { Scenario } from "../types/scenario";
import { ensureValidUuid } from "../utils/uuidUtils";

const LOCAL_STORAGE_KEY_PREFIX = "writr_scenarios_";

export const scenarioService = {
  // Buscar cenários de uma obra
  async getScenarios(bookId: string): Promise<Scenario[]> {
    const safeBookId = ensureValidUuid(bookId);

    // Tenta carregar do Supabase primeiro
    try {
      const { data, error } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          id: ensureValidUuid(item.id),
          id_book: safeBookId,
          name: item.name || item.scenario_name || "Cenário sem nome",
          type: item.type || item.scenario_type || "Outro",
          images: item.images || item.reference_images || [],
          associated_character_ids: item.associated_character_ids || [],
        })) as Scenario[];
      }
    } catch (err) {
      console.warn("Tabela 'scenarios' não encontrada no Supabase, usando armazenamento local:", err);
    }

    // Fallback LocalStorage
    try {
      const localData = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${safeBookId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Erro ao ler cenários do localStorage:", e);
    }

    return [];
  },

  // Salvar (criar ou atualizar) cenário
  async saveScenario(
    bookId: string,
    scenarioData: Partial<Scenario> & { name: string }
  ): Promise<Scenario> {
    const safeBookId = ensureValidUuid(bookId);
    const safeScenarioId = ensureValidUuid(scenarioData.id);

    const now = new Date().toISOString();

    const scenarioToSave: Scenario = {
      id: safeScenarioId,
      id_book: safeBookId,
      name: scenarioData.name,
      type: scenarioData.type || "Outro",
      description: scenarioData.description || null,
      sensory_details: scenarioData.sensory_details || null,
      history_notes: scenarioData.history_notes || null,
      images: scenarioData.images || [],
      associated_character_ids: scenarioData.associated_character_ids || [],
      created_at: scenarioData.created_at || now,
      updated_at: now,
    };

    // Tenta salvar no Supabase
    try {
      const payload: any = {
        id: safeScenarioId,
        id_book: safeBookId,
        name: scenarioToSave.name,
        type: scenarioToSave.type,
        description: scenarioToSave.description,
        sensory_details: scenarioToSave.sensory_details,
        history_notes: scenarioToSave.history_notes,
        images: scenarioToSave.images,
        associated_character_ids: scenarioToSave.associated_character_ids,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("scenarios")
        .upsert([payload])
        .select()
        .single();

      if (!error && data) {
        scenarioToSave.id = ensureValidUuid(data.id);
      }
    } catch (err) {
      console.warn("Erro ao persistir cenário no Supabase:", err);
    }

    // Salva sempre também no LocalStorage para redundância e resiliência
    try {
      const currentList = await this.getScenarios(safeBookId);
      const existingIdx = currentList.findIndex((s) => s.id === scenarioToSave.id);

      let updatedList: Scenario[];
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = scenarioToSave;
      } else {
        updatedList = [...currentList, scenarioToSave];
      }

      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${safeBookId}`, JSON.stringify(updatedList));
    } catch (e) {
      console.error("Erro ao salvar cenário no localStorage:", e);
    }

    return scenarioToSave;
  },

  // Excluir cenário
  async deleteScenario(bookId: string, scenarioId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    const safeScenarioId = ensureValidUuid(scenarioId);

    // Tenta remover do Supabase
    try {
      await supabase.from("scenarios").delete().eq("id", safeScenarioId);
    } catch (err) {
      console.warn("Exceção ao remover do Supabase:", err);
    }

    // Remove do LocalStorage
    try {
      const currentList = await this.getScenarios(safeBookId);
      const updatedList = currentList.filter((s) => s.id !== safeScenarioId);
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${safeBookId}`, JSON.stringify(updatedList));
      return true;
    } catch (e) {
      console.error("Erro ao remover cenário do localStorage:", e);
      return false;
    }
  },
};
