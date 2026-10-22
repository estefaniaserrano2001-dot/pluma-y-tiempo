import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Users,
  Compass,
  Lightbulb,
  Clock,
  Calendar,
  Settings,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Shield,
  Eye,
} from 'lucide-react';
import { useApp, WorkspaceSection } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import { BookSummary } from './BookSummary';
import { ChaptersModule } from './ChaptersModule';
import { CharactersModule } from './CharactersModule';
import { DetailsModule } from './DetailsModule';
import { IdeasModule } from './IdeasModule';
import { TimelineModule } from './TimelineModule';
import { WritingCalendarModule } from './WritingCalendarModule';
import { SettingsModule } from './SettingsModule';
import { ShareBookModal } from './ShareBookModal';

interface NavItem {
  id: WorkspaceSection;
  label: string;
  icon: React.FC<any>;
}

// 8 Clean workspace sections (Writing Assistant is integrated directly inside each chapter)
const NAV_ITEMS: NavItem[] = [
  { id: 'resumen', label: '1. Resumen', icon: BarChart3 },
  { id: 'capitulos', label: '2. Capítulos', icon: BookOpen },
  { id: 'personajes', label: '3. Personajes', icon: Users },
  { id: 'detalles', label: '4. Detalles', icon: Compass },
  { id: 'ideas', label: '5. Ideas al Aire', icon: Lightbulb },
  { id: 'timeline', label: '6. Línea de Tiempo', icon: Clock },
  { id: 'calendario', label: '7. Calendario y Racha', icon: Calendar },
  { id: 'configuracion', label: '8. Archivos y Configuración', icon: Settings },
];

export const BookWorkspace: React.FC = () => {
  const {
    activeBook,
    setActiveBook,
    activeSection,
    setActiveSection,
    currentPalette,
    darkMode,
    customPalettes,
    currentUser,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!activeBook) return null;

  return (
    <div className={`h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden relative ${theme.bgWorkspace}`}>
      {/* Floating Expand Sidebar Button when sidebar is collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`hidden md:flex fixed left-3 top-20 z-40 p-2.5 rounded-2xl border shadow-xl items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${theme.bgCard} ${theme.borderCard} ${theme.textPrimary}`}
          title="Mostrar menú de herramientas"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span>Herramientas</span>
        </button>
      )}

      {/* Workspace Sidebar Navigation - Fixed & Stationary */}
      {isSidebarOpen && (
        <aside
          className={`w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r p-3 md:p-4 flex md:flex-col justify-between select-none z-20 sticky top-0 md:h-full md:self-start overflow-x-auto md:overflow-x-hidden md:overflow-y-auto ${theme.bgSidebar} ${theme.borderSidebar}`}
        >
          <div className="flex md:flex-col gap-1 w-full">
            {/* Top Back & Collapse Toolbar */}
            <div className="hidden md:flex items-center justify-between mb-2">
              <button
                onClick={() => setActiveBook(null)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-black/5 dark:hover:bg-white/5"
                title="Volver a la biblioteca"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Biblioteca</span>
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5"
                title="Plegar menú para máxima concentración"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Section Navigation Items */}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all text-left whitespace-nowrap md:whitespace-normal ${
                    isActive
                      ? `${theme.activeTab} font-semibold shadow-xs`
                      : `${theme.textPrimary} hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100`
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 stroke-[2]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Current Book Badge & Collaboration in Sidebar */}
          <div className="hidden md:block pt-3 border-t border-stone-200 dark:border-stone-800 text-xs space-y-2">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider block">
                Obra Activa:
              </span>
              <span className={`font-serif font-bold truncate block ${theme.textPrimary}`}>
                {activeBook.title}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-stone-500 font-mono">
                  {activeBook.genre}
                </span>
                {currentUser && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium border ${
                      !activeBook.userId || activeBook.userId === currentUser.id
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {!activeBook.userId || activeBook.userId === currentUser.id
                      ? 'Propietario'
                      : activeBook.collaborators?.find(
                          (c) =>
                            c.userId === currentUser.id ||
                            c.username?.toLowerCase() === currentUser.username.toLowerCase()
                        )?.role || 'Colaborador'}
                  </span>
                )}
              </div>
            </div>

            {/* Share / Manage Collaborators Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className={`w-full py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${theme.borderCard} hover:bg-black/5 dark:hover:bg-white/5 ${theme.textPrimary}`}
            >
              <div className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Colaboradores</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono px-1.5 py-0.2 rounded-md font-bold">
                {activeBook.collaborators?.length || 0}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Workspace Canvas Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full scroll-smooth">
        {/* Read-only visitor notification banner if applicable */}
        {currentUser &&
          activeBook.userId &&
          activeBook.userId !== currentUser.id &&
          activeBook.collaborators?.some(
            (c) =>
              (c.userId === currentUser.id ||
                c.username?.toLowerCase() === currentUser.username.toLowerCase()) &&
              c.role === 'visitante'
          ) && (
            <div className="mb-4 p-3 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong>Modo Visitante:</strong> Tienes acceso de solo lectura para explorar este libro y su universo narrativo.
                </span>
              </div>
              <span className="text-[10px] bg-blue-200/60 dark:bg-blue-900/60 px-2 py-0.5 rounded-full font-semibold">
                Solo Lectura
              </span>
            </div>
          )}

        {activeSection === 'resumen' && <BookSummary />}
        {activeSection === 'capitulos' && <ChaptersModule />}
        {activeSection === 'personajes' && <CharactersModule />}
        {activeSection === 'detalles' && <DetailsModule />}
        {activeSection === 'ideas' && <IdeasModule />}
        {activeSection === 'timeline' && <TimelineModule />}
        {activeSection === 'calendario' && <WritingCalendarModule />}
        {activeSection === 'configuracion' && <SettingsModule />}
        {activeSection === 'asistente' && <ChaptersModule />}
      </main>

      {/* Share Book Modal */}
      <ShareBookModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        book={activeBook}
        onBookUpdated={(ub) => setActiveBook(ub)}
      />
    </div>
  );
};
