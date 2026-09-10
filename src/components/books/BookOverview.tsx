import React, { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Calendar,
  Award,
  PenTool,
  Flame,
  BarChart2,
  Target,
  Sliders,
} from "lucide-react";
import type { Book, Chapter } from "../../types/book";
import { chapterService } from "../../services/chapterService";
import { progressService } from "../../services/progressService";
import Button from "../ui/Button";
import type { SidebarTab } from "../layout/Sidebar";

interface BookOverviewProps {
  activeBook: Book;
  onTabChange: (tab: SidebarTab) => void;
}

export const BookOverview: React.FC<BookOverviewProps> = ({ activeBook, onTabChange }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, number>>(() =>
    progressService.getDailyProgressSync(activeBook.id)
  );

  // Carregar dados reais de capítulos e histórico de progresso do Supabase
  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      setIsLoading(true);
      try {
        const [bookChapters, dailyProgress] = await Promise.all([
          chapterService.getChapters(activeBook.id),
          progressService.getDailyProgress(activeBook.id),
        ]);
        if (isMounted) {
          setChapters(bookChapters);
          setProgress(dailyProgress);
        }
      } catch (e) {
        console.error("Erro ao carregar dados reais na visão geral:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRealData();
    return () => {
      isMounted = false;
    };
  }, [activeBook.id]);

  // Estatísticas Reais da Obra
  const totalChapters = chapters.length;
  const totalWords = chapters.reduce((acc, ch) => acc + (ch.word_count || 0), 0);
  const estimatedPages = totalWords > 0 ? Math.ceil(totalWords / 250) : 0;

  // Metas da Obra
  const targetPages = activeBook.expected_pages && activeBook.expected_pages > 0 ? activeBook.expected_pages : 100;
  const targetWords = activeBook.word_goal && activeBook.word_goal > 0 ? activeBook.word_goal : 25000;

  const wordsPercentage = Math.min(100, Math.round((totalWords / targetWords) * 100));
  const pagesPercentage = Math.min(100, Math.round((estimatedPages / targetPages) * 100));

  // Progresso Diário (Hoje)
  const todayStr = new Date().toISOString().split("T")[0];
  const wordsToday = progress[todayStr] || 0;

  // Gerar dados reais dos últimos 7 dias
  const last7Days = Array.from({ length: 7 })
    .map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - idx);
      return d.toISOString().split("T")[0];
    })
    .reverse();

  const chartData = last7Days.map((dateStr) => {
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayName = dayNames[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthNum = dateObj.getMonth() + 1;
    const words = progress[dateStr] || 0;

    return {
      dateStr,
      label: dayName,
      subLabel: `${dayNum}/${monthNum}`,
      words,
    };
  });

  const maxWordsInPeriod = Math.max(...chartData.map((d) => d.words), 100);

  // Média Diária nos últimos 7 dias
  const sumLast7Days = chartData.reduce((acc, d) => acc + d.words, 0);
  const averageLast7Days = Math.round(sumLast7Days / 7);

  // Cálculo da Ofensiva Real (Streak)
  const streak = progressService.calculateStreak(progress);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full select-none animate-in fade-in duration-200 space-y-8">
      
      {/* Header com Boas-Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
            Visão Geral da Obra
          </h2>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Acompanhe o ritmo de produção, metas e dados reais de <strong className="text-slate-900 font-semibold">{activeBook.book_name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => onTabChange("settings")}
            leftIcon={<Sliders className="w-4 h-4 text-slate-600" />}
          >
            Configurações
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => onTabChange("chapters")}
            leftIcon={<PenTool className="w-4 h-4" />}
          >
            Escrever Capítulos
          </Button>
        </div>
      </div>

      {/* Grid de Informações Básicas da Obra & Ofensiva */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metadados da Obra */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Título da Obra</span>
                <h3 className="text-xl font-bold font-funnel text-slate-900 mt-0.5 leading-snug">
                  {activeBook.book_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onTabChange("settings")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Sliders className="w-3 h-3" />
                <span>Editar</span>
              </button>
            </div>

            {activeBook.synopsis || activeBook.resume ? (
              <div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Sinopse</span>
                <p className="text-xs text-slate-600 font-sans mt-1 leading-relaxed line-clamp-3">
                  {activeBook.synopsis || activeBook.resume}
                </p>
              </div>
            ) : (
              <div className="py-1">
                <p className="text-xs text-slate-600 font-sans italic">
                  Sem sinopse cadastrada. Configure nas configurações da obra.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-5 mt-5 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Status</span>
              <span className="inline-block mt-1 font-bold text-slate-800 capitalize bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                {activeBook.status || "Rascunho"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Meta de Páginas</span>
              <span className="font-semibold text-slate-900 mt-1 block">
                {targetPages} págs
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Última Atualização</span>
              <span className="font-semibold text-slate-900 mt-1 block">
                {new Date(activeBook.updated_at || activeBook.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Card de Ofensiva / Streak com Dados Reais */}
        <div className="bg-neutral-900 border border-neutral-950 text-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="absolute right-4 top-4 text-neutral-800 pointer-events-none">
            <Flame className="w-20 h-20 text-neutral-800/40" />
          </div>

          <div className="z-10">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>Ofensiva de Escrita</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
              Dias consecutivos escrevendo
            </p>
          </div>

          <div className="my-4 z-10">
            <h4 className="text-5xl font-extrabold font-funnel text-white tracking-tight flex items-baseline gap-2">
              {streak} <span className="text-lg font-bold text-neutral-400 font-sans">dias</span>
            </h4>
          </div>

          <p className="text-[11px] text-neutral-400 font-sans z-10 leading-relaxed">
            {streak > 0 
              ? `Incrível! Você escreveu hoje e está mantendo o ritmo de produção ativo!`
              : `Escreva algumas palavras hoje no editor para iniciar uma nova sequência de escrita!`}
          </p>
        </div>

      </div>

      {/* Card de Objetivos da Obra (Meta de Palavras e Páginas) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold font-funnel text-slate-900">Progresso das Metas da Obra</h4>
              <p className="text-xs text-slate-600">Acompanhe a evolução do livro em relação aos seus objetivos finais.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTabChange("settings")}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
          >
            Ajustar Metas &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Barra de Progresso de Palavras */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Meta de Palavras
              </span>
              <span className="font-extrabold text-blue-600">{wordsPercentage}%</span>
            </div>

            {/* Barra Visual */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${wordsPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>
                <strong>{totalWords.toLocaleString("pt-BR")}</strong> escritas
              </span>
              <span>
                Meta: <strong>{targetWords.toLocaleString("pt-BR")}</strong> palavras
              </span>
            </div>
          </div>

          {/* Barra de Progresso de Páginas */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Meta de Páginas
              </span>
              <span className="font-extrabold text-emerald-600">{pagesPercentage}%</span>
            </div>

            {/* Barra Visual */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pagesPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>
                <strong>{estimatedPages}</strong> páginas diagramadas
              </span>
              <span>
                Meta: <strong>{targetPages}</strong> páginas
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Grid de Estatísticas Gerais em Números */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200/50">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Total de Palavras</span>
            <strong className="text-lg font-extrabold text-slate-900 font-funnel tracking-tight mt-0.5 block">
              {isLoading ? "..." : totalWords.toLocaleString("pt-BR")}
            </strong>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200/50">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Páginas Escritas</span>
            <strong className="text-lg font-extrabold text-slate-900 font-funnel tracking-tight mt-0.5 block">
              {isLoading ? "..." : estimatedPages.toLocaleString("pt-BR")}
            </strong>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200/50">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Escrito Hoje</span>
            <strong className="text-lg font-extrabold text-slate-900 font-funnel tracking-tight mt-0.5 block">
              {wordsToday.toLocaleString("pt-BR")} <span className="text-[11px] font-normal text-slate-600">palavras</span>
            </strong>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200/50">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Capítulos Criados</span>
            <strong className="text-lg font-extrabold text-slate-900 font-funnel tracking-tight mt-0.5 block">
              {isLoading ? "..." : totalChapters}
            </strong>
          </div>
        </div>

      </div>

      {/* Gráfico de Barras de Escrita Diária (Últimos 7 Dias) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-funnel text-slate-900">Histórico de Escrita</h4>
              <p className="text-[10px] text-slate-600">Palavras escritas nos últimos 7 dias</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Média Diária</span>
            <strong className="text-sm font-extrabold text-slate-800 font-funnel tracking-tight block">
              {averageLast7Days.toLocaleString("pt-BR")} <span className="text-[10px] font-normal text-slate-600">palavras/dia</span>
            </strong>
          </div>
        </div>

        {/* Layout do Gráfico */}
        <div className="h-48 flex items-end justify-between gap-4 px-2 md:px-8 border-b border-slate-100 pb-1">
          {chartData.map((d) => {
            const barHeightPct = (d.words / maxWordsInPeriod) * 100;
            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-default">
                
                {/* Tooltip no Hover */}
                <div className="absolute bottom-full mb-2 bg-neutral-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-20 flex flex-col items-center">
                  <span>{d.words.toLocaleString("pt-BR")} palavras</span>
                  <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mt-0.75" />
                </div>

                {/* Barra do Gráfico */}
                <div 
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-700 ease-out origin-bottom ${
                    d.words > 0
                      ? "bg-slate-900 group-hover:bg-slate-800"
                      : "bg-slate-100 group-hover:bg-slate-200"
                  }`}
                  style={{ height: `${Math.max(4, barHeightPct)}%` }}
                />

              </div>
            );
          })}
        </div>

        {/* Eixo X: Rótulos dos Dias */}
        <div className="flex justify-between gap-4 px-2 md:px-8 pt-3 text-center">
          {chartData.map((d) => (
            <div key={d.dateStr} className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-800">{d.label}</span>
              <span className="text-[9px] text-slate-600 font-semibold mt-0.5">{d.subLabel}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
