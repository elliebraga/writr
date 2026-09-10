-- ==============================================================================
-- WRITR - SCRIPT COMPLETO DE POLÍTICAS RLS (ROW LEVEL SECURITY) PARA O SUPABASE
-- Execute este script no SQL Editor do painel do Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- ==========================================
-- 1. TABELA: books (Obras / Livros)
-- ==========================================
ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select books" ON public.books;
CREATE POLICY "Permitir select books" ON public.books
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert books" ON public.books;
CREATE POLICY "Permitir insert books" ON public.books
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update books" ON public.books;
CREATE POLICY "Permitir update books" ON public.books
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete books" ON public.books;
CREATE POLICY "Permitir delete books" ON public.books
FOR DELETE TO public USING (true);


-- ==========================================
-- 2. TABELA: characters (Personagens)
-- ==========================================
-- Migração de colunas: remover signo/arquétipo e adicionar idade
ALTER TABLE IF EXISTS public.characters DROP COLUMN IF EXISTS character_sign;
ALTER TABLE IF EXISTS public.characters ADD COLUMN IF NOT EXISTS character_age text;

ALTER TABLE IF EXISTS public.characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select characters" ON public.characters;
CREATE POLICY "Permitir select characters" ON public.characters
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert characters" ON public.characters;
CREATE POLICY "Permitir insert characters" ON public.characters
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update characters" ON public.characters;
CREATE POLICY "Permitir update characters" ON public.characters
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete characters" ON public.characters;
CREATE POLICY "Permitir delete characters" ON public.characters
FOR DELETE TO public USING (true);


-- ==========================================
-- 3. TABELA: chapters (Capítulos)
-- ==========================================
ALTER TABLE IF EXISTS public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select chapters" ON public.chapters;
CREATE POLICY "Permitir select chapters" ON public.chapters
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert chapters" ON public.chapters;
CREATE POLICY "Permitir insert chapters" ON public.chapters
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update chapters" ON public.chapters;
CREATE POLICY "Permitir update chapters" ON public.chapters
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete chapters" ON public.chapters;
CREATE POLICY "Permitir delete chapters" ON public.chapters
FOR DELETE TO public USING (true);


-- ==========================================
-- 4. TABELA: relationships (Teia de Relações)
-- ==========================================
ALTER TABLE IF EXISTS public.relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select relationships" ON public.relationships;
CREATE POLICY "Permitir select relationships" ON public.relationships
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert relationships" ON public.relationships;
CREATE POLICY "Permitir insert relationships" ON public.relationships
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update relationships" ON public.relationships;
CREATE POLICY "Permitir update relationships" ON public.relationships
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete relationships" ON public.relationships;
CREATE POLICY "Permitir delete relationships" ON public.relationships
FOR DELETE TO public USING (true);


-- ==========================================
-- 5. TABELA: scenarios (Cenários e Locais)
-- ==========================================
ALTER TABLE IF EXISTS public.scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select scenarios" ON public.scenarios;
CREATE POLICY "Permitir select scenarios" ON public.scenarios
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert scenarios" ON public.scenarios;
CREATE POLICY "Permitir insert scenarios" ON public.scenarios
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update scenarios" ON public.scenarios;
CREATE POLICY "Permitir update scenarios" ON public.scenarios
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete scenarios" ON public.scenarios;
CREATE POLICY "Permitir delete scenarios" ON public.scenarios
FOR DELETE TO public USING (true);


-- ==========================================
-- 6. TABELA: timelines (Linha do Tempo)
-- ==========================================
ALTER TABLE IF EXISTS public.timelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select timelines" ON public.timelines;
CREATE POLICY "Permitir select timelines" ON public.timelines
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert timelines" ON public.timelines;
CREATE POLICY "Permitir insert timelines" ON public.timelines
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update timelines" ON public.timelines;
CREATE POLICY "Permitir update timelines" ON public.timelines
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete timelines" ON public.timelines;
CREATE POLICY "Permitir delete timelines" ON public.timelines
FOR DELETE TO public USING (true);

-- (Compatibilidade caso a tabela se chame timeline_events)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN
    EXECUTE 'ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Permitir select timeline_events" ON public.timeline_events';
    EXECUTE 'CREATE POLICY "Permitir select timeline_events" ON public.timeline_events FOR SELECT TO public USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Permitir insert timeline_events" ON public.timeline_events';
    EXECUTE 'CREATE POLICY "Permitir insert timeline_events" ON public.timeline_events FOR INSERT TO public WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Permitir update timeline_events" ON public.timeline_events';
    EXECUTE 'CREATE POLICY "Permitir update timeline_events" ON public.timeline_events FOR UPDATE TO public USING (true) WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Permitir delete timeline_events" ON public.timeline_events';
    EXECUTE 'CREATE POLICY "Permitir delete timeline_events" ON public.timeline_events FOR DELETE TO public USING (true)';
  END IF;
END $$;


-- ==========================================
-- 7. TABELA: whiteboard_items (Notas / Post-its)
-- ==========================================
ALTER TABLE IF EXISTS public.whiteboard_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select whiteboard_items" ON public.whiteboard_items;
CREATE POLICY "Permitir select whiteboard_items" ON public.whiteboard_items
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert whiteboard_items" ON public.whiteboard_items;
CREATE POLICY "Permitir insert whiteboard_items" ON public.whiteboard_items
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update whiteboard_items" ON public.whiteboard_items;
CREATE POLICY "Permitir update whiteboard_items" ON public.whiteboard_items
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete whiteboard_items" ON public.whiteboard_items;
CREATE POLICY "Permitir delete whiteboard_items" ON public.whiteboard_items
FOR DELETE TO public USING (true);


-- ==========================================
-- 8. TABELA: book_collaborators (Convites & Acessos)
-- ==========================================
ALTER TABLE IF EXISTS public.book_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select book_collaborators" ON public.book_collaborators;
CREATE POLICY "Permitir select book_collaborators" ON public.book_collaborators
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert book_collaborators" ON public.book_collaborators;
CREATE POLICY "Permitir insert book_collaborators" ON public.book_collaborators
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update book_collaborators" ON public.book_collaborators;
CREATE POLICY "Permitir update book_collaborators" ON public.book_collaborators
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete book_collaborators" ON public.book_collaborators;
CREATE POLICY "Permitir delete book_collaborators" ON public.book_collaborators
FOR DELETE TO public USING (true);


-- ==========================================
-- 9. TABELA: profiles (Perfis de Usuário)
-- ==========================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select profiles" ON public.profiles;
CREATE POLICY "Permitir select profiles" ON public.profiles
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert profiles" ON public.profiles;
CREATE POLICY "Permitir insert profiles" ON public.profiles
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update profiles" ON public.profiles;
CREATE POLICY "Permitir update profiles" ON public.profiles
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete profiles" ON public.profiles;
CREATE POLICY "Permitir delete profiles" ON public.profiles
FOR DELETE TO public USING (true);
