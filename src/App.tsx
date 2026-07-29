import { useState, useEffect } from "react";
import SignIn from "./features/auth/SignIn";
import SignUp from "./features/auth/SignUp";
import { supabase } from "./supabaseClient";
import type { Book, BookStatus } from "./types/book";
import { Sidebar, type SidebarTab } from "./components/layout/Sidebar";
import { ChapterFlow } from "./features/chapters/ChapterFlow";
import { CharacterFlow } from "./features/characters/CharacterFlow";
import { RelationsFlow } from "./features/relations/RelationsFlow";
import { NewBookDrawer } from "./components/books/NewBookDrawer";
import BookCard from "./components/ui/BookCard";
import Button from "./components/ui/Button";
import { BookOpen, Plus, Menu } from "lucide-react";
import { ensureValidUuid } from "./utils/uuidUtils";

export default function App() {
  const [screen, setScreen] = useState<"signin" | "signup" | "dashboard">("signin");
  const [userName, setUserName] = useState("Escritor");
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem("writr_local_books");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((b: Book) => ({
        ...b,
        id: ensureValidUuid(b.id),
      }));
    } catch (e) {
      return [];
    }
  });

  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  
  // Estado do Livro Ativo e Abas do Workspace
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("chapters");
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Efeito para salvar obras no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem("writr_local_books", JSON.stringify(books));
    } catch (e) {
      console.error("Erro ao salvar livros no localStorage", e);
    }
  }, [books]);

  // Sync sessão do Supabase ao montar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: any) => {
    if (session && session.user) {
      setSessionUser(session.user);

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("user_name")
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          setUserName(profile.user_name);
        } else {
          setUserName(session.user.raw_user_meta_data?.user_name || session.user.email?.split("@")[0] || "Escritor");
        }
      } catch (err) {
        setUserName(session.user.email?.split("@")[0] || "Escritor");
      }

      fetchBooks(session.user.id);
      setScreen("dashboard");
    } else {
      setSessionUser(null);
      setUserName("Escritor");
      fetchBooks();
      setScreen("dashboard");
    }
  };

  const fetchBooks = async (userId?: string) => {
    setIsLoadingBooks(true);
    try {
      let query = supabase.from("books").select("*");
      if (userId) {
        query = query.or(`id_user.eq.${userId},id_user.is.null`);
      }
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar livros do Supabase:", error.message);
      } else if (data && data.length > 0) {
        const remoteBooks = data.map((b: any) => ({
          ...b,
          id: ensureValidUuid(b.id),
        })) as Book[];

        setBooks((prev) => {
          const existingIds = new Set(remoteBooks.map((b) => b.id));
          const localOnly = prev.filter((b) => !existingIds.has(b.id));
          return [...remoteBooks, ...localOnly];
        });
      }
    } catch (err) {
      console.error("Erro na consulta de livros:", err);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleSignInSubmit = async (formData: any) => {
    const { email, password } = formData;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleSignUpSubmit = async (formData: any) => {
    const { fullName, email, password } = formData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { user_name: fullName } },
    });
    if (error) throw error;
    if (data.user && !data.session) {
      alert("Cadastro realizado! Verifique seu e-mail para ativar a conta.");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erro ao deslogar: " + error.message);
    }
    setBooks([]);
    setSelectedBook(null);
    localStorage.removeItem("writr_local_books");
    setScreen("signin");
  };

  // Criação de Nova Obra
  const handleCreateBookSubmit = async (bookData: {
    book_name: string;
    expected_pages?: number;
    synopsis?: string;
    cover_url?: string;
    status: BookStatus;
  }) => {
    const userId = sessionUser?.id || null;
    const generatedId = ensureValidUuid();

    const newBookRecord: Book = {
      id: generatedId,
      id_user: userId,
      book_name: bookData.book_name,
      expected_pages: bookData.expected_pages,
      synopsis: bookData.synopsis,
      resume: bookData.synopsis,
      cover_url: bookData.cover_url,
      image_ref: bookData.cover_url,
      status: bookData.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBooks((prev) => {
      const updated = [newBookRecord, ...prev];
      try {
        localStorage.setItem("writr_local_books", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const payload: any = {
        id: newBookRecord.id,
        id_user: sessionUser?.id || "a3d665b8-36b8-4e40-9799-b18e71950cfa",
        book_name: bookData.book_name,
        resume: bookData.synopsis || null,
        image_ref: bookData.cover_url || null,
        status: (bookData.status || "rascunho").toString().toLowerCase(),
      };

      const { data, error } = await supabase
        .from("books")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        newBookRecord.id = data.id;
      }
    } catch (err) {
      console.log("Livro mantido localmente.");
    }

    setSelectedBook(newBookRecord);
    setActiveTab("chapters");
  };

  // Renderiza Dashboard com Workspace de Livro Selecionado
  if (screen === "dashboard") {
    if (selectedBook) {
      const safeBook = {
        ...selectedBook,
        id: ensureValidUuid(selectedBook.id),
      };

      return (
        <div className="flex flex-col md:flex-row h-screen bg-white font-sans overflow-hidden select-none">
          <Sidebar
            activeBook={safeBook}
            activeTab={activeTab}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            onTabChange={(tab) => setActiveTab(tab)}
            onBackToBooks={() => setSelectedBook(null)}
          />

          <main className="flex-1 flex flex-col overflow-y-auto bg-white min-w-0">
            {/* Header Mobile de Navegação */}
            <header className="md:hidden flex items-center justify-between p-3.5 bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Abrir Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 min-w-0 px-2">
                <span className="font-bold font-funnel text-slate-900 truncate text-sm">
                  {safeBook.book_name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  {activeTab}
                </span>
              </div>

              <button
                onClick={() => setSelectedBook(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                Obras &rarr;
              </button>
            </header>
            {activeTab === "chapters" && (
              <ChapterFlow
                activeBook={safeBook}
              />
            )}

            {activeTab === "characters" && (
              <CharacterFlow
                activeBook={safeBook}
              />
            )}

            {activeTab === "relations" && (
              <RelationsFlow
                activeBook={safeBook}
                onNavigateToCharacters={() => setActiveTab("characters")}
              />
            )}

            {activeTab === "overview" && (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <h2 className="text-2xl font-bold font-funnel text-slate-900 mb-2">Visão Geral do Livro</h2>
                <p className="text-base text-slate-500 font-sans mb-6">Informações e métricas sobre a obra.</p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Título</span>
                    <h3 className="text-xl font-bold font-funnel text-slate-900 mt-0.5">{safeBook.book_name}</h3>
                  </div>

                  {safeBook.synopsis && (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sinopse</span>
                      <p className="text-sm text-slate-700 mt-1 leading-relaxed">{safeBook.synopsis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{safeBook.status}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Páginas Previstas</span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{safeBook.expected_pages || "Não informada"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <h2 className="text-2xl font-bold font-funnel text-slate-900 mb-2">Configurações da Obra</h2>
                <p className="text-base text-slate-500 font-sans">Gerencie o título e parâmetros gerais do projeto.</p>
              </div>
            )}
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between p-6 md:p-12 select-none">
        <NewBookDrawer
          isOpen={isNewBookModalOpen}
          onClose={() => setIsNewBookModalOpen(false)}
          onCreateBook={handleCreateBookSubmit}
        />

        <header className="flex items-center justify-between border-b border-slate-200 pb-6 max-w-5xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight font-funnel text-slate-900">
              writr
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 font-medium">
              Olá, <strong className="text-slate-900 font-semibold">{userName}</strong>
            </span>
            <button
              onClick={handleSignOut}
              className="hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto mt-12 flex flex-col justify-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-funnel text-slate-900 tracking-tight capitalize">
                Minhas Obras
              </h2>
              <p className="text-base text-slate-500 font-sans mt-1">
                Selecione uma obra para acessar seus capítulos e editor.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewBookModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Livro
            </Button>
          </div>

          {isLoadingBooks ? (
            <div className="text-xs text-slate-400 py-16 text-center">
              Carregando suas obras...
            </div>
          ) : books.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>

              <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight mb-2">
                Você ainda não possui obras criadas
              </h2>

              <p className="text-base text-slate-500 font-sans leading-relaxed mb-8">
                Comece seu projeto literário agora mesmo criando a sua primeira obra.
              </p>

              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsNewBookModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Criar Livro
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.book_name}
                  synopsis={book.synopsis || book.resume || undefined}
                  coverImage={book.cover_url || book.image_ref || undefined}
                  status={book.status}
                  pages={book.expected_pages || undefined}
                  updatedAt={new Date(book.created_at).toLocaleDateString("pt-BR")}
                  onClick={() => {
                    setSelectedBook(book);
                    setActiveTab("chapters");
                  }}
                />
              ))}
            </div>
          )}
        </main>

        <footer className="max-w-5xl w-full mx-auto border-t border-slate-200 pt-6 mt-16 text-center text-xs text-slate-400">
          writr • Plataforma de Escrita e Gestão Editorial
        </footer>
      </div>
    );
  }

  if (screen === "signup") {
    return (
      <SignUp
        onSignUpSubmit={handleSignUpSubmit}
        onNavigateToSignIn={() => setScreen("signin")}
      />
    );
  }

  return (
    <SignIn
      onSignInSubmit={handleSignInSubmit}
      onNavigateToSignUp={() => setScreen("signup")}
    />
  );
}
