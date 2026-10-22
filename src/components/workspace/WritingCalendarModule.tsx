import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Flame,
  Award,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Feather,
  Quote,
  Target,
  Trophy,
  X,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import {
  DailyWritingLog,
  WritingStreakStatus,
  MotivationalQuote,
  DailyNotificationReminder,
  Book,
} from '../../types';
import { getTheme } from '../../utils/theme';

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 'quote_1',
    author: 'Gabriel García Márquez',
    quote: 'El secreto de la disciplina es no esperar la inspiración; la inspiración llega mientras estás trabajando.',
    tip: 'Si hoy escribes 10 palabras más que ayer, habrás vencido a la resistencia creativa.',
    category: 'constancia',
  },
  {
    id: 'quote_2',
    author: 'Stephen King',
    quote: 'El momento más aterrador es siempre justo antes de empezar. Después de eso, las cosas solo pueden mejorar.',
    tip: 'No intentes terminar una novela hoy: solo supera tu meta diaria.',
    category: 'superacion',
  },
  {
    id: 'quote_3',
    author: 'Virginia Woolf',
    quote: 'Escribe lo que sientes, no lo que esperan que sientas. La autenticidad se forja en la constancia diaria.',
    tip: 'Crea una rutina sagrada de 20 minutos donde nada interrumpa tu pluma.',
    category: 'habito',
  },
  {
    id: 'quote_4',
    author: 'Isabel Allende',
    quote: 'Escribir es como un músculo: cuanto más escribes, más fácil resulta encontrar las palabras precisas.',
    tip: 'Añadir 10 palabras más cada día fortalece tu resistencia narrativa.',
    category: 'constancia',
  },
  {
    id: 'quote_5',
    author: 'Haruki Murakami',
    quote: 'La repetición en sí misma se convierte en lo importante; es una forma de hipnotismo.',
    tip: 'Mantener una racha de 5 días transforma el esfuerzo en un hábito placentero.',
    category: 'habito',
  },
  {
    id: 'quote_6',
    author: 'Jorge Luis Borges',
    quote: 'De los diversos instrumentos del hombre, el más asombroso es el libro; todos los demás son extensiones de su cuerpo.',
    tip: 'Cada párrafo que añades hoy es un ladrillo más en la catedral de tu libro.',
    category: 'constancia',
  },
  {
    id: 'quote_7',
    author: 'Julio Cortázar',
    quote: 'Las palabras nunca alcanzan cuando lo que hay que decir desborda el alma. Por eso hay que seguir escribiendo.',
    tip: 'No borres en caliente: deja que el borrador fluya y corrige al día siguiente.',
    category: 'bloqueo',
  },
  {
    id: 'quote_8',
    author: 'Octavio Paz',
    quote: 'La palabra es el hombre mismo. El silencio que precede a la palabra es la cantera del escritor.',
    tip: 'Haz que el silencio juegue a tu favor al comenzar tu sesión diaria.',
    category: 'bloqueo',
  },
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface WritingCalendarModuleProps {
  onClose?: () => void;
}

export const WritingCalendarModule: React.FC<WritingCalendarModuleProps> = ({ onClose }) => {
  const {
    activeBook,
    books,
    currentPalette,
    darkMode,
    customPalettes,
    toast,
    setIsSaving,
    setActiveSection,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Logs & Streak Data
  const [writingLogs, setWritingLogs] = useState<DailyWritingLog[]>([]);
  const [streakStatus, setStreakStatus] = useState<WritingStreakStatus | null>(null);
  const [notifications, setNotifications] = useState<DailyNotificationReminder[]>([]);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  // Manual Log Entry Modal
  const [isManualLogModalOpen, setIsManualLogModalOpen] = useState(false);
  const [manualBookId, setManualBookId] = useState<string>('');
  const [manualWordsInput, setManualWordsInput] = useState<number>(50);
  const [manualNotesInput, setManualNotesInput] = useState<string>('');

  // Load Writing Data
  const loadCalendarData = useCallback(async () => {
    if (books.length > 0) {
      await dbService.seedWritingHistoryIfEmpty(
        activeBook?.id || books[0].id,
        activeBook?.title || books[0].title
      );
    }
    const logs = await dbService.getDailyWritingLogs();
    setWritingLogs(logs);

    const status = await dbService.calculateStreakStatus();
    setStreakStatus(status);

    const notifs = await dbService.getWritingNotifications();
    setNotifications(notifs);

    if (activeBook) {
      setManualBookId(activeBook.id);
    } else if (books.length > 0) {
      setManualBookId(books[0].id);
    }
  }, [activeBook, books]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Trigger celebration confetti when 5-day streak is unlocked!
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    } catch (e) {
      console.warn('Confetti effect failed', e);
    }
  };

  // Switch quote
  const handleNextQuote = () => {
    setActiveQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  // Map of logs by date string YYYY-MM-DD
  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyWritingLog>();
    writingLogs.forEach((l) => map.set(l.date, l));
    return map;
  }, [writingLogs]);

  // Selected Day Details
  const selectedDayLog = useMemo(() => {
    return logsByDate.get(selectedDateStr) || null;
  }, [logsByDate, selectedDateStr]);

  // Previous Day relative to selected date
  const selectedDayYesterdayWords = useMemo(() => {
    const d = new Date(selectedDateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    const prevStr = d.toISOString().slice(0, 10);
    return logsByDate.get(prevStr)?.totalWordsWritten || 0;
  }, [logsByDate, selectedDateStr]);

  const selectedDayTargetWords = selectedDayYesterdayWords > 0 ? selectedDayYesterdayWords + 10 : 10;
  const selectedDayWords = selectedDayLog?.totalWordsWritten || 0;
  const selectedDayMeetsGoal = selectedDayWords >= selectedDayTargetWords && selectedDayWords > 0;

  // Calendar Grid Calculation for Current Month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // European convention: 0 = Mon, 6 = Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Days from previous month to fill first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      log: DailyWritingLog | null;
      meetsStreak: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Padding previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const dStr = prevDate.toISOString().slice(0, 10);
      const log = logsByDate.get(dStr) || null;
      days.push({
        dateStr: dStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        log,
        meetsStreak: Boolean(log && log.totalWordsWritten >= 10),
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const dStr = thisDate.toISOString().slice(0, 10);
      const log = logsByDate.get(dStr) || null;

      // Check if it met streak rule relative to its previous day
      const prevD = new Date(thisDate);
      prevD.setUTCDate(prevD.getUTCDate() - 1);
      const prevDStr = prevD.toISOString().slice(0, 10);
      const prevWords = logsByDate.get(prevDStr)?.totalWordsWritten || 0;
      const req = prevWords > 0 ? prevWords + 10 : 10;
      const meets = Boolean(log && log.totalWordsWritten >= req && log.totalWordsWritten > 0);

      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        log,
        meetsStreak: meets,
      });
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let j = 1; j <= remaining; j++) {
      const nextDate = new Date(year, month + 1, j);
      const dStr = nextDate.toISOString().slice(0, 10);
      const log = logsByDate.get(dStr) || null;
      days.push({
        dateStr: dStr,
        dayNumber: j,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        log,
        meetsStreak: Boolean(log && log.totalWordsWritten >= 10),
      });
    }

    return days;
  }, [currentDate, logsByDate]);

  // Save manual writing log entry
  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBookId || manualWordsInput <= 0) return;

    setIsSaving(true);
    try {
      const targetBook = books.find((b) => b.id === manualBookId);
      const bookTitle = targetBook?.title || 'Libro';

      await dbService.recordWritingSession(
        manualBookId,
        bookTitle,
        Number(manualWordsInput),
        undefined,
        manualNotesInput ? `Nota: ${manualNotesInput}` : undefined,
        selectedDateStr
      );

      await loadCalendarData();
      setIsManualLogModalOpen(false);
      setManualNotesInput('');
      toast(`Registradas ${manualWordsInput} palabras en "${bookTitle}"`, 'success');

      // Check if unlocked streak
      const updatedStatus = await dbService.calculateStreakStatus();
      if (updatedStatus.unlockedStreak) {
        triggerConfetti();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Simulate 5 days of streak if user wants a 1-click demonstration
  const handleSimulateStreak = async () => {
    if (!activeBook && books.length === 0) return;
    const bId = activeBook?.id || books[0].id;
    const bTitle = activeBook?.title || books[0].title;

    setIsSaving(true);
    try {
      const today = new Date();
      // 5 consecutive days: 40 -> 55 -> 70 -> 90 -> 110 (+15 to +20 more than previous day)
      const progression = [40, 55, 75, 95, 120];
      for (let i = 0; i < progression.length; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - (4 - i));
        const dStr = d.toISOString().slice(0, 10);
        await dbService.saveDailyWritingLog({
          id: `log_${dStr}`,
          date: dStr,
          totalWordsWritten: progression[i],
          bookBreakdown: {
            [bId]: {
              bookId: bId,
              bookTitle: bTitle,
              wordsWritten: progression[i],
              chaptersWorked: [{ chapterId: 'demo_ch', chapterTitle: 'Capítulo activo', words: progression[i] }],
            },
          },
          meetsStreakGoal: true,
          notes: `Día ${i + 1} de racha (+${progression[i] - (i > 0 ? progression[i - 1] : 0)} palabras)`,
          createdAt: d.toISOString(),
          updatedAt: d.toISOString(),
        });
      }

      await loadCalendarData();
      triggerConfetti();
      toast('¡Racha de 5 días desbloqueada con éxito! Requisito de +10 palabras cumplido.', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQuote = MOTIVATIONAL_QUOTES[activeQuoteIndex] || MOTIVATIONAL_QUOTES[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {onClose && (
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentText}`}>
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                Calendario de Escritura &amp; Racha
              </h2>
              <p className="text-xs text-stone-500">
                Registro global de producción de palabras por autor y por libro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            title="Cerrar calendario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 1. TOP HERO: MOTIVATIONAL QUOTE & STREAK OVERVIEW */}
      <div
        className={`p-6 md:p-8 rounded-3xl border shadow-xs relative overflow-hidden ${theme.bgCard} ${theme.borderCard}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Streak Status Hero Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  streakStatus?.unlockedStreak
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                    : `${theme.accentBadge} ${theme.accentBadgeText}`
                }`}
              >
                {streakStatus?.unlockedStreak ? '🔥 Racha de Constancia Activa' : 'Meta de Constancia: 5 Días'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-serif font-extrabold text-4xl md:text-5xl tracking-tight text-stone-900 dark:text-stone-100">
                {streakStatus?.consecutiveDaysAchieved || 0}
              </span>
              <span className="text-sm font-semibold text-stone-500">
                {streakStatus?.consecutiveDaysAchieved === 1 ? 'día consecutivo' : 'días consecutivos'}
              </span>
            </div>

            {/* Progress to 5 Days Milestone */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-stone-500">
                  {streakStatus?.unlockedStreak
                    ? '¡Hito de 5 días superado con éxito!'
                    : `Hito de 5 días: ${streakStatus?.consecutiveDaysAchieved || 0}/5 días`}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">
                  {Math.min(100, Math.round(((streakStatus?.consecutiveDaysAchieved || 0) / 5) * 100))}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (((streakStatus?.consecutiveDaysAchieved || 0) / 5) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Daily Increment Rule reminder */}
            <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
              <span className="font-bold text-amber-600 dark:text-amber-400">Regla de oro:</span> Cada día debes escribir como mínimo{' '}
              <strong>10 palabras más</strong> que el día anterior para no romper la racha.
            </p>
          </div>

          {/* Today's Target Pill Card */}
          <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                Meta de Hoy
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 shadow-2xs">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Ayer</span>
                <strong className="text-base font-mono text-stone-700 dark:text-stone-200">
                  {streakStatus?.yesterdayWords || 0}
                </strong>
                <span className="text-[10px] text-stone-400 block">palabras</span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-2xs">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-semibold block">Meta hoy (+10)</span>
                <strong className="text-base font-mono text-amber-900 dark:text-amber-200">
                  {streakStatus?.requiredWordsToday || 10}
                </strong>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block">palabras</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-500">
                Llevas hoy: <strong className="text-stone-800 dark:text-stone-100 font-mono">{streakStatus?.todayWords || 0}</strong> palabras
              </span>
              {streakStatus?.todayGoalMet ? (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Meta lograda
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-semibold">
                  Faltan {Math.max(0, (streakStatus?.requiredWordsToday || 10) - (streakStatus?.todayWords || 0))} palabras
                </span>
              )}
            </div>

            {/* Quick Actions in Hero */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveSection('capitulos')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 ${theme.primaryBtn}`}
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Escribir ahora</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManualLogModalOpen(true)}
                className="py-1.5 px-3 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-black/5 dark:hover:bg-white/5 text-stone-700 dark:text-stone-200"
                title="Registrar palabras escritas fuera de la app"
              >
                + Registrar
              </button>
            </div>
          </div>

          {/* Motivational Quote & Tips */}
          <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Quote className="w-4 h-4" />
                <span>Inspiración de Maestros</span>
              </div>
              <button
                type="button"
                onClick={handleNextQuote}
                className="text-[10px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1 underline"
                title="Mostrar otra frase motivacional"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Cambiar</span>
              </button>
            </div>

            <p className="text-xs font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">
              «{currentQuote.quote}»
            </p>
            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block font-serif">
              — {currentQuote.author}
            </span>

            <div className="pt-2 border-t border-amber-500/15 text-[11px] text-amber-800 dark:text-amber-300 font-sans leading-snug">
              💡 <strong>Consejo de constancia:</strong> {currentQuote.tip}
            </div>
          </div>
        </div>

        {/* 1-Click Simulation Button for Testing 5-Day Streak */}
        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-stone-400 text-[11px]">
            ¿Quieres probar la racha de 5 días de inmediato?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateStreak}
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 text-xs transition-colors"
              title="Cargar simulación de 5 días con incremento de +10 palabras por día"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Simular 5 Días de Racha (+10 palabras/día)</span>
            </button>
            <button
              type="button"
              onClick={triggerConfetti}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-amber-600"
              title="Lanzar confeti de celebración"
            >
              🎉
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CALENDAR GRID & DAILY BREAKDOWN INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Calendar Component */}
        <div className={`lg:col-span-2 p-5 md:p-6 rounded-3xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
          {/* Calendar Header with Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                  {MONTH_NAMES[currentDate.getMonth()]} de {currentDate.getFullYear()}
                </h3>
                <span className="text-xs text-stone-500">
                  Haz clic en cualquier día para ver qué escribiste y en qué libros
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={jumpToToday}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-black/5"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-black/5"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono font-semibold text-xs text-stone-400 pb-1">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* 7-column Calendar Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell) => {
              const isSelected = selectedDateStr === cell.dateStr;
              const hasWriting = cell.log && cell.log.totalWordsWritten > 0;
              const wordsCount = cell.log?.totalWordsWritten || 0;
              const booksCount = cell.log ? Object.keys(cell.log.bookBreakdown || {}).length : 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[72px] sm:min-h-[82px] p-1.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-amber-600 ring-2 ring-amber-500/40 bg-amber-500/10 shadow-xs'
                      : cell.isCurrentMonth
                      ? 'border-stone-200/90 dark:border-stone-800/90 bg-white/60 dark:bg-stone-900/40 hover:bg-stone-100 dark:hover:bg-stone-850'
                      : 'border-transparent bg-stone-100/30 dark:bg-stone-950/20 text-stone-400 opacity-50'
                  }`}
                >
                  {/* Top row: day number + streak flame if met */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : cell.isCurrentMonth
                          ? 'text-stone-800 dark:text-stone-200'
                          : 'text-stone-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.meetsStreak && (
                      <span title="Día calificado para racha (+10 palabras vs ayer)" className="text-amber-500 animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                      </span>
                    )}
                  </div>

                  {/* Words badge on cell */}
                  {hasWriting ? (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold block truncate text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                        +{wordsCount}p
                      </span>
                      {booksCount > 0 && (
                        <span className="text-[9px] text-stone-400 line-clamp-1 block leading-tight">
                          {booksCount} {booksCount === 1 ? 'libro' : 'libros'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] text-stone-300 dark:text-stone-700 block">
                      —
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between text-[11px] text-stone-400 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" /> Día actual
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" /> Meta diaria cumplida (+10 palabras)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500/20 text-emerald-600 text-[10px] flex items-center justify-center font-bold font-mono">
                  +p
                </span>{' '}
                Palabras registradas
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsManualLogModalOpen(true)}
              className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
            >
              + Añadir palabras a {selectedDateStr}
            </button>
          </div>
        </div>

        {/* Right: Detailed Day Breakdown Inspector */}
        <div className={`p-5 md:p-6 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                  Detalle del día seleccionado
                </span>
                <h4 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                  {new Date(selectedDateStr + 'T12:00:00Z').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h4>
              </div>

              {selectedDayMeetsGoal && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" /> Racha OK
                </span>
              )}
            </div>

            {/* Daily totals & streak qualification status */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Total palabras del día:
                </span>
                <span className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100">
                  {selectedDayWords.toLocaleString()}
                </span>
              </div>

              <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200 dark:border-stone-800 space-y-1">
                <div className="flex justify-between">
                  <span>Palabras del día anterior:</span>
                  <span className="font-mono font-semibold">{selectedDayYesterdayWords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meta de crecimiento (+10):</span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                    {selectedDayTargetWords} palabras
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Calificación de racha:</span>
                  {selectedDayMeetsGoal ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Cumplida (+{selectedDayWords - selectedDayTargetWords})
                    </span>
                  ) : (
                    <span className="text-rose-500">
                      {selectedDayWords === 0 ? 'Sin escritura' : `Faltaron ${selectedDayTargetWords - selectedDayWords} palabras`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Book breakdown */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                ¿En qué libros se escribió este día?
              </span>

              {!selectedDayLog || Object.keys(selectedDayLog.bookBreakdown || {}).length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs italic border border-dashed rounded-xl">
                  No se registraron palabras en ningún libro este día.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {Object.values(selectedDayLog.bookBreakdown).map((bEntry) => (
                    <div
                      key={bEntry.bookId}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <h5 className="font-serif font-bold text-xs truncate text-stone-800 dark:text-stone-200">
                            {bEntry.bookTitle}
                          </h5>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 shrink-0">
                          +{bEntry.wordsWritten} palabras
                        </span>
                      </div>

                      {/* Chapters worked */}
                      {bEntry.chaptersWorked && bEntry.chaptersWorked.length > 0 && (
                        <div className="pl-5 space-y-0.5 pt-1 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-500">
                          {bEntry.chaptersWorked.map((ch, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[170px]">• {ch.chapterTitle}</span>
                              <span className="font-mono">+{ch.words} p</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action button in Day Inspector */}
          <button
            type="button"
            onClick={() => setIsManualLogModalOpen(true)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 ${theme.primaryBtn}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir o corregir palabras de este día</span>
          </button>
        </div>
      </div>

      {/* 3. NOTIFICATIONS & MOTIVATIONAL REMINDERS DRAWER */}
      <div className={`p-6 rounded-3xl border shadow-xs space-y-4 ${theme.bgCard} ${theme.borderCard}`}>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Recordatorios Motivacionales y Notificaciones Diarias
              </h3>
              <p className="text-xs text-stone-500">
                Avisos para incentivar la constancia y proteger tu racha
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const notif: DailyNotificationReminder = {
                id: 'notif_' + Date.now(),
                date: new Date().toISOString().slice(0, 10),
                title: '✍️ Recordatorio de hoy',
                message: currentQuote.tip,
                type: 'daily_inspiration',
                timestamp: new Date().toISOString(),
                read: false,
              };
              await dbService.saveWritingNotification(notif);
              setNotifications((prev) => [notif, ...prev]);
              toast('Recordatorio motivacional enviado', 'info');
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-black/5 flex items-center gap-1.5 text-stone-700 dark:text-stone-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Generar Recordatorio Diario</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {notifications.slice(0, 6).map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/50 space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-stone-400">
                  {new Date(n.timestamp).toLocaleDateString()}
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  {n.type.replace('_', ' ')}
                </span>
              </div>
              <h5 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100">
                {n.title}
              </h5>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                {n.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: MANUAL LOG ENTRY */}
      {isManualLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    Registrar Palabras Escritas
                  </h4>
                  <p className="text-xs text-stone-400">Para el día: {selectedDateStr}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualLogModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Libro o Proyecto *
                </label>
                <select
                  value={manualBookId}
                  onChange={(e) => setManualBookId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Cantidad de palabras escritas *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50000}
                  required
                  value={manualWordsInput}
                  onChange={(e) => setManualWordsInput(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Anotaciones (opcional)
                </label>
                <input
                  type="text"
                  value={manualNotesInput}
                  onChange={(e) => setManualNotesInput(e.target.value)}
                  placeholder="Ej: Borrador a mano en cafetería, escena de persecución"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsManualLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md ${theme.primaryBtn}`}
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
