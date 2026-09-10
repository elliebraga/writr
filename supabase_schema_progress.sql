-- ==============================================================================
-- SCHEMA DE CONFIGURAÇÕES DA OBRA E HISTÓRICO DE PROGRESSO DIÁRIO (WRITR)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Adicionar colunas de Metas e Objetivos na tabela de Livros (books)
ALTER TABLE IF EXISTS public.books 
ADD COLUMN IF NOT EXISTS expected_pages integer DEFAULT 100;

ALTER TABLE IF EXISTS public.books 
ADD COLUMN IF NOT EXISTS word_goal integer DEFAULT 25000;

-- 2. Garantir coluna de contagem de palavras na tabela de Capítulos (chapters)
ALTER TABLE IF EXISTS public.chapters 
ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0;

-- 3. Criar Tabela de Histórico Diário de Escrita (writing_progress)
-- Armazena a contagem de palavras escritas por obra em cada data específica
CREATE TABLE IF NOT EXISTS public.writing_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_book uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  id_user uuid NULL,
  date date NOT NULL,
  words_written integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_book_date UNIQUE (id_book, date)
);

-- 4. Índices para Otimização de Consultas Rápidas no Dashboard
CREATE INDEX IF NOT EXISTS idx_writing_progress_book ON public.writing_progress(id_book);
CREATE INDEX IF NOT EXISTS idx_writing_progress_date ON public.writing_progress(id_book, date DESC);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.writing_progress ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS Permissivas para Desenvolvimento Local e Autenticados
DROP POLICY IF EXISTS "Permitir leitura de progresso" ON public.writing_progress;
CREATE POLICY "Permitir leitura de progresso" ON public.writing_progress
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de progresso" ON public.writing_progress;
CREATE POLICY "Permitir inserção de progresso" ON public.writing_progress
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de progresso" ON public.writing_progress;
CREATE POLICY "Permitir atualização de progresso" ON public.writing_progress
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir deleção de progresso" ON public.writing_progress;
CREATE POLICY "Permitir deleção de progresso" ON public.writing_progress
  FOR DELETE USING (true);
