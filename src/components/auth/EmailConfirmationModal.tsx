import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Button from "../ui/Button";

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResend: (email: string) => Promise<unknown>;
  onGoToSignIn: () => void;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  email,
  onResend,
  onGoToSignIn,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Timer regressivo de 60 segundos após reenviar para evitar spam
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      await onResend(email);
      setResendSuccess(true);
      setCountdown(60); // 60 segundos de espera
    } catch (err: any) {
      setResendError(
        err.message || "Erro ao reenviar e-mail de confirmação. Tente novamente mais tarde."
      );
    } finally {
      setIsResending(false);
    }
  };

  // Detecta o provedor de e-mail comum para atalho rápido
  const getEmailProviderUrl = (emailAddress: string) => {
    const domain = emailAddress.split("@")[1]?.toLowerCase();
    if (domain === "gmail.com") return "https://mail.google.com";
    if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com")
      return "https://outlook.live.com";
    if (domain === "yahoo.com" || domain === "yahoo.com.br") return "https://mail.yahoo.com";
    if (domain === "icloud.com") return "https://www.icloud.com/mail";
    return null;
  };

  const providerUrl = getEmailProviderUrl(email);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto select-none">
      {/* Backdrop com desfoque */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 text-center">
          
          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Ícone com Efeito Visual */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Mail className="w-8 h-8 stroke-[1.75]" />
          </div>

          {/* Título & Subtítulo */}
          <h3 className="text-xl sm:text-2xl font-bold font-funnel text-neutral-900 mb-2">
            Verifique seu e-mail
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-4">
            Enviamos um link de ativação da sua conta para:
          </p>

          {/* Pílula com o e-mail em destaque */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-100 border border-neutral-200/80 rounded-full text-xs font-semibold text-neutral-800 mb-5 max-w-full truncate">
            <span className="truncate">{email}</span>
          </div>

          {/* Instruções */}
          <p className="text-xs text-neutral-500 leading-relaxed mb-6">
            Abra sua caixa de entrada e clique no botão de confirmação para ativar sua conta e começar a escrever no <strong>Writr</strong>.
          </p>

          {/* Atalho para Abrir Caixa de Entrada (se detectada) */}
          {providerUrl && (
            <a
              href={providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span>Abrir Caixa de Entrada</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Notificação de Sucesso no Reenvio */}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 text-left animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Novo e-mail de confirmação enviado! Verifique sua caixa de entrada.</span>
            </div>
          )}

          {/* Notificação de Erro no Reenvio */}
          {resendError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 text-left animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{resendError}</span>
            </div>
          )}

          {/* Ações Inferiores */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-100">
            {/* Botão de Reenviar E-mail */}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-neutral-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>
                {isResending
                  ? "Reenviando e-mail..."
                  : countdown > 0
                  ? `Reenviar e-mail em ${countdown}s`
                  : "Não recebeu? Clique para reenviar"}
              </span>
            </button>

            {/* Botão Ir para Login */}
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                onClose();
                onGoToSignIn();
              }}
              className="w-full !rounded-xl !py-2.5 !text-xs !font-semibold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Já confirmei / Ir para o Login
            </Button>
          </div>

          {/* Aviso sobre caixa de Spam */}
          <p className="text-[11px] text-neutral-400 mt-4 leading-tight">
            Dica: Se o e-mail não aparecer em alguns minutos, verifique sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
