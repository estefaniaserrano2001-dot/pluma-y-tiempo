import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  X,
  FileText,
  Search,
  Plus,
  Loader2,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { aiService, GrammarSuggestion, CrutchFinding, ContinuityIssue } from '../../services/aiService';
import { Chapter, Character, WorldDetail, TimelineEvent } from '../../types';
import { getTheme } from '../../utils/theme';

export const WritingAssistantModule: React.FC = () => {
  const {
    activeBook,
    currentPalette,
    darkMode,
    activeChapterId,
    setActiveChapterId,
    toast,
    setIsSaving,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [details, setDetails] = useState<WorldDetail[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Active assistant tool tab: 'grammar' | 'crutches' | 'continuity'
  const [activeTab, setActiveTab] = useState<'grammar' | 'crutches' | 'continuity'>('grammar');

  // Loading states
  const [loadingGrammar, setLoadingGrammar] = useState(false);
  const [loadingCrutches, setLoadingCrutches] = useState(false);
  const [loadingContinuity, setLoadingContinuity] = useState(false);

  // Analysis Results
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [grammarScore, setGrammarScore] = useState<number | null>(null);
  const [grammarSummary, setGrammarSummary] = useState<string>('');
  const [ignoredGrammarIds, setIgnoredGrammarIds] = useState<string[]>([]);

  const [crutchFindings, setCrutchFindings] = useState<CrutchFinding[]>([]);
  const [crutchDiagnosis, setCrutchDiagnosis] = useState<string>('');
  const [authorStyleExpressions, setAuthorStyleExpressions] = useState<string[]>([]);
  const [customCrutchInput, setCustomCrutchInput] = useState('');
  const [customCrutchesList, setCustomCrutchesList] = useState<string[]>([
    'de alguna manera',
    'la verdad es que',
    'en cierto modo',
    'se dio cuenta de que',
  ]);

  const [continuityIssues, setContinuityIssues] = useState<ContinuityIssue[]>([]);
  const [continuityVerdict, setContinuityVerdict] = useState<string>('');
  const [resolvedContinuityIds, setResolvedContinuityIds] = useState<string[]>([]);

  // Load book context
  useEffect(() => {
    if (!activeBook) return;

    async function loadData() {
      if (!activeBook) return;
      const chs = await dbService.getChaptersByBook(activeBook.id);
      setChapters(chs);
      const chars = await dbService.getCharactersByBook(activeBook.id);
      setCharacters(chars);
      const dets = await dbService.getDetailsByBook(activeBook.id);
      setDetails(dets);
      const evs = await dbService.getTimelineEventsByBook(activeBook.id);
      setTimelineEvents(evs);

      if (chs.length > 0) {
        if (activeChapterId) {
          const found = chs.find((c) => c.id === activeChapterId);
          if (found) {
            setSelectedChapter(found);
            return;
          }
        }
        setSelectedChapter(chs[0]);
      }
    }
    loadData();
  }, [activeBook, activeChapterId]);

  // Run Grammar Analysis
  const runGrammarAnalysis = async () => {
    if (!selectedChapter) return;
    if (!selectedChapter.content.trim()) {
      toast('El capítulo está vacío. Escribe algo de texto antes de analizar.', 'info');
      return;
    }

    setLoadingGrammar(true);
    try {
      const res = await aiService.analyzeGrammar(selectedChapter.content, selectedChapter.title);
      setGrammarSuggestions(res.suggestions || []);
      setGrammarScore(res.overallScore || 85);
      setGrammarSummary(res.summary || '');
      setIgnoredGrammarIds([]);
      toast('Análisis lingüístico completado', 'success');
    } catch (err: any) {
      toast('Error en el análisis: ' + err.message, 'error');
    } finally {
      setLoadingGrammar(false);
    }
  };

  // Run Crutches Detection
  const runCrutchesDetection = async () => {
    if (!selectedChapter) return;
    if (!selectedChapter.content.trim()) {
      toast('El capítulo está vacío.', 'info');
      return;
    }

    setLoadingCrutches(true);
    try {
      const res = await aiService.detectCrutches(selectedChapter.content, customCrutchesList);
      setCrutchFindings(res.findings || []);
      setCrutchDiagnosis(res.diagnosis || '');
      toast('Detección de muletillas completada', 'success');
    } catch (err: any) {
      toast('Error al detectar muletillas: ' + err.message, 'error');
    } finally {
      setLoadingCrutches(false);
    }
  };

  // Run Narrative Continuity Check
  const runContinuityCheck = async () => {
    if (!selectedChapter) return;
    if (!selectedChapter.content.trim()) {
      toast('El capítulo está vacío.', 'info');
      return;
    }

    setLoadingContinuity(true);
    try {
      const res = await aiService.analyzeContinuity({
        text: selectedChapter.content,
        chapterTitle: selectedChapter.title,
        characters,
        details,
        timelineEvents,
      });
      setContinuityIssues(res.issues || []);
      setContinuityVerdict(res.overallConsistencyVerdict || '');
      setResolvedContinuityIds([]);
      toast('Verificación de continuidad completada', 'success');
    } catch (err: any) {
      toast('Error en el análisis de continuidad: ' + err.message, 'error');
    } finally {
      setLoadingContinuity(false);
    }
  };

  // Apply a grammar suggestion directly to the chapter content!
  const handleApplySuggestion = async (sugg: GrammarSuggestion) => {
    if (!selectedChapter) return;

    const original = sugg.originalSnippet;
    const replacement = sugg.suggestedCorrection;

    if (!selectedChapter.content.includes(original)) {
      toast('No se encontró el fragmento exacto (quizá ya fue editado).', 'info');
      return;
    }

    setIsSaving(true);
    const updatedContent = selectedChapter.content.replace(original, replacement);
    const updatedChapter: Chapter = {
      ...selectedChapter,
      content: updatedContent,
      wordCount: updatedContent.trim().split(/\s+/).length,
      characterCount: updatedContent.length,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveChapter(updatedChapter);
    setSelectedChapter(updatedChapter);
    setChapters((prev) => prev.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)));
    setIgnoredGrammarIds((prev) => [...prev, sugg.id]);
    setIsSaving(false);
    toast('Corrección aplicada al capítulo', 'success');
  };

  // Ignore suggestion
  const handleIgnoreSuggestion = (id: string) => {
    setIgnoredGrammarIds((prev) => [...prev, id]);
  };

  // Toggle Author Style Expression
  const handleToggleAuthorStyle = (expr: string) => {
    setAuthorStyleExpressions((prev) =>
      prev.includes(expr) ? prev.filter((e) => e !== expr) : [...prev, expr]
    );
  };

  // Add custom expression to search for
  const handleAddCustomCrutch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCrutchInput.trim().toLowerCase();
    if (trimmed && !customCrutchesList.includes(trimmed)) {
      setCustomCrutchesList((prev) => [...prev, trimmed]);
      setCustomCrutchInput('');
      toast(`Expresión "${trimmed}" añadida a la lista de control`, 'info');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Chapter Selector */}
      <div
        className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme.bgCard} ${theme.borderCard}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${theme.accentBadge} ${theme.accentBadgeText}`}
            >
              Asistente de Escritura con IA
            </span>
            <span className="text-xs text-stone-400">• Revisión lingüística y lore</span>
          </div>
          <h2 className={`font-serif text-2xl font-bold mt-1 ${theme.textPrimary}`}>
            Corrector Editorial y Continuidad
          </h2>
          <p className="text-xs text-stone-500 max-w-xl">
            Perfecciona la prosa de tus capítulos: detecta errores ortotipográficos, muletillas
            inconscientes y contradicciones con la biblia de tu universo.
          </p>
        </div>

        {/* Chapter Picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 hidden sm:inline">
            Capítulo a evaluar:
          </label>
          <select
            value={selectedChapter?.id || ''}
            onChange={(e) => {
              const ch = chapters.find((c) => c.id === e.target.value);
              if (ch) {
                setSelectedChapter(ch);
                setActiveChapterId(ch.id);
                // Clear previous analysis
                setGrammarSuggestions([]);
                setCrutchFindings([]);
                setContinuityIssues([]);
              }
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-medium font-serif ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Cap. {c.number}: {c.title} ({c.wordCount} palabras)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Switcher: 1. Ortografía y Gramática, 2. Detector de Muletillas, 3. Continuidad */}
      <div className="flex rounded-2xl p-1 bg-stone-100 dark:bg-stone-800 text-xs font-semibold w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'grammar'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ortografía, Gramática y Estilo</span>
        </button>

        <button
          onClick={() => setActiveTab('crutches')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'crutches'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Detector de Muletillas</span>
        </button>

        <button
          onClick={() => setActiveTab('continuity')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'continuity'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Continuidad Narrativa</span>
        </button>
      </div>

      {/* TAB 1: ORTOGRAFÍA, GRAMÁTICA Y PUNTUACIÓN */}
      {activeTab === 'grammar' && (
        <div className="space-y-6">
          {/* Action Trigger Card */}
          <div
            className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Revisión Lingüística Integral
              </h3>
              <p className="text-xs text-stone-500">
                Examina concordancia, tildes, comas, cambios de tiempo verbal y pleonasmos innecesarios.
              </p>
            </div>

            <button
              onClick={runGrammarAnalysis}
              disabled={loadingGrammar || !selectedChapter}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${theme.primaryBtn} disabled:opacity-50`}
            >
              {loadingGrammar ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analizando texto...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analizar {selectedChapter ? `Capítulo ${selectedChapter.number}` : ''}</span>
                </>
              )}
            </button>
          </div>

          {/* Grammar Score and Summary */}
          {grammarScore !== null && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 ${theme.bgCard} ${theme.borderCard}`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold font-mono text-xl text-white ${
                    grammarScore >= 80 ? 'bg-emerald-600' : grammarScore >= 60 ? 'bg-amber-600' : 'bg-rose-600'
                  }`}
                >
                  {grammarScore}
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-semibold block">Salud Lingüística</span>
                  <span className="text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
                    {grammarScore >= 80 ? 'Excelente prosa' : grammarScore >= 60 ? 'Requiere pulido' : 'Revisión urgente'}
                  </span>
                </div>
              </div>

              <div
                className={`md:col-span-3 p-5 rounded-2xl border shadow-xs flex items-center ${theme.bgCard} ${theme.borderCard}`}
              >
                <div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                    Dictamen Editorial:
                  </span>
                  <p className="text-xs font-serif text-stone-700 dark:text-stone-300 leading-relaxed">
                    "{grammarSummary}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {grammarSuggestions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>
                  Sugerencias encontradas ({grammarSuggestions.filter((s) => !ignoredGrammarIds.includes(s.id)).length})
                </span>
                <span>Haz clic en "Aplicar" para actualizar el manuscrito automáticamente</span>
              </div>

              {grammarSuggestions
                .filter((s) => !ignoredGrammarIds.includes(s.id))
                .map((sugg) => (
                  <div
                    key={sugg.id}
                    className={`p-4 rounded-2xl border shadow-xs space-y-3 transition-all ${theme.bgCard} ${theme.borderCard}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            sugg.severity === 'error'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              : sugg.severity === 'advertencia'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {sugg.severity}
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 capitalize">
                          {sugg.type.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApplySuggestion(sugg)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aplicar</span>
                        </button>
                        <button
                          onClick={() => handleIgnoreSuggestion(sugg.id)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-500 hover:bg-black/5"
                        >
                          Ignorar
                        </button>
                      </div>
                    </div>

                    {/* Before vs After comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">
                          Fragmento original:
                        </span>
                        <p className="font-serif italic text-stone-800 dark:text-stone-200">
                          "{sugg.originalSnippet}"
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          Corrección sugerida:
                        </span>
                        <p className="font-serif font-medium text-emerald-900 dark:text-emerald-200">
                          "{sugg.suggestedCorrection}"
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 font-sans leading-normal">
                      <strong>Explicación:</strong> {sugg.explanation}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            grammarScore !== null && (
              <div
                className={`p-12 rounded-3xl border text-center shadow-xs ${theme.bgCard} ${theme.borderCard}`}
              >
                <CheckCheck className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <h4 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  ¡Manuscrito impecable!
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  No se detectaron faltas ortográficas o problemas sintácticos en este capítulo.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: DETECTOR DE MULETILLAS */}
      {activeTab === 'crutches' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Detector de Muletillas y Repeticiones
              </h3>
              <p className="text-xs text-stone-500">
                Encuentra conectores gastados, frases comodín y repeticiones de proximidad.
              </p>
            </div>

            <button
              onClick={runCrutchesDetection}
              disabled={loadingCrutches || !selectedChapter}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${theme.primaryBtn} disabled:opacity-50`}
            >
              {loadingCrutches ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Escaneando cadencia...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Escanear Muletillas</span>
                </>
              )}
            </button>
          </div>

          {/* Custom user expressions search bar */}
          <div className={`p-4 rounded-2xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-2">
              Expresiones personalizadas a vigilar:
            </span>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {customCrutchesList.map((expr) => (
                <span
                  key={expr}
                  className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
                >
                  <span>"{expr}"</span>
                  <button
                    onClick={() => setCustomCrutchesList((p) => p.filter((x) => x !== expr))}
                    className="text-stone-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddCustomCrutch} className="flex gap-2 max-w-md">
              <input
                type="text"
                value={customCrutchInput}
                onChange={(e) => setCustomCrutchInput(e.target.value)}
                placeholder="Añadir muletilla propia (ej: 'obviamente')..."
                className={`w-full px-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              >
                Añadir
              </button>
            </form>
          </div>

          {/* Crutches diagnosis */}
          {crutchDiagnosis && (
            <div className={`p-4 rounded-2xl border bg-amber-500/10 border-amber-500/20 text-xs font-serif leading-relaxed text-amber-900 dark:text-amber-200`}>
              <strong>Dictamen de variedad léxica:</strong> {crutchDiagnosis}
            </div>
          )}

          {/* Findings */}
          {crutchFindings.length > 0 && (
            <div className="space-y-4">
              {crutchFindings.map((finding) => {
                const isStyle = authorStyleExpressions.includes(finding.expression);

                return (
                  <div
                    key={finding.id}
                    className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${
                      isStyle ? 'border-purple-500/40 opacity-80' : theme.borderCard
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-amber-700 dark:text-amber-400">
                          "{finding.expression}"
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {finding.count} apariciones
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          {finding.category.replace('_', ' ')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleAuthorStyle(finding.expression)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                          isStyle
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'border-stone-300 text-stone-600 dark:text-stone-300 hover:bg-black/5'
                        }`}
                      >
                        {isStyle ? '✓ Marcado como estilo del autor' : 'Marcar como estilo intencional'}
                      </button>
                    </div>

                    <div className="text-xs text-stone-500">
                      <strong>Distribución:</strong> {finding.distribution}
                    </div>

                    {/* Sample Snippets */}
                    {finding.snippets?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-stone-500 block">
                          Ejemplos en el texto:
                        </span>
                        {finding.snippets.map((snip, i) => (
                          <p
                            key={i}
                            className="text-xs font-serif italic text-stone-700 dark:text-stone-300 p-2 rounded-lg bg-stone-100/60 dark:bg-stone-800/40"
                          >
                            "...{snip}..."
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Alternatives */}
                    {finding.alternatives?.length > 0 && (
                      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Alternativas sugeridas:{' '}
                        </span>
                        <span className="text-stone-700 dark:text-stone-300 font-serif">
                          {finding.alternatives.join(' • ')}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-stone-500 font-sans">
                      <em>Consejo:</em> {finding.stylisticAdvice}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANÁLISIS DE CONTINUIDAD NARRATIVA */}
      {activeTab === 'continuity' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div>
              <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                Verificador de Continuidad de Lore
              </h3>
              <p className="text-xs text-stone-500">
                Contrasta el capítulo contra las fichas de personajes, reglas del mundo y acontecimientos de la línea temporal.
              </p>
            </div>

            <button
              onClick={runContinuityCheck}
              disabled={loadingContinuity || !selectedChapter}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${theme.primaryBtn} disabled:opacity-50`}
            >
              {loadingContinuity ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cruzando con la biblia...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Verificar Continuidad</span>
                </>
              )}
            </button>
          </div>

          {continuityVerdict && (
            <div className={`p-4 rounded-2xl border bg-purple-500/10 border-purple-500/20 text-xs font-serif leading-relaxed text-purple-900 dark:text-purple-200`}>
              <strong>Veredicto de Continuidad:</strong> {continuityVerdict}
            </div>
          )}

          {continuityIssues.length > 0 ? (
            <div className="space-y-4">
              {continuityIssues
                .filter((iss) => !resolvedContinuityIds.includes(iss.id))
                .map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-5 rounded-2xl border shadow-xs space-y-3 ${theme.bgCard} ${theme.borderCard}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400">
                          {issue.severity.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          Entidad afectada: "{issue.relatedEntity}"
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setResolvedContinuityIds((prev) => [...prev, issue.id]);
                          toast('Alerta resuelta o marcada como intencional', 'info');
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-black/5"
                      >
                        Marcar como giro intencional
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs font-serif italic text-stone-800 dark:text-stone-200">
                      "{issue.fragment}"
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                      <strong>Choque detectado:</strong> {issue.explanation}
                    </p>

                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300 font-sans">
                      <strong>Propuesta de armonización:</strong> {issue.suggestion}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            continuityVerdict && (
              <div className={`p-12 rounded-3xl border text-center shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <h4 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  ¡Continuidad coherente!
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  No se detectaron contradicciones con la edad de los personajes, el canon de lore o la línea temporal.
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
