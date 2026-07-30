import { supabase } from "../supabaseClient";
import type { Book, BookStatus } from "../types/book";
import { ensureValidUuid } from "../utils/uuidUtils";

export const DEFAULT_USER_ID = "a3d665b8-36b8-4e40-9799-b18e71950cfa";

export const bookService = {
  // Buscar todas as obras
  async getBooks(userId?: string): Promise<Book[]> {
    try {
      let query = supabase.from("books").select("*");
      if (userId) {
        query = query.or(`id_user.eq.${userId},id_user.is.null`);
      }
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar livros do Supabase:", error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((b: any) => ({
          ...b,
          id: ensureValidUuid(b.id),
          book_name: b.book_name || "Sem título",
          synopsis: b.resume || b.synopsis || "",
          resume: b.resume || b.synopsis || "",
          cover_url: b.image_ref || b.cover_url || "",
          image_ref: b.image_ref || b.cover_url || "",
          status: b.status || "rascunho",
        })) as Book[];
      }

      return [];
    } catch (err) {
      console.error("Exceção ao buscar livros:", err);
      return [];
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
    const userId = bookData.userId || DEFAULT_USER_ID;

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
