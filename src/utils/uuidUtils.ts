import { supabase } from "../supabaseClient";

export function ensureValidUuid(id?: string | null): string {
  if (!id) {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0");
  }

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(id)) {
    return id;
  }

  const cleanDigits = id.replace(/\D/g, "");
  const paddedHex = (cleanDigits || "0").slice(-12).padStart(12, "0");
  return `00000000-0000-4000-8000-${paddedHex}`;
}

export async function ensureParentBookExists(bookId: string, bookName: string = "Obra"): Promise<void> {
  const safeBookId = ensureValidUuid(bookId);
  try {
    const { data: bookCheck } = await supabase
      .from("books")
      .select("id")
      .eq("id", safeBookId)
      .maybeSingle();

    if (!bookCheck) {
      console.log(`ℹ️ [Supabase] Obra pai (${safeBookId}) não encontrada no banco. Criando registro pai automaticamente...`);
      await supabase.from("books").upsert([
        {
          id: safeBookId,
          book_name: bookName,
          status: "rascunho",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (e) {
    console.warn("⚠️ [Supabase] Aviso ao verificar/criar obra pai:", e);
  }
}
