export type ScenarioType =
  | "Cidade"
  | "Edifício"
  | "Reino / Região"
  | "Floresta / Natureza"
  | "Interior"
  | "Fantástico / Mágico"
  | "Outro";

export interface Scenario {
  id: string;
  id_book: string;
  name: string;
  type?: ScenarioType | string;
  description?: string | null;
  sensory_details?: string | null;
  history_notes?: string | null;
  images?: string[] | null;
  associated_character_ids?: string[] | null;
  created_at: string;
  updated_at?: string;
}
