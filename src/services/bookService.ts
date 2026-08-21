import { supabase } from "../supabaseClient";
import type { Book, BookStatus } from "../types/book";
import { ensureValidUuid } from "../utils/uuidUtils";

export const DEFAULT_USER_ID = "a3d665b8-36b8-4e40-9799-b18e71950cfa";

export const bookService = {
  // Buscar todas as obras (próprias + compartilhadas com o usuário)
  async getBooks(userId?: string, userEmail?: string): Promise<Book[]> {
    const booksMap = new Map<string, Book>();

    try {
      // 1. Buscar livros do próprio usuário (Owner)
      let query = supabase.from("books").select("*");
      if (userId) {
        query = query.eq("id_user", userId);
      } else {
        query = query.is("id_user", null);
      }
      const { data: ownedData, error: ownedError } = await query.order("created_at", { ascending: false });

      if (ownedError) {
        console.error("Erro ao buscar livros próprios do Supabase:", ownedError.message);
      } else if (ownedData && ownedData.length > 0) {
        ownedData.forEach((b: any) => {
          const id = ensureValidUuid(b.id);
          booksMap.set(id, {
            ...b,
            id,
            book_name: b.book_name || "Sem título",
            synopsis: b.resume || b.synopsis || "",
            resume: b.resume || b.synopsis || "",
            cover_url: b.image_ref || b.cover_url || "",
            image_ref: b.image_ref || b.cover_url || "",
            status: b.status || "rascunho",
            is_shared: false,
            user_role: "owner",
          });
        });
      }

      // 2. Buscar livros compartilhados aceitos ou pendentes com o e-mail do usuário (Collaborator)
      if (userEmail) {
        const cleanEmail = userEmail.trim().toLowerCase();
        
        const collabRows: any[] = [];
        
        // Consulta direta 1: user_email
        const { data: c1 } = await supabase
          .from("book_collaborators")
          .select("id_book, role, status, user_email, email, book_name")
          .eq("user_email", cleanEmail);

        if (c1 && c1.length > 0) {
          collabRows.push(...c1);
        }

        // Consulta direta 2: email
        const { data: c2 } = await supabase
          .from("book_collaborators")
          .select("id_book, role, status, user_email, email, book_name")
          .eq("email", cleanEmail);

        if (c2 && c2.length > 0) {
          c2.forEach((item: any) => {
            if (!collabRows.some((existing) => existing.id_book === item.id_book)) {
              collabRows.push(item);
            }
          });
        }

        if (collabRows.length > 0) {
          const collabBookIds = collabRows
            .map((c: any) => ensureValidUuid(c.id_book))
            .filter((id: string) => !booksMap.has(id));

          if (collabBookIds.length > 0) {
            const roleMap = new Map<string, any>();
            const nameMap = new Map<string, any>();

            collabRows.forEach((c: any) => {
              const bId = ensureValidUuid(c.id_book);
              roleMap.set(bId, c.role || "editor");
              if (c.book_name) nameMap.set(bId, c.book_name);
            });

            const { data: sharedData, error: sharedError } = await supabase
              .from("books")
              .select("*")
              .in("id", collabBookIds);

            if (!sharedError && sharedData && sharedData.length > 0) {
              sharedData.forEach((b: any) => {
                const id = ensureValidUuid(b.id);
                booksMap.set(id, {
                  ...b,
                  id,
                  book_name: b.book_name || nameMap.get(id) || "Obra Compartilhada",
                  synopsis: b.resume || b.synopsis || "",
                  resume: b.resume || b.synopsis || "",
                  cover_url: b.image_ref || b.cover_url || "",
                  image_ref: b.image_ref || b.cover_url || "",
                  status: b.status || "rascunho",
                  is_shared: true,
                  user_role: roleMap.get(id) || "editor",
                });
              });
            }

            // Fallback resiliente: Se o RLS do Supabase bloqueou a leitura da tabela 'books' para este usuário
            collabBookIds.forEach((bookId) => {
              if (!booksMap.has(bookId)) {
                let localName = nameMap.get(bookId) || "Obra Compartilhada";
                try {
                  const savedLocal = localStorage.getItem("writr_local_books");
                  if (savedLocal) {
                    const parsed = JSON.parse(savedLocal);
                    const found = parsed.find((b: any) => ensureValidUuid(b.id) === bookId);
                    if (found && found.book_name) localName = found.book_name;
                  }
                } catch (e) {}

                booksMap.set(bookId, {
                  id: bookId,
                  book_name: localName,
                  synopsis: "Você tem acesso a esta obra como colaborador.",
                  resume: "Você tem acesso a esta obra como colaborador.",
                  cover_url: "",
                  image_ref: "",
                  status: "rascunho",
                  is_shared: true,
                  user_role: roleMap.get(bookId) || "editor",
                  created_at: new Date().toISOString(),
                });
              }
            });
          }
        }

        // 3. Fallback para cache local de colaboradores
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("writr_collaborators_")) {
              const bookId = key.replace("writr_collaborators_", "");
              if (!booksMap.has(bookId)) {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const list = JSON.parse(raw);
                  const match = list.find((c: any) => c.user_email?.toLowerCase() === cleanEmail);
                  if (match) {
                    const { data: singleBook } = await supabase
                      .from("books")
                      .select("*")
                      .eq("id", bookId)
                      .single();

                    if (singleBook) {
                      const id = ensureValidUuid(singleBook.id);
                      booksMap.set(id, {
                        ...singleBook,
                        id,
                        book_name: singleBook.book_name || "Sem título",
                        synopsis: singleBook.resume || singleBook.synopsis || "",
                        resume: singleBook.resume || singleBook.synopsis || "",
                        cover_url: singleBook.image_ref || singleBook.cover_url || "",
                        image_ref: singleBook.image_ref || singleBook.cover_url || "",
                        status: singleBook.status || "rascunho",
                        is_shared: true,
                        user_role: match.role || "editor",
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (e) {}
      }

      return Array.from(booksMap.values());
    } catch (err) {
      console.error("Exceção ao buscar livros:", err);
      return Array.from(booksMap.values());
    }
  },

  // Criar uma nova obra (com registro automático N:N do criador em book_collaborators)
  async createBook(bookData: {
    book_name: string;
    expected_pages?: number;
    synopsis?: string;
    cover_url?: string;
    status: BookStatus;
    userId?: string;
    userEmail?: string;
    userName?: string;
  }): Promise<Book> {
    const generatedId = ensureValidUuid();
    const userId = bookData.userId || null;

    const newBook: Book = {
      id: generatedId,
      id_user: userId,
      book_name: bookData.book_name,
      expected_pages: bookData.expected_pages,
      synopsis: bookData.synopsis,
      resume: bookData.synopsis,
      cover_url: bookData.cover_url,
      image_ref: bookData.cover_url,
      status: bookData.status || "rascunho",
      is_shared: false,
      user_role: "owner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const payload: any = {
        id: generatedId,
        id_user: userId,
        book_name: bookData.book_name,
        resume: bookData.synopsis || null,
        image_ref: bookData.cover_url || null,
        status: "rascunho",
      };

      const { data, error } = await supabase
        .from("books")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        newBook.id = ensureValidUuid(data.id);
      } else if (error) {
        console.error("Erro no Supabase ao criar livro:", error.message);
      }

      // Registrar o criador na relação N:N (book_collaborators) com role 'owner' e status 'accepted'
      if (bookData.userEmail) {
        try {
          const collabId = ensureValidUuid();
          const cleanEmail = bookData.userEmail.trim().toLowerCase();
          const ownerName = bookData.userName || cleanEmail.split("@")[0];

          await supabase.from("book_collaborators").insert([
            {
              id: collabId,
              id_book: newBook.id,
              user_email: cleanEmail,
              user_name: ownerName,
              role: "owner",
              status: "accepted",
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (collabErr) {
          console.warn("Aviso ao vincular criador na relação N:N:", collabErr);
        }
      }
    } catch (err) {
      console.error("Exceção ao criar livro:", err);
    }

    return newBook;
  },

  // Excluir uma obra
  async deleteBook(bookId: string): Promise<boolean> {
    const safeBookId = ensureValidUuid(bookId);
    try {
      const { error } = await supabase.from("books").delete().eq("id", safeBookId);
      if (error) {
        console.error("Erro ao excluir livro:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exceção ao excluir livro:", err);
      return false;
    }
  },
};
