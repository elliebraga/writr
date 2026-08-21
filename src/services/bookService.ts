import { supabase } from "../supabaseClient";
import type { Book, BookStatus } from "../types/book";
import { ensureValidUuid } from "../utils/uuidUtils";

export const DEFAULT_USER_ID = "a3d665b8-36b8-4e40-9799-b18e71950cfa";

export const bookService = {
  // Buscar todas as obras do usuário logado
  async getBooks(userId?: string): Promise<Book[]> {
    const booksMap = new Map<string, Book>();

    try {
      let query = supabase.from("books").select("*");
      if (userId) {
        query = query.eq("id_user", userId);
      } else {
        query = query.is("id_user", null);
      }
      
      const { data: ownedData, error: ownedError } = await query.order("created_at", { ascending: false });

      if (ownedError) {
        console.error("Erro ao buscar livros do Supabase:", ownedError.message);
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
          });
        });
      }

      // Fallback para cache local se a busca no Supabase não retornar dados
      if (booksMap.size === 0) {
        try {
          const savedLocal = localStorage.getItem("writr_local_books");
          if (savedLocal) {
            const parsed: Book[] = JSON.parse(savedLocal);
            parsed.forEach((b) => {
              const id = ensureValidUuid(b.id);
              booksMap.set(id, { ...b, id });
            });
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
