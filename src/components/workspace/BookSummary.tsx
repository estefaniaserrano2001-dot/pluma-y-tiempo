import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Compass,
  Lightbulb,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  Feather,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { Chapter, Character, WorldDetail, Idea, TimelineEvent } from '../../types';
import { getTheme } from '../../utils/theme';

export const BookSummary: React.FC = () => {
  const { activeBook, currentPalette, darkMode, setActiveSection, setActiveChapterId } = useApp();
  const theme = getTheme(currentPalette, darkMode);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [details, setDetails] = useState<WorldDetail[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [streakStatus, setStreakStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBook) return;

    async function loadData() {
      if (!activeBook) return;
      setLoading(true);
      const chs = await dbService.getChaptersByBook(activeBook.id);
      const chars = await dbService.getCharactersByBook(activeBook.id);
      const dets = await dbService.getDetailsByBook(activeBook.id);
      const ids = await dbService.getIdeasByBook(activeBook.id);
      const evs = await dbService.getTimelineEventsByBook(activeBook.id);
      const streak = await dbService.calculateStreakStatus();

      setChapters(chs);
      setCharacters(chars);
      setDetails(dets);
      setIdeas(ids);
      setEvents(evs);
      setStreakStatus(streak);
      setLoading(false);
    }
    loadData();
  }, [activeBook]);

  if (!activeBook) return null;

  const totalWords = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  const targetWords = activeBook.targetWordCount || 75000;
  const wordProgressPct = Math.min(100, Math.round((totalWords / targetWords) * 100));

  // Find last modified chapter to continue writing
  const lastChapter = chapters.length > 0
    ? [...chapters].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null;

  // Chapter status breakdown
  const statusCounts = chapters.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div
        className={`p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${theme.bgCard} ${theme.borderCard}`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              style={{ width: '94.5469px', height: '60px' }}
              className={`text-[11px] px-3.5 py-1.5 rounded-2xl font-bold uppercase tracking-wider inline-flex flex-col justify-center leading-tight text-left ${theme.accentBadge} ${theme.accentBadgeText}`}
            >
              PANEL<br />DE<br />CONTROL
            </span>
            <span className="text-xs text-stone-400 capitalize">• Estado: {activeBook.status}</span>
          </div>
          <h2 className={`font-serif text-2xl md:text-3xl font-extrabold ${theme.textPrimary}`}>
            {activeBook.title}
          </h2>
          {activeBook.subtitle && (
            <p className="text-sm font-serif italic text-stone-500">{activeBook.subtitle}</p>
          )}
          <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            {activeBook.description}
          </p>
        </div>

        {lastChapter && (
          <button
            onClick={() => {
              setActiveChapterId(lastChapter.id);
              setActiveSection('capitulos');
            }}
            style={{ width: '304.281px', height: '66.7031px' }}
            className={`flex items-center justify-between gap-3 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all shrink-0 ${theme.primaryBtn}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Feather className="w-5 h-5 stroke-[2.2] shrink-0" />
              <div className="text-left min-w-0">
                <span className="block text-[11px] font-normal opacity-90 leading-tight">Continuar escribiendo</span>
                <span className="block font-bold truncate text-sm mt-0.5">Cap. {lastChapter.number}: {lastChapter.title}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>

      {/* Metric Cards Row (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Words & Progress */}
        <div className={`p-5 rounded-2xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Progreso Palabras</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-2xl font-bold font-mono ${theme.textPrimary}`}>
            {totalWords.toLocaleString()}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex justify-between items-center">
            <span>Meta: {targetWords.toLocaleString()}</span>
            <span className="font-semibold text-amber-600">{wordProgressPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
              style={{ width: `${wordProgressPct}%` }}
            />
          </div>
        </div>

        {/* Chapters Count */}
        <div
          onClick={() => setActiveSection('capitulos')}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer hover:border-amber-600/40 transition-all ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Capítulos</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`text-2xl font-bold font-mono ${theme.textPrimary}`}>
            {chapters.length}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {statusCounts['terminado'] || 0} listos • {statusCounts['borrador'] || 0} borradores
          </p>
        </div>

        {/* Characters Count */}
        <div
          onClick={() => setActiveSection('personajes')}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer hover:border-amber-600/40 transition-all ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Personajes</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className={`text-2xl font-bold font-mono ${theme.textPrimary}`}>
            {characters.length}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {characters.filter((c) => c.role === 'protagonista').length} protagonistas
          </p>
        </div>

        {/* Timeline Events Count */}
        <div
          onClick={() => setActiveSection('timeline')}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer hover:border-amber-600/40 transition-all ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Línea Temporal</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-bold font-mono ${theme.textPrimary}`}>
            {events.length}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Hitos y conexiones
          </p>
        </div>

        {/* Writing Streak & Calendar Card */}
        <div
          onClick={() => setActiveSection('calendario')}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            streakStatus?.unlockedStreak
              ? 'border-amber-500/50 bg-amber-500/10 hover:ring-2 hover:ring-amber-500/30'
              : `${theme.bgCard} ${theme.borderCard} hover:border-amber-600/40`
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Racha Constancia</span>
            <span className="text-amber-500 animate-pulse font-bold text-sm">🔥</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${theme.textPrimary}`}>
            {streakStatus?.consecutiveDaysAchieved || 0} {streakStatus?.consecutiveDaysAchieved === 1 ? 'día' : 'días'}
          </div>
          <p className="text-xs text-stone-500 mt-1 truncate">
            {streakStatus?.unlockedStreak
              ? '🔥 ¡Racha activa!'
              : `Faltan ${Math.max(0, 5 - (streakStatus?.consecutiveDaysAchieved || 0))} días para hito`}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Timeline Events & Pending Ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Timeline Preview */}
        <div className={`p-6 rounded-3xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Acontecimientos Temporales Clave
              </h3>
            </div>
            <button
              onClick={() => setActiveSection('timeline')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver lienzo interactivo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                onClick={() => setActiveSection('timeline')}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all flex items-start gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-1.5 shadow-xs"
                  style={{ backgroundColor: ev.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-bold truncate ${theme.textPrimary}`}>
                      {ev.title}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                      {ev.dateDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ideas al aire pendientes */}
        <div className={`p-6 rounded-3xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Ideas al Aire en Desarrollo
              </h3>
            </div>
            <button
              onClick={() => setActiveSection('ideas')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todas las ideas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {ideas.filter((i) => i.status !== 'descartada').slice(0, 4).map((idea) => (
              <div
                key={idea.id}
                onClick={() => setActiveSection('ideas')}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold truncate ${theme.textPrimary}`}>
                    {idea.title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      idea.priority === 'urgente' || idea.priority === 'alta'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {idea.priority}
                  </span>
                </div>
                <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{idea.content}</p>
              </div>
            ))}
            {ideas.length === 0 && (
              <p className="text-xs text-stone-500 text-center py-6">
                No hay ideas registradas. ¡Anota cualquier chispazo creativo en "Ideas al aire"!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Characters Carousel / Roster Preview */}
      <div className={`p-6 rounded-3xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
              Personajes Principales
            </h3>
          </div>
          <button
            onClick={() => setActiveSection('personajes')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Ver fichas completas</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {characters.slice(0, 3).map((ch) => (
            <div
              key={ch.id}
              onClick={() => setActiveSection('personajes')}
              className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 cursor-pointer transition-all flex items-start gap-3.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                style={{ backgroundColor: ch.avatarColor || '#3D5A7D' }}
              >
                {ch.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs font-bold truncate ${theme.textPrimary}`}>{ch.name}</h4>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider block">
                  {ch.role}
                </span>
                <p className="text-xs text-stone-500 line-clamp-2 mt-1">{ch.appearance || ch.backstory}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
