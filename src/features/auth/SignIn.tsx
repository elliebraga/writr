import * as React from "react";
import { useState, useEffect } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TypingLogo from "../../components/ui/TypingLogo";

interface SignInProps {
  onSignInSubmit?: (formData: any) => Promise<void>;
  onNavigateToSignUp?: () => void;
}

export default function SignIn({ onSignInSubmit, onNavigateToSignUp }: SignInProps) {
  // Estados para os campos do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado de controle de visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  // Controle de lockout (brute force)
  const [cooldownEnd, setCooldownEnd] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Inicializa o estado de bloqueio a partir do localStorage no carregamento
  useEffect(() => {
    const lockoutUntil = localStorage.getItem("writr_login_lockout_until");
    if (lockoutUntil) {
      const remainingTime = Number(lockoutUntil) - Date.now();
      if (remainingTime > 0) {
        setCooldownEnd(Number(lockoutUntil));
      } else {
        localStorage.removeItem("writr_login_lockout_until");
        localStorage.removeItem("writr_login_attempts");
      }
    }
  }, []);

  // Timer regressivo do bloqueio
  useEffect(() => {
    if (cooldownEnd <= Date.now()) return;

    setSecondsRemaining(Math.ceil((cooldownEnd - Date.now()) / 1000));

    const interval = setInterval(() => {
      const remainingTime = Math.ceil((cooldownEnd - Date.now()) / 1000);
      if (remainingTime <= 0) {
        setCooldownEnd(0);
        setSecondsRemaining(0);
        localStorage.removeItem("writr_login_lockout_until");
        localStorage.removeItem("writr_login_attempts");
        clearInterval(interval);
      } else {
        setSecondsRemaining(remainingTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // Estados de erro
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Estado de carregamento (Loading)
  const [isLoading, setIsLoading] = useState(false);

  // Função de validação client-side
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "O email é obrigatório.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Por favor, insira um formato de email válido.";
    }

    if (!password) {
      newErrors.password = "A senha é obrigatória.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (cooldownEnd > Date.now()) {
      setErrors({
        general: `Muitas tentativas incorretas. Aguarde mais ${secondsRemaining} segundos antes de tentar novamente.`,
      });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (onSignInSubmit) {
        await onSignInSubmit({ email, password });
      } else {
        console.log("Submit de Login executado com:", { email });
      }
      // Sucesso: reseta as tentativas
      localStorage.removeItem("writr_login_attempts");
      localStorage.removeItem("writr_login_lockout_until");
    } catch (err: any) {
      const attempts = Number(localStorage.getItem("writr_login_attempts") || "0") + 1;
      localStorage.setItem("writr_login_attempts", String(attempts));

      if (attempts >= 5) {
        const lockoutTime = Date.now() + 60000; // Bloqueio de 60 segundos
        localStorage.setItem("writr_login_lockout_until", String(lockoutTime));
        setCooldownEnd(lockoutTime);
        setErrors({
          general: "Muitas tentativas incorretas. Por motivos de segurança, seu login foi bloqueado temporariamente por 60 segundos.",
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          general: err.message || `Credenciais incorretas. Tentativa ${attempts} de 5 antes do bloqueio temporário.`,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-paper">
      
      {/* 1. PAINEL ESQUERDO (Preto Absoluto, Logotipo Funnel Display Centralizado) */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-center items-center p-12 select-none">
        <div className="text-center">
          <TypingLogo
            text="writr"
            className="text-8xl md:text-[108px] text-white font-normal tracking-tight"
          />
          <p className="text-xl md:text-2xl font-light tracking-wide text-neutral-300 mt-2">
            where stories begin
          </p>
        </div>
      </div>

      {/* 2. PAINEL DIREITO (Fundo Creme de Papel com Formulário Minimalista) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-paper">
        <div className="w-full max-w-md">
          
          {/* Header Mobile / Branding */}
          <div className="flex flex-col items-center mb-8 lg:hidden select-none">
            <TypingLogo
              text="writr"
              className="text-6xl text-black font-normal tracking-tight"
            />
            <p className="text-sm font-light tracking-wide text-neutral-500 mt-1">
              where stories begin
            </p>
          </div>

          {/* Título de Boas-vindas */}
          <div className="mb-10 text-left">
            <h2 className="text-[44px] font-normal text-neutral-950 tracking-tight leading-none">
              Boas vindas!
            </h2>
          </div>

          {/* Banner de Erro Geral */}
          {errors.general && (
            <div 
              role="alert" 
              className="bg-feedback-danger-bg/20 border border-feedback-danger-text/20 text-feedback-danger-text px-4 py-3 rounded-xl text-xs font-medium mb-6 flex gap-2 items-center"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Email */}
            <div className="flex flex-col gap-1">
              <Input
                label="Email:"
                type="email"
                placeholder="placeholder"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
                required
                className="bg-white border-neutral-300 focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 rounded-[14px]"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1">
              <Input
                label="Senha:"
                type={showPassword ? "text" : "password"}
                placeholder="placeholder"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
                className="bg-white border-neutral-300 focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 rounded-[14px]"
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none focus:text-neutral-600 hover:text-neutral-600 transition-colors p-1"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            {/* Botão de Ação Principal - Pílula Preta */}
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading || secondsRemaining > 0}
              className="w-full mt-4 bg-black text-white hover:bg-neutral-900 active:bg-neutral-950 rounded-full h-[46px] border-none font-medium disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed"
            >
              {secondsRemaining > 0 ? `Bloqueado (${secondsRemaining}s)` : "Continuar"}
            </Button>
          </form>

          {/* Rodapé - Cadastro alternativo */}
          <div className="mt-8 text-center">
            <button
              onClick={onNavigateToSignUp}
              disabled={isLoading}
              className="text-black font-normal hover:underline transition-colors focus-visible:outline-none rounded px-2 py-1"
            >
              ou cadastre-se
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
