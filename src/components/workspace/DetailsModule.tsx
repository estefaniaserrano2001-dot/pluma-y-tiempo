import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Compass,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  BookOpen,
  Users,
  Clock,
  Lightbulb,
  Edit2,
  Trash2,
  X,
  Check,
  Tag,
  Lock,
  HelpCircle,
  ArrowRight,
  Filter,
  Sliders,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Star,
  Maximize2,
  CornerDownRight,
  FolderTree,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { WorldDetail, DetailCategory, Character, Chapter, Idea, TimelineEvent, MediaImage } from '../../types';
import { getTheme } from '../../utils/theme';

const ICON_COMPONENTS: Record<string, any> = {
  MapPin,
  Compass,
  Sparkles,
  Shield,
  Users,
  Lock,
  BookOpen,
  Layers,
  Clock,
  HelpCircle,
  Tag,
  FolderTree,
};

export const DetailsModule: React.FC = () => {
  const {
    activeBook,
    currentPalette,
    darkMode,
    customPalettes,
    toast,
    setIsSaving,
    navigateToEntity,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [details, setDetails] = useState<WorldDetail[]>([]);
  const [categories, setCategories] = useState<DetailCategory[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Collapsible sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [selectedDetail, setSelectedDetail] = useState<WorldDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('todos');

  // Detail Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<WorldDetail | null>(null);
  const [deleteConfirmDetail, setDeleteConfirmDetail] = useState<WorldDetail | null>(null);

  // Lightbox Modal for viewing enlarged images
  const [lightboxImage, setLightboxImage] = useState<MediaImage | null>(null);

  // Category Management Modal State
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<DetailCategory | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catColorInput, setCatColorInput] = useState('#2D5A43');
  const [catIconInput, setCatIconInput] = useState('MapPin');
  const [catParentIdInput, setCatParentIdInput] = useState<string>(''); // For subcategories
  const [deletingCat, setDeletingCat] = useState<DetailCategory | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('sin_categoria');

  // Form Fields for WorldDetail
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('dcat_lug');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [historicalPeriod, setHistoricalPeriod] = useState('');
  const [immutableInfo, setImmutableInfo] = useState('');
  const [provisionalInfo, setProvisionalInfo] = useState('');
  const [relatedCharacterIds, setRelatedCharacterIds] = useState<string[]>([]);
  const [relatedChapterIds, setRelatedChapterIds] = useState<string[]>([]);
  const [relatedIdeaIds, setRelatedIdeaIds] = useState<string[]>([]);
  const [relatedTimelineEventIds, setRelatedTimelineEventIds] = useState<string[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [mainImageId, setMainImageId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    if (!activeBook) return;
    const cats = await dbService.getDetailCategories(activeBook.id);
    setCategories(cats);
    const dets = await dbService.getDetailsByBook(activeBook.id);
    setDetails(dets);
    const chars = await dbService.getCharactersByBook(activeBook.id);
    setCharacters(chars);
    const chaps = await dbService.getChaptersByBook(activeBook.id);
    setChapters(chaps);
    const ids = await dbService.getIdeasByBook(activeBook.id);
    setIdeas(ids);
    const evs = await dbService.getTimelineEventsByBook(activeBook.id);
    setTimelineEvents(evs);

    if (dets.length > 0 && !selectedDetail) {
      setSelectedDetail(dets[0]);
    } else if (selectedDetail) {
      const refreshed = dets.find((d) => d.id === selectedDetail.id) || null;
      setSelectedDetail(refreshed);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBook]);

  // Separate parent categories from subcategories
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, DetailCategory[]>();
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
    return subcategoriesByParent.get(category) || [];
  }, [category, subcategoriesByParent]);

  // Open Edit Modal
  const openEditModal = (detail?: WorldDetail) => {
    if (detail) {
      setEditingDetail(detail);
      setName(detail.name);
      setCategory(detail.category);
      setSubcategoryId(detail.subcategoryId || '');
      setDescription(detail.description);
      setHistoricalPeriod(detail.historicalPeriod || '');
      setImmutableInfo(detail.immutableInfo || '');
      setProvisionalInfo(detail.provisionalInfo || '');
      setRelatedCharacterIds(detail.relatedCharacterIds || []);
      setRelatedChapterIds(detail.relatedChapterIds || []);
      setRelatedIdeaIds(detail.relatedIdeaIds || []);
      setRelatedTimelineEventIds(detail.relatedTimelineEventIds || []);
      setImages(detail.images || []);
      setMainImageId(detail.mainImageId);
    } else {
      setEditingDetail(null);
      setName('');
      const defaultParent = parentCategories[0]?.id || categories[0]?.id || 'dcat_lug';
      setCategory(defaultParent);
      const subs = subcategoriesByParent.get(defaultParent);
      setSubcategoryId(subs && subs.length > 0 ? subs[0].id : '');
      setDescription('');
      setHistoricalPeriod('');
      setImmutableInfo('');
      setProvisionalInfo('');
      setRelatedCharacterIds([]);
      setRelatedChapterIds([]);
      setRelatedIdeaIds([]);
      setRelatedTimelineEventIds([]);
      setImages([]);
      setMainImageId(undefined);
    }
    setIsModalOpen(true);
  };

  // Add multiple images from local disk (PNG, JPG, WebP)
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
            id: 'dimg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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
    toast(`${files.length} imagen(es) añadida(s)`, 'info');
  };

  const handleSetMainImage = (imgId: string) => {
    setMainImageId(imgId);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === imgId,
      }))
    );
    toast('Imagen principal de la ficha seleccionada', 'success');
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

  // Save Detail
  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeBook) return;

    setIsSaving(true);
    try {
      const detailId =
        editingDetail?.id ||
        'det_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const mainImg = images.find((i) => i.id === mainImageId) || images[0];

      const record: WorldDetail = {
        id: detailId,
        bookId: activeBook.id,
        name: name.trim(),
        category,
        subcategoryId: subcategoryId || undefined,
        description: description.trim(),
        historicalPeriod: historicalPeriod.trim(),
        tags: editingDetail?.tags || [],
        images,
        mainImageId: mainImg?.id,
        immutableInfo: immutableInfo.trim(),
        provisionalInfo: provisionalInfo.trim(),
        relatedCharacterIds,
        relatedChapterIds,
        relatedIdeaIds,
        relatedTimelineEventIds,
        createdAt: editingDetail?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveDetail(record);
      await loadData();
      setSelectedDetail(record);
      setIsModalOpen(false);
      toast(
        editingDetail
          ? `Ficha "${record.name}" actualizada`
          : `Elemento "${record.name}" creado con éxito`,
        'success'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmDetail) return;
    setIsSaving(true);
    try {
      await dbService.deleteDetail(deleteConfirmDetail.id);
      await loadData();
      if (selectedDetail?.id === deleteConfirmDetail.id) {
        setSelectedDetail(null);
      }
      toast(`Elemento "${deleteConfirmDetail.name}" eliminado`, 'info');
      setDeleteConfirmDetail(null);
    } finally {
      setIsSaving(false);
    }
  };

  // CATEGORY & SUBCATEGORY MANAGEMENT
  const handleSaveCategory = async () => {
    if (!catNameInput.trim() || !activeBook) return;
    setIsSaving(true);
    try {
      const catId =
        editingCat?.id ||
        (catParentIdInput ? 'dsub_' : 'dcat_') + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const catRecord: DetailCategory = {
        id: catId,
        bookId: activeBook.id,
        name: catNameInput.trim(),
        color: catColorInput,
        icon: catIconInput,
        parentId: catParentIdInput ? catParentIdInput : null,
        order: editingCat?.order ?? categories.length,
      };

      await dbService.saveDetailCategory(catRecord);
      const updated = await dbService.getDetailCategories(activeBook.id);
      setCategories(updated);
      setEditingCat(null);
      setCatNameInput('');
      setCatParentIdInput('');
      toast(
        catParentIdInput
          ? 'Subcategoría jerárquica guardada'
          : 'Categoría principal guardada',
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
      await dbService.deleteDetailCategoryAndReassign(
        deletingCat.id,
        reassignTargetCatId,
        activeBook.id
      );
      await loadData();
      setDeletingCat(null);
      toast('Categoría eliminada y elementos reasignados con seguridad', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCategories = async () => {
    if (!activeBook) return;
    setIsSaving(true);
    try {
      const defaults = await dbService.resetDetailCategoriesToDefault(activeBook.id);
      setCategories(defaults);
      await loadData();
      toast('Categorías y subcategorías predeterminadas restablecidas', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered details
  const filteredDetails = useMemo(() => {
    return details.filter((d) => {
      if (categoryFilter !== 'todos') {
        const matchesCategory = d.category === categoryFilter;
        if (!matchesCategory) return false;

        if (subcategoryFilter !== 'todos') {
          if (d.subcategoryId !== subcategoryFilter) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [details, categoryFilter, subcategoryFilter, searchQuery]);

  // Main Image of currently selected detail
  const selectedMainImage = useMemo(() => {
    if (!selectedDetail) return null;
    if (selectedDetail.images && selectedDetail.images.length > 0) {
      if (selectedDetail.mainImageId) {
        const found = selectedDetail.images.find((i) => i.id === selectedDetail.mainImageId);
        if (found) return found;
      }
      return selectedDetail.images[0];
    }
    return null;
  }, [selectedDetail]);

  const selectedCatObj = categories.find((c) => c.id === selectedDetail?.category);
  const selectedSubcatObj = categories.find((c) => c.id === selectedDetail?.subcategoryId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)] relative">
      {/* Toggle button when sidebar is collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-2 bottom-6 z-40 p-2.5 rounded-xl border shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${theme.bgCard} ${theme.borderCard} ${theme.textPrimary}`}
          title="Mostrar lista de detalles"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Detalles ({details.length})</span>
        </button>
      )}

      {/* Left List of World Details */}
      {isSidebarOpen && (
        <div
          className={`w-full lg:w-80 shrink-0 rounded-2xl border p-4 flex flex-col justify-between shadow-xs transition-all duration-300 ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  Detalles del Mundo ({details.length})
                </h3>
                <p className="text-[11px] text-stone-500">Lore y reglas jerárquicas</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCatManagerOpen(true)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5"
                  title="Gestionar categorías y subcategorías jerárquicas"
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal()}
                  className={`p-2 rounded-xl text-xs font-semibold shadow-sm ${theme.primaryBtn}`}
                  title="Añadir nueva ficha del mundo"
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

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar lugares, reliquias, leyes..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              />
            </div>

            {/* Top-Level Categories Filter Bar */}
            <div className="space-y-1.5">
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <button
                  onClick={() => {
                    setCategoryFilter('todos');
                    setSubcategoryFilter('todos');
                  }}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all ${
                    categoryFilter === 'todos'
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  Todos ({details.length})
                </button>
                {parentCategories.map((c) => {
                  const isAct = categoryFilter === c.id;
                  const count = details.filter((d) => d.category === c.id).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCategoryFilter(c.id);
                        setSubcategoryFilter('todos');
                      }}
                      className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
                        isAct
                          ? `${theme.activeTab} font-semibold shadow-xs`
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                      <span>{c.name} ({count})</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setEditingCat(null);
                    setCatNameInput('');
                    setCatParentIdInput('');
                    setIsCatManagerOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-md whitespace-nowrap transition-all border border-dashed border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:border-amber-500 flex items-center gap-1 shrink-0 font-bold text-[11px]"
                  title="Agregar nueva categoría (+)"
                >
                  <Plus className="w-3 h-3" />
                  <span>Categoría</span>
                </button>
              </div>

              {/* Subcategories Secondary Filter Row (if parent category is selected) */}
              {currentFilterSubcategories.length > 0 && (
                <div className="p-2 rounded-xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    <FolderTree className="w-3 h-3 text-amber-500" />
                    <span>Subcategorías:</span>
                  </div>
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setSubcategoryFilter('todos')}
                      className={`px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap transition-all ${
                        subcategoryFilter === 'todos'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-stone-500 hover:bg-black/5'
                      }`}
                    >
                      Todas
                    </button>
                    {currentFilterSubcategories.map((sub) => {
                      const isSubAct = subcategoryFilter === sub.id;
                      const subCount = details.filter((d) => d.subcategoryId === sub.id).length;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setSubcategoryFilter(sub.id)}
                          className={`px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap transition-all flex items-center gap-1 ${
                            isSubAct
                              ? 'bg-amber-600 text-white font-bold'
                              : 'text-stone-600 dark:text-stone-400 hover:bg-black/5'
                          }`}
                        >
                          <span>{sub.name} ({subCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {filteredDetails.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No hay elementos en esta categoría o subcategoría.
                </div>
              ) : (
                filteredDetails.map((det) => {
                  const isSelected = selectedDetail?.id === det.id;
                  const detCat = categories.find((c) => c.id === det.category);
                  const detSubcat = categories.find((c) => c.id === det.subcategoryId);
                  const IconComponent =
                    detCat?.icon && ICON_COMPONENTS[detCat.icon]
                      ? ICON_COMPONENTS[detCat.icon]
                      : Compass;
                  const thumb = det.images && det.images.length > 0 ? det.images[0].url : null;

                  return (
                    <div
                      key={det.id}
                      onClick={() => setSelectedDetail(det)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs`
                          : `${theme.borderCard} hover:bg-black/5 dark:hover:bg-white/5`
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={det.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-2xs"
                          />
                        ) : (
                          <div
                            className="p-2 rounded-lg shrink-0 text-white shadow-xs"
                            style={{
                              backgroundColor: detCat?.color || theme.accentHex,
                            }}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? theme.textPrimary : 'text-stone-800 dark:text-stone-200'
                            }`}
                          >
                            {det.name}
                          </h4>
                          <div className="text-[10px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                            <span>{detCat?.name || det.category}</span>
                            {detSubcat && (
                              <>
                                <span>/</span>
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  {detSubcat.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {det.images && det.images.length > 0 && (
                          <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                            <ImageIcon className="w-3 h-3" />
                            <span>{det.images.length}</span>
                          </span>
                        )}
                        {det.immutableInfo && (
                          <span title="Canon Inmutable" className={`shrink-0 ${theme.accentText}`}>
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{categories.length} categorías y subcategorías</span>
            <button
              onClick={() => setIsCatManagerOpen(true)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline text-[10px]"
            >
              Gestionar
            </button>
          </div>
        </div>
      )}

      {/* Right: Full Detail Content */}
      {selectedDetail ? (
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header Card with Hero / Main Image */}
          <div
            className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center gap-4 min-w-0">
              {selectedMainImage ? (
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => setLightboxImage(selectedMainImage)}
                  title="Ampliar imagen"
                >
                  <img
                    src={selectedMainImage.url}
                    alt={selectedDetail.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white dark:border-stone-800"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md"
                  style={{ backgroundColor: selectedCatObj?.color || theme.accentHex }}
                >
                  <Compass className="w-8 h-8" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-white"
                    style={{
                      backgroundColor: selectedCatObj?.color || theme.accentHex,
                    }}
                  >
                    {selectedCatObj?.name || selectedDetail.category}
                  </span>

                  {selectedSubcatObj && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" />
                      {selectedSubcatObj.name}
                    </span>
                  )}

                  {selectedDetail.historicalPeriod && (
                    <span className="text-xs text-stone-500 font-mono">
                      • Era: {selectedDetail.historicalPeriod}
                    </span>
                  )}
                </div>

                <h2 className={`font-serif text-2xl font-bold truncate ${theme.textPrimary}`}>
                  {selectedDetail.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={() => openEditModal(selectedDetail)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Elemento</span>
              </button>
              <button
                onClick={() => setDeleteConfirmDetail(selectedDetail)}
                className="p-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-500/10"
                title="Eliminar elemento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Description */}
          <div className={`p-6 rounded-3xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>
              Descripción y Significado en la Trama
            </h4>
            <p className={`text-sm leading-relaxed font-serif whitespace-pre-line ${theme.textPrimary}`}>
              {selectedDetail.description || 'Sin descripción detallada.'}
            </p>
          </div>

          {/* Attached Images Gallery for Details */}
          {selectedDetail.images && selectedDetail.images.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}>
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${theme.accentText}`}>
                  <ImageIcon className="w-4 h-4" />
                  Galería de imágenes y mapas ({selectedDetail.images.length})
                </h4>
                <button
                  onClick={() => openEditModal(selectedDetail)}
                  className="text-xs text-stone-500 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Añadir más imágenes
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {selectedDetail.images.map((img) => {
                  const isMain = img.id === selectedDetail.mainImageId || img.isCover;
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
                        alt={img.caption || 'Imagen del mundo'}
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

          {/* Canon & Provisional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Immutable Info */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-2 ${theme.bgCard} ${theme.borderCard}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Canon Inmutable (No Cambiar)</span>
              </div>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300 font-serif">
                {selectedDetail.immutableInfo || 'Sin restricciones canónicas absolutas.'}
              </p>
            </div>

            {/* Provisional Info */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-2 ${theme.bgCard} ${theme.borderCard}`}>
              <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ideas Provisionales (Sujeto a cambios)</span>
              </div>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300 font-serif">
                {selectedDetail.provisionalInfo || 'Sin notas provisionales.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 p-16 rounded-3xl border text-center flex flex-col items-center justify-center ${theme.bgCard} ${theme.borderCard}`}
        >
          <Compass className="w-12 h-12 mb-3 text-stone-400 opacity-60" />
          <h3 className={`font-serif text-lg font-bold ${theme.textPrimary}`}>
            No hay ningún elemento del mundo seleccionado
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
            Documenta geografía, magia, leyes, reliquias y linajes con subcategorías jerárquicas e imágenes.
          </p>
          <button
            onClick={() => openEditModal()}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
          >
            Crear Ficha del Mundo
          </button>
        </div>
      )}

      {/* LIGHTBOX FOR IMAGES */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border border-white/20">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Detalle'}
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

      {/* CREATE / EDIT WORLD DETAIL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    {editingDetail ? `Editar ${editingDetail.name}` : 'Nueva Ficha del Mundo'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Lore con soporte de subcategorías jerárquicas e imágenes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del elemento *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: La Ciudad Flotante de Caelum"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Hierarchical Category & Subcategory Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Categoría Principal *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      const subs = subcategoriesByParent.get(newCat);
                      setSubcategoryId(subs && subs.length > 0 ? subs[0].id : '');
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3 text-amber-500" />
                      Subcategoría
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(null);
                        setCatNameInput('');
                        setCatParentIdInput(category);
                        setIsCatManagerOpen(true);
                      }}
                      className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                    >
                      + Nueva subcategoría
                    </button>
                  </div>

                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="">(Sin subcategoría específica)</option>
                    {currentFormSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* IMAGES UPLOAD SECTION */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary}`}>
                      Imágenes y Mapas de este Detalle
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Sube fotos, planos, mapas o bocetos desde tu dispositivo
                    </p>
                  </div>

                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs ${theme.primaryBtn}`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Imágenes</span>
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
                    No has agregado imágenes a este detalle todavía.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                                placeholder="Pie de foto / descripción..."
                                className={`w-full text-xs bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none ${theme.textPrimary}`}
                              />
                              <div className="flex items-center gap-2 mt-1">
                                {isMain ? (
                                  <span className={`text-[10px] font-bold ${theme.accentText} flex items-center gap-1`}>
                                    <Star className="w-3 h-3 fill-current" /> Imagen Principal
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

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descripción profunda
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Historia, origen, geografía, importancia o función dramática..."
                  className={`w-full p-3 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Canon & Provisional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    Canon Inmutable (Regla fija)
                  </label>
                  <textarea
                    rows={2}
                    value={immutableInfo}
                    onChange={(e) => setImmutableInfo(e.target.value)}
                    placeholder="Leyes que no se pueden violar sin romper la coherencia..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 flex items-center gap-1 ${theme.accentText}`}>
                    <Sparkles className="w-3 h-3" />
                    Notas provisionales
                  </label>
                  <textarea
                    rows={2}
                    value={provisionalInfo}
                    onChange={(e) => setProvisionalInfo(e.target.value)}
                    placeholder="Ideas tentativas o misterios aún no resueltos..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>
              </div>

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
                  {editingDetail ? 'Guardar Cambios' : 'Crear Ficha'}
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
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    Categorías y Subcategorías del Mundo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Estructura jerárquicamente tus categorías y subcategorías
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
              {/* Category creation / edit form */}
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
                      placeholder="Ej: Archipiélagos..."
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

              {/* Hierarchical Categories & Subcategories Tree List */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                  Estructura Jerárquica Actual:
                </span>

                <div className="space-y-2">
                  {parentCategories.map((parent) => {
                    const subs = subcategoriesByParent.get(parent.id) || [];
                    return (
                      <div
                        key={parent.id}
                        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs"
                      >
                        {/* Parent item */}
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

            {/* Modal Footer */}
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
              Eliminar "{deletingCat.name}"
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
              Selecciona a qué categoría reasignar los detalles que pertenezcan a esta categoría o subcategoría:
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

      {/* Delete Item Confirmation Modal */}
      {deleteConfirmDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <h3 className="font-serif font-bold text-lg text-rose-600 mb-2">
              ¿Eliminar "{deleteConfirmDetail.name}"?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              Estás a punto de borrar esta ficha del mundo. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmDetail(null)}
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
