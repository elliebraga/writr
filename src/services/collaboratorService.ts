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
          user_email: c.user_email || c.email || "",
          user_name: c.user_name || c.user_email?.split("@")[0] || c.email?.split("@")[0] || "Co-Autor",
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

  // Adicionar/Convidar um novo colaborador por e-mail (com resiliência total para e-mail e status no Supabase)
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

    // 1. Atualizar cache local síncrono imediatamente
    try {
      const current = await this.getCollaborators(safeBookId);
      const filtered = current.filter((c) => c.user_email !== cleanEmail);
      const updated = [...filtered, newCollaborator];
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}

    // 2. Persistir no Supabase com resiliência de colunas (tentativa 1: user_email + status, tentativa 2: sem status, tentativa 3: email)
    try {
      const payloadPrimary: any = {
        id: generatedId,
        id_book: safeBookId,
        user_email: cleanEmail,
        user_name: displayName,
        role: role,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      let { data, error } = await supabase
        .from("book_collaborators")
        .insert([payloadPrimary])
        .select()
        .single();

      // Se falhar (ex: a coluna 'status' não existe ainda no Supabase do projeto)
      if (error) {
        console.warn("⚠️ [Supabase] Tentativa 1 de salvamento de colaborador falhou:", error.message);
        
        const payloadFallback1: any = {
          id: generatedId,
          id_book: safeBookId,
          user_email: cleanEmail,
          user_name: displayName,
          role: role,
          created_at: new Date().toISOString(),
        };

        const res2 = await supabase
          .from("book_collaborators")
          .insert([payloadFallback1])
          .select()
          .single();

        data = res2.data;
        error = res2.error;

        if (error) {
          console.warn("⚠️ [Supabase] Tentativa 2 de salvamento falhou:", error.message);

          const payloadFallback2: any = {
            id: generatedId,
            id_book: safeBookId,
            email: cleanEmail,
            user_name: displayName,
            role: role,
          };

          const res3 = await supabase
            .from("book_collaborators")
            .insert([payloadFallback2])
            .select()
            .single();

          data = res3.data;
          error = res3.error;
        }
      }

      if (!error && data) {
        console.log("✅ [Supabase] Colaborador e e-mail salvos no banco remoto com sucesso:", data.id);
        newCollaborator.id = ensureValidUuid(data.id);
      } else if (error) {
        console.error("❌ [Supabase] Erro ao salvar colaborador no banco remoto:", error.message);
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
      // 1. Buscar no Supabase por user_email ou email
      const data: any[] = [];

      const { data: d1 } = await supabase
        .from("book_collaborators")
        .select("*")
        .eq("user_email", cleanEmail)
        .eq("status", "pending");

      if (d1 && d1.length > 0) {
        data.push(...d1);
      }

      const { data: d2 } = await supabase
        .from("book_collaborators")
        .select("*")
        .eq("email", cleanEmail)
        .eq("status", "pending");

      if (d2 && d2.length > 0) {
        d2.forEach((item: any) => {
          if (!data.some((existing) => existing.id === item.id)) {
            data.push(item);
          }
        });
      }

      if (data && data.length > 0) {
        const bookIds = data.map((c: any) => ensureValidUuid(c.id_book));
        
        // Buscar títulos das obras correspondentes (se o RLS permitir)
        const bookTitleMap = new Map<string, string>();
        try {
          const { data: booksData } = await supabase
            .from("books")
            .select("id, book_name")
            .in("id", bookIds);

          if (booksData) {
            booksData.forEach((b: any) => {
              bookTitleMap.set(ensureValidUuid(b.id), b.book_name || "Obra Compartilhada");
            });
          }
        } catch (e) {}

        // Tentar obter nome de obras também dos livros locais salvos
        try {
          const savedLocal = localStorage.getItem("writr_local_books");
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            parsed.forEach((b: any) => {
              const id = ensureValidUuid(b.id);
              if (!bookTitleMap.has(id) && b.book_name) {
                bookTitleMap.set(id, b.book_name);
              }
            });
          }
        } catch (e) {}

        data.forEach((c: any) => {
          const safeId = ensureValidUuid(c.id);
          const safeBookId = ensureValidUuid(c.id_book);
          const emailVal = c.user_email || c.email || cleanEmail;

          invitationsMap.set(safeId, {
            id: safeId,
            id_book: safeBookId,
            user_email: emailVal,
            user_name: c.user_name || emailVal.split("@")[0],
            role: (c.role || "editor") as CollaboratorRole,
            status: "pending",
            book_name: c.book_name || bookTitleMap.get(safeBookId) || "Obra Compartilhada",
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
                (c) => (c.user_email?.toLowerCase() === cleanEmail) && c.status === "pending"
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
