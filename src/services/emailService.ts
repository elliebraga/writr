import emailjs from "@emailjs/browser";
import type { CollaboratorRole } from "../types/collaborator";

export interface InviteEmailParams {
  toEmail: string;
  toName?: string;
  bookName: string;
  role: CollaboratorRole;
  inviteLink: string;
}

export interface EmailSendResult {
  success: boolean;
  isConfigured: boolean;
  message: string;
}

export const emailService = {
  /**
   * Envia e-mail de convite de colaborador usando o EmailJS (se configurado)
   */
  async sendInviteEmail(params: InviteEmailParams): Promise<EmailSendResult> {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Verificar se as chaves do EmailJS foram preenchidas no .env
    if (!serviceId || !templateId || !publicKey) {
      console.warn(
        "⚠️ [emailService] Chaves do EmailJS não configuradas no arquivo .env (VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY)."
      );
      return {
        success: false,
        isConfigured: false,
        message: "E-mail não disparado automaticamente pois as chaves do EmailJS não estão no .env.",
      };
    }

    try {
      const roleText =
        params.role === "editor"
          ? "Editor (Permissão de escrita)"
          : params.role === "owner"
          ? "Dono da Obra"
          : "Leitor (Apenas leitura)";
      
      const templateParams = {
        to_email: params.toEmail,
        to_name: params.toName || params.toEmail.split("@")[0],
        book_name: params.bookName,
        role: roleText,
        invite_link: params.inviteLink,
      };

      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      if (response.status === 200) {
        console.log("✅ [emailService] E-mail de convite enviado via EmailJS para:", params.toEmail);
        return {
          success: true,
          isConfigured: true,
          message: "E-mail de convite enviado com sucesso!",
        };
      } else {
        throw new Error(`EmailJS respondeu com status ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ [emailService] Erro ao enviar e-mail de convite via EmailJS:", error);
      return {
        success: false,
        isConfigured: true,
        message: error?.text || error?.message || "Falha no envio automático do e-mail.",
      };
    }
  },
};
