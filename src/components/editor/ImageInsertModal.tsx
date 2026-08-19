import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Link as LinkIcon, Upload as UploadIcon, Trash2 } from "lucide-react";
import Button from "../ui/Button";

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
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [localImageSrc, setLocalImageSrc] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setImageUrl("");
    setLocalImageSrc(null);
    onClose();
  };

  const handleConfirm = () => {
    if (activeTab === "upload" && localImageSrc) {
      onConfirm(localImageSrc);
      handleClose();
    } else if (activeTab === "url" && imageUrl.trim()) {
      onConfirm(imageUrl.trim());
      handleClose();
    }
  };

  // Processamento do arquivo de imagem e conversão para Base64/DataURL
  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          setLocalImageSrc(e.target.result);
        }
      };
      reader.readAsDataURL(file);
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
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop click handles cancel */}
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col z-50 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold font-funnel text-slate-900">
              Adicionar Imagem
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de Opções */}
        <div className="flex justify-center p-3 bg-slate-50/50 border-b border-slate-100">
          <div className="flex bg-slate-200/60 p-0.5 rounded-full w-full max-w-[280px]">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-1 text-[11px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UploadIcon className="w-3.5 h-3.5" />
              <span>Arquivo Local</span>
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`flex-1 py-1 text-[11px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "url"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Endereço URL</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Central */}
        <div className="p-5 flex-1 min-h-[180px] flex flex-col justify-center">
          
          {activeTab === "upload" ? (
            <div className="space-y-4">
              {!localImageSrc ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center ${
                    dragActive
                      ? "border-slate-800 bg-slate-50"
                      : "border-slate-200 hover:border-slate-400 bg-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                    <UploadIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Arraste e solte uma imagem aqui
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ou clique para selecionar do computador
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[160px] p-2">
                  <img
                    src={localImageSrc}
                    alt="Preview de upload"
                    className="max-h-[144px] rounded-lg object-contain w-auto shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setLocalImageSrc(null)}
                    className="absolute top-2 right-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 p-1.5 rounded-full transition-colors shadow-xs"
                    title="Remover Imagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Endereço URL da Imagem
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.png"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-800 pr-9"
                  />
                  <LinkIcon className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {imageUrl.trim() && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[120px] p-2">
                  <img
                    src={imageUrl.trim()}
                    alt="Preview por URL"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                    }}
                    className="max-h-[104px] rounded-lg object-contain w-auto shadow-2xs"
                  />
                </div>
              )}
            </div>
          )}

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
            disabled={
              activeTab === "upload"
                ? !localImageSrc
                : !imageUrl.trim()
            }
          >
            Inserir Imagem
          </Button>
        </div>

      </div>
    </div>
  );
};
