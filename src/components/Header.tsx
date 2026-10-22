import React, { useState } from 'react';
import {
  Feather,
  Search,
  Palette,
  Sun,
  Moon,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  HardDrive,
  ChevronDown,
  BookOpen,
  User,
  UserPlus,
  LogIn,
  LogOut,
  Sparkles,
  Calendar,
  Flame,
  Cloud,
  RefreshCw,
  Laptop,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PALETTES, getTheme } from '../utils/theme';
import { PaletteTheme } from '../types';

export const Header: React.FC = () => {
  const {
    activeBook,
    setActiveBook,
    currentPalette,
    darkMode,
    toggleDarkMode,
    setPalette,
    setOpenGlobalSearch,
    isSaving,
    settings,
    customPalettes,
    currentUser,
    openAuthModal,
    logoutUser,
    openPaletteCreator,
    openProfileModal,
    setActiveSection,
    cloudSyncStatus,
    lastCloudSync,
    triggerCloudSync,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header
      className={`h-16 px-4 md:px-6 border-b flex items-center justify-between transition-colors duration-200 select-none ${theme.bgSidebar} ${theme.borderSidebar} sticky top-0 z-30`}
    >
      {/* Left: Brand or Back to Library */}
      <div className="flex items-center gap-3">
        {activeBook ? (
          <button
            onClick={() => setActiveBook(null)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme.textPrimary} hover:bg-black/5 dark:hover:bg-white/10`}
            title="Volver a la Biblioteca de Libros"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-700/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-inner">
              <Feather className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className={`font-serif text-lg font-bold tracking-tight ${theme.textPrimary}`}>
                Pluma &amp; Tiempo
              </span>
              <span className={`block text-[11px] font-sans -mt-1 ${theme.textMuted}`}>
                Espacio de Creación Narrativa
              </span>
            </div>
          </div>
        )}

        {/* Current Book title pill if in workspace */}
        {activeBook && (
          <div className="flex items-center gap-2 pl-2 border-l border-stone-300 dark:border-stone-700">
            <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400 hidden md:block" />
            <span className={`font-serif font-semibold text-sm md:text-base max-w-[200px] md:max-w-[340px] truncate ${theme.textPrimary}`}>
              {activeBook.title}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium hidden lg:inline-block ${theme.accentBadge} ${theme.accentBadgeText}`}
            >
              {activeBook.status}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Save & Cloud Multidevice Status indicator */}
      <div className="flex items-center gap-2 text-xs">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Guardando cambios...</span>
          </span>
        ) : currentUser ? (
          cloudSyncStatus === 'syncing' ? (
            <button
              onClick={() => triggerCloudSync()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-medium animate-pulse"
              title="Sincronizando cuenta y libros con la nube..."
            >
              <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
              <span className="hidden sm:inline">Sincronizando con la nube...</span>
              <span className="sm:hidden">Sincronizando...</span>
            </button>
          ) : cloudSyncStatus === 'offline' ? (
            <button
              onClick={() => triggerCloudSync(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/10 text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 text-xs hover:border-amber-500 transition-colors"
              title="Guardado localmente. Haz clic para reintentar sincronizar en la nube"
            >
              <Cloud className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Guardado local (clic para nube)</span>
            </button>
          ) : (
            <button
              onClick={() => triggerCloudSync(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title={`Copia de seguridad en la nube activa. Tu cuenta y tus libros están protegidos en todos tus dispositivos.${lastCloudSync ? ' Última sincronización: ' + new Date(lastCloudSync).toLocaleTimeString() : ''}. Haz clic para crear una nueva copia de respaldo.`}
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Copia en la nube al día</span>
              <span className="md:hidden">Nube al día</span>
            </button>
          )
        ) : (
          <span className={`flex items-center gap-1.5 ${theme.textMuted}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden md:inline">Modo local</span>
          </span>
        )}
      </div>

      {/* Right Controls: Search, Palettes, Dark Mode, Info */}
      <div className="flex items-center gap-2">
        {/* Global Search trigger */}
        <button
          onClick={() => setOpenGlobalSearch(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs md:text-sm transition-all ${theme.borderCard} ${theme.bgCard} ${theme.textSecondary} hover:border-amber-600/50 shadow-sm`}
          title="Buscar en todo el universo (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-stone-500">
            ⌘K
          </kbd>
        </button>

        {/* Writing Calendar & Streak quick button */}
        {activeBook && (
          <button
            onClick={() => setActiveSection('calendario')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs md:text-sm font-semibold transition-all ${theme.borderCard} ${theme.bgCard} text-amber-700 dark:text-amber-400 hover:border-amber-500/60 shadow-sm`}
            title="Abrir Calendario de Escritura y Racha de Constancia"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Calendario &amp; Racha</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-mono font-bold flex items-center gap-0.5">
              <Flame className="w-3 h-3 fill-current text-amber-500" />
            </span>
          </button>
        )}

        {/* 5-Palette selector dropdown */}
        <div className="relative">
          {(() => {
            const activeCustom = customPalettes?.find((cp) => cp.id === currentPalette);
            const activePreset = (PALETTES as Record<string, any>)[currentPalette] || PALETTES.bosque;
            const activePaletteConfig = activeCustom
              ? { name: activeCustom.name, preview: [activeCustom.primary, activeCustom.secondary, activeCustom.accent] }
              : activePreset;

            return (
              <button
                onClick={() => setShowPaletteMenu(!showPaletteMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} shadow-sm hover:ring-2 hover:ring-amber-500/20`}
                title="Cambiar paleta de colores"
              >
                <div className="flex -space-x-1">
                  {activePaletteConfig.preview.map((hex: string, i: number) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-white dark:border-stone-900 shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <span className="hidden sm:inline font-sans capitalize">{activePaletteConfig.name}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>
            );
          })()}

          {showPaletteMenu && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-2xl p-2 z-50 ${theme.bgCard} ${theme.borderCard} animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto`}
            >
              <div className="px-3 py-2 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Paletas de Colores
                  </span>
                  <Palette className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Personalización visual en toda la interfaz
                </p>
              </div>

              {/* Predefined Palettes */}
              <div className="py-1 space-y-1">
                {(Object.keys(PALETTES) as PaletteTheme[]).map((pKey) => {
                  const p = PALETTES[pKey];
                  const isSelected = currentPalette === pKey;
                  return (
                    <div
                      key={pKey}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      onClick={async () => {
                        await setPalette(pKey, Boolean(activeBook));
                        setShowPaletteMenu(false);
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                            {p.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                              ✓ Activa
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                          {p.description}
                        </span>
                      </div>
                      <div className="flex -space-x-1 pl-2">
                        {p.preview.map((hex, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Palettes (if any) */}
              {customPalettes.length > 0 && (
                <div className="pt-2 mt-1 border-t border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block mb-1">
                    Tus Paletas Personalizadas
                  </span>
                  <div className="space-y-1">
                    {customPalettes.map((cp) => {
                      const isSelected = currentPalette === cp.id;
                      return (
                        <div
                          key={cp.id}
                          className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 border border-amber-500/30'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          onClick={async () => {
                            await setPalette(cp.id, Boolean(activeBook));
                            setShowPaletteMenu(false);
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                                {cp.name}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                  ✓ Activa
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                              Personalizada (3 tonos)
                            </span>
                          </div>
                          <div className="flex -space-x-1 pl-2">
                            {[cp.primary, cp.secondary, cp.accent].map((hex, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-sm"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    openPaletteCreator();
                    setShowPaletteMenu(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Crear Paleta Personalizada</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg border transition-all ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} hover:ring-2 hover:ring-amber-500/20`}
          title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600" />
          )}
        </button>

        {/* User Account / Profile Badge (Solo usuario y contraseña) */}
        <div className="relative">
          {currentUser ? (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border text-xs font-medium transition-all ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} shadow-sm hover:ring-2 hover:ring-amber-500/20`}
              title={`Perfil de @${currentUser.username}`}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-6 h-6 rounded-lg object-cover shadow-xs border border-stone-200 dark:border-stone-700"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-lg text-white font-bold text-[11px] flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: currentUser.avatarColor || '#2D5A43' }}
                >
                  {currentUser.displayName?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-semibold hidden sm:inline max-w-[100px] truncate">
                @{currentUser.username}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('register')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${theme.primaryBtn}`}
              title="Crear cuenta o Iniciar sesión (Solo usuario y contraseña)"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Crear Cuenta</span>
            </button>
          )}

          {showUserMenu && currentUser && (
            <div
              className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 ${theme.bgCard} ${theme.borderCard} animate-in fade-in slide-in-from-top-2 duration-150`}
            >
              <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm border border-stone-200 dark:border-stone-700 shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0"
                    style={{ backgroundColor: currentUser.avatarColor || '#2D5A43' }}
                  >
                    {currentUser.displayName?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-serif font-bold text-xs truncate block text-stone-900 dark:text-stone-100">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono block truncate">
                    @{currentUser.username}
                  </span>
                  {currentUser.email && (
                    <span className="text-[10px] text-stone-400 block truncate">
                      {currentUser.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1 text-xs space-y-0.5">
                <button
                  onClick={() => {
                    openProfileModal();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 font-medium"
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Editar Perfil, Contraseña y Foto</span>
                </button>
                <button
                  onClick={async () => {
                    await triggerCloudSync(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2 font-medium"
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <span className="block">Hacer copia en la nube ahora</span>
                    <span className="block text-[10px] text-stone-400 font-normal">
                      {lastCloudSync
                        ? 'Sincronizado: ' + new Date(lastCloudSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Sincroniza tus libros y cuenta'}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5 text-stone-400" />
                  <span>Cambiar de cuenta</span>
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Crear otra cuenta</span>
                </button>
                <div className="pt-1 mt-1 border-t border-stone-200 dark:border-stone-800">
                  <button
                    onClick={() => {
                      logoutUser();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
