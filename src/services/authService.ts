import { supabase } from "../supabaseClient";

export interface AuthUser {
  id: string;
  email?: string;
  userName?: string;
}

// Função para formatar e traduzir erros de autenticação do Supabase/GoTrue
// Elimina mensagens vazias, "{}" e erros técnicos enigmáticos
export function formatAuthError(
  err: any,
  fallbackMessage: string = "Ocorreu um erro no processamento da autenticação."
): string {
  if (!err) return fallbackMessage;

  let raw = "";
  if (typeof err === "string") {
    raw = err;
  } else if (typeof err.message === "string") {
    raw = err.message;
  } else if (typeof err.msg === "string") {
    raw = err.msg;
  } else if (typeof err.error_description === "string") {
    raw = err.error_description;
  } else if (typeof err.error === "string") {
    raw = err.error;
  }

  raw = raw.trim();

  // Previne mensagens vazias, "{}" ou "[object Object]"
  if (!raw || raw === "{}" || raw === "[object Object]") {
    if (err.status === 500 || err.statusCode === 500) {
      return "Erro ao enviar o e-mail de confirmação. O serviço de e-mails (SMTP) do Supabase pode ter atingido a cota temporária ou precisa ser configurado no painel.";
    }
    return fallbackMessage;
  }

  const lower = raw.toLowerCase();

  if (lower.includes("error sending confirmation email")) {
    return "Erro ao enviar o e-mail de confirmação. O serviço de envio de e-mails (SMTP) do Supabase pode ter atingido a cota temporária ou precisa ser verificado no painel.";
  }

  if (lower.includes("user already registered")) {
    return "Este e-mail já está cadastrado. Tente entrar com sua senha ou recuperar o acesso.";
  }

  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (lower.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam.";
  }

  if (lower.includes("invalid format") || lower.includes("unable to validate email")) {
    return "O formato do e-mail informado é inválido.";
  }

  if (lower.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (lower.includes("rate limit") || lower.includes("only request this once every")) {
    return "Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente.";
  }

  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return "O cadastro de novos usuários está temporariamente desativado no momento.";
  }

  return raw;
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
      throw new Error(formatAuthError(error, "Erro ao realizar login. Verifique suas credenciais."));
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
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(formatAuthError(error, "Erro ao realizar cadastro. Tente novamente."));
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

  // Reenviar e-mail de confirmação
  async resendConfirmationEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(formatAuthError(error, "Erro ao reenviar e-mail de confirmação. Tente novamente mais tarde."));
    }

    return data;
  },
};
