import React, { useState, useEffect } from "react";
import { Users, Plus, Sparkles } from "lucide-react";
import type { Book } from "../../types/book";
import type { Character, CharacterRoleType } from "../../types/character";
import { CharacterCard } from "../../components/characters/CharacterCard";
import { CharacterDrawer } from "../../components/characters/CharacterDrawer";
import { characterService } from "../../services";
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
      const remoteCharacters = await characterService.getCharacters(safeBookId);
      if (remoteCharacters.length > 0) {
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
    const savedChar = await characterService.saveCharacter(safeBookId, characterData);

    setCharacters((prev) => {
      const exists = prev.some((c) => c.id === savedChar.id);
      const updated = exists
        ? prev.map((c) => (c.id === savedChar.id ? { ...c, ...savedChar } : c))
        : [...prev, savedChar];

      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setIsDrawerOpen(false);
    setSelectedCharacterToEdit(null);
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

    await characterService.deleteCharacter(safeCharId);

    if (selectedCharacterToEdit && (selectedCharacterToEdit.id === characterId || selectedCharacterToEdit.id === safeCharId)) {
      setIsDrawerOpen(false);
      setSelectedCharacterToEdit(null);
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col font-sans select-none overflow-y-auto">
      
      {/* Drawer Lateral de Criação/Edição */}
      <CharacterDrawer
        isOpen={isDrawerOpen}
        characterToEdit={selectedCharacterToEdit}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCharacterToEdit(null);
        }}
        onSaveCharacter={handleSaveCharacter}
        onDeleteCharacter={handleDeleteCharacter}
      />

      {/* Condicional de Estado: Carregando vs Vazio vs Lista de Cards */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2 py-20">
          <Sparkles className="w-5 h-5 animate-pulse text-slate-400" />
          <span>Carregando elenco da história...</span>
        </div>
      ) : characters.length === 0 ? (
        
        // 🔴 ROTA NÃO: Sem personagens criados ainda
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-20 p-6">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-slate-400" />
          </div>

          <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight mb-2">
            Nenhum personagem cadastrado
          </h2>

          <p className="text-base text-slate-500 font-sans leading-relaxed mb-8">
            Dê vida ao elenco de <strong className="text-slate-800">{activeBook.book_name}</strong> criando seus protagonistas e antagonistas.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenCreateDrawer}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Criar Personagem
          </Button>
        </div>
      ) : (
        
        // 🟢 ROTA SIM: Lista de Cards de Personagens
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          
          {/* Header Superior da Aba Personagens */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-funnel text-slate-900 tracking-tight">
                  Elenco de Personagens
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {characters.length} {characters.length === 1 ? "membro" : "membros"}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-sans mt-1">
                Fichas detalhadas de personalidade, papel dramático e arquétipos.
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

          {/* Grid de Cards de Personagens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onSelect={() => handleOpenEditDrawer(character)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
