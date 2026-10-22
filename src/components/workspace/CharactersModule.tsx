import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  User,
  Users,
  Heart,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Clock,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronRight,
  Eye,
  Key,
  Flame,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  Star,
  ArrowUp,
  ArrowDown,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { Character, CharacterRelationship, Chapter, TimelineEvent, MediaImage, CharacterCategory } from '../../types';
import { getTheme } from '../../utils/theme';
import { ColorGridPicker } from '../common/ColorGridPicker';

const AVATAR_COLORS = [
  '#2D5A43',
  '#1E3B5C',
  '#933D2D',
  '#583778',
  '#2B3A4A',
  '#8C6D3B',
  '#165B54',
  '#7A2E4B',
];

const RELATION_TYPES = [
  'Aliado',
  'Enemigo',
  'Familiar',
  'Romance',
  'Mentor',
  'Rival',
  'Cómplice',
  'Subordinado',
  'Otro',
];

const ROLES = [
  { id: 'protagonista', label: 'Protagonista' },
  { id: 'antagonista', label: 'Antagonista' },
  { id: 'secundario', label: 'Secundario' },
  { id: 'terciario', label: 'Terciario / Extra' },
  { id: 'otro', label: 'Otro' },
];

export const CharactersModule: React.FC = () => {
  const {
    activeBook,
    currentPalette,
    darkMode,
    toast,
    setIsSaving,
    navigateToEntity,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Collapsible sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [deleteConfirmChar, setDeleteConfirmChar] = useState<Character | null>(null);

  // Lightbox Modal for viewing character images
  const [lightboxImage, setLightboxImage] = useState<MediaImage | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [role, setRole] = useState<Character['role']>('secundario');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [motivations, setMotivations] = useState('');
  const [goals, setGoals] = useState('');
  const [fears, setFears] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [secrets, setSecrets] = useState('');
  const [evolution, setEvolution] = useState('');
  const [firstAppearance, setFirstAppearance] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [mainImageId, setMainImageId] = useState<string | undefined>(undefined);

  // Relationship input states
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState('Aliado');
  const [relDesc, setRelDesc] = useState('');

  // Character categories states
  const [characterCategories, setCharacterCategories] = useState<CharacterCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');
  const [catColorInput, setCatColorInput] = useState('#2D5A43');
  const [editingCat, setEditingCat] = useState<CharacterCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<CharacterCategory | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('secundario');

  const loadData = async () => {
    if (!activeBook) return;
    const cats = await dbService.getCharacterCategoriesByBook(activeBook.id);
    setCharacterCategories(cats);
    const chars = await dbService.getCharactersByBook(activeBook.id);
    setCharacters(chars);
    const chaps = await dbService.getChaptersByBook(activeBook.id);
    setChapters(chaps);
    const evs = await dbService.getTimelineEventsByBook(activeBook.id);
    setTimelineEvents(evs);

    if (chars.length > 0 && !selectedCharacter) {
      setSelectedCharacter(chars[0]);
    } else if (selectedCharacter) {
      const refreshed = chars.find((c) => c.id === selectedCharacter.id) || null;
      setSelectedCharacter(refreshed);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBook]);

  // Open Edit Modal
  const openEditModal = (char?: Character) => {
    if (char) {
      setEditingChar(char);
      setName(char.name);
      setAliases(char.aliases || '');
      setAge(char.age || '');
      setBirthDate(char.birthDate || '');
      setRole(char.role);
      setAppearance(char.appearance || '');
      setPersonality(char.personality || '');
      setBackstory(char.backstory || '');
      setMotivations(char.motivations || '');
      setGoals(char.goals || '');
      setFears(char.fears || '');
      setStrengths(char.strengths || '');
      setWeaknesses(char.weaknesses || '');
      setSecrets(char.secrets || '');
      setEvolution(char.evolution || '');
      setFirstAppearance(char.firstAppearance || '');
      setAdditionalNotes(char.additionalNotes || '');
      setAvatarColor(char.avatarColor || AVATAR_COLORS[0]);
      setRelationships(char.relationships || []);
      setImages(char.images || []);
      setMainImageId(char.mainImageId);
      setSelectedCategoryIds(char.categoryIds || (char.role ? [char.role] : []));
    } else {
      setEditingChar(null);
      setName('');
      setAliases('');
      setAge('');
      setBirthDate('');
      setRole('protagonista');
      setSelectedCategoryIds(['protagonista']);
      setAppearance('');
      setPersonality('');
      setBackstory('');
      setMotivations('');
      setGoals('');
      setFears('');
      setStrengths('');
      setWeaknesses('');
      setSecrets('');
      setEvolution('');
      setFirstAppearance('');
      setAdditionalNotes('');
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setRelationships([]);
      setImages([]);
      setMainImageId(undefined);
    }
    setRelTargetId('');
    setRelDesc('');
    setIsModalOpen(true);
  };

  // Add multiple image files from local disk
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        if (!url) return;

        setImages((prev) => {
          const newImg: MediaImage = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            url,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            order: prev.length,
            isCover: prev.length === 0 && !mainImageId,
            createdAt: new Date().toISOString(),
          };

          if (newImg.isCover) {
            setMainImageId(newImg.id);
          }

          return [...prev, newImg];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast(`${files.length} imagen(es) seleccionada(s)`, 'info');
  };

  // Set image as main/cover
  const handleSetMainImage = (imgId: string) => {
    setMainImageId(imgId);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === imgId,
      }))
    );
    toast('Imagen principal del personaje actualizada', 'success');
  };

  // Move image in gallery order
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    const reordered = copy.map((img, i) => ({ ...img, order: i }));
    setImages(reordered);
  };

  // Delete an image
  const handleDeleteImage = (imgId: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== imgId);
      if (mainImageId === imgId) {
        const newMain = next[0]?.id;
        setMainImageId(newMain);
        if (newMain) next[0].isCover = true;
      }
      return next;
    });
  };

  // Update image caption
  const handleUpdateImageCaption = (imgId: string, caption: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imgId ? { ...img, caption } : img))
    );
  };

  // Add a relationship to character
  const handleAddRelationship = () => {
    if (!relTargetId) return;
    setRelationships((prev) => [
      ...prev,
      {
        targetCharacterId: relTargetId,
        relationType: relType,
        description: relDesc.trim(),
      },
    ]);
    setRelTargetId('');
    setRelDesc('');
  };

  const handleRemoveRelationship = (idx: number) => {
    setRelationships((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save Character
  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeBook) return;

    setIsSaving(true);
    try {
      const charId =
        editingChar?.id ||
        'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const mainImg = images.find((img) => img.id === mainImageId) || images[0];

      const characterRecord: Character = {
        id: charId,
        bookId: activeBook.id,
        name: name.trim(),
        aliases: aliases.trim(),
        age: age.trim(),
        birthDate: birthDate.trim(),
        role,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : [role],
        appearance: appearance.trim(),
        personality: personality.trim(),
        backstory: backstory.trim(),
        motivations: motivations.trim(),
        goals: goals.trim(),
        fears: fears.trim(),
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        secrets: secrets.trim(),
        evolution: evolution.trim(),
        firstAppearance: firstAppearance.trim(),
        additionalNotes: additionalNotes.trim(),
        avatarColor,
        avatarUrl: mainImg?.url,
        images,
        mainImageId: mainImg?.id,
        relationships,
        createdAt: editingChar?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveCharacter(characterRecord);
      await loadData();
      setSelectedCharacter(characterRecord);
      setIsModalOpen(false);
      toast(
        editingChar
          ? `Ficha de "${characterRecord.name}" actualizada`
          : `Personaje "${characterRecord.name}" creado con éxito`,
        'success'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Character Category Management Handlers (Req 7)
  const handleSaveCategory = async () => {
    if (!catNameInput.trim() || !activeBook) return;
    setIsSaving(true);
    try {
      const catId = editingCat?.id || 'ccat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const catRecord: CharacterCategory = {
        id: catId,
        bookId: activeBook.id,
        name: catNameInput.trim(),
        color: catColorInput,
        order: editingCat?.order ?? characterCategories.length,
      };
      await dbService.saveCharacterCategory(catRecord);
      const updated = await dbService.getCharacterCategoriesByBook(activeBook.id);
      setCharacterCategories(updated);
      setEditingCat(null);
      setCatNameInput('');
      toast('Categoría de personaje guardada', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCat || !activeBook) return;
    setIsSaving(true);
    try {
      await dbService.deleteCharacterCategory(activeBook.id, deletingCat.id, reassignTargetCatId);
      await loadData();
      setDeletingCat(null);
      toast(`Categoría eliminada y personajes reasignados a "${reassignTargetCatId}"`, 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCategories = async () => {
    if (!activeBook) return;
    setIsSaving(true);
    try {
      const defaults = await dbService.resetCharacterCategoriesToDefault(activeBook.id);
      setCharacterCategories(defaults);
      await loadData();
      toast('Categorías de personajes restablecidas a los 18 arquetipos', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= characterCategories.length) return;
    const reordered = [...characterCategories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    for (let i = 0; i < reordered.length; i++) {
      reordered[i].order = i;
      await dbService.saveCharacterCategory(reordered[i]);
    }
    setCharacterCategories(reordered);
  };

  // Delete Character
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmChar) return;
    setIsSaving(true);
    try {
      await dbService.deleteCharacter(deleteConfirmChar.id);
      await loadData();
      if (selectedCharacter?.id === deleteConfirmChar.id) {
        setSelectedCharacter(null);
      }
      toast(`Personaje "${deleteConfirmChar.name}" eliminado`, 'info');
      setDeleteConfirmChar(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Characters (Support all categories & roles - Req 7)
  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      if (roleFilter !== 'todos') {
        const matchesRole = c.role === roleFilter || c.role.toLowerCase() === roleFilter.toLowerCase();
        const matchesCat = c.categoryIds && (
          c.categoryIds.includes(roleFilter) ||
          c.categoryIds.some((id) => id.toLowerCase() === roleFilter.toLowerCase())
        );
        if (!matchesRole && !matchesCat) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.aliases.toLowerCase().includes(q) ||
          c.appearance.toLowerCase().includes(q) ||
          c.personality.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [characters, roleFilter, searchQuery]);

  // Main portrait image of selected character
  const selectedMainImage = useMemo(() => {
    if (!selectedCharacter) return null;
    if (selectedCharacter.images && selectedCharacter.images.length > 0) {
      if (selectedCharacter.mainImageId) {
        const found = selectedCharacter.images.find(
          (img) => img.id === selectedCharacter.mainImageId
        );
        if (found) return found;
      }
      return selectedCharacter.images[0];
    }
    return null;
  }, [selectedCharacter]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)] relative">
      {/* Toggle button when sidebar is collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-2 bottom-6 z-40 p-2.5 rounded-xl border shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${theme.bgCard} ${theme.borderCard} ${theme.textPrimary}`}
          title="Mostrar lista de personajes"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Personajes ({characters.length})</span>
        </button>
      )}

      {/* Left List of Characters */}
      {isSidebarOpen && (
        <div
          className={`w-full lg:w-80 shrink-0 rounded-2xl border p-4 flex flex-col justify-between shadow-xs transition-all duration-300 ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  Personajes ({characters.length})
                </h3>
                <p className="text-[11px] text-stone-500">Dramatis personae</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCatManagerOpen(true)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5"
                  title="Gestionar categorías y arquetipos de personajes"
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal()}
                  className={`p-2 rounded-xl text-xs font-semibold shadow-sm ${theme.primaryBtn}`}
                  title="Añadir nuevo personaje"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5"
                  title="Plegar panel lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar personajes..."
                  className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                <button
                  onClick={() => setRoleFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                    roleFilter === 'todos'
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Todos
                </button>
                {characterCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setRoleFilter(c.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                      roleFilter === c.id
                        ? `${theme.activeTab} font-semibold shadow-xs`
                        : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Character Cards */}
            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredCharacters.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No se encontraron personajes.
                </div>
              ) : (
                filteredCharacters.map((char) => {
                  const isSelected = selectedCharacter?.id === char.id;
                  const thumb = char.images && char.images.length > 0 ? char.images[0].url : char.avatarUrl;

                  return (
                    <div
                      key={char.id}
                      onClick={() => setSelectedCharacter(char)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs`
                          : `${theme.borderCard} hover:bg-black/5 dark:hover:bg-white/5`
                      }`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={char.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-xs"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: char.avatarColor || AVATAR_COLORS[0] }}
                        >
                          {char.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? theme.textPrimary : 'text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {char.name}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                              char.role === 'protagonista'
                                ? `${theme.accentBadge} ${theme.accentText}`
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                            }`}
                          >
                            {char.role}
                          </span>
                        </div>
                        {char.aliases && (
                          <p className="text-[10px] text-stone-400 truncate italic">
                            "{char.aliases}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right: Full Character Sheet */}
      {selectedCharacter ? (
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header Card with Portrait */}
          <div
            className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center gap-4">
              {selectedMainImage ? (
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setLightboxImage(selectedMainImage)}
                  title="Hacer clic para ampliar imagen"
                >
                  <img
                    src={selectedMainImage.url}
                    alt={selectedCharacter.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white dark:border-stone-800 shrink-0"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0"
                  style={{ backgroundColor: selectedCharacter.avatarColor }}
                >
                  {selectedCharacter.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`font-serif text-2xl font-bold ${theme.textPrimary}`}>
                    {selectedCharacter.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1">
                    {selectedCharacter.categoryIds && selectedCharacter.categoryIds.length > 0 ? (
                      selectedCharacter.categoryIds.map((cid) => {
                        const cat = characterCategories.find((c) => c.id === cid || c.name.toLowerCase() === cid.toLowerCase());
                        return (
                          <span
                            key={cid}
                            className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-white shadow-xs"
                            style={{ backgroundColor: cat?.color || theme.accentHex }}
                          >
                            {cat?.name || cid}
                          </span>
                        );
                      })
                    ) : (
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${theme.accentBadge} ${theme.accentText}`}>
                        {selectedCharacter.role}
                      </span>
                    )}
                  </div>
                </div>
                {selectedCharacter.aliases && (
                  <p className="text-xs text-stone-500 italic mt-0.5">
                    Alias: "{selectedCharacter.aliases}"
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-2">
                  {selectedCharacter.age && <span>Edad: {selectedCharacter.age}</span>}
                  {selectedCharacter.birthDate && (
                    <>
                      <span>•</span>
                      <span>Nacimiento: {selectedCharacter.birthDate}</span>
                    </>
                  )}
                  {selectedCharacter.firstAppearance && (
                    <>
                      <span>•</span>
                      <span>1ª aparición: {selectedCharacter.firstAppearance}</span>
                    </>
                  )}
                  {selectedCharacter.images && selectedCharacter.images.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {selectedCharacter.images.length} imágenes
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => openEditModal(selectedCharacter)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Ficha</span>
              </button>
              <button
                onClick={() => setDeleteConfirmChar(selectedCharacter)}
                className="p-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-500/10"
                title="Eliminar personaje"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Character Image Gallery Section */}
          {selectedCharacter.images && selectedCharacter.images.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}>
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${theme.accentText}`}>
                  <ImageIcon className="w-4 h-4" />
                  Galería de imágenes y referencias visuales ({selectedCharacter.images.length})
                </h4>
                <button
                  onClick={() => openEditModal(selectedCharacter)}
                  className="text-xs text-stone-500 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Añadir más imágenes
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {selectedCharacter.images.map((img) => {
                  const isMain = img.id === selectedCharacter.mainImageId || img.isCover;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setLightboxImage(img)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer aspect-square bg-stone-100 dark:bg-stone-900 transition-all ${
                        isMain
                          ? `${theme.activeBorder} ring-2 ${theme.activeRing}`
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.caption || 'Imagen de personaje'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {isMain && (
                        <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${theme.activeTab} shadow-xs`}>
                          Principal
                        </span>
                      )}
                      {img.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[10px] text-white truncate">
                          {img.caption}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Apariencia & Personalidad */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.accentText}`}>
                  Apariencia Física
                </h4>
                <p className={`text-xs leading-relaxed font-serif ${theme.textPrimary}`}>
                  {selectedCharacter.appearance || 'Sin detalles registrados.'}
                </p>
              </div>

              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.accentText}`}>
                  Personalidad y Comportamiento
                </h4>
                <p className={`text-xs leading-relaxed font-serif ${theme.textPrimary}`}>
                  {selectedCharacter.personality || 'Sin detalles registrados.'}
                </p>
              </div>
            </div>

            {/* Historia & Motivaciones */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.accentText}`}>
                  Historia Personal (Backstory)
                </h4>
                <p className={`text-xs leading-relaxed font-serif ${theme.textPrimary}`}>
                  {selectedCharacter.backstory || 'Sin historia previa registrada.'}
                </p>
              </div>

              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.accentText}`}>
                  Motivaciones y Objetivos
                </h4>
                <p className={`text-xs leading-relaxed font-serif ${theme.textPrimary}`}>
                  {selectedCharacter.motivations || selectedCharacter.goals || 'Sin metas definidas.'}
                </p>
              </div>
            </div>

            {/* Psicología: Fortalezas, Debilidades, Miedos y Secretos */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}>
              <h4 className={`text-sm font-bold font-serif ${theme.textPrimary}`}>
                Dimensiones Psicológicas
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Fortalezas
                  </span>
                  <p className="text-stone-600 dark:text-stone-400">
                    {selectedCharacter.strengths || 'N/A'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="font-semibold text-rose-800 dark:text-rose-300 block mb-1">
                    Debilidades
                  </span>
                  <p className="text-stone-600 dark:text-stone-400">
                    {selectedCharacter.weaknesses || 'N/A'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="font-semibold text-purple-800 dark:text-purple-300 block mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Miedos
                  </span>
                  <p className="text-stone-600 dark:text-stone-400">
                    {selectedCharacter.fears || 'N/A'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Secretos
                  </span>
                  <p className="text-stone-600 dark:text-stone-400">
                    {selectedCharacter.secrets || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Arco Narrativo y Evolución */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}>
              <h4 className={`text-sm font-bold font-serif ${theme.textPrimary}`}>
                Arco Narrativo y Transformación
              </h4>
              <p className={`text-xs leading-relaxed font-serif ${theme.textPrimary}`}>
                {selectedCharacter.evolution || 'Sin arco de transformación detallado aún.'}
              </p>
            </div>
          </div>

          {/* Relaciones Interpersonales */}
          <div className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}>
            <h4 className={`text-sm font-bold font-serif ${theme.textPrimary}`}>
              Vínculos y Relaciones con otros Personajes ({selectedCharacter.relationships?.length || 0})
            </h4>

            {(!selectedCharacter.relationships || selectedCharacter.relationships.length === 0) ? (
              <p className="text-xs text-stone-400 italic">
                No tiene vínculos registrados. Edita la ficha para conectar con aliados o rivales.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedCharacter.relationships.map((rel, idx) => {
                  const target = characters.find((c) => c.id === rel.targetCharacterId);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 shrink-0">
                        <Heart className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                          {rel.relationType}
                        </span>
                        <h5 className={`text-xs font-bold truncate ${theme.textPrimary}`}>
                          {target ? target.name : 'Personaje no encontrado'}
                        </h5>
                        {rel.description && (
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                            {rel.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 p-16 rounded-3xl border text-center flex flex-col items-center justify-center ${theme.bgCard} ${theme.borderCard}`}
        >
          <Users className="w-12 h-12 mb-3 text-stone-400 opacity-60" />
          <h3 className={`font-serif text-lg font-bold ${theme.textPrimary}`}>
            No hay ningún personaje seleccionado
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
            Crea tu primer personaje para documentar sus rasgos, imágenes, evolución y vínculos dramáticos.
          </p>
          <button
            onClick={() => openEditModal()}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
          >
            Crear Personaje
          </button>
        </div>
      )}

      {/* Lightbox Modal for enlarged view */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border border-white/20">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Retrato'}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
                title="Cerrar imagen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lightboxImage.caption && (
              <p className="text-sm text-stone-200 font-serif italic text-center max-w-lg bg-black/40 px-4 py-1.5 rounded-full">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Character Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${theme.accentBadge} ${theme.accentText}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    {editingChar ? `Editar a ${editingChar.name}` : 'Crear Ficha de Personaje'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Dramatis personae con trasfondo, psicología, galería visual y relaciones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCharacter} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Name, Role */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Aélys Vane"
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Rol principal
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const r = e.target.value;
                      setRole(r as any);
                      if (!selectedCategoryIds.includes(r)) {
                        setSelectedCategoryIds([...selectedCategoryIds, r]);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none capitalize`}
                  >
                    {characterCategories.map((c) => (
                      <option key={c.id} value={c.name.toLowerCase()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Categories & Archetypes (Req 7) */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Categorías y Arquetipos (Permite selección múltiple)
                    </label>
                    <span className="text-[10px] text-stone-500">
                      Un personaje puede ser tanto Mentor como Antagonista o Rival en distintas etapas.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCatManagerOpen(true)}
                    className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Gestionar</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto">
                  {characterCategories.map((c) => {
                    const isChecked = selectedCategoryIds.includes(c.id) || selectedCategoryIds.includes(c.name.toLowerCase());
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id && id !== c.name.toLowerCase()));
                          } else {
                            setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          isChecked
                            ? 'text-white shadow-xs font-semibold'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                        }`}
                        style={{
                          backgroundColor: isChecked ? c.color : undefined,
                          borderColor: isChecked ? c.color : undefined,
                        }}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Aliases, Age, Birthdate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Alias / Apodos
                  </label>
                  <input
                    type="text"
                    value={aliases}
                    onChange={(e) => setAliases(e.target.value)}
                    placeholder="Ej: El Relojero Ciego"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ej: 29 años"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fecha de nacimiento / Era
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="Ej: Año 1412, Noche de la Lente Roja"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>
              </div>

              {/* IMAGE GALLERY MANAGEMENT SECTION */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary}`}>
                      Imágenes y Retratos del Personaje
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Sube retratos, vestuario o referencias visuales desde tu dispositivo. Se guardan persistentemente.
                    </p>
                  </div>

                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs ${theme.primaryBtn}`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddImages}
                    />
                  </label>
                </div>

                {images.length === 0 ? (
                  <div className="text-center py-5 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-400">
                    No has agregado imágenes para este personaje aún.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {images.map((img, idx) => {
                      const isMain = img.id === mainImageId || img.isCover;
                      return (
                        <div
                          key={img.id}
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isMain
                              ? `${theme.activeBorder} ${theme.accentBadge}`
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={img.url}
                              alt="Thumbnail"
                              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                            />
                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={img.caption || ''}
                                onChange={(e) => handleUpdateImageCaption(img.id, e.target.value)}
                                placeholder="Nota o descripción (ej: Retrato de coronación, atuendo invernal)..."
                                className={`w-full text-xs bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none ${theme.textPrimary}`}
                              />
                              <div className="flex items-center gap-2 mt-1">
                                {isMain ? (
                                  <span className={`text-[10px] font-bold ${theme.accentText} flex items-center gap-1`}>
                                    <Star className="w-3 h-3 fill-current" /> Retrato Principal
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetMainImage(img.id)}
                                    className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                                  >
                                    Fijar como principal
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="Subir orden"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'down')}
                              disabled={idx === images.length - 1}
                              className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30"
                              title="Bajar orden"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="p-1 rounded text-stone-400 hover:text-rose-600"
                              title="Eliminar imagen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Color Avatar Picker (Permite cualquier color) */}
              <div>
                <ColorGridPicker
                  value={avatarColor}
                  onChange={setAvatarColor}
                  title="Color distintivo del personaje (Cualquier color, selector libre o hexadecimal)"
                />
              </div>

              {/* Appearance & Personality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Apariencia física
                  </label>
                  <textarea
                    rows={3}
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                    placeholder="Rasgos distintivos, vestimenta, ojos, cicatrices..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Personalidad
                  </label>
                  <textarea
                    rows={3}
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Temperamento, manías, valores éticos..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Backstory & Goals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Historia personal (Backstory)
                  </label>
                  <textarea
                    rows={3}
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    placeholder="Origen, trauma fundacional, eventos que moldearon su destino..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Motivaciones y Objetivos
                  </label>
                  <textarea
                    rows={3}
                    value={motivations}
                    onChange={(e) => setMotivations(e.target.value)}
                    placeholder="¿Qué desea por encima de todo? ¿Qué necesita realmente?..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Psychological Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fortalezas
                  </label>
                  <input
                    type="text"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Ej: Estratega brillante, lealtad inquebrantable"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Debilidades
                  </label>
                  <input
                    type="text"
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="Ej: Impulsivo, desconfiado, arrogante"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Miedos profundos
                  </label>
                  <input
                    type="text"
                    value={fears}
                    onChange={(e) => setFears(e.target.value)}
                    placeholder="Ej: Ser olvidado, perder a su hermana"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Secretos ocultos
                  </label>
                  <input
                    type="text"
                    value={secrets}
                    onChange={(e) => setSecrets(e.target.value)}
                    placeholder="Ej: Fue quien abrió las compuertas de la fortaleza"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Evolution & Narrative Arc */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Arco de transformación y evolución a lo largo de la historia
                </label>
                <textarea
                  rows={2}
                  value={evolution}
                  onChange={(e) => setEvolution(e.target.value)}
                  placeholder="¿Cómo cambia desde el inicio hasta el desenlace?..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Relationships Builder */}
              <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Vínculos con otros personajes
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={relTargetId}
                    onChange={(e) => setRelTargetId(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="">Selecciona personaje...</option>
                    {characters
                      .filter((c) => !editingChar || c.id !== editingChar.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>

                  <select
                    value={relType}
                    onChange={(e) => setRelType(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    {RELATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={relDesc}
                      onChange={(e) => setRelDesc(e.target.value)}
                      placeholder="Detalle (ej: Rencor antiguo)"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={handleAddRelationship}
                      disabled={!relTargetId}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 shadow-xs ${theme.primaryBtn}`}
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {relationships.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {relationships.map((rel, idx) => {
                      const tgt = characters.find((c) => c.id === rel.targetCharacterId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {rel.relationType}:
                            </span>
                            <span className="font-medium text-stone-700 dark:text-stone-300">
                              {tgt ? tgt.name : rel.targetCharacterId}
                            </span>
                            {rel.description && (
                              <span className="text-stone-500 italic">({rel.description})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRelationship(idx)}
                            className="p-1 text-stone-400 hover:text-rose-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
                >
                  {editingChar ? 'Guardar Cambios' : 'Crear Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Character Confirmation Modal */}
      {deleteConfirmChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg">¿Eliminar este personaje?</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              Estás a punto de eliminar permanentemente a{' '}
              <strong>"{deleteConfirmChar.name}"</strong> ({deleteConfirmChar.role}). Esta acción
              no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmChar(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-md"
              >
                Eliminar Personaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHARACTER CATEGORIES MANAGER MODAL (Req 7) */}
      {isCatManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    Categorías y Arquetipos de Personajes
                  </h3>
                  <p className="text-xs text-stone-500">
                    Crea, reordena, asigna colores o personaliza los roles de tus personajes
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCatManagerOpen(false)} className="p-1.5 text-stone-400 hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Nueva categoría (ej: Antihéroe, Saboteador)..."
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                />
                <input
                  type="color"
                  value={catColorInput}
                  onChange={(e) => setCatColorInput(e.target.value)}
                  className="w-10 h-9 rounded-xl border p-0.5 cursor-pointer"
                  title="Color distintivo"
                />
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={!catNameInput.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 shadow-xs ${theme.primaryBtn}`}
                >
                  {editingCat ? 'Guardar' : 'Añadir'}
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 pt-2">
                {characterCategories.map((c, index) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0" style={{ backgroundColor: c.color }} />
                      <span className={`font-medium ${theme.textPrimary}`}>{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveCategory(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30"
                        title="Subir orden"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveCategory(index, 'down')}
                        disabled={index === characterCategories.length - 1}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 disabled:opacity-30"
                        title="Bajar orden"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCat(c);
                          setCatNameInput(c.name);
                          setCatColorInput(c.color || '#2D5A43');
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700"
                        title="Editar nombre/color"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingCat(c);
                          const remaining = characterCategories.filter((other) => other.id !== c.id);
                          setReassignTargetCatId(remaining[0]?.id || 'secundario');
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600"
                        title="Eliminar con reasignación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetCategories}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer 18 arquetipos</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCatManagerOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Reassignment Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <h3 className="font-serif font-bold text-lg text-rose-600 mb-2">
              Eliminar categoría "{deletingCat.name}"
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
              Selecciona a qué rol o categoría reasignar los personajes que la contengan:
            </p>
            <select
              value={reassignTargetCatId}
              onChange={(e) => setReassignTargetCatId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs mb-5 ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
            >
              {characterCategories
                .filter((c) => c.id !== deletingCat.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Reasignar a: {c.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow-md hover:bg-rose-700"
              >
                Confirmar y Reasignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
