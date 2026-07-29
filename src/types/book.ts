export type BookStatus = "Idea" | "Draft" | "Writing" | "rascunho" | "privado" | "publicado";

export interface Book {
  id: string;
  id_user?: string | null;
  book_name: string;
  expected_pages?: number | null;
  synopsis?: string | null;
  resume?: string | null;
  cover_url?: string | null;
  image_ref?: string | null;
  status: BookStatus;
  created_at: string;
  updated_at?: string;
}

export interface Chapter {
  id: string;
  id_book: string; // Coluna oficial da tabela public.chapters no Supabase
  book_id?: string; // Alias de compatibilidade
  title: string;
  text?: string | null; // Coluna oficial da tabela public.chapters no Supabase
  content: string; // Alias de compatibilidade
  synopsis?: string | null;
  word_count: number;
  order_index: number;
  created_at: string;
  updated_at?: string;
}
