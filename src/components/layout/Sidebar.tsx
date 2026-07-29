import React from "react";
import { BookOpen, Layers, Users, Settings, ArrowLeft, Book as BookIcon } from "lucide-react";
import type { Book } from "../../types/book";

export type SidebarTab = "overview" | "chapters" | "characters" | "settings";

interface SidebarProps {
  activeBook: Book;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onBackToBooks: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeBook,
  activeTab,
  onTabChange,
  onBackToBooks,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none">
      {/* Top Header & Back to Books */}
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={onBackToBooks}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para Minhas Obras</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-12 bg-slate-100 border border-slate-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
            {activeBook.cover_url || activeBook.image_ref ? (
              <img
                src={activeBook.cover_url || activeBook.image_ref || ""}
                alt={activeBook.book_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 truncate" title={activeBook.book_name}>
              {activeBook.book_name}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 inline-block mt-0.5">
              {activeBook.status || "Rascunho"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => onTabChange("overview")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "overview"
              ? "bg-slate-100 text-slate-900 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => onTabChange("chapters")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "chapters"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Capítulos</span>
        </button>

        <button
          onClick={() => onTabChange("characters")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "characters"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personagens</span>
        </button>

        <button
          onClick={() => onTabChange("settings")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "settings"
              ? "bg-slate-100 text-slate-900 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 text-center">
        <div className="text-[11px] text-slate-400 font-medium">
          writr • Plataforma de Escrita
        </div>
      </div>
    </aside>
  );
};
