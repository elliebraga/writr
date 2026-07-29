import React, { useState, useEffect } from "react";
import { Users, Plus, Sparkles } from "lucide-react";
import type { Book } from "../../types/book";
import type { Character, CharacterRoleType } from "../../types/character";
import { CharacterCard } from "../../components/characters/CharacterCard";
import { CharacterDrawer } from "../../components/characters/CharacterDrawer";
import { supabase } from "../../supabaseClient";
import Button from "../../components/ui/Button";
import { ensureValidUuid } from "../../utils/uuidUtils";

interface CharacterFlowProps {
  activeBook: Book;
}

export const CharacterFlow: React.FC<CharacterFlowProps> = ({ activeBook }) => {
  const safeBookId = ensureValidUuid(activeBook.id);
  const localStorageKey = `writr_characters_${safeBookId}`;

  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Controle de estado do Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCharacterToEdit, setSelectedCharacterToEdit] = useState<Character | null>(null);

  // Salva no localStorage sempre que os personagens mudarem
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(characters));
    } catch (e) {
      console.error("Erro ao salvar personagens no localStorage:", e);
    }
  }, [characters, localStorageKey]);

  useEffect(() => {
    fetchCharacters();
  }, [safeBookId]);

  // Carrega personagens do Supabase e mescla sem perder os do localStorage
  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id_book", safeBookId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const remoteCharacters: Character[] = data.map((c: any) => {
          let appearanceStr = c.appearance || null;
          let secretsStr = c.secrets || null;
          let summaryStr = c.summary || null;

          if (c.character_details) {
            try {
              const parsed = JSON.parse(c.character_details);
              if (typeof parsed === "object" && parsed !== null) {
                appearanceStr = appearanceStr || parsed.appearance || null;
                secretsStr = secretsStr || parsed.secrets || null;
                summaryStr = summaryStr || parsed.notes || null;
              }
            } catch (e) {
              summaryStr = summaryStr || c.character_details;
            }
          }

          const imgUrl = c.character_images && c.character_images.length > 0
            ? c.character_images[0]
            : c.image_url || null;

          return {
            ...c,
            id: ensureValidUuid(c.id),
            id_book: safeBookId,
            book_id: safeBookId,
            character_name: c.character_name || c.name || "Personagem sem nome",
            name: c.character_name || c.name || "Personagem sem nome",
            appearance: appearanceStr,
            secrets: secretsStr,
            summary: summaryStr,
            image_url: imgUrl,
          };
        });

        setCharacters((prev) => {
          const map = new Map<string, Character>();
          prev.forEach((c) => map.set(c.id, c));
          remoteCharacters.forEach((c) => map.set(c.id, c));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      console.log("Personagens salvos em modo local.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateDrawer = () => {
    setSelectedCharacterToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (character: Character) => {
    setSelectedCharacterToEdit(character);
    setIsDrawerOpen(true);
  };

  const handleSaveCharacter = async (characterData: {
    id?: string;
    character_name: string;
    role_type: CharacterRoleType;
    character_sign?: string;
    character_personality?: string;
    character_motivations?: string;
    appearance?: string;
    secrets?: string;
    character_images?: string[];
    character_details?: string;
    summary?: string;
  }) => {
    const safeCharId = ensureValidUuid(characterData.id);

    const payload: any = {
      id: safeCharId,
      id_book: safeBookId,
      character_name: characterData.character_name,
      character_sign: characterData.character_sign || null,
      character_personality: characterData.character_personality || null,
      character_motivations: characterData.character_motivations || null,
      character_images: characterData.character_images || [],
      character_details: characterData.character_details || null,
      updated_at: new Date().toISOString(),
    };

    if (characterData.id) {
      // Atualização de personagem existente
      const updatedRecord: Partial<Character> = {
        id: safeCharId,
        character_name: characterData.character_name,
        name: characterData.character_name,
        role_type: characterData.role_type,
        character_sign: characterData.character_sign,
        character_personality: characterData.character_personality,
        character_motivations: characterData.character_motivations,
        appearance: characterData.appearance,
        secrets: characterData.secrets,
        summary: characterData.summary,
        character_images: characterData.character_images,
        image_url: characterData.character_images && characterData.character_images.length > 0 ? characterData.character_images[0] : null,
        character_details: characterData.character_details,
        updated_at: new Date().toISOString(),
      };

      setCharacters((prev) => {
        const updated = prev.map((c) => (c.id === characterData.id || c.id === safeCharId ? { ...c, ...updatedRecord } : c));
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const { error } = await supabase
          .from("characters")
          .update(payload)
          .eq("id", safeCharId);

        if (error) {
          console.error("Erro ao atualizar personagem no Supabase:", error.message);
        }
      } catch (err) {
        console.log("Atualizado na memória local.");
      }
    } else {
      // Criação de novo personagem
      const newCharacter: Character = {
        id: safeCharId,
        id_book: safeBookId,
        book_id: safeBookId,
        character_name: characterData.character_name,
        name: characterData.character_name,
        role_type: characterData.role_type,
        character_sign: characterData.character_sign,
        character_personality: characterData.character_personality,
        character_motivations: characterData.character_motivations,
        appearance: characterData.appearance,
        secrets: characterData.secrets,
        summary: characterData.summary,
        character_images: characterData.character_images,
        image_url: characterData.character_images && characterData.character_images.length > 0 ? characterData.character_images[0] : null,
        character_details: characterData.character_details,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCharacters((prev) => {
        const updated = [...prev, newCharacter];
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const { data, error } = await supabase
          .from("characters")
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          newCharacter.id = data.id;
        } else if (error) {
          console.error("Erro ao inserir personagem no Supabase:", error.message);
        }
      } catch (err) {
        console.log("Persistido na memória local.");
      }
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    const safeCharId = ensureValidUuid(characterId);
    setCharacters((prev) => {
      const updated = prev.filter((c) => c.id !== characterId && c.id !== safeCharId);
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await supabase.from("characters").delete().eq("id", safeCharId);
    } catch (err) {
      console.log("Removido na memória local.");
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen p-6 md:p-10 flex flex-col font-sans select-none">
      {/* Drawer Ficha do Personagem */}
      <CharacterDrawer
        isOpen={isDrawerOpen}
        characterToEdit={selectedCharacterToEdit}
        onClose={() => setIsDrawerOpen(false)}
        onSaveCharacter={handleSaveCharacter}
        onDeleteCharacter={handleDeleteCharacter}
      />

      {/* Condicional de Estado: Carregando vs Conteúdo */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <Sparkles className="w-5 h-5 animate-pulse text-slate-400" />
          <span>Carregando personagens...</span>
        </div>
      ) : characters.length === 0 ? (
        
        // 🔴 ROTA NÃO (Livro Vazio / Sem Personagens criados)
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-slate-400" />
          </div>

          <h2 className="text-xl font-bold font-funnel text-slate-900 tracking-tight mb-2">
            Sua obra ainda não possui personagens
          </h2>

          <p className="text-base text-slate-500 font-sans leading-relaxed mb-8">
            Adicione os protagonistas, antagonistas e personagens secundários que darão vida a <strong className="text-slate-800">{activeBook.book_name}</strong>.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenCreateDrawer}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Adicionar Personagem
          </Button>
        </div>
      ) : (
        
        // 🟢 ROTA SIM (Livro com Personagens Existentes)
        <div className="max-w-6xl w-full mx-auto flex flex-col flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
                  Personagens da Obra
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {characters.length} {characters.length === 1 ? "personagem" : "personagens"}
                </span>
              </div>
              <p className="text-base text-slate-500 font-sans mt-1">
                Fichas detalhadas de elenco e relacionamentos da história.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateDrawer}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Personagem
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onSelect={handleOpenEditDrawer}
                onDelete={handleDeleteCharacter}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
