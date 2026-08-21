import React, { useState } from "react";
import { Mail, Check, X, Shield } from "lucide-react";
import type { BookCollaborator } from "../../types/collaborator";
import Button from "../ui/Button";

interface InvitationBannerProps {
  invitations: BookCollaborator[];
  onRespond: (invitationId: string, bookId: string, accept: boolean) => Promise<void>;
}

export const InvitationBanner: React.FC<InvitationBannerProps> = ({
  invitations,
  onRespond,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!invitations || invitations.length === 0) return null;

  const handleAction = async (invitationId: string, bookId: string, accept: boolean) => {
    setProcessingId(invitationId);
    try {
      await onRespond(invitationId, bookId, accept);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full space-y-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {invitations.map((invite) => {
        const isProcessing = processingId === invite.id;
        const roleLabel = invite.role === "editor" ? "Editor (Escrita e Leitura)" : "Leitor (Apenas Leitura)";

        return (
          <div
            key={invite.id}
            className="p-4 sm:p-5 bg-indigo-950 text-white rounded-2xl border border-indigo-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
          >
            {/* Elemento de iluminação decorativo */}
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3.5 z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-800/60 border border-indigo-700/80 flex items-center justify-center text-indigo-200 shrink-0 mt-0.5 sm:mt-0">
                <Mail className="w-5 h-5 text-indigo-300" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-800 text-indigo-200 border border-indigo-700">
                    Solicitação de Colaboração
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold font-funnel text-white mt-1">
                  Convite para a obra: <span className="text-indigo-200">"{invite.book_name || "Obra Sem Título"}"</span>
                </h4>

                <p className="text-xs text-indigo-200/80 font-sans mt-0.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Permissão oferecida: <strong className="text-white">{roleLabel}</strong></span>
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end z-10 shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                onClick={() => handleAction(invite.id, invite.id_book, false)}
                className="bg-transparent border-indigo-700 text-indigo-200 hover:bg-indigo-900/60 hover:text-white hover:border-indigo-600 text-xs"
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Recusar
              </Button>

              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessing}
                onClick={() => handleAction(invite.id, invite.id_book, true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-lg shadow-indigo-950 text-xs"
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Aceitar Convite
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
