export interface TimelineEvent {
  id: string;
  id_book: string;
  id_character?: string | null; // NULL se for evento geral da história
  event_date: string; // Ex: "Ano 240", "15 de Outubro"
  location: string; // Ex: "Grande Salão", "Deserto"
  description: string; // O que aconteceu
  created_at: string;
  updated_at?: string;
}
