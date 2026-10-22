import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  BookOpen,
  Search,
  MoreVertical,
  Edit2,
  Copy,
  Archive,
  Trash2,
  Calendar,
  FileText,
  Compass,
  Feather,
  Crown,
  Scroll,
  Shield,
  Flame,
  Sparkles,
  ArrowRight,
  Upload,
  Layers,
  Image as ImageIcon,
  Maximize2,
  X,
  Palette,
  Share2,
  Users,
  Cloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Book, PaletteTheme, MediaImage } from '../../types';
import { dbService } from '../../services/db';
import { getTheme, PALETTES } from '../../utils/theme';
import { BookModal } from './BookModal';
import { ShareBookModal } from '../workspace/ShareBookModal';
import { WritingCalendarModule } from '../workspace/WritingCalendarModule';

const ICON_MAP: Record<string, React.FC<any>> = {
  Compass,
  Feather,
  BookOpen,
  Crown,
  Scroll,
  Shield,
  Flame,
  Sparkles,
};

export const LibraryView: React.FC = () => {
  const {
    books,
    refreshBooks,
    setActiveBook,
    currentPalette,
    darkMode,
    toast,
    setIsSaving,
    customPalettes,
    currentUser,
    openAuthModal,
    openPaletteCreator,
    triggerCloudSync,
    cloudSyncStatus,
    openProfileModal,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'archivados'>('activos');
  const [userBooksFilter, setUserBooksFilter] = useState<'mis_libros' | 'compartidos' | 'todos'>('todos');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'chapters' | 'created'>('updated');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [sharingBook, setSharingBook] = useState<Book | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<Book | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [galleryBook, setGalleryBook] = useState<Book | null>(null);
  const [lightboxImage, setLightboxImage] = useState<MediaImage | null>(null);

  const [bookChapterStats, setBookChapterStats] = useState<
    Record<string, { count: number; words: number }>
  >({});

  // Load chapter counts and words for each book
  useEffect(() => {
    async function loadStats() {
      const stats: Record<string, { count: number; words: number }> = {};
      for (const b of books) {
        const chapters = await dbService.getChaptersByBook(b.id);
        const words = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
        stats[b.id] = { count: chapters.length, words };
      }
      setBookChapterStats(stats);
    }
    if (books.length > 0) {
      loadStats();
    }
  }, [books]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        if (statusFilter === 'activos' && b.isArchived) return false;
        if (statusFilter === 'archivados' && !b.isArchived) return false;

        // User ownership / collaboration filter
        if (currentUser) {
          const isOwner = b.userId === currentUser.id;
          const isCollaborator =
            b.userId !== currentUser.id &&
            b.collaborators?.some(
              (c) =>
                c.userId === currentUser.id ||
                (c.username && c.username.toLowerCase() === currentUser.username.toLowerCase())
            );

          // Strictly hide any other user's book unless explicitly collaborated
          if (!isOwner && !isCollaborator) return false;

          if (userBooksFilter === 'mis_libros' && !isOwner) return false;
          if (userBooksFilter === 'compartidos' && !isCollaborator) return false;
        } else {
          // Guest mode: only books that are unassigned
          if (b.userId) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = b.title.toLowerCase().includes(q);
          const matchSubtitle = (b.subtitle || '').toLowerCase().includes(q);
          const matchGenre = b.genre.toLowerCase().includes(q);
          const matchDesc = b.description.toLowerCase().includes(q);
          return matchTitle || matchSubtitle || matchGenre || matchDesc;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'chapters') {
          const aCount = bookChapterStats[a.id]?.count || 0;
          const bCount = bookChapterStats[b.id]?.count || 0;
          return bCount - aCount;
        }
        return 0;
      });
  }, [books, statusFilter, userBooksFilter, searchQuery, sortBy, bookChapterStats, currentUser]);

  const handleCreateOrUpdateBook = async (bookData: Partial<Book>) => {
    setIsSaving(true);
    try {
      if (editingBook) {
        const updated: Book = {
          ...editingBook,
          ...bookData,
          updatedAt: new Date().toISOString(),
        } as Book;
        await dbService.saveBook(updated);
        toast(`Libro "${updated.title}" actualizado con éxito`, 'success');
      } else {
        const newBook: Book = {
          id: 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userId: currentUser?.id,
          title: bookData.title || 'Nuevo Proyecto',
          subtitle: bookData.subtitle,
          description: bookData.description || '',
          genre: bookData.genre || 'Fantasía Épica',
          status: bookData.status || 'planificacion',
          targetWordCount: bookData.targetWordCount || 75000,
          coverGradient: bookData.coverGradient || 'from-emerald-950 via-teal-900 to-stone-900',
          coverIcon: bookData.coverIcon || 'Compass',
          coverImageUrl: bookData.coverImageUrl,
          images: bookData.images || [],
          colorPalette: (bookData.colorPalette || currentPalette) as any,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbService.saveBook(newBook);
        toast(`Proyecto "${newBook.title}" creado`, 'success');
      }
      await refreshBooks();
    } catch (e: any) {
      toast('Error al guardar el libro: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
      setEditingBook(null);
    }
  };

  const handleDuplicateBook = async (book: Book) => {
    setIsSaving(true);
    try {
      const exportedJson = await dbService.exportBookToJson(book.id);
      const parsed = JSON.parse(exportedJson);
      parsed.book.title = `${book.title} (Copia)`;
      await dbService.importBookFromJson(JSON.stringify(parsed));
      await refreshBooks();
      toast(`Libro duplicado con éxito: "${book.title} (Copia)"`, 'success');
    } catch (e: any) {
      toast('Fallo al duplicar el proyecto: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
      setMenuOpenId(null);
    }
  };

  const handleToggleArchive = async (book: Book) => {
    setIsSaving(true);
    try {
      const updated: Book = {
        ...book,
        isArchived: !book.isArchived,
        updatedAt: new Date().toISOString(),
      };
      await dbService.saveBook(updated);
      await refreshBooks();
      toast(
        updated.isArchived
          ? `Libro "${book.title}" archivado`
          : `Libro "${book.title}" desarchivado`,
        'info'
      );
    } finally {
      setIsSaving(false);
      setMenuOpenId(null);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteConfirmBook) return;
    setIsSaving(true);
    try {
      await dbService.deleteBook(deleteConfirmBook.id);
      await refreshBooks();
      toast(`Libro "${deleteConfirmBook.title}" eliminado definitivamente`, 'info');
      setDeleteConfirmBook(null);
    } catch (e: any) {
      toast('Error al eliminar: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setIsSaving(true);
      const res = await dbService.restoreBackupFromJson(text, currentUser?.id);
      await refreshBooks();

      const parts: string[] = [];
      if (res.booksCount > 0) parts.push(`${res.booksCount} ${res.booksCount === 1 ? 'libro' : 'libros'}`);
      if (res.chaptersCount > 0) parts.push(`${res.chaptersCount} ${res.chaptersCount === 1 ? 'capítulo' : 'capítulos'}`);
      if (res.charactersCount > 0) parts.push(`${res.charactersCount} personajes`);
      if (res.detailsCount > 0) parts.push(`${res.detailsCount} detalles del mundo`);
      if (res.eventsCount > 0) parts.push(`${res.eventsCount} eventos`);

      const summaryText = parts.length > 0 ? ` (${parts.join(', ')})` : '';
      toast(`¡Copia de seguridad leída y restaurada con éxito!${summaryText}`, 'success');

      if (currentUser) {
        triggerCloudSync(false).catch(() => {});
      }

      if (res.firstRestoredBookId) {
        const booksList = await dbService.getBooks(currentUser);
        const loaded = booksList.find((b) => b.id === res.firstRestoredBookId);
        if (loaded && res.booksCount === 1) {
          setActiveBook(loaded);
        }
      }
    } catch (err: any) {
      toast('Error al leer o restaurar copia de seguridad: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] p-4 md:p-8 ${theme.bgWorkspace}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Banner / Library Welcome */}
        <div
          className={`p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${theme.bgCard} ${theme.borderCard}`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${theme.accentBadge} ${theme.accentBadgeText}`}
              >
                {currentUser ? `Biblioteca de @${currentUser.username}` : 'Biblioteca de Proyectos'}
              </span>
              <span className="text-xs text-stone-400">• {books.length} proyectos</span>
              {currentUser ? (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5" />
                  Sincronizado en la nube (Multidispositivo)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  ✨ Crear cuenta para sincronizar en todos tus dispositivos
                </button>
              )}
            </div>
            <h1 className={`font-serif text-2xl md:text-3xl font-extrabold ${theme.textPrimary}`}>
              Tus Obras y Universos Narrativos
            </h1>
            <p className="text-sm text-stone-500 max-w-2xl mt-1">
              Organiza manuscritos, personajes, fichas del mundo y líneas temporales
              con independencia absoluta para cada libro y respaldo automático en la nube.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser && (
              <button
                type="button"
                onClick={() => triggerCloudSync(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs md:text-sm font-semibold cursor-pointer transition-all hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs`}
                title="Crear una copia de seguridad en la nube de todos tus libros"
              >
                <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Copia en la Nube</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs md:text-sm font-semibold cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 ${theme.borderCard} ${theme.bgCard} text-amber-700 dark:text-amber-400 shadow-xs hover:border-amber-500/50`}
              title="Abrir calendario de producción y racha de constancia"
            >
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Calendario &amp; Racha</span>
              <span className="flex items-center gap-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                <Flame className="w-3 h-3 fill-current text-amber-500" />
                5d
              </span>
            </button>

            <label
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs md:text-sm font-semibold cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} shadow-xs hover:border-amber-500/50`}
              title="Leer y restaurar copia de seguridad (.json) con todos tus libros y datos"
            >
              <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Restaurar Copia / JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJsonFile}
              />
            </label>

            <button
              type="button"
              onClick={openPaletteCreator}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs md:text-sm font-semibold cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} shadow-xs hover:border-amber-500/40`}
              title="Personalizar paleta de colores para toda la biblioteca"
            >
              <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Personalizar Paleta</span>
            </button>

            <button
              onClick={() => {
                setEditingBook(null);
                setIsModalOpen(true);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${theme.primaryBtn}`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Libro</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, género o sinopsis..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* User Ownership Filter Tabs (Mis Libros vs Compartidos) */}
            {currentUser && (
              <div
                className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-medium ${theme.borderCard} ${theme.bgCard}`}
              >
                <button
                  onClick={() => setUserBooksFilter('mis_libros')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    userBooksFilter === 'mis_libros'
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Mis Libros
                </button>
                <button
                  onClick={() => setUserBooksFilter('compartidos')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    userBooksFilter === 'compartidos'
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <Users className="w-3 h-3 text-stone-400" />
                  <span>Compartidos</span>
                </button>
                <button
                  onClick={() => setUserBooksFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    userBooksFilter === 'todos'
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Todos
                </button>
              </div>
            )}

            {/* Status Tabs */}
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-medium ${theme.borderCard} ${theme.bgCard}`}
            >
              <button
                onClick={() => setStatusFilter('activos')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'activos'
                    ? `${theme.activeTab} font-semibold shadow-xs`
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Activos ({books.filter((b) => !b.isArchived).length})
              </button>
              <button
                onClick={() => setStatusFilter('archivados')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'archivados'
                    ? `${theme.activeTab} font-semibold shadow-xs`
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Archivados ({books.filter((b) => b.isArchived).length})
              </button>
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'todos'
                    ? `${theme.activeTab} font-semibold shadow-xs`
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
            >
              <option value="updated">Última modificación</option>
              <option value="title">Título alfabético</option>
              <option value="chapters">Cantidad de capítulos</option>
              <option value="created">Fecha de creación</option>
            </select>
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div
            className={`p-16 rounded-3xl border text-center shadow-xs ${theme.bgCard} ${theme.borderCard}`}
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-stone-400 opacity-60" />
            <h3 className={`font-serif text-lg font-bold ${theme.textPrimary}`}>
              No se encontraron proyectos literarios
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-6">
              {searchQuery
                ? 'Prueba con otros términos o limpia los filtros de búsqueda.'
                : 'Comienza tu viaje creativo creando tu primera novela, antología o guion.'}
            </p>
            <button
              onClick={() => {
                setEditingBook(null);
                setIsModalOpen(true);
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md ${theme.primaryBtn}`}
            >
              <Plus className="w-4 h-4" />
              <span>Crear Mi Primer Libro</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const stats = bookChapterStats[book.id] || { count: 0, words: 0 };
              const target = book.targetWordCount || 75000;
              const progressPct = Math.min(100, Math.round((stats.words / target) * 100));
              const IconComp = ICON_MAP[book.coverIcon] || Compass;
              const isMenuOpen = menuOpenId === book.id;
              const bookPalette = (book.colorPalette || currentPalette) as PaletteTheme;
              const paletteCfg = PALETTES[bookPalette] || PALETTES.bosque;
              const hasCustomCover = !!book.coverImageUrl;

              return (
                <div
                  key={book.id}
                  className={`group rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${theme.bgCard} ${theme.borderCard}`}
                >
                  {/* Top Cover Visual Banner */}
                  <div
                    onClick={() => setActiveBook(book)}
                    className={`h-44 bg-gradient-to-br ${book.coverGradient} p-5 flex flex-col justify-between text-white cursor-pointer relative overflow-hidden`}
                    style={
                      hasCustomCover
                        ? {
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.8)), url(${book.coverImageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-mono tracking-wider bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20 text-white/90">
                          {book.genre}
                        </span>
                        {currentUser && (
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs flex items-center gap-1 ${
                              book.userId === currentUser.id || !book.userId
                                ? 'bg-amber-500/30 text-amber-100 border-amber-400/40'
                                : 'bg-blue-600/30 text-blue-100 border-blue-400/40'
                            }`}
                          >
                            {book.userId === currentUser.id || !book.userId ? (
                              'Tú (Autor)'
                            ) : (
                              <>
                                <Shield className="w-2.5 h-2.5" />
                                {book.collaborators?.find(
                                  (c) =>
                                    c.userId === currentUser.id ||
                                    c.username?.toLowerCase() === currentUser.username.toLowerCase()
                                )?.role || 'Colaborador'}
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Share & Collaborators button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingBook(book);
                          }}
                          className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-all flex items-center gap-1 text-[10px] px-2"
                          title="Compartir o gestionar colaboradores de este libro"
                        >
                          <Share2 className="w-3.5 h-3.5 text-amber-300" />
                          {book.collaborators && book.collaborators.length > 0 && (
                            <span>{book.collaborators.length}</span>
                          )}
                        </button>

                        {/* Gallery icon button if book has multiple images */}
                        {book.images && book.images.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGalleryBook(book);
                            }}
                            className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-all flex items-center gap-1 text-[10px] px-2"
                            title="Ver galería de imágenes del libro"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{book.images.length}</span>
                          </button>
                        )}

                        {/* 3 dots palette preview */}
                        <div
                          className="flex -space-x-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs border border-white/10"
                          title={`Paleta: ${paletteCfg.name}`}
                        >
                          {paletteCfg.preview.map((hex, idx) => (
                            <div
                              key={idx}
                              className="w-2.5 h-2.5 rounded-full border border-black/40"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>

                        {/* Three dots menu */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(isMenuOpen ? null : book.id);
                          }}
                          className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="z-10">
                      {!hasCustomCover && (
                        <IconComp className="w-6 h-6 text-amber-300 drop-shadow mb-1" />
                      )}
                      <h3 className="font-serif font-bold text-xl leading-tight line-clamp-1 drop-shadow-md">
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p className="text-xs text-white/80 italic font-serif line-clamp-1 drop-shadow">
                          {book.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Subtle glow */}
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  </div>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      className={`absolute right-4 top-14 w-52 rounded-xl border shadow-xl p-1 z-30 ${theme.bgCard} ${theme.borderCard} animate-in fade-in zoom-in-95 duration-100`}
                    >
                      <button
                        onClick={() => {
                          setSharingBook(book);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Compartir colaboradores ({book.collaborators?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingBook(book);
                          setIsModalOpen(true);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Editar datos y portada</span>
                      </button>
                      {book.images && book.images.length > 0 && (
                        <button
                          onClick={() => {
                            setGalleryBook(book);
                            setMenuOpenId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                          <span>Ver galería de imágenes</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateBook(book)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Duplicar proyecto</span>
                      </button>
                      <button
                        onClick={() => handleToggleArchive(book)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5 text-stone-500" />
                        <span>{book.isArchived ? 'Desarchivar' : 'Archivar libro'}</span>
                      </button>
                      <div className="my-1 border-t border-stone-200 dark:border-stone-800" />
                      <button
                        onClick={() => {
                          setDeleteConfirmBook(book);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar proyecto</span>
                      </button>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-4">
                        {book.description || 'Sin sinopsis registrada.'}
                      </p>

                      {/* Word Count Progress Bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-stone-500 flex items-center gap-1 font-mono">
                            <FileText className="w-3.5 h-3.5" />
                            {stats.words.toLocaleString()} / {target.toLocaleString()} palabras
                          </span>
                          <span className={`font-semibold text-xs font-mono ${theme.accentText}`}>
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: theme.accentHex,
                            }}
                          />
                        </div>
                      </div>

                      {/* Meta stats badges */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mb-4">
                        <span className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                          <Layers className="w-3 h-3 text-stone-400" />
                          {stats.count} capítulos
                        </span>
                        <span className={`capitalize px-2 py-0.5 rounded-md font-medium ${theme.accentBadge} ${theme.accentText}`}>
                          {book.status}
                        </span>
                        {book.collaborators && book.collaborators.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSharingBook(book)}
                            className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md hover:bg-amber-500/20 transition-colors"
                            title="Ver colaboradores"
                          >
                            <Users className="w-3 h-3" />
                            <span>{book.collaborators.length} {book.collaborators.length === 1 ? 'colab' : 'colabs'}</span>
                          </button>
                        )}
                        <span className="flex items-center gap-1 ml-auto text-[10px] text-stone-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(book.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action: Open Workspace */}
                    <button
                      onClick={() => setActiveBook(book)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${theme.borderCard} hover:bg-black/5 dark:hover:bg-white/5 ${theme.textPrimary}`}
                    >
                      <span>Entrar al Espacio de Trabajo</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Image Gallery Modal */}
      {galleryBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setGalleryBook(null)}
        >
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    Galería de {galleryBook.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Portadas e imágenes de referencia vinculadas a este proyecto
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGalleryBook(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
              {(galleryBook.images || []).map((img) => (
                <div
                  key={img.id}
                  onClick={() => setLightboxImage(img)}
                  className="group relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 cursor-pointer aspect-square bg-stone-100 dark:bg-stone-900"
                >
                  <img
                    src={img.url}
                    alt={img.caption || 'Imagen'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {img.url === galleryBook.coverImageUrl && (
                    <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${theme.activeTab} shadow-xs`}>
                      Portada
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for single image view */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Book Create / Edit Modal */}
      <BookModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBook(null);
        }}
        onSave={handleCreateOrUpdateBook}
        initialBook={editingBook}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 rounded-full bg-rose-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  ¿Eliminar este libro?
                </h3>
                <p className="text-xs text-stone-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-300 mb-6 leading-relaxed">
              Estás a punto de borrar permanentemente{' '}
              <strong className="text-rose-600 font-semibold">"{deleteConfirmBook.title}"</strong>,
              incluyendo todos sus capítulos, fichas de personajes, lore, grabaciones de audio y
              la línea de tiempo asociada.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmBook(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBook}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                Sí, Eliminar Proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Book Modal */}
      {sharingBook && (
        <ShareBookModal
          isOpen={!!sharingBook}
          book={sharingBook}
          onClose={() => setSharingBook(null)}
          onBookUpdated={() => refreshBooks()}
        />
      )}

      {/* Writing Calendar & Streak Modal from Library */}
      {isCalendarModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsCalendarModalOpen(false)}
        >
          <div
            className={`w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-4 md:p-6 ${theme.bgCard} ${theme.borderCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            <WritingCalendarModule onClose={() => setIsCalendarModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
