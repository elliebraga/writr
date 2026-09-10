import { supabase } from "../supabaseClient";
import { ensureValidUuid } from "../utils/uuidUtils";

export const progressService = {
  /**
   * Obtém o progresso diário de escrita do localStorage (modo síncrono para render imediato).
   */
  getDailyProgressSync(bookId: string): Record<string, number> {
    const key = `writr_progress_${bookId}`;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Obtém o progresso diário de escrita para uma determinada obra buscando no Supabase e mesclando com o cache local.
   * Retorna um mapa onde a chave é a data (AAAA-MM-DD) e o valor é a quantidade de palavras escritas.
   */
  async getDailyProgress(bookId: string): Promise<Record<string, number>> {
    const safeBookId = ensureValidUuid(bookId);
    const localProgress = this.getDailyProgressSync(safeBookId);
    const resultMap: Record<string, number> = { ...localProgress };

    try {
      const { data, error } = await supabase
        .from("writing_progress")
        .select("date, words_written")
        .eq("id_book", safeBookId);

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          if (row.date) {
            // Se houver conflito, pega o maior valor entre o banco e o local
            resultMap[row.date] = Math.max(resultMap[row.date] || 0, row.words_written || 0);
          }
        });

        // Atualiza cache local
        try {
          localStorage.setItem(`writr_progress_${safeBookId}`, JSON.stringify(resultMap));
        } catch (e) {}
      }
    } catch (err) {
      console.warn("⚠️ [Supabase] Tabela writing_progress não disponível ainda, usando cache local:", err);
    }

    return resultMap;
  },

  /**
   * Registra a variação (delta) de palavras escritas na data de hoje.
   * Atualiza sincronamente o localStorage e persiste de forma assíncrona no Supabase.
   */
  async recordProgress(bookId: string, delta: number, userId?: string): Promise<void> {
    if (delta <= 0) return; // Apenas contabiliza novas palavras escritas

    const safeBookId = ensureValidUuid(bookId);
    const today = new Date().toISOString().split("T")[0]; // AAAA-MM-DD
    const key = `writr_progress_${safeBookId}`;

    // 1. Atualização Síncrona no localStorage
    let updatedTodayTotal = delta;
    try {
      const progress = this.getDailyProgressSync(safeBookId);
      progress[today] = (progress[today] || 0) + delta;
      updatedTodayTotal = progress[today];
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (e) {
      console.error("Erro ao registrar progresso no localStorage:", e);
    }

    // 2. Persistência no Supabase (tabela writing_progress)
    try {
      const payload = {
        id_book: safeBookId,
        id_user: userId || null,
        date: today,
        words_written: updatedTodayTotal,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("writing_progress")
        .upsert(payload, { onConflict: "id_book,date" });

      if (error) {
        console.warn("⚠️ [Supabase] Erro ao sincronizar writing_progress (execute supabase_schema_progress.sql se a tabela não existir):", error.message);
      }
    } catch (err) {
      console.warn("Exceção ao persistir progresso diário no Supabase:", err);
    }
  },

  /**
   * Calcula a sequência (streak) de dias consecutivos de escrita a partir de um dicionário de progresso.
   */
  calculateStreak(progress: Record<string, number>): number {
    let streak = 0;
    const checkDate = new Date();
    const todayStr = checkDate.toISOString().split("T")[0];

    // Se ainda não escreveu hoje, começa verificando a partir de ontem para não quebrar a sequência
    const todayWords = progress[todayStr] || 0;
    if (todayWords === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if ((progress[dateStr] || 0) > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },
};
