import { createClient } from '@supabase/supabase-js';

// Carrega as chaves do ambiente Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Credenciais do Supabase não encontradas no arquivo .env. Verifique se configurou VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

// Interceptor customizado de fetch para capturar mensagens reais de erro da API do Supabase (GoTrue)
// Evita o bug onde erros 500 têm o corpo ignorado pela biblioteca retornando "{}"
const customFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    try {
      const cloned = response.clone();
      const body = await cloned.json();
      const msg = body.msg || body.message || body.error_description || body.error;
      if (msg) {
        try {
          Object.defineProperty(response, "message", { value: msg, enumerable: true, writable: true });
          Object.defineProperty(response, "msg", { value: msg, enumerable: true, writable: true });
        } catch {
          (response as any).message = msg;
          (response as any).msg = msg;
        }
      }
    } catch {
      // Ignora falha de parse caso a resposta não seja JSON
    }
  }
  return response;
};

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    global: { fetch: customFetch },
  }
);
