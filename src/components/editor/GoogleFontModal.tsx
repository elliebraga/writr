import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  Type,
} from "lucide-react";
import {
  CURATED_GOOGLE_FONTS,
  type CustomFont,
  getSavedCustomFonts,
  addCustomFont,
  removeCustomFont,
  subscribeCustomFonts,
  loadGoogleFont,
} from "../../services/fontService";

interface GoogleFontModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFont?: (fontFamily: string) => void;
}

export const GoogleFontModal: React.FC<GoogleFontModalProps> = ({
  isOpen,
  onClose,
  onSelectFont,
}) => {
  const [savedFonts, setSavedFonts] = useState<CustomFont[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [customFontInput, setCustomFontInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Carregar fontes salvas e escutar mudanças
  useEffect(() => {
    setSavedFonts(getSavedCustomFonts());
    const unsub = subscribeCustomFonts(() => {
      setSavedFonts(getSavedCustomFonts());
    });
    return unsub;
  }, []);

  // Pré-carregar as fontes da lista curada no documento para exibição fiel das miniaturas
  useEffect(() => {
    if (isOpen) {
      CURATED_GOOGLE_FONTS.forEach((f) => {
        loadGoogleFont(f.name, f.weights);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFontSaved = (name: string) => {
    return savedFonts.some((f) => f.name.toLowerCase() === name.toLowerCase());
  };

  const handleAddPredefined = async (font: CustomFont, applyNow = false) => {
    await addCustomFont(font);
    if (applyNow && onSelectFont) {
      onSelectFont(font.family);
      onClose();
    }
  };

  const handleRemove = (name: string) => {
    removeCustomFont(name);
  };

  const handleAddCustomInput = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = customFontInput.trim();
    if (!name) return;

    setIsAdding(true);
    setFeedbackMsg(null);

    // Carrega do Google Fonts
    const ok = await loadGoogleFont(name);
    if (ok) {
      const newFont: CustomFont = {
        name,
        family: `'${name}', sans-serif`,
        category: "sans-serif",
      };
      await addCustomFont(newFont);
      setFeedbackMsg({
        text: `Fonte "${name}" adicionada com sucesso ao seu editor!`,
        type: "success",
      });
      setCustomFontInput("");
      if (onSelectFont) {
        onSelectFont(newFont.family);
      }
    } else {
      setFeedbackMsg({
        text: `Não foi possível carregar a fonte "${name}". Verifique a ortografia exata no Google Fonts.`,
        type: "error",
      });
    }
    setIsAdding(false);
  };

  // Filtragem
  const filteredCurated = CURATED_GOOGLE_FONTS.filter((font) => {
    const matchesSearch =
      font.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      font.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || font.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Fontes do Google Fonts</h2>
              <p className="text-xs text-slate-600">
                Adicione qualquer tipografia da biblioteca oficial para usar no seu texto.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input para adicionar qualquer fonte por nome */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <form onSubmit={handleAddCustomInput} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Digite o nome exato da fonte (ex: Antonio, Poppins, Outfit, Caveat...)"
                value={customFontInput}
                onChange={(e) => setCustomFontInput(e.target.value)}
                className="w-full h-10 px-3.5 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !customFontInput.trim()}
              className="h-10 px-4 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Fonte</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback */}
          {feedbackMsg && (
            <p
              className={`text-xs mt-2 font-medium ${
                feedbackMsg.type === "success" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {feedbackMsg.text}
            </p>
          )}

          {/* Seção de fontes já salvas pelo usuário */}
          {savedFonts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Fontes ativas no seu menu ({savedFonts.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {savedFonts.map((f) => (
                  <div
                    key={f.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium"
                  >
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => {
                        if (onSelectFont) {
                          onSelectFont(f.family);
                          onClose();
                        }
                      }}
                      title="Clique para aplicar no texto agora"
                    >
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(f.name)}
                      className="text-indigo-400 hover:text-rose-600 transition-colors"
                      title="Remover do menu"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Busca e Filtros para a biblioteca curada */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar sugestões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Todas" },
              { id: "sans-serif", label: "Sem Serifa" },
              { id: "serif", label: "Serifadas" },
              { id: "display", label: "Display / Título" },
              { id: "handwriting", label: "Cursiva" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Fontes com Preview Tipográfico */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCurated.map((font) => {
              const saved = isFontSaved(font.name);
              return (
                <div
                  key={font.name}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{font.name}</span>
                        {font.name === "Antonio" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Recomendada
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 capitalize px-1.5 py-0.5 rounded bg-slate-100">
                        {font.category}
                      </span>
                    </div>

                    {/* Preview da Fonte */}
                    <div
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-3 text-slate-800 transition-colors group-hover:bg-indigo-50/40"
                      style={{ fontFamily: font.family }}
                    >
                      <p className="text-sm line-clamp-1">
                        O rápido gavião marrom pula sobre o cão.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ABCDEFGHIJKLMN abcdefghijklmn 1234567890
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleAddPredefined(font, true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Usar no texto</span>
                      <Sparkles className="w-3 h-3" />
                    </button>

                    {saved ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(font.name)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Clique para remover"
                      >
                        <Check className="w-3 h-3" />
                        <span>No Menu</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddPredefined(font, false)}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCurated.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Nenhuma fonte encontrada com os filtros selecionados.
              <br />
              Você pode digitar o nome exato no campo acima para adicioná-la diretamente do Google Fonts!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
          >
            <span>Explorar catálogo completo no Google Fonts</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
