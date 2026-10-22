import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  User,
  Compass,
  Lightbulb,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import { dbService } from '../services/db';
import { Chapter, Character, WorldDetail, Idea, TimelineEvent } from '../types';

interface SearchResult {
  id: string;
  type: 'chapter' | 'character' | 'detail' | 'idea' | 'timeline';
  title: string;
  subtitle: string;
  snippet: string;
  badge: string;
}

export const GlobalSearchModal: React.FC = () => {
  const {
    openGlobalSearch,
    setOpenGlobalSearch,
    activeBook,
    currentPalette,
    darkMode,
    navigateToEntity,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode);
  const [query, setQuery] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [details, setDetails] = useState<WorldDetail[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!openGlobalSearch || !activeBook) return;

    async function loadData() {
      if (!activeBook) return;
      const chs = await dbService.getChaptersByBook(activeBook.id);
      const chars = await dbService.getCharactersByBook(activeBook.id);
      const dets = await dbService.getDetailsByBook(activeBook.id);
      const ids = await dbService.getIdeasByBook(activeBook.id);
      const evs = await dbService.getTimelineEventsByBook(activeBook.id);

      setChapters(chs);
      setCharacters(chars);
      setDetails(dets);
      setIdeas(ids);
      setEvents(evs);
    }
    loadData();
  }, [openGlobalSearch, activeBook]);

  // Handle ESC or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenGlobalSearch(!openGlobalSearch);
      }
      if (e.key === 'Escape' && openGlobalSearch) {
        setOpenGlobalSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openGlobalSearch, setOpenGlobalSearch]);

  const results: SearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: SearchResult[] = [];

    // Chapters
    chapters.forEach((c) => {
      if (
        c.title.toLowerCase().includes(q) ||
        c.synopsis.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.privateNotes.toLowerCase().includes(q)
      ) {
        const textIdx = c.content.toLowerCase().indexOf(q);
        const snippet =
          textIdx !== -1
            ? '...' + c.content.slice(Math.max(0, textIdx - 40), textIdx + 60) + '...'
            : c.synopsis || 'Capítulo ' + c.number;
        list.push({
          id: c.id,
          type: 'chapter',
          title: `Capítulo ${c.number}: ${c.title}`,
          subtitle: `${c.wordCount} palabras • Estado: ${c.status}`,
          snippet,
          badge: 'Capítulo',
        });
      }
    });

    // Characters
    characters.forEach((ch) => {
      if (
        ch.name.toLowerCase().includes(q) ||
        ch.aliases.toLowerCase().includes(q) ||
        ch.appearance.toLowerCase().includes(q) ||
        ch.personality.toLowerCase().includes(q) ||
        ch.backstory.toLowerCase().includes(q) ||
        ch.secrets.toLowerCase().includes(q)
      ) {
        list.push({
          id: ch.id,
          type: 'character',
          title: ch.name,
          subtitle: `${ch.role.toUpperCase()} • ${ch.age}`,
          snippet: ch.appearance || ch.personality || ch.backstory,
          badge: 'Personaje',
        });
      }
    });

    // Details / Lore
    details.forEach((d) => {
      if (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.immutableInfo.toLowerCase().includes(q) ||
        d.provisionalInfo.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        list.push({
          id: d.id,
          type: 'detail',
          title: d.name,
          subtitle: `Categoría: ${d.category.replace('_', ' ')}`,
          snippet: d.description || d.immutableInfo,
          badge: 'Detalle',
        });
      }
    });

    // Ideas
    ideas.forEach((i) => {
      if (
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        list.push({
          id: i.id,
          type: 'idea',
          title: i.title,
          subtitle: `Prioridad: ${i.priority} • Estado: ${i.status}`,
          snippet: i.content,
          badge: 'Idea',
        });
      }
    });

    // Timeline Events
    events.forEach((ev) => {
      if (
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.dateDisplay.toLowerCase().includes(q) ||
        (ev.notes || '').toLowerCase().includes(q)
      ) {
        list.push({
          id: ev.id,
          type: 'timeline',
          title: ev.title,
          subtitle: `${ev.dateDisplay} • ${ev.category.replace('_', ' ')}`,
          snippet: ev.description || ev.notes || '',
          badge: 'Acontecimiento',
        });
      }
    });

    return list.slice(0, 15);
  }, [query, chapters, characters, details, ideas, events]);

  if (!openGlobalSearch) return null;

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'chapter':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'character':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'detail':
        return <Compass className="w-4 h-4 text-blue-600" />;
      case 'idea':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'timeline':
        return <Clock className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Search Input Box */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeBook
                ? `Buscar en "${activeBook.title}" (personajes, capítulos, lore, línea de tiempo)...`
                : 'Abre un libro para buscar en su contenido...'
            }
            className={`w-full bg-transparent text-base focus:outline-none ${theme.textPrimary} placeholder:text-stone-400`}
            autoFocus
          />
          <button
            onClick={() => setOpenGlobalSearch(false)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-stone-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-stone-100 dark:divide-stone-800">
          {!activeBook ? (
            <div className="p-8 text-center text-stone-500 text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-400 opacity-60" />
              Selecciona o abre un libro de la biblioteca para realizar búsquedas profundas.
            </div>
          ) : query.trim() === '' ? (
            <div className="p-8 text-center text-stone-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 text-stone-400 opacity-60" />
              Escribe palabras clave para localizar escenas, nombres, secretos o acontecimientos.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm">
              No se encontraron coincidencias para "{query}".
            </div>
          ) : (
            results.map((res) => (
              <div
                key={res.type + '_' + res.id}
                onClick={() => navigateToEntity(res.type, res.id)}
                className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0 mt-0.5">
                    {getTypeIcon(res.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-semibold text-sm truncate ${theme.textPrimary} group-hover:text-amber-600 dark:group-hover:text-amber-400`}
                      >
                        {res.title}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {res.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 truncate mt-0.5">{res.subtitle}</p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1 mt-1 font-serif italic">
                      "{res.snippet}"
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-stone-100/50 dark:bg-stone-900/50 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex justify-between">
          <span>
            Navega directamente a capítulos, personajes, lore e hitos temporales
          </span>
          <span className="font-mono">ESC para cerrar</span>
        </div>
      </div>
    </div>
  );
};
