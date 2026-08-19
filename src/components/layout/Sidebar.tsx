import { BookOpen, Layers, Users, Share2, Settings, ArrowLeft, Book as BookIcon, X, Calendar, MapPin } from "lucide-react";
import type { Book } from "../../types/book";

export type SidebarTab = "overview" | "chapters" | "characters" | "relations" | "scenarios" | "timeline" | "settings";

interface SidebarProps {
  activeBook: Book;
  activeTab: SidebarTab;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onTabChange: (tab: SidebarTab) => void;
  onBackToBooks: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeBook,
  activeTab,
  isOpenMobile = false,
  onCloseMobile,
  onTabChange,
  onBackToBooks,
}) => {
  const content = (
    <div className="w-64 bg-black text-white rounded-2xl flex flex-col h-full select-none overflow-hidden">
      {/* Top Header & Back to Books */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBackToBooks}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Minhas Obras</span>
          </button>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-neutral-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div className="w-9 h-12 bg-neutral-900 rounded shrink-0 overflow-hidden flex items-center justify-center">
            {activeBook.cover_url || activeBook.image_ref ? (
              <img
                src={activeBook.cover_url || activeBook.image_ref || ""}
                alt={activeBook.book_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookIcon className="w-4 h-4 text-neutral-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-white truncate" title={activeBook.book_name}>
              {activeBook.book_name}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-neutral-900 text-neutral-300 inline-block mt-0.5">
              {activeBook.status || "Rascunho"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => {
            onTabChange("overview");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "overview"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => {
            onTabChange("chapters");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "chapters"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Capítulos</span>
        </button>

        <button
          onClick={() => {
            onTabChange("characters");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "characters"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personagens</span>
        </button>

        <button
          onClick={() => {
            onTabChange("relations");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "relations"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Relações</span>
        </button>

        <button
          onClick={() => {
            onTabChange("scenarios");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "scenarios"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Cenários</span>
        </button>

        <button
          onClick={() => {
            onTabChange("timeline");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "timeline"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Linha do Tempo</span>
        </button>

        <button
          onClick={() => {
            onTabChange("settings");
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "settings"
              ? "bg-neutral-800 text-white font-semibold"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 text-center">
        <div className="text-[11px] text-neutral-500 font-medium">
          writr • Plataforma de Escrita
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex h-screen shrink-0 p-3">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          <aside className="relative z-50 h-full p-3 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

