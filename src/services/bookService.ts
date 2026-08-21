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

      // 2. Buscar livros compartilhados com o e-mail do usuário (Collaborator)
      if (userEmail) {
        const cleanEmail = userEmail.trim().toLowerCase();
        const { data: collabRows, error: collabError } = await supabase
          .from("book_collaborators")
          .select("id_book, role")
          .eq("user_email", cleanEmail);

        if (!collabError && collabRows && collabRows.length > 0) {
          const collabBookIds = collabRows
            .map((c: any) => ensureValidUuid(c.id_book))
            .filter((id: string) => !booksMap.has(id));

          if (collabBookIds.length > 0) {
            const { data: sharedData, error: sharedError } = await supabase
              .from("books")
              .select("*")
              .in("id", collabBookIds);

            if (!sharedError && sharedData && sharedData.length > 0) {
              const roleMap = new Map<string, any>();
              collabRows.forEach((c: any) => {
                roleMap.set(ensureValidUuid(c.id_book), c.role || "editor");
              });

              sharedData.forEach((b: any) => {
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
                  is_shared: true,
                  user_role: roleMap.get(id) || "editor",
                });
              });
            }
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

  // Criar uma nova obra
  async createBook(bookData: {
    book_name: string;
    expected_pages?: number;
    synopsis?: string;
    cover_url?: string;
    status: BookStatus;
    userId?: string;
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
