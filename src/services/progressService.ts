export const progressService = {
  /**
   * Obtém o progresso diário de escrita para uma determinada obra.
   * Retorna um mapa onde a chave é a data (AAAA-MM-DD) e o valor é a quantidade de palavras escritas.
   */
  getDailyProgress(bookId: string): Record<string, number> {
    const key = `writr_progress_${bookId}`;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Erro ao ler progresso diário:", e);
      return {};
    }
  },

  /**
   * Registra a variação (delta) de palavras escritas na data de hoje.
   */
  recordProgress(bookId: string, delta: number): void {
    if (delta <= 0) return; // Apenas contabiliza novas palavras escritas
    
    const key = `writr_progress_${bookId}`;
    const today = new Date().toISOString().split("T")[0]; // AAAA-MM-DD
    
    try {
      const progress = this.getDailyProgress(bookId);
      progress[today] = (progress[today] || 0) + delta;
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (e) {
      console.error("Erro ao registrar progresso diário:", e);
    }
  },
};
