import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Lightbulb,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Edit2,
  Trash2,
  BookOpen,
  User,
  Compass,
  Clock,
  X,
  Check,
  Tag,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Archive,
  Inbox,
  CheckSquare,
  Square,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  Image as ImageIcon,
  Star,
  ArrowUp,
  ArrowDown,
  Maximize2,
  CornerDownRight,
  FolderTree,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { Idea, IdeaTray, IdeaCategory, Chapter, Character, WorldDetail, TimelineEvent, MediaImage } from '../../types';
import { getTheme } from '../../utils/theme';

export const IdeasModule: React.FC = () => {
  const {
    activeBook,
    currentPalette,
    darkMode,
    customPalettes,
    toast,
    setIsSaving,
    setActiveSection,
    setActiveChapterId,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [activeTray, setActiveTray] = useState<IdeaTray>('en_espera');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Collapsible sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State for Idea create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [deleteConfirmIdea, setDeleteConfirmIdea] = useState<Idea | null>(null);

  // Lightbox Modal for viewing enlarged images
  const [lightboxImage, setLightboxImage] = useState<MediaImage | null>(null);

  // Category Manager Modal
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');
  const [catColorInput, setCatColorInput] = useState('#2D5A43');
  const [catParentIdInput, setCatParentIdInput] = useState<string>(''); // For subcategories
  const [editingCat, setEditingCat] = useState<IdeaCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<IdeaCategory | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('sin_categoria');

  // Conversion Menu State
  const [convertIdea, setConvertIdea] = useState<Idea | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tray, setTray] = useState<IdeaTray>('en_espera');
  const [categoryId, setCategoryId] = useState<string>('icat_tra');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [priority, setPriority] = useState<Idea['priority']>('media');
  const [images, setImages] = useState<MediaImage[]>([]);
  const [mainImageId, setMainImageId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    if (!activeBook) return;
    const cats = await dbService.getIdeaCategories(activeBook.id);
    setCategories(cats);
    const list = await dbService.getIdeasByBook(activeBook.id);
    setIdeas(list);
  };

  useEffect(() => {
    loadData();
  }, [activeBook]);

  // Separate parent categories from subcategories
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, IdeaCategory[]>();
    categories.forEach((c) => {
      if (c.parentId) {
        const list = map.get(c.parentId) || [];
        list.push(c);
        map.set(c.parentId, list);
      }
    });
    return map;
  }, [categories]);

  // Subcategories available for active category filter
  const currentFilterSubcategories = useMemo(() => {
    if (categoryFilter === 'todos') return [];
    return subcategoriesByParent.get(categoryFilter) || [];
  }, [categoryFilter, subcategoriesByParent]);

  // Subcategories available for current form category
  const currentFormSubcategories = useMemo(() => {
    return subcategoriesByParent.get(categoryId) || [];
  }, [categoryId, subcategoriesByParent]);

  const openEditModal = (idea?: Idea) => {
    if (idea) {
      setEditingIdea(idea);
      setTitle(idea.title);
      setContent(idea.content);
      setTray(idea.tray || (idea.status === 'utilizada' ? 'realizadas' : idea.status === 'descartada' ? 'descartadas' : 'en_espera'));
      setCategoryId(idea.categoryId || 'icat_tra');
      setSubcategoryId(idea.subcategoryId || '');
      setPriority(idea.priority);
      setImages(idea.images || []);
      setMainImageId(idea.mainImageId);
    } else {
      setEditingIdea(null);
      setTitle('');
      setContent('');
      setTray(activeTray);
      const defaultParent = parentCategories[0]?.id || categories[0]?.id || 'icat_tra';
      setCategoryId(defaultParent);
      const subs = subcategoriesByParent.get(defaultParent);
      setSubcategoryId(subs && subs.length > 0 ? subs[0].id : '');
      setPriority('media');
      setImages([]);
      setMainImageId(undefined);
    }
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
          const isFirst = prev.length === 0 && !mainImageId;
          const newImg: MediaImage = {
            id: 'iimg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            url,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            order: prev.length,
            isCover: isFirst,
            createdAt: new Date().toISOString(),
          };

          if (isFirst) {
            setMainImageId(newImg.id);
          }

          return [...prev, newImg];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast(`${files.length} imagen(es) de inspiración añadida(s)`, 'info');
  };

  const handleSetMainImage = (imgId: string) => {
    setMainImageId(imgId);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === imgId,
      }))
    );
    toast('Imagen principal de la idea seleccionada', 'success');
  };

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

  const handleUpdateImageCaption = (imgId: string, caption: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imgId ? { ...img, caption } : img))
    );
  };

  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    if (!activeBook) return;

    setIsSaving(true);
    try {
      const ideaId =
        editingIdea?.id ||
        'idea_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const statusMap: Record<IdeaTray, Idea['status']> = {
        en_espera: 'nueva',
        realizadas: 'utilizada',
        descartadas: 'descartada',
      };

      const mainImg = images.find((i) => i.id === mainImageId) || images[0];

      const ideaRecord: Idea = {
        id: ideaId,
        bookId: activeBook.id,
        title: title.trim() || 'Idea sin título',
        content: content.trim(),
        tags: editingIdea?.tags || [],
        status: statusMap[tray],
        tray,
        categoryId,
        subcategoryId: subcategoryId || undefined,
        images,
        mainImageId: mainImg?.id,
        isCompleted: tray === 'realizadas',
        priority,
        relatedCharacterIds: editingIdea?.relatedCharacterIds || [],
        relatedChapterIds: editingIdea?.relatedChapterIds || [],
        relatedDetailIds: editingIdea?.relatedDetailIds || [],
        createdAt: editingIdea?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveIdea(ideaRecord);
      await loadData();
      setIsModalOpen(false);
      toast(editingIdea ? 'Idea actualizada' : 'Idea registrada con éxito', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick move between trays
  const handleMoveIdeaTray = async (idea: Idea, newTray: IdeaTray) => {
    setIsSaving(true);
    try {
      const isComp = newTray === 'realizadas';
      const statusMap: Record<IdeaTray, Idea['status']> = {
        en_espera: 'nueva',
        realizadas: 'utilizada',
        descartadas: 'descartada',
      };
      const updated: Idea = {
        ...idea,
        tray: newTray,
        status: statusMap[newTray],
        isCompleted: isComp,
        updatedAt: new Date().toISOString(),
      };
      await dbService.saveIdea(updated);
      await loadData();
      const trayNames: Record<IdeaTray, string> = {
        en_espera: 'En Espera',
        realizadas: 'Realizadas',
        descartadas: 'Descartadas',
      };
      toast(`Idea movida a "${trayNames[newTray]}"`, 'info');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle completion checkbox in "Realizadas" tray
  const handleToggleCompleted = async (idea: Idea) => {
    const nextState = !idea.isCompleted;
    const targetTray: IdeaTray = nextState ? 'realizadas' : 'en_espera';
    await handleMoveIdeaTray(idea, targetTray);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmIdea) return;
    setIsSaving(true);
    try {
      await dbService.deleteIdea(deleteConfirmIdea.id);
      await loadData();
      toast('Idea eliminada', 'info');
      setDeleteConfirmIdea(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert Idea into another narrative entity
  const handleConvertIdea = async (
    targetType: 'chapter' | 'character' | 'detail' | 'timeline'
  ) => {
    if (!convertIdea || !activeBook) return;
    setIsSaving(true);

    try {
      if (targetType === 'chapter') {
        const existingChapters = await dbService.getChaptersByBook(activeBook.id);
        const nextNum = existingChapters.length + 1;
        const newChap: Chapter = {
          id: 'chap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          bookId: activeBook.id,
          order: nextNum,
          number: nextNum,
          title: convertIdea.title,
          synopsis: convertIdea.content.slice(0, 300),
          content: `<p>${convertIdea.content.replace(/\n\n/g, '</p><p>')}</p>`,
          status: 'borrador',
          wordCount: convertIdea.content.split(/\s+/).length,
          characterCount: convertIdea.content.length,
          privateNotes: `Convertido desde la idea: ${convertIdea.title}`,
          relatedCharacterIds: [],
          relatedTimelineEventIds: [],
          audioIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbService.saveChapter(newChap);

        await dbService.saveIdea({
          ...convertIdea,
          tray: 'realizadas',
          status: 'utilizada',
          isCompleted: true,
        });
        await loadData();
        toast(`Idea convertida en Capítulo ${nextNum}`, 'success');
        setConvertIdea(null);
        setActiveChapterId(newChap.id);
        setActiveSection('capitulos');
      } else if (targetType === 'character') {
        const newChar: Character = {
          id: 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          bookId: activeBook.id,
          name: convertIdea.title,
          aliases: '',
          age: '',
          birthDate: '',
          role: 'secundario',
          appearance: '',
          personality: '',
          backstory: convertIdea.content,
          motivations: '',
          goals: '',
          fears: '',
          strengths: '',
          weaknesses: '',
          secrets: '',
          evolution: '',
          firstAppearance: '',
          additionalNotes: `Convertido desde la idea: ${convertIdea.title}`,
          avatarColor: '#2D5A43',
          relationships: [],
          images: convertIdea.images || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbService.saveCharacter(newChar);
        await dbService.saveIdea({
          ...convertIdea,
          tray: 'realizadas',
          status: 'utilizada',
          isCompleted: true,
        });
        await loadData();
        toast(`Idea convertida en ficha de personaje`, 'success');
        setConvertIdea(null);
        setActiveSection('personajes');
      } else if (targetType === 'detail') {
        const newDet: WorldDetail = {
          id: 'det_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          bookId: activeBook.id,
          name: convertIdea.title,
          category: 'conceptos',
          description: convertIdea.content,
          historicalPeriod: '',
          tags: convertIdea.tags || [],
          images: convertIdea.images || [],
          immutableInfo: '',
          provisionalInfo: convertIdea.content,
          relatedCharacterIds: [],
          relatedChapterIds: [],
          relatedIdeaIds: [convertIdea.id],
          relatedTimelineEventIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbService.saveDetail(newDet);
        await dbService.saveIdea({
          ...convertIdea,
          tray: 'realizadas',
          status: 'utilizada',
          isCompleted: true,
        });
        await loadData();
        toast(`Idea convertida en ficha de lore`, 'success');
        setConvertIdea(null);
        setActiveSection('detalles');
      } else if (targetType === 'timeline') {
        const newEv: TimelineEvent = {
          id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          bookId: activeBook.id,
          title: convertIdea.title,
          description: convertIdea.content,
          dateType: 'aproximada',
          dateDisplay: 'Momento clave',
          numericSortValue: 50,
          category: 'trama_principal',
          color: '#3B82F6',
          status: 'confirmado',
          importance: 'media',
          images: convertIdea.images || [],
          characterIds: convertIdea.relatedCharacterIds || [],
          chapterIds: convertIdea.relatedChapterIds || [],
          detailIds: convertIdea.relatedDetailIds || [],
          connectedEventIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbService.saveTimelineEvent(newEv);
        await dbService.saveIdea({
          ...convertIdea,
          tray: 'realizadas',
          status: 'utilizada',
          isCompleted: true,
        });
        await loadData();
        toast(`Idea convertida en acontecimiento de la línea temporal`, 'success');
        setConvertIdea(null);
        setActiveSection('timeline');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Category & Subcategory CRUD
  const handleSaveCategory = async () => {
    if (!catNameInput.trim() || !activeBook) return;
    setIsSaving(true);
    try {
      const catId =
        editingCat?.id ||
        (catParentIdInput ? 'isub_' : 'icat_') + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const catRecord: IdeaCategory = {
        id: catId,
        bookId: activeBook.id,
        name: catNameInput.trim(),
        color: catColorInput,
        parentId: catParentIdInput ? catParentIdInput : null,
        order: editingCat?.order ?? categories.length,
      };

      await dbService.saveIdeaCategory(catRecord);
      const updated = await dbService.getIdeaCategories(activeBook.id);
      setCategories(updated);
      setEditingCat(null);
      setCatNameInput('');
      setCatParentIdInput('');
      toast(
        catParentIdInput
          ? 'Subcategoría de ideas guardada'
          : 'Categoría principal de ideas guardada',
        'success'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCat || !activeBook) return;
    setIsSaving(true);
    try {
      await dbService.deleteIdeaCategoryAndReassign(
        deletingCat.id,
        reassignTargetCatId,
        activeBook.id
      );
      await loadData();
      setDeletingCat(null);
      toast('Categoría eliminada con reasignación segura', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCategories = async () => {
    if (!activeBook) return;
    setIsSaving(true);
    try {
      const defaults = await dbService.resetIdeaCategoriesToDefault(activeBook.id);
      setCategories(defaults);
      await loadData();
      toast('Categorías y subcategorías de ideas restablecidas', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const getIdeaTray = (i: Idea): IdeaTray => {
    if (i.tray) return i.tray;
    if (i.isCompleted || i.status === 'utilizada') return 'realizadas';
    if (i.status === 'descartada') return 'descartadas';
    return 'en_espera';
  };

  // Filtered ideas based on current active tray, category filter, subcategory filter and search
  const filteredIdeas = useMemo(() => {
    return ideas.filter((item) => {
      const itemTray = getIdeaTray(item);
      if (itemTray !== activeTray) return false;

      if (categoryFilter !== 'todos') {
        const matchesCategory = item.categoryId === categoryFilter;
        if (!matchesCategory) return false;

        if (subcategoryFilter !== 'todos') {
          if (item.subcategoryId !== subcategoryFilter) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = item.title.toLowerCase().includes(q);
        const mContent = item.content.toLowerCase().includes(q);
        const mTag = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        return mTitle || mContent || mTag;
      }
      return true;
    });
  }, [ideas, activeTray, categoryFilter, subcategoryFilter, searchQuery]);

  // Counts per tray
  const trayCounts = useMemo(() => {
    const counts: Record<IdeaTray, number> = {
      en_espera: 0,
      realizadas: 0,
      descartadas: 0,
    };
    ideas.forEach((i) => {
      const t = getIdeaTray(i);
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [ideas]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)] relative">
      {/* Collapsed toggle */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-2 bottom-6 z-40 p-2.5 rounded-xl border shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${theme.bgCard} ${theme.borderCard} ${theme.textPrimary}`}
          title="Mostrar bandejas y categorías"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Bandejas ({ideas.length})</span>
        </button>
      )}

      {/* Left Sidebar: 3 Distinct Trays & Hierarchical Categories */}
      {isSidebarOpen && (
        <div
          className={`w-full lg:w-72 shrink-0 rounded-2xl border p-4 flex flex-col justify-between shadow-xs transition-all duration-300 ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  Bandejas de Ideas
                </h3>
                <p className="text-[11px] text-stone-500">{ideas.length} notas con fotos y subcategorías</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCatManagerOpen(true)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5"
                  title="Gestionar categorías y subcategorías de ideas"
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal()}
                  className={`p-2 rounded-xl text-xs font-semibold shadow-sm ${theme.primaryBtn}`}
                  title="Nueva idea"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5"
                  title="Plegar panel lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 DISTINCT TRAYS */}
            <div className="space-y-1.5">
              {/* 1. En espera */}
              <button
                onClick={() => {
                  setActiveTray('en_espera');
                  setSubcategoryFilter('todos');
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeTray === 'en_espera'
                    ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs font-semibold`
                    : 'border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${theme.accentBadge} ${theme.accentText}`}>
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">1. En Espera</span>
                    <span className="text-[10px] text-stone-500">Pendientes de desarrollo</span>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${theme.accentBadge} ${theme.accentText}`}>
                  {trayCounts.en_espera}
                </span>
              </button>

              {/* 2. Realizadas */}
              <button
                onClick={() => {
                  setActiveTray('realizadas');
                  setSubcategoryFilter('todos');
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeTray === 'realizadas'
                    ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs font-semibold`
                    : 'border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">2. Realizadas</span>
                    <span className="text-[10px] text-stone-500">Incorporadas o completas</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {trayCounts.realizadas}
                </span>
              </button>

              {/* 3. Descartadas */}
              <button
                onClick={() => {
                  setActiveTray('descartadas');
                  setSubcategoryFilter('todos');
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeTray === 'descartadas'
                    ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs font-semibold`
                    : 'border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-500">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">3. Descartadas</span>
                    <span className="text-[10px] text-stone-500">Archivadas como referencia</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                  {trayCounts.descartadas}
                </span>
              </button>
            </div>

            {/* Hierarchical Categories Filter */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600 dark:text-stone-400">
                  Categorías y Subcategorías
                </span>
                <button
                  onClick={() => setIsCatManagerOpen(true)}
                  className="text-[10px] text-stone-400 hover:underline"
                >
                  Gestionar
                </button>
              </div>

              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setCategoryFilter('todos');
                    setSubcategoryFilter('todos');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                    categoryFilter === 'todos'
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : 'text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span>Todas las categorías</span>
                </button>

                {parentCategories.map((c) => {
                  const subs = subcategoriesByParent.get(c.id) || [];
                  const isParentSelected = categoryFilter === c.id;

                  return (
                    <div key={c.id} className="space-y-0.5">
                      <button
                        onClick={() => {
                          setCategoryFilter(c.id);
                          setSubcategoryFilter('todos');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                          isParentSelected && subcategoryFilter === 'todos'
                            ? `${theme.activeTab} font-semibold shadow-xs`
                            : 'text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color || theme.accentHex }}
                          />
                          <span className="truncate font-semibold">{c.name}</span>
                        </div>
                        {subs.length > 0 && (
                          <span className="text-[10px] text-stone-400 font-mono">
                            {subs.length}
                          </span>
                        )}
                      </button>

                      {/* Nested subcategories in filter list */}
                      {isParentSelected && subs.length > 0 && (
                        <div className="pl-4 space-y-0.5 border-l-2 border-amber-500/30 ml-2 py-0.5">
                          {subs.map((sub) => {
                            const isSubActive = subcategoryFilter === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setSubcategoryFilter(sub.id)}
                                className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-all flex items-center gap-1.5 ${
                                  isSubActive
                                    ? 'bg-amber-600 text-white font-bold'
                                    : 'text-stone-500 hover:bg-black/5'
                                }`}
                              >
                                <CornerDownRight className="w-2.5 h-2.5 text-amber-500" />
                                <span className="truncate">{sub.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Organiza con imágenes y jerarquías</span>
            <Lightbulb className="w-3.5 h-3.5 text-stone-400" />
          </div>
        </div>
      )}

      {/* Main Content: Ideas Canvas & Toolbar */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Top Controls Bar */}
        <div
          className={`p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ideas por título, contenido o imágenes..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 ${theme.borderCard} ${theme.bgCard}`}
            >
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'grid'
                    ? `${theme.activeTab} shadow-xs`
                    : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Vista en cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'list'
                    ? `${theme.activeTab} shadow-xs`
                    : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Vista en lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => openEditModal()}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Idea</span>
            </button>
          </div>
        </div>

        {/* Ideas Grid or List */}
        {filteredIdeas.length === 0 ? (
          <div
            className={`p-16 rounded-3xl border text-center shadow-xs ${theme.bgCard} ${theme.borderCard}`}
          >
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-stone-400 opacity-60" />
            <h3 className={`font-serif text-lg font-bold ${theme.textPrimary}`}>
              No hay ideas en la bandeja "{activeTray.replace('_', ' ')}"
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
              Anota destellos de inspiración, fotos o bocetos de ambientación antes de que escapen.
            </p>
            <button
              onClick={() => openEditModal()}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
            >
              Añadir Idea
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => {
              const cat = categories.find((c) => c.id === idea.categoryId);
              const subcat = categories.find((c) => c.id === idea.subcategoryId);
              const isRealizada = activeTray === 'realizadas' || idea.isCompleted;
              const hasImages = idea.images && idea.images.length > 0;
              const mainImg = hasImages ? idea.images![0] : null;

              return (
                <div
                  key={idea.id}
                  className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all duration-200 group relative ${theme.bgCard} ${theme.borderCard} ${
                    isRealizada ? 'opacity-85' : ''
                  }`}
                >
                  <div>
                    {/* Top category & tray controls */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(idea)}
                          className="text-stone-400 hover:text-emerald-600 transition-colors"
                          title={isRealizada ? 'Marcar como pendiente' : 'Marcar como realizada'}
                        >
                          {isRealizada ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        {cat && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: cat.color || theme.accentHex }}
                          >
                            {cat.name}
                          </span>
                        )}

                        {subcat && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                            <CornerDownRight className="w-2.5 h-2.5" />
                            {subcat.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                        <button
                          onClick={() => openEditModal(idea)}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmIdea(idea)}
                          className="p-1 rounded text-stone-400 hover:text-rose-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Attached Image Thumbnail on Grid Card */}
                    {mainImg && (
                      <div
                        onClick={() => setLightboxImage(mainImg)}
                        className="relative h-32 rounded-xl overflow-hidden mb-3 border border-stone-200 dark:border-stone-800 cursor-pointer group/img"
                        title="Ver imagen de la idea"
                      >
                        <img
                          src={mainImg.url}
                          alt={idea.title}
                          className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        {idea.images!.length > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold">
                            +{idea.images!.length - 1} fotos
                          </span>
                        )}
                      </div>
                    )}

                    <h4
                      className={`text-sm font-bold font-serif mb-2 ${theme.textPrimary} ${
                        isRealizada ? 'line-through text-stone-400 dark:text-stone-500' : ''
                      }`}
                    >
                      {idea.title}
                    </h4>

                    <p
                      className={`text-xs leading-relaxed font-serif whitespace-pre-line line-clamp-4 text-stone-600 dark:text-stone-300 ${
                        isRealizada ? 'line-through opacity-70' : ''
                      }`}
                    >
                      {idea.content}
                    </p>
                  </div>

                  {/* Bottom Tray & Conversion Buttons */}
                  <div className="pt-3 mt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
                    {/* Quick Move Between Trays */}
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>Mover bandeja:</span>
                      <div className="flex items-center gap-1">
                        {activeTray !== 'en_espera' && (
                          <button
                            onClick={() => handleMoveIdeaTray(idea, 'en_espera')}
                            className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
                          >
                            En Espera
                          </button>
                        )}
                        {activeTray !== 'realizadas' && (
                          <button
                            onClick={() => handleMoveIdeaTray(idea, 'realizadas')}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          >
                            Realizada
                          </button>
                        )}
                        {activeTray !== 'descartadas' && (
                          <button
                            onClick={() => handleMoveIdeaTray(idea, 'descartadas')}
                            className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-600 dark:text-stone-400"
                          >
                            Descartar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Convert Button */}
                    <button
                      onClick={() => setConvertIdea(idea)}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all shadow-xs ${theme.accentBadge} ${theme.accentText} border-transparent hover:opacity-90`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Convertir en elemento de la obra</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-2xl border divide-y shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
            {filteredIdeas.map((idea) => {
              const cat = categories.find((c) => c.id === idea.categoryId);
              const subcat = categories.find((c) => c.id === idea.subcategoryId);
              const isRealizada = activeTray === 'realizadas' || idea.isCompleted;
              const hasImages = idea.images && idea.images.length > 0;
              const thumb = hasImages ? idea.images![0] : null;

              return (
                <div
                  key={idea.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(idea)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-600"
                    >
                      {isRealizada ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {thumb && (
                      <img
                        src={thumb.url}
                        alt="Idea thumb"
                        onClick={() => setLightboxImage(thumb)}
                        className="w-12 h-12 rounded-lg object-cover border cursor-pointer shrink-0"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4
                          className={`text-sm font-bold truncate ${theme.textPrimary} ${
                            isRealizada ? 'line-through text-stone-400' : ''
                          }`}
                        >
                          {idea.title}
                        </h4>
                        {cat && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white shrink-0"
                            style={{ backgroundColor: cat.color || theme.accentHex }}
                          >
                            {cat.name}
                          </span>
                        )}
                        {subcat && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/20">
                            ↳ {subcat.name}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs text-stone-500 line-clamp-1 mt-0.5 ${
                          isRealizada ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {idea.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setConvertIdea(idea)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${theme.accentBadge} ${theme.accentText}`}
                    >
                      <Sparkles className="w-3 h-3" /> Convertir
                    </button>
                    <button
                      onClick={() => openEditModal(idea)}
                      className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmIdea(idea)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-500/10"
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

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border border-white/20">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Idea'}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
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

      {/* CREATE / EDIT IDEA MODAL WITH IMAGES AND SUBCATEGORIES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    {editingIdea ? 'Editar Idea' : 'Nueva Idea al Aire'}
                  </h3>
                  <p className="text-xs text-stone-500">Anota ocurrencias, fotos y subcategorías</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdea} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título de la idea *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: El misterio del espejo roto en la torre"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Tray, Category and Subcategory selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Bandeja
                  </label>
                  <select
                    value={tray}
                    onChange={(e) => setTray(e.target.value as IdeaTray)}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="en_espera">1. En Espera</option>
                    <option value="realizadas">2. Realizada</option>
                    <option value="descartadas">3. Descartada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Categoría Principal
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategoryId(newCat);
                      const subs = subcategoriesByParent.get(newCat);
                      setSubcategoryId(subs && subs.length > 0 ? subs[0].id : '');
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Subcategoría
                  </label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="">(Sin subcategoría)</option>
                    {currentFormSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* IMAGES UPLOAD SECTION FOR IDEAS */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary}`}>
                      Imágenes y Referencias Visuales
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Sube fotos, bocetos o capturas para inspirar tu idea
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
                  <div className="text-center py-4 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-400">
                    No has agregado imágenes a esta idea todavía.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
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
                                placeholder="Nota o pie de foto..."
                                className={`w-full text-xs bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none ${theme.textPrimary}`}
                              />
                              <div className="flex items-center gap-2 mt-1">
                                {isMain ? (
                                  <span className={`text-[10px] font-bold ${theme.accentText} flex items-center gap-1`}>
                                    <Star className="w-3 h-3 fill-current" /> Principal
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

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Anotaciones y detalles
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe libremente cualquier ocurrencia, fragmento de diálogo, pista o atmósfera..."
                  className={`w-full p-3 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
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
                  {editingIdea ? 'Guardar Cambios' : 'Registrar Idea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY & SUBCATEGORY MANAGER MODAL */}
      {isCatManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-3xl border shadow-2xl p-6 flex flex-col ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    Categorías y Subcategorías de Ideas
                  </h3>
                  <p className="text-xs text-stone-500">
                    Estructura tus ideas por temas principales y sub-temas jerárquicos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatManagerOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Creator form */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-3">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  {editingCat ? `Editar "${editingCat.name}"` : 'Crear Categoría o Subcategoría'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">
                      Nivel Jerárquico:
                    </label>
                    <select
                      value={catParentIdInput}
                      onChange={(e) => setCatParentIdInput(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                    >
                      <option value="">Categoría Principal (Raíz)</option>
                      {parentCategories.map((p) => (
                        <option key={p.id} value={p.id}>
                          ↳ Subcategoría de: {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">
                      Nombre:
                    </label>
                    <input
                      type="text"
                      value={catNameInput}
                      onChange={(e) => setCatNameInput(e.target.value)}
                      placeholder="Ej: Giros de trama..."
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500">Color:</span>
                    <input
                      type="color"
                      value={catColorInput}
                      onChange={(e) => setCatColorInput(e.target.value)}
                      className="w-8 h-7 rounded-lg border cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    disabled={!catNameInput.trim()}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn} disabled:opacity-40`}
                  >
                    {editingCat ? 'Guardar Cambios' : 'Añadir'}
                  </button>
                </div>
              </div>

              {/* Hierarchy Tree */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                  Estructura Jerárquica:
                </span>

                <div className="space-y-2">
                  {parentCategories.map((parent) => {
                    const subs = subcategoriesByParent.get(parent.id) || [];
                    return (
                      <div
                        key={parent.id}
                        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs"
                      >
                        <div className="p-2.5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-850/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: parent.color }}
                            />
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {parent.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ({subs.length} subcategorías)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCat(null);
                                setCatNameInput('');
                                setCatParentIdInput(parent.id);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                              title="Añadir subcategoría aquí"
                            >
                              + Subcategoría
                            </button>
                            <button
                              onClick={() => {
                                setEditingCat(parent);
                                setCatNameInput(parent.name);
                                setCatColorInput(parent.color || '#2D5A43');
                                setCatParentIdInput('');
                              }}
                              className="p-1 rounded text-stone-400 hover:text-stone-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingCat(parent);
                                const rem = parentCategories.filter((other) => other.id !== parent.id);
                                setReassignTargetCatId(rem[0]?.id || 'sin_categoria');
                              }}
                              className="p-1 rounded text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Indented Subcategories */}
                        {subs.length > 0 ? (
                          <div className="p-2 pl-6 space-y-1 bg-stone-50/20 dark:bg-stone-900/30">
                            {subs.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-1.5 rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-white/60 dark:bg-stone-800/40 text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <CornerDownRight className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                                  <span className="truncate text-stone-700 dark:text-stone-300 font-medium">
                                    {sub.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCat(sub);
                                      setCatNameInput(sub.name);
                                      setCatColorInput(sub.color || '#2D5A43');
                                      setCatParentIdInput(sub.parentId || '');
                                    }}
                                    className="p-1 rounded text-stone-400 hover:text-stone-700"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingCat(sub);
                                      setReassignTargetCatId('sin_categoria');
                                    }}
                                    className="p-1 rounded text-stone-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 pl-6 text-[11px] text-stone-400 italic">
                            Sin subcategorías todavía.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetCategories}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer predeterminadas</span>
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
              Selecciona a qué categoría reasignar las ideas asociadas:
            </p>
            <select
              value={reassignTargetCatId}
              onChange={(e) => setReassignTargetCatId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs mb-5 ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
            >
              <option value="sin_categoria">Dejar sin categoría ("sin_categoria")</option>
              {categories
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

      {/* CONVERT IDEA MODAL */}
      {convertIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                    Convertir Idea en Elemento
                  </h3>
                  <p className="text-xs text-stone-500">
                    Crea una entidad formal conservando el texto y fotos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConvertIdea(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2">
              <button
                onClick={() => handleConvertIdea('chapter')}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${theme.textPrimary}`}>Nuevo Capítulo</h5>
                    <p className="text-[11px] text-stone-500">
                      Crear capítulo con el contenido de la idea
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => handleConvertIdea('character')}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${theme.textPrimary}`}>Ficha de Personaje</h5>
                    <p className="text-[11px] text-stone-500">
                      Convertir en personaje con biografía inicial
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => handleConvertIdea('detail')}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${theme.textPrimary}`}>Detalle del Mundo</h5>
                    <p className="text-[11px] text-stone-500">
                      Convertir en concepto, lugar o reliquia
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => handleConvertIdea('timeline')}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${theme.textPrimary}`}>Acontecimiento Temporal</h5>
                    <p className="text-[11px] text-stone-500">
                      Insertar en la línea de tiempo interactiva
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Idea Confirmation Modal */}
      {deleteConfirmIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
          >
            <h3 className="font-serif font-bold text-lg text-rose-600 mb-2">
              ¿Eliminar "{deleteConfirmIdea.title}"?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              Estás a punto de borrar esta idea definitivamente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmIdea(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
