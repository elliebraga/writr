export interface CustomFont {
  name: string;
  family: string;
  category: "sans-serif" | "serif" | "display" | "monospace" | "handwriting";
  weights?: string;
}

export const CURATED_GOOGLE_FONTS: CustomFont[] = [
  {
    name: "Antonio",
    family: "'Antonio', sans-serif",
    category: "display",
    weights: "100..700",
  },
  {
    name: "Poppins",
    family: "'Poppins', sans-serif",
    category: "sans-serif",
    weights: "300..800",
  },
  {
    name: "Montserrat",
    family: "'Montserrat', sans-serif",
    category: "sans-serif",
    weights: "300..800",
  },
  {
    name: "Outfit",
    family: "'Outfit', sans-serif",
    category: "sans-serif",
    weights: "300..800",
  },
  {
    name: "Oswald",
    family: "'Oswald', sans-serif",
    category: "display",
    weights: "300..700",
  },
  {
    name: "Bebas Neue",
    family: "'Bebas Neue', sans-serif",
    category: "display",
    weights: "400",
  },
  {
    name: "Caveat",
    family: "'Caveat', cursive",
    category: "handwriting",
    weights: "400..700",
  },
  {
    name: "Dancing Script",
    family: "'Dancing Script', cursive",
    category: "handwriting",
    weights: "400..700",
  },
  {
    name: "Space Grotesk",
    family: "'Space Grotesk', sans-serif",
    category: "sans-serif",
    weights: "300..700",
  },
  {
    name: "Libre Baskerville",
    family: "'Libre Baskerville', serif",
    category: "serif",
    weights: "400;700",
  },
  {
    name: "Cormorant Garamond",
    family: "'Cormorant Garamond', serif",
    category: "serif",
    weights: "300..700",
  },
  {
    name: "Cinzel Decorative",
    family: "'Cinzel Decorative', serif",
    category: "display",
    weights: "400;700",
  },
  {
    name: "Syne",
    family: "'Syne', sans-serif",
    category: "display",
    weights: "400..800",
  },
  {
    name: "Plus Jakarta Sans",
    family: "'Plus Jakarta Sans', sans-serif",
    category: "sans-serif",
    weights: "300..800",
  },
  {
    name: "Bitter",
    family: "'Bitter', serif",
    category: "serif",
    weights: "300..800",
  },
  {
    name: "Abril Fatface",
    family: "'Abril Fatface', serif",
    category: "display",
    weights: "400",
  },
];

const STORAGE_KEY = "writr_custom_fonts";
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error("Erro no subscriber de fontes:", e);
    }
  });
}

/**
 * Carrega uma fonte do Google Fonts injetando dinamicamente a tag <link> no <head>
 */
export function loadGoogleFont(fontName: string, weights?: string): Promise<boolean> {
  const cleanName = fontName.trim();
  if (!cleanName) return Promise.resolve(false);

  const elementId = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  if (document.getElementById(elementId)) {
    return Promise.resolve(true);
  }

  const encodedName = cleanName.replace(/\s+/g, "+");
  const weightsParam = weights ? `:wght@${weights}` : ":ital,wght@0,300..800;1,300..800";

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = elementId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}${weightsParam}&display=swap`;

    link.onload = () => {
      resolve(true);
    };

    link.onerror = () => {
      // Fallback: tenta carregar sem restrição estrita de pesos
      link.onerror = () => {
        link.remove();
        resolve(false);
      };
      link.href = `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`;
    };

    document.head.appendChild(link);
  });
}

/**
 * Obtém a lista de fontes personalizadas salvas no localStorage
 */
export function getSavedCustomFonts(): CustomFont[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Adiciona uma fonte personalizada
 */
export async function addCustomFont(font: CustomFont): Promise<boolean> {
  const loaded = await loadGoogleFont(font.name, font.weights);
  const current = getSavedCustomFonts();
  
  // Evitar duplicatas por nome (case-insensitive)
  const existingIdx = current.findIndex(
    (f) => f.name.toLowerCase() === font.name.toLowerCase()
  );

  if (existingIdx >= 0) {
    current[existingIdx] = font;
  } else {
    current.push(font);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    notifySubscribers();
    return loaded;
  } catch (err) {
    console.error("Falha ao salvar fonte no localStorage:", err);
    return loaded;
  }
}

/**
 * Remove uma fonte personalizada salva
 */
export function removeCustomFont(fontName: string): void {
  const current = getSavedCustomFonts();
  const filtered = current.filter(
    (f) => f.name.toLowerCase() !== fontName.toLowerCase()
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  notifySubscribers();
}

/**
 * Inscreve um componente para receber atualizações quando fontes personalizadas mudarem
 */
export function subscribeCustomFonts(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Inicializa e carrega todas as fontes personalizadas já salvas ao abrir a aplicação
 */
export function initCustomFonts(): void {
  const fonts = getSavedCustomFonts();
  fonts.forEach((f) => {
    loadGoogleFont(f.name, f.weights);
  });
}
