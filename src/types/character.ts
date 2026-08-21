export type CharacterRoleType =
  | "Protagonista"
  | "Antagonista"
  | "Secundário"
  | "Coadjuvante"
  | "Mentor"
  | "Outro";

export interface Character {
  id: string;
  id_book: string; // Tabela public.characters
  id_character_type?: string | null;
  character_name: string;
  character_sign?: string | null; // Signo / Arquétipo
  character_personality?: string | null; // Personalidade
  character_images?: string[] | null; // Array de imagens do personagem
  character_motivations?: string | null; // Campo oficial de Motivações
  character_details?: string | null; // Detalhes gerais e serialização

  // Campos separados de Ficha (UI)
  appearance?: string | null; // Aparência Física
  secrets?: string | null; // Segredos
  summary?: string | null; // Resumo / Apresentação

  // Aliases de compatibilidade
  book_id?: string;
  name?: string;
  role_type?: CharacterRoleType | string | null;
  image_url?: string | null;
  created_at: string;
  updated_at?: string;
}
