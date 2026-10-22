import React, { useState } from 'react';
import { Palette, X, Check, Sparkles, Sliders } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { getTheme, getContrastRatio } from '../../utils/theme';
import { CustomPaletteConfig } from '../../types';
import { ColorGridPicker } from './ColorGridPicker';

export const CustomPaletteModal: React.FC = () => {
  const {
    isPaletteCreatorOpen,
    setIsPaletteCreatorOpen,
    customPalettes,
    refreshCustomPalettes,
    setPalette,
    currentPalette,
    darkMode,
    toast,
    setIsSaving,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [paletteName, setPaletteName] = useState(`Paleta Personalizada ${customPalettes.length + 1}`);
  const [primaryColor, setPrimaryColor] = useState('#243B35');
  const [secondaryColor, setSecondaryColor] = useState('#87A878');
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [activeColorField, setActiveColorField] = useState<'primary' | 'secondary' | 'accent'>('primary');

  if (!isPaletteCreatorOpen) return null;

  const handleClose = () => {
    setIsPaletteCreatorOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paletteName.trim()) return;

    setIsSaving(true);
    try {
      const paletteId = 'cpal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const record: CustomPaletteConfig = {
        id: paletteId,
        name: paletteName.trim(),
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        createdAt: new Date().toISOString(),
      };

      await dbService.saveCustomPalette(record);
      await refreshCustomPalettes();
      await setPalette(record.id); // Applies to Library, Login, Workspace!
      setIsPaletteCreatorOpen(false);
      toast(`Paleta "${record.name}" creada y aplicada a toda la aplicación`, 'success');
    } catch (err: any) {
      toast('Error al guardar la paleta: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const primaryOnWhiteContrast = getContrastRatio(primaryColor, '#FFFFFF').toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg max-h-[90vh] rounded-3xl border shadow-2xl p-6 flex flex-col overflow-y-auto ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Crear Paleta Personalizada
              </h3>
              <p className="text-xs text-stone-400">
                Aplica a toda la aplicación (Biblioteca, Iniciar sesión y Manuscritos)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Cerrar ventana"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Nombre de tu paleta *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Ej: Niebla Nórdica, Brasa Antigua, Cuarzo Rosa"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
            />
          </div>

          {/* Color Tabs */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Configurar los 3 tonos armónicos:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveColorField('primary')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeColorField === 'primary'
                    ? 'ring-2 ring-amber-500/50 border-amber-500'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    1. Principal
                  </span>
                  <div
                    className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  {primaryColor}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveColorField('secondary')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeColorField === 'secondary'
                    ? 'ring-2 ring-amber-500/50 border-amber-500'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    2. Secundario
                  </span>
                  <div
                    className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-xs"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </div>
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  {secondaryColor}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveColorField('accent')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeColorField === 'accent'
                    ? 'ring-2 ring-amber-500/50 border-amber-500'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    3. Acento
                  </span>
                  <div
                    className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  {accentColor}
                </span>
              </button>
            </div>
          </div>

          {/* Active Field Picker */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-2 capitalize">
              Seleccionar Tono {activeColorField === 'primary' ? 'Principal (Botones y destacados)' : activeColorField === 'secondary' ? 'Secundario (Bordes y fondos suaves)' : 'Acento (Insignias y brillos)'}
            </span>
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
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Vista previa en vivo:
            </span>
            <div className="flex items-center justify-between p-3 rounded-xl shadow-xs" style={{ backgroundColor: secondaryColor + '20', borderColor: primaryColor + '40' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs" style={{ backgroundColor: primaryColor }}>
                  P
                </div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{paletteName || 'Paleta'}</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold shadow-xs text-white" style={{ backgroundColor: primaryColor }}>
                Botón Principal
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${theme.primaryBtn}`}
            >
              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>Guardar y Aplicar a Toda la App</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
