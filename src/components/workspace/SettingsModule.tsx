import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Download,
  Upload,
  HardDrive,
  FileText,
  Sun,
  Moon,
  Check,
  AlertCircle,
  HelpCircle,
  Info,
  ShieldCheck,
  Type,
  Plus,
  Trash2,
  Copy,
  Edit2,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { PALETTES, getTheme, getContrastRatio } from '../../utils/theme';
import { PaletteTheme, Book, Chapter, CustomPaletteConfig, CustomFontItem } from '../../types';
import { formatBytes } from '../../utils/timelineEngine';
import { ColorGridPicker } from '../common/ColorGridPicker';

const SYSTEM_FONTS = [
  { name: 'Plus Jakarta Sans (Moderna y Limpia)', value: 'Plus Jakarta Sans' },
  { name: 'Lora (Editorial / Novela Clásica)', value: 'Lora' },
  { name: 'Cinzel (Épica / Portadas)', value: 'Cinzel' },
  { name: 'Georgia (Serif Tradicional)', value: 'Georgia' },
  { name: 'Monospace (Borrador / Guion)', value: 'monospace' },
  { name: 'System Sans-Serif (Predeterminada)', value: 'system-ui' },
];

export const SettingsModule: React.FC = () => {
  const {
    activeBook,
    setActiveBook,
    refreshBooks,
    currentPalette,
    darkMode,
    toggleDarkMode,
    setPalette,
    settings,
    updateSettings,
    customPalettes,
    refreshCustomPalettes,
    customFonts,
    refreshCustomFonts,
    currentUser,
    toast,
    setIsSaving,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number }>({
    usage: 0,
    quota: 0,
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // 3-Color Custom Palette State (Req 8.1)
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [editingCustomPalette, setEditingCustomPalette] = useState<CustomPaletteConfig | null>(null);
  const [paletteName, setPaletteName] = useState('Mi Paleta Personalizada');
  const [primaryColor, setPrimaryColor] = useState('#243B35');
  const [secondaryColor, setSecondaryColor] = useState('#E5DCCB');
  const [accentColor, setAccentColor] = useState('#87A878');
  const [activeColorField, setActiveColorField] = useState<'primary' | 'secondary' | 'accent'>('primary');

  // Custom Font Import State (Req 11.1)
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [fontNameInput, setFontNameInput] = useState('');
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [fontPreviewUrl, setFontPreviewUrl] = useState<string | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      const est = await dbService.getStorageEstimate();
      setStorageEstimate(est);
      if (activeBook) {
        const chs = await dbService.getChaptersByBook(activeBook.id);
        setChapters(chs);
      }
    }
    loadStats();
  }, [activeBook]);

  // Contrast Ratio Calculations (Req 8.1)
  const primaryOnWhiteContrast = getContrastRatio(primaryColor, '#FFFFFF').toFixed(1);
  const secondaryOnPrimaryContrast = getContrastRatio(secondaryColor, primaryColor).toFixed(1);
  const accentOnWhiteContrast = getContrastRatio(accentColor, '#FFFFFF').toFixed(1);
  const hasContrastWarning = Number(primaryOnWhiteContrast) < 4.5;

  // Open Palette Creator / Editor
  const openPaletteEditor = (paletteConfig?: CustomPaletteConfig) => {
    if (paletteConfig) {
      setEditingCustomPalette(paletteConfig);
      setPaletteName(paletteConfig.name);
      setPrimaryColor(paletteConfig.primary);
      setSecondaryColor(paletteConfig.secondary);
      setAccentColor(paletteConfig.accent);
    } else {
      setEditingCustomPalette(null);
      setPaletteName(`Paleta Personalizada ${customPalettes.length + 1}`);
      setPrimaryColor('#243B35');
      setSecondaryColor('#E5DCCB');
      setAccentColor('#87A878');
    }
    setActiveColorField('primary');
    setIsPaletteModalOpen(true);
  };

  // Save 3-Color Custom Palette (Req 8.1)
  const handleSaveCustomPalette = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paletteName.trim()) return;

    setIsSaving(true);
    try {
      const paletteId =
        editingCustomPalette?.id ||
        'cpal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const record: CustomPaletteConfig = {
        id: paletteId,
        name: paletteName.trim(),
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        createdAt: editingCustomPalette?.createdAt || new Date().toISOString(),
      };

      await dbService.saveCustomPalette(record);
      await refreshCustomPalettes();
      setIsPaletteModalOpen(false);

      // Automatically apply this custom palette
      await setPalette(record.id, true);
      toast(`Paleta "${record.name}" guardada y aplicada`, 'success');
    } catch (err: any) {
      toast('Error al guardar paleta: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Custom Palette
  const handleDuplicateCustomPalette = async (pal: CustomPaletteConfig) => {
    setIsSaving(true);
    try {
      const newId = 'cpal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const dup: CustomPaletteConfig = {
        ...pal,
        id: newId,
        name: `${pal.name} (Copia)`,
        createdAt: new Date().toISOString(),
      };
      await dbService.saveCustomPalette(dup);
      await refreshCustomPalettes();
      toast(`Paleta duplicada como "${dup.name}"`, 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Custom Palette
  const handleDeleteCustomPalette = async (paletteId: string) => {
    if (!confirm('¿Eliminar esta paleta personalizada?')) return;
    setIsSaving(true);
    try {
      await dbService.deleteCustomPalette(paletteId);
      await refreshCustomPalettes();
      if (currentPalette === paletteId) {
        await setPalette('bosque', false);
      }
      toast('Paleta personalizada eliminada', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  // Custom Font File Upload & Validation (Req 11.1)
  const handleFontFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'ttf' && extension !== 'otf' && extension !== 'woff' && extension !== 'woff2') {
      setFontError('Formato no compatible. Por favor sube archivos .ttf o .otf');
      return;
    }

    setFontError(null);
    setFontFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!fontNameInput) {
      setFontNameInput(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setFontPreviewUrl(dataUrl);

      // Dynamically test load in FontFace
      try {
        const testFace = new FontFace(cleanName, `url(${dataUrl})`);
        testFace.load().then((loaded) => {
          document.fonts.add(loaded);
        }).catch(() => {
          setFontError('El archivo de fuente no pudo ser procesado por el navegador.');
        });
      } catch (err) {
        console.warn('FontFace API error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Font to IndexedDB (Req 11.1)
  const handleSaveCustomFont = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontNameInput.trim() || !fontPreviewUrl || !fontFile) return;

    setIsSaving(true);
    try {
      const ext = (fontFile.name.split('.').pop()?.toLowerCase() || 'truetype') as any;
      const format = ext === 'otf' ? 'opentype' : 'truetype';

      const fontRecord: CustomFontItem = {
        id: 'font_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: fontNameInput.trim(),
        fileName: fontFile.name,
        format,
        dataUrl: fontPreviewUrl,
        createdAt: new Date().toISOString(),
      };

      await dbService.saveCustomFont(fontRecord);
      await refreshCustomFonts();

      // Apply to UI
      await updateSettings({ uiFontFamily: fontRecord.name });

      setIsFontModalOpen(false);
      setFontFile(null);
      setFontPreviewUrl(null);
      setFontNameInput('');
      toast(`Fuente "${fontRecord.name}" instalada y aplicada a la interfaz`, 'success');
    } catch (err: any) {
      toast('Error al guardar la fuente: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Custom Font
  const handleDeleteCustomFont = async (font: CustomFontItem) => {
    const isCurrent = settings.uiFontFamily === font.name;
    const warning = isCurrent
      ? `La fuente "${font.name}" está actualmente en uso en la interfaz. Si la eliminas, la aplicación volverá a la tipografía del sistema. ¿Deseas continuar?`
      : `¿Eliminar la fuente "${font.name}" de la aplicación?`;

    if (!confirm(warning)) return;

    setIsSaving(true);
    try {
      await dbService.deleteCustomFont(font.id);
      await refreshCustomFonts();
      if (isCurrent) {
        await updateSettings({ uiFontFamily: 'default' });
      }
      toast(`Fuente "${font.name}" eliminada`, 'info');
    } finally {
      setIsSaving(false);
    }
  };

  // Export full book project as JSON
  const handleExportJson = async () => {
    if (!activeBook) return;
    try {
      const json = await dbService.exportBookToJson(activeBook.id);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${activeBook.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Copia de seguridad JSON descargada', 'success');
    } catch (err: any) {
      toast('Error al exportar: ' + err.message, 'error');
    }
  };

  // Restore backup file directly from settings
  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setIsSaving(true);
      const res = await dbService.restoreBackupFromJson(text, currentUser?.id);
      await refreshBooks();
      toast(`Copia de seguridad restaurada (${res.booksCount} libros, ${res.chaptersCount} capítulos, ${res.charactersCount} personajes)`, 'success');
      if (res.firstRestoredBookId) {
        const booksList = await dbService.getBooks(currentUser);
        const loaded = booksList.find((b) => b.id === res.firstRestoredBookId);
        if (loaded) setActiveBook(loaded);
      }
    } catch (err: any) {
      toast('Error al restaurar: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  // Export Full Manuscript to TXT
  const handleExportFullManuscript = () => {
    if (!activeBook) return;
    if (chapters.length === 0) {
      toast('No hay capítulos para exportar', 'info');
      return;
    }

    let manuscript = `${activeBook.title.toUpperCase()}\n`;
    if (activeBook.subtitle) manuscript += `${activeBook.subtitle}\n`;
    manuscript += `Género: ${activeBook.genre}\n`;
    manuscript += `Exportado el: ${new Date().toLocaleDateString()}\n`;
    manuscript += `${'='.repeat(60)}\n\n`;

    chapters.forEach((chap) => {
      manuscript += `\n\n${'#'.repeat(40)}\n`;
      manuscript += `CAPÍTULO ${chap.number}: ${chap.title.toUpperCase()}\n`;
      if (chap.synopsis) manuscript += `Sinopsis: ${chap.synopsis}\n`;
      manuscript += `${'#'.repeat(40)}\n\n`;
      manuscript += `${chap.content.replace(/<[^>]*>?/gm, '') || '(Capítulo sin texto)'}\n\n`;
    });

    const blob = new Blob([manuscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manuscrito_${activeBook.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Manuscrito completo exportado en TXT', 'success');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-sm ${theme.bgCard} ${theme.borderCard}`}>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${theme.accentBadge} ${theme.accentBadgeText}`}
          >
            Ajustes del Proyecto
          </span>
        </div>
        <h2 className={`font-serif text-2xl md:text-3xl font-bold ${theme.textPrimary}`}>
          Archivos, Paletas y Tipografía
        </h2>
        <p className="text-xs md:text-sm text-stone-500 max-w-2xl mt-1">
          Personaliza la estética visual, crea paletas exclusivas de 3 colores, importa fuentes tipográficas y descarga copias de seguridad de "{activeBook?.title}".
        </p>
      </div>

      {/* 1. SECCIÓN DE PALETAS: 5 PREDETERMINADAS + PALETAS PERSONALIZADAS DE 3 COLORES (Req 8 & 8.1) */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xs space-y-6 ${theme.bgCard} ${theme.borderCard}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Atmósferas Visuales y Paletas Literarias
              </h3>
              <p className="text-xs text-stone-500">
                Elige entre las 5 paletas de autor o diseña tu propia combinación de 3 colores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPaletteEditor()}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear mi paleta</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-black/5"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
              <span>{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>
        </div>

        {/* 5 Predetermined Palettes Grid with High-Contrast Preview (Req 8) */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2.5">
            Paletas Literarias Predeterminadas (5)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {(Object.keys(PALETTES) as PaletteTheme[]).map((pKey) => {
              const p = PALETTES[pKey];
              const isSelected = currentPalette === pKey;
              return (
                <div
                  key={pKey}
                  onClick={() => setPalette(pKey, true)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-500/10 shadow-md ring-2 ring-amber-500/30 scale-[1.02]'
                      : `${theme.borderCard} hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  <div>
                    {/* Swatches */}
                    <div className="flex -space-x-1 mb-2.5">
                      {p.preview.map((hex, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-stone-800 shadow-sm"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <h4 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      {p.description}
                    </p>
                  </div>

                  {/* Visual mini-card preview of card/button/badge (Req 8) */}
                  <div className="pt-3 mt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-stone-400">
                        {isSelected ? '✓ Activa' : 'Aplicar'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Palettes Section (Req 8.1) */}
        {customPalettes.length > 0 && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
              Tus Paletas Personalizadas de 3 Colores ({customPalettes.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {customPalettes.map((cp) => {
                const isSelected = currentPalette === cp.id;
                return (
                  <div
                    key={cp.id}
                    onClick={() => setPalette(cp.id, true)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 bg-purple-500/10 shadow-md ring-2 ring-purple-500/30 scale-[1.02]'
                        : `${theme.borderCard} hover:bg-black/5`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex -space-x-1.5">
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: cp.primary }} title="Primario" />
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: cp.secondary }} title="Secundario" />
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: cp.accent }} title="Acento" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaletteEditor(cp);
                            }}
                            className="p-1 rounded text-stone-400 hover:text-stone-700"
                            title="Editar colores"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateCustomPalette(cp);
                            }}
                            className="p-1 rounded text-stone-400 hover:text-stone-700"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomPalette(cp.id);
                            }}
                            className="p-1 rounded text-stone-400 hover:text-rose-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200">
                        {cp.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                        {cp.primary} • {cp.secondary} • {cp.accent}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-400">
                      {isSelected ? '✓ Aplicada actualmente' : 'Clic para activar'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. SECCIÓN DE TIPOGRAFÍA DE LA INTERFAZ Y FUENTES IMPORTADAS (.TTF/.OTF) (Req 11 & 11.1) */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xs space-y-6 ${theme.bgCard} ${theme.borderCard}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Tipografía de la Interfaz y Fuentes Personalizadas
              </h3>
              <p className="text-xs text-stone-500">
                Cambia la fuente general de la aplicación o importa archivos .ttf y .otf desde tu disco (independiente del editor de manuscritos)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFontModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Agregar fuente (.ttf / .otf)</span>
            </button>
            <button
              onClick={async () => {
                await updateSettings({ uiFontFamily: 'default', uiFontScale: 100 });
                toast('Tipografía de la interfaz restablecida a la predeterminada', 'info');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-black/5"
              title="Restaurar tipografía predeterminada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>
          </div>
        </div>

        {/* Font Selectors & Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Interface Font Family */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Fuente de la interfaz
            </label>
            <select
              value={settings.uiFontFamily || 'default'}
              onChange={async (e) => {
                const val = e.target.value;
                await updateSettings({ uiFontFamily: val });
                toast('Tipografía de la interfaz actualizada', 'success');
              }}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
            >
              <option value="default">Tipografía del Sistema (Predeterminada)</option>
              <optgroup label="Fuentes del Sistema y Web">
                {SYSTEM_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
              {customFonts.length > 0 && (
                <optgroup label="Fuentes Importadas por el Usuario">
                  {customFonts.map((cf) => (
                    <option key={cf.id} value={cf.name}>
                      ★ {cf.name} ({cf.fileName})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Interface Scale */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Escala de tamaño general de la interfaz
              </label>
              <span className="text-xs font-mono font-bold text-stone-500">
                {settings.uiFontScale || 100}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[90, 100, 110, 120].map((sc) => (
                <button
                  key={sc}
                  onClick={async () => {
                    await updateSettings({ uiFontScale: sc });
                    toast(`Escala ajustada a ${sc}%`, 'info');
                  }}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    (settings.uiFontScale || 100) === sc
                      ? `${theme.activeTab} shadow-xs`
                      : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-black/5'
                  }`}
                >
                  {sc}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Specimen Preview */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Muestra Tipográfica de la Interfaz:
          </span>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 leading-snug">
            «El relojero sostenía la llave octogonal con la certeza de que el tiempo se agota antes del invierno.»
          </p>
          <span className="text-[11px] text-stone-500 font-mono block">
            Fuente activa: <strong>{settings.uiFontFamily || 'Predeterminada'}</strong> • Escala: {settings.uiFontScale || 100}%
          </span>
        </div>

        {/* List of Installed Custom Fonts (Req 11.1) */}
        {customFonts.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Fuentes Importadas desde tu Dispositivo ({customFonts.length})
            </span>
            <div className="space-y-2">
              {customFonts.map((cf) => {
                const isCurrent = settings.uiFontFamily === cf.name;
                return (
                  <div
                    key={cf.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? `${theme.activeBorder} ${theme.accentBadge}`
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5
                          className="font-bold text-sm text-stone-900 dark:text-stone-100"
                          style={{ fontFamily: `"${cf.name}", sans-serif` }}
                        >
                          {cf.name}
                        </h5>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 uppercase">
                          {cf.format}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> En uso
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs text-stone-600 dark:text-stone-400 truncate mt-1"
                        style={{ fontFamily: `"${cf.name}", sans-serif` }}
                      >
                        ABCDEFGHIJKLMNÑOPQRSTUVWXYZ abcdefghijklmnñopqrstuvwxyz 1234567890
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCurrent ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateSettings({ uiFontFamily: cf.name });
                            toast(`Fuente "${cf.name}" activada`, 'success');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
                        >
                          Activar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateSettings({ uiFontFamily: 'default' });
                            toast('Desactivada fuente personalizada', 'info');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-black/5"
                        >
                          Desactivar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomFont(cf)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Eliminar archivo de fuente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. EXPORT & BACKUPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Manuscript Export */}
        <div className={`p-6 rounded-3xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Exportar Manuscrito Completo
              </h3>
              <p className="text-xs text-stone-500">
                Une todos los capítulos ({chapters.length}) en un único archivo de texto
              </p>
            </div>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-serif">
            Genera un archivo .txt formateado con títulos, números de capítulo y sinopsis, preparado para Word o LibreOffice.
          </p>

          <button
            onClick={handleExportFullManuscript}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm ${theme.primaryBtn}`}
          >
            <Download className="w-4 h-4" />
            <span>Descargar Manuscrito en TXT</span>
          </button>
        </div>

        {/* JSON Backup & Security */}
        <div className={`p-6 rounded-3xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Copia de Seguridad Integral (JSON)
              </h3>
              <p className="text-xs text-stone-500">
                Exporta toda la base de datos de este libro
              </p>
            </div>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-serif">
            Incluye capítulos, personajes, relaciones, lore, ideas y toda la línea de tiempo con sus coordenadas y conexiones.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={handleExportJson}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-black/5 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Exportar Libro (JSON)</span>
            </button>
            <label className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 flex items-center justify-center gap-2 shadow-xs cursor-pointer">
              <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Restaurar Copia (.json)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleRestoreBackupFile}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4. STORAGE & PERSISTENCE DIAGNOSTICS */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
              Almacenamiento Local Persistente (IndexedDB)
            </h3>
            <p className="text-xs text-stone-500">
              Tus datos, fuentes y audios están guardados en tu navegador de forma offline
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 font-semibold block mb-1">Espacio Ocupado:</span>
            <strong className="text-base font-mono text-stone-800 dark:text-stone-200">
              {formatBytes(storageEstimate.usage)}
            </strong>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 font-semibold block mb-1">Cuota Estimada del Navegador:</span>
            <strong className="text-base font-mono text-stone-800 dark:text-stone-200">
              {formatBytes(storageEstimate.quota)}
            </strong>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 font-semibold block mb-1">Capítulos en este Libro:</span>
            <strong className="text-base font-mono text-stone-800 dark:text-stone-200">
              {chapters.length} partes
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Aviso de seguridad y almacenamiento:</strong> La aplicación utiliza el motor
            IndexedDB de tu navegador para almacenar tus manuscritos, relaciones y archivos de audio sin
            necesidad de enviar tus borradores a servidores externos no autorizados. Se recomienda descargar periódicamente una copia de seguridad en JSON con el botón superior.
          </div>
        </div>
      </div>

      {/* MODAL A: 3-COLOR PALETTE CREATOR / EDITOR (Req 8.1) */}
      {isPaletteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                    {editingCustomPalette ? 'Editar Mi Paleta' : 'Crear Mi Paleta (Exactamente 3 Colores)'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Define Primario, Secundario y Acento. El sistema generará una combinación coherente y accesible.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsPaletteModalOpen(false)} className="p-1.5 text-stone-400 hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPalette} className="py-4 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre de la paleta *
                </label>
                <input
                  type="text"
                  required
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  placeholder="Ej: Niebla & Ámbar"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* 3 Color Pickers Tab Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveColorField('primary')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeColorField === 'primary'
                      ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-500/5'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                    1. Color Primario
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border shadow-xs" style={{ backgroundColor: primaryColor }} />
                    <span className="text-xs font-mono font-bold">{primaryColor.toUpperCase()}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveColorField('secondary')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeColorField === 'secondary'
                      ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-500/5'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                    2. Color Secundario
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border shadow-xs" style={{ backgroundColor: secondaryColor }} />
                    <span className="text-xs font-mono font-bold">{secondaryColor.toUpperCase()}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveColorField('accent')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeColorField === 'accent'
                      ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-500/5'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                    3. Color de Acento
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border shadow-xs" style={{ backgroundColor: accentColor }} />
                    <span className="text-xs font-mono font-bold">{accentColor.toUpperCase()}</span>
                  </div>
                </button>
              </div>

              {/* Color Grid Picker for active field */}
              <div>
                <ColorGridPicker
                  value={
                    activeColorField === 'primary'
                      ? primaryColor
                      : activeColorField === 'secondary'
                      ? secondaryColor
                      : accentColor
                  }
                  onChange={(hex) => {
                    if (activeColorField === 'primary') setPrimaryColor(hex);
                    else if (activeColorField === 'secondary') setSecondaryColor(hex);
                    else setAccentColor(hex);
                  }}
                  title={`Selecciona ${
                    activeColorField === 'primary'
                      ? 'Color Primario (Botones y destacados principales)'
                      : activeColorField === 'secondary'
                      ? 'Color Secundario (Bordes y elementos de soporte)'
                      : 'Color de Acento (Detalles, insignias y brillo)'
                  }`}
                />
              </div>

              {/* Real-time Live Preview & WCAG Contrast Check (Req 8.1) */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                    Vista Previa en Tiempo Real de la Combinación
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span>Contraste:</span>
                    <strong className={hasContrastWarning ? 'text-rose-500' : 'text-emerald-600'}>
                      {primaryOnWhiteContrast}:1 {hasContrastWarning ? '(Bajo)' : '(Óptimo)'}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl border shadow-sm bg-white dark:bg-stone-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                      Capítulo 1: El eco en las torres
                    </h5>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Demostración de contraste de texto, botón y distintivo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: secondaryColor, color: '#1C1917' }}
                    >
                      Insignia
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Botón de Acción
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsPaletteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
                >
                  Guardar y Aplicar Paleta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL B: CUSTOM FONT IMPORTER (.TTF / .OTF) (Req 11.1) */}
      {isFontModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                    Importar Fuente (.ttf / .otf)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Carga un archivo tipográfico local para usar en la interfaz de la aplicación
                  </p>
                </div>
              </div>
              <button onClick={() => setIsFontModalOpen(false)} className="p-1.5 text-stone-400 hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomFont} className="py-4 space-y-4">
              {/* File upload input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Archivo de fuente (.ttf o .otf) *
                </label>
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 cursor-pointer bg-stone-50 dark:bg-stone-900/40 transition-all">
                  <Upload className="w-6 h-6 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    {fontFile ? fontFile.name : 'Haz clic para seleccionar archivo de fuente'}
                  </span>
                  <span className="text-[10px] text-stone-400 mt-0.5">
                    Formatos TrueType (.ttf) u OpenType (.otf)
                  </span>
                  <input
                    type="file"
                    accept=".ttf,.otf,font/ttf,font/otf"
                    className="hidden"
                    onChange={handleFontFileSelected}
                  />
                </label>
                {fontError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fontError}</span>
                  </p>
                )}
              </div>

              {/* Visible font name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre visible de la fuente *
                </label>
                <input
                  type="text"
                  required
                  value={fontNameInput}
                  onChange={(e) => setFontNameInput(e.target.value)}
                  placeholder="Ej: Minion Pro / Alegreya"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Specimen Preview */}
              {fontPreviewUrl && (
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/60 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Espécimen de prueba:
                  </span>
                  <h4
                    className="text-base font-bold text-stone-900 dark:text-stone-100"
                    style={{ fontFamily: `"${fontNameInput}", sans-serif` }}
                  >
                    Pluma & Tiempo: Creación Literaria
                  </h4>
                  <p
                    className="text-xs text-stone-600 dark:text-stone-300"
                    style={{ fontFamily: `"${fontNameInput}", sans-serif` }}
                  >
                    Los engranajes del astrolabio giraban con precisión milimétrica sobre las nieblas de Valoria.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsFontModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!fontFile || !fontNameInput.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn} disabled:opacity-40`}
                >
                  Instalar Fuente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
