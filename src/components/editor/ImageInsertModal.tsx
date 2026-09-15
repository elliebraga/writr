import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Upload as UploadIcon, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import { compressImageFile } from "../../utils/imageUtils";

interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (src: string) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [localImageSrc, setLocalImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setLocalImageSrc(null);
    setIsProcessing(false);
    onClose();
  };

  const handleConfirm = () => {
    if (localImageSrc) {
      onConfirm(localImageSrc);
      handleClose();
    }
  };

  // Processamento do arquivo de imagem com compressão
  const processFile = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setIsProcessing(true);
      try {
        const compressedBase64 = await compressImageFile(file, 1600, 1600, 0.85);
        setLocalImageSrc(compressedBase64);
      } catch (err) {
        console.error("Erro ao processar imagem para o editor:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Eventos de Drag e Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop click handles cancel */}
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col z-50 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-funnel text-slate-900 leading-tight">
                Inserir Imagem
              </h3>
              <p className="text-[11px] text-slate-500">
                Selecione do seu computador ou celular
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo Central */}
        <div className="p-5 flex-1 min-h-[200px] flex flex-col justify-center">
          <div className="space-y-4">
            {!localImageSrc ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all text-center group ${
                  dragActive
                    ? "border-indigo-600 bg-indigo-50/50 scale-[1.01]"
                    : "border-slate-200 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 group-hover:text-indigo-600 group-hover:scale-105 transition-all">
                  <UploadIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                    {isProcessing ? "Otimizando imagem..." : "Clique para escolher ou arraste o arquivo"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formatos PNG, JPG, WebP ou GIF do seu dispositivo
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[220px] p-2">
                <img
                  src={localImageSrc}
                  alt="Pré-visualização da imagem"
                  className="max-h-[200px] rounded-xl object-contain w-auto shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLocalImageSrc(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 p-1.5 rounded-full transition-colors shadow-xs cursor-pointer"
                  title="Remover Imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-white">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!localImageSrc || isProcessing}
            isLoading={isProcessing}
          >
            Inserir no Texto
          </Button>
        </div>

      </div>
    </div>
  );
};
