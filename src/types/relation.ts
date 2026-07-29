export type RelationPresetType =
  | "Aliados"
  | "Inimigos"
  | "Família"
  | "Amor"
  | "Mentor"
  | "Rival"
  | "Outro";

export interface NodePosition {
  x: number;
  y: number;
}

export interface CharacterRelationLink {
  id: string;
  from_character_id: string;
  to_character_id: string;
  label: string;
  description?: string; // Explicação detalhada da relação
  line_style?: "solid" | "dashed";
  color?: string;
  created_at?: string;
}

export interface RelationsData {
  nodes: Record<string, NodePosition>; // Mapeia character_id -> { x, y }
  links: CharacterRelationLink[];
}
