import React, { createContext, useContext, useState, useRef } from "react";
import Button from "./Button";
import { AlertTriangle, HelpCircle, X } from "lucide-react";

interface DialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "alert" | "confirm";
}

interface DialogContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string, confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showAlert = (message: string, title = "Aviso") => {
    setOptions({
      title,
      message,
      confirmLabel: "Ok",
      type: "alert",
    });
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      resolverRef.current = () => {
        resolve();
      };
    });
  };

  const showConfirm = (
    message: string,
    title = "Confirmação",
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar"
  ) => {
    setOptions({
      title,
      message,
      confirmLabel,
      cancelLabel,
      type: "confirm",
    });
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={options.type === "confirm" ? handleCancel : handleConfirm}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full p-6 z-50 animate-in zoom-in-95 duration-200">
            {/* Close button (only for accessibility/optional escape, handles cancel/confirm accordingly) */}
            <button
              type="button"
              onClick={options.type === "confirm" ? handleCancel : handleConfirm}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                options.type === "alert" 
                  ? "bg-amber-50 border-amber-100 text-amber-600" 
                  : "bg-slate-50 border-slate-100 text-slate-900"
              }`}>
                {options.type === "alert" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-base font-bold font-funnel text-slate-900 mb-1.5 leading-snug">
                  {options.title}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed break-words">
                  {options.message}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              {options.type === "confirm" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  {options.cancelLabel || "Cancelar"}
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirm}
              >
                {options.confirmLabel || "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
