import { supabase } from "../supabaseClient";
import type { BookCollaborator, CollaboratorRole } from "../types/collaborator";
import { ensureValidUuid, ensureParentBookExists } from "../utils/uuidUtils";

const LOCAL_KEY_PREFIX = "writr_collaborators_";

export const collaboratorService = {
  // Buscar colaboradores de uma obra
  async getCollaborators(bookId: string): Promise<BookCollaborator[]> {
    const safeBookId = ensureValidUuid(bookId);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;

    let localList: BookCollaborator[] = [];
    try {
      const saved = localStorage.getItem(localKey);
      localList = saved ? JSON.parse(saved) : [];
    } catch (e) {}

    try {
      const { data, error } = await supabase
        .from("book_collaborators")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("⚠️ [Supabase] Tabela 'book_collaborators' não encontrada ou inacessível, usando armazenamento local:", error.message);
        return localList;
      }

      if (data && data.length > 0) {
        const remoteList = data.map((c: any) => ({
          id: ensureValidUuid(c.id),
          id_book: safeBookId,
          user_email: c.user_email,
          user_name: c.user_name || c.user_email?.split("@")[0] || "Co-Autor",
          role: (c.role || "editor") as CollaboratorRole,
          created_at: c.created_at,
        })) as BookCollaborator[];

        try {
          localStorage.setItem(localKey, JSON.stringify(remoteList));
        } catch (e) {}

        return remoteList;
      }

      return localList;
    } catch (err) {
      console.error("Exceção ao buscar colaboradores:", err);
      return localList;
    }
  },

  // Adicionar/Convidar um novo colaborador por e-mail
  async addCollaborator(
    bookId: string,
    userEmail: string,
    role: CollaboratorRole = "editor",
    userName?: string
  ): Promise<BookCollaborator> {
    const safeBookId = ensureValidUuid(bookId);
    const generatedId = ensureValidUuid();
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;
    const cleanEmail = userEmail.trim().toLowerCase();
    const displayName = userName || cleanEmail.split("@")[0];

    await ensureParentBookExists(safeBookId);

    const newCollaborator: BookCollaborator = {
      id: generatedId,
      id_book: safeBookId,
      user_email: cleanEmail,
      user_name: displayName,
      role: role,
      created_at: new Date().toISOString(),
    };

    // 1. Atualizar cache local síncrono
    try {
      const current = await this.getCollaborators(safeBookId);
      const filtered = current.filter((c) => c.user_email !== cleanEmail);
      const updated = [...filtered, newCollaborator];
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}

    // 2. Persistir no Supabase
    try {
      const payload: any = {
        id: generatedId,
        id_book: safeBookId,
        user_email: cleanEmail,
        user_name: displayName,
        role: role,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("book_collaborators")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        console.log("✅ [Supabase] Colaborador convidado com sucesso:", data.id);
        newCollaborator.id = ensureValidUuid(data.id);
      } else if (error) {
        console.warn("⚠️ [Supabase] Erro ao salvar colaborador remoto (mantido no cache local):", error.message);
      }
    } catch (err) {
      console.error("Exceção ao salvar colaborador:", err);
    }

    return newCollaborator;
  },

  // Remover colaborador
  async removeCollaborator(bookId: string, collaboratorId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    const safeCollabId = ensureValidUuid(collaboratorId);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;

    // 1. Atualizar localStorage
    try {
      const current = await this.getCollaborators(safeBookId);
      const updated = current.filter((c) => c.id !== safeCollabId);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}

    // 2. Remover no Supabase
    try {
      const { error } = await supabase
        .from("book_collaborators")
        .delete()
        .eq("id", safeCollabId);

      if (error) {
        console.warn("⚠️ [Supabase] Erro ao deletar colaborador remoto:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao deletar colaborador:", err);
      return false;
    }
  },
};
