import React, { useEffect, useState } from "react";
import { BookOpen, FileText, Calendar, Award, PenTool, Flame, BarChart2 } from "lucide-react";
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
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const bookChapters = await chapterService.getChapters(activeBook.id);
        setChapters(bookChapters);
      } catch (e) {
        console.error("Erro ao carregar capítulos na visão geral:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    setProgress(progressService.getDailyProgress(activeBook.id));
  }, [activeBook.id]);

  // Estatísticas Gerais
  const totalChapters = chapters.length;
  const totalWords = chapters.reduce((acc, ch) => acc + (ch.word_count || 0), 0);
  const estimatedPages = Math.max(1, Math.ceil(totalWords / 250));

  // Progresso Diário (Hoje)
  const todayStr = new Date().toISOString().split("T")[0];
  const wordsToday = progress[todayStr] || 0;

  // Gerar dados dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - idx);
    return d.toISOString().split("T")[0];
  }).reverse();

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

  // Cálculo da Ofensiva (Streak) de Escrita
  const getStreak = () => {
    let streak = 0;
    const checkDate = new Date();
    
    // Se não escreveu nada hoje, verifica a partir de ontem para não quebrar a sequência imediatamente
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
  };

  const streak = getStreak();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full select-none animate-in fade-in duration-200">
      
      {/* Header com Boas-Vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
            Visão Geral da Obra
          </h2>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Acompanhe suas estatísticas de escrita, metas de progresso e ritmo de trabalho.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => onTabChange("chapters")}
          leftIcon={<PenTool className="w-4 h-4" />}
        >
          Escrever Capítulos
        </Button>
      </div>

      {/* Grid de Informações Básicas da Obra */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Metadados da Obra */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Título da Obra</span>
              <h3 className="text-lg font-bold font-funnel text-slate-900 mt-0.5 leading-snug">
                {activeBook.book_name}
              </h3>
            </div>

            {activeBook.synopsis ? (
              <div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Sinopse da Obra</span>
                <p className="text-xs text-slate-600 font-sans mt-1 leading-relaxed line-clamp-3">
                  {activeBook.synopsis}
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-xs text-slate-600 font-sans italic">Sem sinopse cadastrada para este livro.</p>
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
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Páginas Previstas</span>
              <span className="font-semibold text-slate-900 mt-1 block">
                {activeBook.expected_pages ? `${activeBook.expected_pages} págs` : "Não informado"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Último Update</span>
              <span className="font-semibold text-slate-900 mt-1 block">
                {new Date(activeBook.updated_at || activeBook.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Card de Ofensiva / Streak */}
        <div className="bg-neutral-900 border border-neutral-950 text-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 text-neutral-800 pointer-events-none">
            <Flame className="w-20 h-20 text-neutral-800/40" />
          </div>

          <div className="z-10">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>Ofensiva de Escrita</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
              Dias seguidos escrevendo
            </p>
          </div>

          <div className="my-4 z-10">
            <h4 className="text-5xl font-extrabold font-funnel text-white tracking-tight flex items-baseline gap-2">
              {streak} <span className="text-lg font-bold text-neutral-400 font-sans">dias</span>
            </h4>
          </div>

          <p className="text-[11px] text-neutral-400 font-sans z-10 leading-relaxed">
            {streak > 0 
              ? `Incrível! Continue assim. Você está mantendo o ritmo de escrita ativo!`
              : `Escreva algumas palavras hoje para começar uma nova sequência de escrita!`}
          </p>
        </div>

      </div>

      {/* Grid de Estatísticas e Métricas de Palavras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
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

      {/* Gráfico de Barras de Escrita Diária */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
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
