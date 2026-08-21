import { supabase } from "../supabaseClient";
import type { BookCollaborator, CollaboratorRole, InvitationStatus } from "../types/collaborator";
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
          status: (c.status || "accepted") as InvitationStatus,
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

  // Adicionar/Convidar um novo colaborador por e-mail (status 'pending')
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
      status: "pending",
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
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("book_collaborators")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        console.log("✅ [Supabase] Convite de colaborador criado com sucesso:", data.id);
        newCollaborator.id = ensureValidUuid(data.id);
      } else if (error) {
        console.warn("⚠️ [Supabase] Erro ao salvar colaborador remoto (mantido no cache local):", error.message);
      }
    } catch (err) {
      console.error("Exceção ao salvar colaborador:", err);
    }

    return newCollaborator;
  },

  // Buscar convites pendentes associados ao e-mail do usuário convidado
  async getPendingInvitations(userEmail?: string): Promise<BookCollaborator[]> {
    if (!userEmail) return [];
    const cleanEmail = userEmail.trim().toLowerCase();
    const invitationsMap = new Map<string, BookCollaborator>();

    try {
      // 1. Buscar no Supabase onde user_email = cleanEmail e status = 'pending'
      const { data, error } = await supabase
        .from("book_collaborators")
        .select("*")
        .eq("user_email", cleanEmail)
        .eq("status", "pending");

      if (!error && data && data.length > 0) {
        const bookIds = data.map((c: any) => ensureValidUuid(c.id_book));
        
        // Buscar títulos das obras correspondentes
        const { data: booksData } = await supabase
          .from("books")
          .select("id, book_name")
          .in("id", bookIds);

        const bookTitleMap = new Map<string, string>();
        if (booksData) {
          booksData.forEach((b: any) => {
            bookTitleMap.set(ensureValidUuid(b.id), b.book_name || "Obra sem título");
          });
        }

        data.forEach((c: any) => {
          const safeId = ensureValidUuid(c.id);
          const safeBookId = ensureValidUuid(c.id_book);
          invitationsMap.set(safeId, {
            id: safeId,
            id_book: safeBookId,
            user_email: cleanEmail,
            user_name: c.user_name || cleanEmail.split("@")[0],
            role: (c.role || "editor") as CollaboratorRole,
            status: "pending",
            book_name: bookTitleMap.get(safeBookId) || "Obra sem título",
            created_at: c.created_at,
          });
        });
      }

      // 2. Checar cache local para convites pendentes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_KEY_PREFIX)) {
          const bookId = key.replace(LOCAL_KEY_PREFIX, "");
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const list: BookCollaborator[] = JSON.parse(raw);
              const match = list.find(
                (c) => c.user_email?.toLowerCase() === cleanEmail && c.status === "pending"
              );
              if (match && !invitationsMap.has(match.id)) {
                invitationsMap.set(match.id, {
                  ...match,
                  id_book: ensureValidUuid(bookId),
                  book_name: match.book_name || "Obra sem título",
                });
              }
            } catch (e) {}
          }
        }
      }

      return Array.from(invitationsMap.values());
    } catch (err) {
      console.error("Exceção ao buscar convites pendentes:", err);
      return Array.from(invitationsMap.values());
    }
  },

  // Aceitar ou Recusar um convite de colaboração
  async respondToInvitation(
    invitationId: string,
    bookId: string,
    accept: boolean
  ): Promise<boolean> {
    const safeCollabId = ensureValidUuid(invitationId);
    const safeBookId = ensureValidUuid(bookId);
    const localKey = `${LOCAL_KEY_PREFIX}${safeBookId}`;

    // 1. Atualizar cache local
    try {
      const current = await this.getCollaborators(safeBookId);
      let updated: BookCollaborator[];
      if (accept) {
        updated = current.map((c) => (c.id === safeCollabId ? { ...c, status: "accepted" } : c));
      } else {
        updated = current.filter((c) => c.id !== safeCollabId);
      }
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}

    // 2. Atualizar no Supabase
    try {
      if (accept) {
        const { error } = await supabase
          .from("book_collaborators")
          .update({ status: "accepted" })
          .eq("id", safeCollabId);

        if (error) {
          console.warn("⚠️ [Supabase] Erro ao aceitar convite (atualizado localmente):", error.message);
        }
      } else {
        const { error } = await supabase
          .from("book_collaborators")
          .delete()
          .eq("id", safeCollabId);

        if (error) {
          console.warn("⚠️ [Supabase] Erro ao deletar convite recusado:", error.message);
        }
      }

      return true;
    } catch (err) {
      console.error("Exceção ao responder convite:", err);
      return true;
    }
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
