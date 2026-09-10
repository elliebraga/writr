import { useState, useEffect } from "react";
import SignIn from "./features/auth/SignIn";
import SignUp from "./features/auth/SignUp";
import type { Book, BookStatus } from "./types/book";
import { Sidebar, type SidebarTab } from "./components/layout/Sidebar";
import { ChapterFlow } from "./features/chapters/ChapterFlow";
import { CharacterFlow } from "./features/characters/CharacterFlow";
import { RelationsFlow } from "./features/relations/RelationsFlow";
import { NewBookDrawer } from "./components/books/NewBookDrawer";
import BookCard from "./components/ui/BookCard";
import Button from "./components/ui/Button";
import { BookOpen, Plus, Menu } from "lucide-react";
import { authService, bookService } from "./services";
import { ensureValidUuid } from "./utils/uuidUtils";
import { useDialog } from "./components/ui/DialogProvider";
import { TimelineFlow } from "./features/timeline/TimelineFlow";
import { BookOverview } from "./components/books/BookOverview";
import { ScenarioFlow } from "./features/scenarios/ScenarioFlow";
import { characterService } from "./services";
import type { Character } from "./types/character";
import { WhiteboardFlow } from "./features/whiteboard/WhiteboardFlow";
import { BookSettingsFlow } from "./features/books/BookSettingsFlow";

export default function App() {
  const { showAlert } = useDialog();
  const [screen, setScreen] = useState<"signin" | "signup" | "dashboard">("signin");
  const [userName, setUserName] = useState("Escritor");
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  const [books, setBooks] = useState<Book[]>([]);

  // Carregar obras locais do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("writr_local_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        setBooks(parsed.map((b: Book) => ({ ...b, id: ensureValidUuid(b.id) })));
      }
    } catch (e) {}
  }, []);

  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  
  // Estado do Livro Ativo e Abas do Workspace
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("chapters");
  const [timelineCharacterFilter, setTimelineCharacterFilter] = useState<string | null>(null);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookCharacters, setBookCharacters] = useState<Character[]>([]);

  // Carregar personagens da obra ativa
  useEffect(() => {
    if (selectedBook) {
      const safeId = ensureValidUuid(selectedBook.id);
      characterService.getCharacters(safeId).then((data) => {
        setBookCharacters(data);
      });
    } else {
      setBookCharacters([]);
    }
  }, [selectedBook?.id]);

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
    authService.getSession().then((session) => {
      handleSession(session);
    });

    const subscription = authService.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: any) => {
    if (session && session.user) {
      setSessionUser(session.user);

      const name = await authService.getUserProfile(session.user.id);
      setUserName(name || session.user.email?.split("@")[0] || "Escritor");

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
      const remoteBooks = await bookService.getBooks(userId);
      setBooks((prev) => {
        const map = new Map<string, Book>();
        if (userId) {
          prev.filter((b) => b.id_user === userId).forEach((b) => map.set(b.id, b));
          remoteBooks.forEach((b) => map.set(b.id, b));
        } else {
          prev.filter((b) => !b.id_user).forEach((b) => map.set(b.id, b));
          remoteBooks.forEach((b) => map.set(b.id, b));
        }
        return Array.from(map.values());
      });
    } catch (err) {
      console.error("Erro na consulta de livros:", err);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleSignInSubmit = async (formData: any) => {
    await authService.signIn(formData);
  };

  const handleSignUpSubmit = async (formData: any) => {
    const data = await authService.signUp(formData);
    if (data.user && !data.session) {
      await showAlert("Cadastro realizado! Verifique seu e-mail para ativar a conta.", "Cadastro Realizado");
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (err: any) {
      await showAlert("Erro ao deslogar: " + err.message, "Erro");
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
    const userId = sessionUser?.id;
    const createdBook = await bookService.createBook({
      ...bookData,
      userId,
    });

    setBooks((prev) => {
      const updated = [createdBook, ...prev];
      try {
        localStorage.setItem("writr_local_books", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setSelectedBook(createdBook);
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
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans select-none">
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
                onNavigateToTimeline={(charId) => {
                  setTimelineCharacterFilter(charId);
                  setActiveTab("timeline");
                }}
              />
            )}

            {activeTab === "relations" && (
              <RelationsFlow
                activeBook={safeBook}
                onNavigateToCharacters={() => setActiveTab("characters")}
              />
            )}

            {activeTab === "scenarios" && (
              <ScenarioFlow
                activeBook={safeBook}
                characters={bookCharacters}
              />
            )}

            {activeTab === "timeline" && (
              <TimelineFlow
                activeBook={safeBook}
                initialCharacterFilter={timelineCharacterFilter}
              />
            )}

            {activeTab === "overview" && (
              <BookOverview
                activeBook={safeBook}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "whiteboard" && (
              <WhiteboardFlow
                activeBook={safeBook}
              />
            )}

            {activeTab === "settings" && (
              <BookSettingsFlow
                activeBook={safeBook}
                onUpdateBook={(updatedBook) => {
                  setSelectedBook(updatedBook);
                  setBooks((prev) =>
                    prev.map((b) => (b.id === updatedBook.id ? updatedBook : b))
                  );
                }}
                onDeleteBook={(bookId) => {
                  setSelectedBook(null);
                  setBooks((prev) => prev.filter((b) => b.id !== bookId));
                }}
              />
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
              className="hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
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
              <p className="text-base text-slate-600 font-sans mt-1">
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
            <div className="text-xs text-slate-600 py-16 text-center">
              Carregando suas obras...
            </div>
          ) : books.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-slate-600" />
              </div>

              <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight mb-2">
                Você ainda não possui obras criadas
              </h2>

              <p className="text-base text-slate-600 font-sans leading-relaxed mb-8">
                Comece seu projeto literário agora mesmo criando a sua primeira obra.
              </p>

              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsNewBookModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Criar Primeira Obra
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book: Book) => (
                <BookCard
                  key={book.id}
                  title={book.book_name}
                  synopsis={book.synopsis || book.resume || undefined}
                  coverImage={book.cover_url || book.image_ref || undefined}
                  status={book.status}
                  pages={book.expected_pages || undefined}
                  updatedAt={new Date(book.created_at || Date.now()).toLocaleDateString("pt-BR")}
                  active={(selectedBook as any)?.id === book.id}
                  onClick={() => setSelectedBook(book)}
                />
              ))}

              <BookCard
                variant="add"
                onClick={() => setIsNewBookModalOpen(true)}
              />
            </div>
          )}
        </main>

        <footer className="mt-16 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 max-w-5xl w-full mx-auto font-sans">
          <span>&copy; {new Date().getFullYear()} writr. Todos os direitos reservados.</span>
          <span>Sua suíte de escrita inteligente.</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {screen === "signin" && (
        <SignIn
          onNavigateToSignUp={() => setScreen("signup")}
          onSignInSubmit={handleSignInSubmit}
        />
      )}

      {screen === "signup" && (
        <SignUp
          onNavigateToSignIn={() => setScreen("signin")}
          onSignUpSubmit={handleSignUpSubmit}
        />
      )}
    </div>
  );
}
