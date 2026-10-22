import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Compass,
  Feather,
  Sparkles,
  Flame,
  Crown,
  Scroll,
  Shield,
  Palette,
  Upload,
  Image as ImageIcon,
  Star,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import { Book, PaletteTheme, MediaImage } from '../../types';
import { PALETTES, getTheme } from '../../utils/theme';
import { useApp } from '../../context/AppContext';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Partial<Book>) => Promise<void>;
  initialBook?: Book | null;
}

const COVER_GRADIENTS = [
  { name: 'Esmeralda & Roble', value: 'from-emerald-950 via-teal-900 to-stone-900' },
  { name: 'Océano Abisal', value: 'from-slate-950 via-sky-950 to-blue-900' },
  { name: 'Ascua & Terracota', value: 'from-amber-950 via-red-950 to-stone-900' },
  { name: 'Crepúsculo Amatista', value: 'from-purple-950 via-indigo-950 to-stone-950' },
  { name: 'Carbón & Medianoche', value: 'from-zinc-950 via-neutral-900 to-stone-900' },
  { name: 'Papiro Antiguo', value: 'from-stone-800 via-amber-900 to-stone-950' },
];

const COVER_ICONS = [
  { name: 'Brújula', id: 'Compass', icon: Compass },
  { name: 'Pluma', id: 'Feather', icon: Feather },
  { name: 'Libro Abierto', id: 'BookOpen', icon: BookOpen },
  { name: 'Corona', id: 'Crown', icon: Crown },
  { name: 'Pergamino', id: 'Scroll', icon: Scroll },
  { name: 'Escudo', id: 'Shield', icon: Shield },
  { name: 'Llama', id: 'Flame', icon: Flame },
  { name: 'Destello', id: 'Sparkles', icon: Sparkles },
];

const GENRES = [
  'Fantasía Épica',
  'Ciencia Ficción',
  'Misterio / Novela Negra',
  'Ficción Histórica',
  'Thriller Psicológico',
  'Romance',
  'Terror / Horror',
  'Realismo Mágico',
  'Aventura',
  'Ensayo / No Ficción',
  'Poesía / Antología',
  'Otro',
];

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBook,
}) => {
  const { currentPalette, darkMode, toast } = useApp();
  const theme = getTheme(currentPalette, darkMode);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Fantasía Épica');
  const [status, setStatus] = useState<Book['status']>('planificacion');
  const [targetWordCount, setTargetWordCount] = useState<number>(75000);
  const [coverGradient, setCoverGradient] = useState(COVER_GRADIENTS[0].value);
  const [coverIcon, setCoverIcon] = useState('Compass');
  const [selectedPalette, setSelectedPalette] = useState<PaletteTheme>('bosque');
  const [images, setImages] = useState<MediaImage[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title);
      setSubtitle(initialBook.subtitle || '');
      setDescription(initialBook.description);
      setGenre(initialBook.genre);
      setStatus(initialBook.status);
      setTargetWordCount(initialBook.targetWordCount || 75000);
      setCoverGradient(initialBook.coverGradient || COVER_GRADIENTS[0].value);
      setCoverIcon(initialBook.coverIcon || 'Compass');
      setSelectedPalette(initialBook.colorPalette || 'bosque');
      setImages(initialBook.images || []);
      setCoverImageUrl(initialBook.coverImageUrl);
    } else {
      setTitle('');
      setSubtitle('');
      setDescription('');
      setGenre('Fantasía Épica');
      setStatus('planificacion');
      setTargetWordCount(75000);
      setCoverGradient(COVER_GRADIENTS[0].value);
      setCoverIcon('Compass');
      setSelectedPalette('bosque');
      setImages([]);
      setCoverImageUrl(undefined);
    }
  }, [initialBook, isOpen]);

  if (!isOpen) return null;

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
          const isFirst = prev.length === 0 && !coverImageUrl;
          const newImg: MediaImage = {
            id: 'bimg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            url,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            order: prev.length,
            isCover: isFirst,
            createdAt: new Date().toISOString(),
          };

          if (isFirst) {
            setCoverImageUrl(url);
          }

          return [...prev, newImg];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    toast(`${files.length} imagen(es) añadida(s)`, 'info');
  };

  // Set main cover
  const handleSetMainCover = (img: MediaImage) => {
    setCoverImageUrl(img.url);
    setImages((prev) =>
      prev.map((i) => ({
        ...i,
        isCover: i.id === img.id,
      }))
    );
    toast('Portada principal del libro seleccionada', 'success');
  };

  // Move image order
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

  // Delete image
  const handleDeleteImage = (imgId: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === imgId);
      const next = prev.filter((i) => i.id !== imgId);
      if (target?.url === coverImageUrl) {
        setCoverImageUrl(next[0]?.url);
        if (next[0]) next[0].isCover = true;
      }
      return next;
    });
  };

  // Update caption
  const handleUpdateImageCaption = (imgId: string, caption: string) => {
    setImages((prev) =>
      prev.map((i) => (i.id === imgId ? { ...i, caption } : i))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        genre,
        status,
        targetWordCount: Number(targetWordCount) || 50000,
        coverGradient,
        coverIcon,
        colorPalette: selectedPalette,
        images,
        coverImageUrl,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIconComp =
    COVER_ICONS.find((i) => i.id === coverIcon)?.icon || Compass;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col my-auto ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                {initialBook ? 'Editar Proyecto Literario' : 'Crear Nuevo Libro'}
              </h3>
              <p className="text-xs text-stone-500">
                Define las características, galería de portadas y paleta de tu obra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live Cover Preview + Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Cover Preview Card */}
            <div
              className={`h-56 rounded-2xl bg-gradient-to-br ${coverGradient} text-stone-100 p-4 flex flex-col justify-between shadow-xl relative overflow-hidden border border-white/20`}
              style={
                coverImageUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.75)), url(${coverImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="flex justify-between items-start z-10">
                <SelectedIconComp className="w-7 h-7 text-amber-300 drop-shadow" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10">
                  {genre}
                </span>
              </div>
              <div className="z-10">
                <h4 className="font-serif font-bold text-lg leading-tight line-clamp-2 text-white drop-shadow-md">
                  {title || 'Título de tu Libro'}
                </h4>
                {subtitle && (
                  <p className="text-xs text-white/90 line-clamp-1 italic font-serif mt-0.5 drop-shadow">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="text-[10px] text-white/70 flex justify-between border-t border-white/20 pt-1.5 z-10 font-mono">
                <span>Pluma &amp; Tiempo</span>
                <span className="capitalize">{status}</span>
              </div>
            </div>

            {/* Title & Subtitle inputs */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título de la obra *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: El Viento de los Olvidados"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Subtítulo o lema (opcional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Crónica del Primer Invierno"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Género literario
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g} className="bg-white dark:bg-stone-900">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Estado de la obra
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Book['status'])}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="idea" className="bg-white dark:bg-stone-900">Idea inicial</option>
                    <option value="planificacion" className="bg-white dark:bg-stone-900">Planificación</option>
                    <option value="escritura" className="bg-white dark:bg-stone-900">En escritura</option>
                    <option value="revision" className="bg-white dark:bg-stone-900">En revisión</option>
                    <option value="terminado" className="bg-white dark:bg-stone-900">Terminado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MULTIPLE IMAGES & COVERS MANAGEMENT */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary}`}>
                  Galería de Portadas e Ilustraciones del Libro
                </h4>
                <p className="text-[11px] text-stone-500">
                  Carga una o varias imágenes locales. Elige cuál será la portada principal del libro.
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
                Aún no has subido imágenes para este libro. Se utilizará el gradiente e icono seleccionados abajo.
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((img, idx) => {
                  const isMain = img.url === coverImageUrl || img.isCover;
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
                          alt="Cover thumbnail"
                          className="w-12 h-14 rounded-lg object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={img.caption || ''}
                            onChange={(e) => handleUpdateImageCaption(img.id, e.target.value)}
                            placeholder="Descripción (ej: Portada oficial, ilustración conceptual)..."
                            className={`w-full text-xs bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none ${theme.textPrimary}`}
                          />
                          <div className="flex items-center gap-2 mt-1">
                            {isMain ? (
                              <span className={`text-[10px] font-bold ${theme.accentText} flex items-center gap-1`}>
                                <Star className="w-3 h-3 fill-current" /> Portada Principal
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetMainCover(img)}
                                className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                              >
                                Usar como portada principal
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

          {/* Description / Synopsis */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Sinopsis o premisa del libro
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la trama principal, conflicto nuclear o temática central..."
              className={`w-full p-3 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none`}
            />
          </div>

          {/* Target Word Count */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Objetivo de palabras del manuscrito
              </label>
              <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400">
                {Number(targetWordCount).toLocaleString()} palabras
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={250000}
              step={5000}
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>Cuento (10k)</span>
              <span>Novela corta (40k)</span>
              <span>Novela estándar (80k)</span>
              <span>Novela épica (150k+)</span>
            </div>
          </div>

          {/* Cover Design Options: Gradients & Icons */}
          <div className="space-y-4 pt-3 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Estilo de Portada (Gradiente e Icono)
            </h4>

            {/* Gradients */}
            <div>
              <label className="block text-[11px] text-stone-500 mb-1.5">
                Gradiente de fondo de portada
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {COVER_GRADIENTS.map((grad) => (
                  <button
                    key={grad.name}
                    type="button"
                    onClick={() => setCoverGradient(grad.value)}
                    className={`h-10 rounded-xl bg-gradient-to-br ${grad.value} border-2 transition-transform ${
                      coverGradient === grad.value
                        ? 'border-white scale-105 shadow-md ring-2 ring-amber-500/50'
                        : 'border-transparent hover:opacity-90'
                    }`}
                    title={grad.name}
                  />
                ))}
              </div>
            </div>

            {/* Icons */}
            <div>
              <label className="block text-[11px] text-stone-500 mb-1.5">
                Icono emblemático de la obra
              </label>
              <div className="flex flex-wrap gap-2">
                {COVER_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = coverIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCoverIcon(item.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs transition-all ${
                        isSelected
                          ? `${theme.activeBorder} ${theme.accentBadge} ${theme.accentText} font-semibold shadow-xs`
                          : 'border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dedicated Palette Selection for this book */}
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Paleta de colores exclusiva para este libro
              </label>
            </div>
            <p className="text-[11px] text-stone-500">
              Cada libro puede tener su propia atmósfera visual entre las cinco paletas de autor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Object.values(PALETTES).map((pal) => {
                const isSelected = selectedPalette === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => setSelectedPalette(pal.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs`
                        : 'border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-stone-800 dark:text-stone-200">
                        {pal.name}
                      </span>
                      <span className="text-[10px] text-stone-500 line-clamp-1">
                        {pal.description}
                      </span>
                    </div>

                    <div className="flex -space-x-1 shrink-0 ml-2">
                      {pal.preview.map((c, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
            >
              {isSubmitting
                ? 'Guardando...'
                : initialBook
                ? 'Guardar Cambios'
                : 'Crear Libro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
