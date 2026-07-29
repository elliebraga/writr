import { createClient } from '@supabase/supabase-js';

// Carrega as chaves do ambiente Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Credenciais do Supabase não encontradas no arquivo .env. Verifique se configurou VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
