import React, { useState, useEffect } from "react";
import { X, UserPlus, Users, Trash2, Mail, Check, Copy } from "lucide-react";
import type { Book } from "../../types/book";
import type { BookCollaborator, CollaboratorRole } from "../../types/collaborator";
import { collaboratorService, emailService } from "../../services";
import Button from "../ui/Button";

interface ShareBookModalProps {
  isOpen: boolean;
  activeBook: Book;
  onClose: () => void;
}

export const ShareBookModal: React.FC<ShareBookModalProps> = ({
  isOpen,
  activeBook,
  onClose,
}) => {
  const [collaborators, setCollaborators] = useState<BookCollaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<CollaboratorRole>("editor");
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeBook?.id) {
      loadCollaborators();
      setInvitedEmail(null);
      setEmailStatus(null);
    }
  }, [isOpen, activeBook?.id]);

  const loadCollaborators = async () => {
    setIsLoading(true);
    try {
      const data = await collaboratorService.getCollaborators(activeBook.id);
      setCollaborators(data);
    } catch (e) {
      console.error("Erro ao carregar colaboradores:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe um e-mail válido para o convite.");
      return;
    }

    setError(null);
    setEmailStatus(null);
    setIsSubmitting(true);
    const targetEmail = email.trim();
    const selectedRole = role;

    try {
      const newMember = await collaboratorService.addCollaborator(
        activeBook.id,
        targetEmail,
        selectedRole
      );

      setCollaborators((prev) => {
        const filtered = prev.filter((c) => c.user_email !== newMember.user_email);
        return [...filtered, newMember];
      });

      setInvitedEmail(targetEmail);
      setInvitedRole(selectedRole);
      setEmail("");

      // Tentar enviar e-mail automático via EmailJS
      const res = await emailService.sendInviteEmail({
        toEmail: targetEmail,
        bookName: activeBook.book_name,
        role: selectedRole,
        inviteLink: window.location.href,
      });

      setEmailStatus({
        sent: res.success,
        message: res.message,
      });
    } catch (err: any) {
      setError(err.message || "Erro ao convidar colaborador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    try {
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
      await collaboratorService.removeCollaborator(activeBook.id, id);
    } catch (e) {
      console.error("Erro ao remover colaborador:", e);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInviteBodyText = () => {
    const roleText = invitedRole === "editor" ? "Editor (Pode escrever)" : "Leitor (Apenas leitura)";
    const link = window.location.href;
    return `Olá!\n\nVocê foi convidado(a) para colaborar no livro "${activeBook.book_name}" no Writr com permissão de ${roleText}.\n\nAcesse o link abaixo para visualizar e colaborar:\n${link}\n\nBom trabalho!`;
  };

  const handleOpenMailClient = () => {
    if (!invitedEmail) return;
    const subject = encodeURIComponent(`Convite de Colaboração: ${activeBook.book_name}`);
    const body = encodeURIComponent(getInviteBodyText());
    window.open(`mailto:${invitedEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const handleCopyInviteText = () => {
    navigator.clipboard.writeText(getInviteBodyText());
    setCopiedInviteText(true);
    setTimeout(() => setCopiedInviteText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-50">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-funnel text-slate-900">
                Compartilhar Obra
              </h3>
              <p className="text-xs text-slate-500 font-sans truncate max-w-xs">
                {activeBook.book_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Formulário de Convite por E-mail */}
          <form onSubmit={handleAddCollaborator} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Convidar Co-Autor ou Leitor por E-mail
            </label>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                className="h-9 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer shrink-0"
              >
                <option value="editor">Editor (Pode Escrever)</option>
                <option value="viewer">Leitor (Apenas Leitura)</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Convidar
              </Button>
            </div>

            {invitedEmail && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-emerald-800 font-semibold">
                  <span>
                    {emailStatus?.sent
                      ? `🎉 E-mail enviado para ${invitedEmail}!`
                      : `✅ Permissão concedida para ${invitedEmail}!`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInvitedEmail(null);
                      setEmailStatus(null);
                    }}
                    className="text-emerald-600 hover:text-emerald-900 text-sm font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-emerald-700 text-[11px]">
                  {emailStatus?.sent
                    ? "O convite foi entregue com sucesso na caixa de entrada do colaborador."
                    : "O colaborador foi cadastrado no banco de dados. Você também pode enviar um e-mail pelo seu app local ou copiar o convite:"}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenMailClient}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {emailStatus?.sent ? "Reenviar pelo App" : "Abrir App de E-mail"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyInviteText}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {copiedInviteText ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                    {copiedInviteText ? "Texto Copiado!" : "Copiar Texto de Convite"}
                  </button>
                </div>
              </div>
            )}
          </form>

          <hr className="border-slate-100" />

          {/* Lista de Colaboradores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700">
                Membros da Obra ({collaborators.length + 1})
              </span>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Link Copiado!" : "Copiar Link"}</span>
              </button>
            </div>

            {/* Autor Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Autor Principal (Você)
                    </span>
                    <span className="text-[10px] text-slate-500">Dono da Obra</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900 text-white uppercase">
                  Dono
                </span>
              </div>

              {isLoading ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Carregando colaboradores...
                </div>
              ) : (
                collaborators.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {member.user_email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 block truncate">
                          {member.user_name || member.user_email}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {member.user_email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {member.role === "editor" ? "Editor" : "Leitor"}
                      </span>

                      <button
                        onClick={() => handleRemoveCollaborator(member.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
