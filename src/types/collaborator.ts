export type CollaboratorRole = "owner" | "editor" | "viewer";

export interface BookCollaborator {
  id: string;
  id_book: string;
  user_email: string;
  user_name?: string | null;
  role: CollaboratorRole;
  created_at?: string;
}

export interface UserPresence {
  user_id: string;
  user_name: string;
  color: string;
  active_at: string;
  cursor?: {
    from: number;
    to: number;
  };
}
