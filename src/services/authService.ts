import { supabase } from "../supabaseClient";

export interface AuthUser {
  id: string;
  email?: string;
  userName?: string;
}

export const authService = {
  // Buscar sessão ativa
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erro ao obter sessão:", error.message);
        return null;
      }
      return session;
    } catch (err) {
      console.error("Exceção ao obter sessão:", err);
      return null;
    }
  },

  // Escutar mudanças de estado de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },

  // Fazer login com e-mail e senha
  async signIn(formData: { email: string; password: string }) {
    const { email, password } = formData;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      throw new Error(error.message || "Erro ao realizar login.");
    }

    return data;
  },

  // Cadastrar novo usuário e criar perfil
  async signUp(formData: { fullName: string; email: string; password: string }) {
    const { fullName, email, password } = formData;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: { user_name: fullName.trim() },
      },
    });

    if (error) {
      throw new Error(error.message || "Erro ao realizar cadastro.");
    }

    if (data.user) {
      try {
        await supabase.from("profiles").upsert([
          {
            id: data.user.id,
            user_name: fullName.trim(),
            user_email: email.trim(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (profileErr) {
        console.log("Perfil será sincronizado no primeiro acesso.");
      }
    }

    return data;
  },

  // Buscar perfil de usuário na tabela public.profiles
  async getUserProfile(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_name")
        .eq("id", userId)
        .single();

      if (!error && data && data.user_name) {
        return data.user_name;
      }
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
    }

    return "Escritor";
  },

  // Fazer logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || "Erro ao fazer logout.");
    }
  },
};
