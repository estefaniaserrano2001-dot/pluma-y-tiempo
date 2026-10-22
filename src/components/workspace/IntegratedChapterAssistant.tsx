import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Loader2,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { aiService, GrammarSuggestion, CrutchFinding, ContinuityIssue } from '../../services/aiService';
import { Chapter, Character, WorldDetail, TimelineEvent, AssistantScope, PaletteTheme } from '../../types';
import { getTheme } from '../../utils/theme';

interface IntegratedChapterAssistantProps {
  chapter: Chapter;
  characters: Character[];
  details: WorldDetail[];
  timelineEvents: TimelineEvent[];
  palette: PaletteTheme;
  darkMode: boolean;
  selectedText?: string;
  onApplyCorrection: (original: string, replacement: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const IntegratedChapterAssistant: React.FC<IntegratedChapterAssistantProps> = ({
  chapter,
  characters,
  details,
  timelineEvents,
  palette,
  darkMode,
  selectedText,
  onApplyCorrection,
  onClose,
  isOpen,
}) => {
  const theme = getTheme(palette, darkMode);

  const [activeTab, setActiveTab] = useState<'correccion' | 'muletillas' | 'continuidad'>('correccion');
  const [scope, setScope] = useState<AssistantScope>('completo');
  const [analyzingSelectionOnly, setAnalyzingSelectionOnly] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Results
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [grammarScore, setGrammarScore] = useState<number | null>(null);
  const [grammarSummary, setGrammarSummary] = useState<string>('');
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);

  const [crutchFindings, setCrutchFindings] = useState<CrutchFinding[]>([]);
  const [crutchDiagnosis, setCrutchDiagnosis] = useState<string>('');
  const [authorStyleList, setAuthorStyleList] = useState<string[]>([]);

  const [continuityIssues, setContinuityIssues] = useState<ContinuityIssue[]>([]);
  const [continuityVerdict, setContinuityVerdict] = useState<string>('');
  const [resolvedContinuityIds, setResolvedContinuityIds] = useState<string[]>([]);

  // Width adjustment
  const [isWide, setIsWide] = useState(false);

  if (!isOpen) return null;

  // Run selected analysis
  const handleRunAnalysis = async () => {
    const textToAnalyze = analyzingSelectionOnly && selectedText?.trim()
      ? selectedText.trim()
      : chapter.content.replace(/<[^>]*>?/gm, ''); // strip HTML for analysis

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      alert('El texto a analizar está vacío.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'correccion') {
        const res = await aiService.analyzeGrammar(textToAnalyze, chapter.title, scope);
        setGrammarSuggestions(res.suggestions || []);
        setGrammarScore(res.overallScore || 90);
        setGrammarSummary(res.summary || '');
        setIgnoredIds([]);
      } else if (activeTab === 'muletillas') {
        const res = await aiService.detectCrutches(textToAnalyze);
        setCrutchFindings(res.findings || []);
        setCrutchDiagnosis(res.diagnosis || '');
      } else if (activeTab === 'continuidad') {
        const res = await aiService.analyzeContinuity({
          text: textToAnalyze,
          chapterTitle: chapter.title,
          characters,
          details,
          timelineEvents,
        });
        setContinuityIssues(res.issues || []);
        setContinuityVerdict(res.overallConsistencyVerdict || '');
        setResolvedContinuityIds([]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error en el asistente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`border-l shadow-2xl flex flex-col justify-between transition-all duration-300 z-30 ${
        theme.bgCard
      } ${theme.borderCard} ${
        isWide ? 'w-full md:w-[540px]' : 'w-full md:w-[400px]'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${theme.accentBadge} ${theme.accentBadgeText}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-sm ${theme.textPrimary}`}>
                Asistente de Escritura
              </h3>
              <p className="text-[10px] text-stone-500 truncate max-w-[200px]">
                {chapter.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsWide(!isWide)}
              className="p-1 rounded text-stone-400 hover:text-stone-700"
              title={isWide ? 'Reducir panel' : 'Ampliar panel'}
            >
              {isWide ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-stone-400 hover:text-stone-700"
              title="Cerrar asistente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="p-2 border-b border-stone-200 dark:border-stone-800">
          <div className="flex rounded-lg p-0.5 bg-stone-100 dark:bg-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('correccion')}
              className={`flex-1 py-1 rounded-md transition-all ${
                activeTab === 'correccion'
                  ? `${theme.activeTab} shadow-xs`
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Corrección
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('muletillas')}
              className={`flex-1 py-1 rounded-md transition-all ${
                activeTab === 'muletillas'
                  ? `${theme.activeTab} shadow-xs`
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Muletillas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('continuidad')}
              className={`flex-1 py-1 rounded-md transition-all ${
                activeTab === 'continuidad'
                  ? `${theme.activeTab} shadow-xs`
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Continuidad
            </button>
          </div>
        </div>

        {/* Specific Scope selector for requested tasks */}
        {activeTab === 'correccion' && (
          <div className="px-3 py-2 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-semibold text-stone-500">Alcance de revisión:</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as AssistantScope)}
              className="px-2 py-1 rounded-lg border text-xs font-medium bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
            >
              <option value="completo">Completa (todos los aspectos)</option>
              <option value="solo_ortografia">Solo ortografía (tildes, grafías)</option>
              <option value="solo_puntuacion">Solo puntuación (comas, signos)</option>
              <option value="solo_gramatica">Solo gramática y concordancia</option>
              <option value="solo_claridad">Solo claridad de frases</option>
            </select>
          </div>
        )}

        {/* Selection mode toggle */}
        {selectedText && (
          <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
            <span className="truncate pr-2">
              Texto seleccionado: <em>"{selectedText.slice(0, 30)}..."</em>
            </span>
            <label className="flex items-center gap-1 cursor-pointer shrink-0 font-semibold">
              <input
                type="checkbox"
                checked={analyzingSelectionOnly}
                onChange={(e) => setAnalyzingSelectionOnly(e.target.checked)}
                className="accent-amber-600"
              />
              <span>Solo selección</span>
            </label>
          </div>
        )}
      </div>

      {/* Main Results / Suggestions area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Run action button */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={loading}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 ${theme.primaryBtn} disabled:opacity-50`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analizando con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {activeTab === 'correccion'
                  ? `Revisar (${scope.replace('solo_', 'solo ')})`
                  : activeTab === 'muletillas'
                  ? 'Escanear Muletillas'
                  : 'Verificar Continuidad'}
              </span>
            </>
          )}
        </button>

        {/* TAB 1: CORRECCIÓN LINGÜÍSTICA */}
        {activeTab === 'correccion' && (
          <div className="space-y-3 pt-2">
            {grammarScore !== null && (
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold block text-stone-700 dark:text-stone-300">
                    Puntuación: {grammarScore}/100
                  </span>
                  <span className="text-[10px] text-stone-500 line-clamp-1">{grammarSummary}</span>
                </div>
              </div>
            )}

            {grammarSuggestions
              .filter((s) => !ignoredIds.includes(s.id))
              .map((sugg) => (
                <div
                  key={sugg.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        sugg.severity === 'error'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {sugg.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyCorrection(sugg.originalSnippet, sugg.suggestedCorrection);
                          setIgnoredIds((p) => [...p, sugg.id]);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Aplicar sugerencia en el editor"
                      >
                        Aplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIgnoredIds((p) => [...p, sugg.id])}
                        className="p-1 text-stone-400 hover:text-stone-600"
                        title="Ignorar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 font-serif text-[11px]">
                    <p className="line-through text-rose-600">"{sugg.originalSnippet}"</p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      "{sugg.suggestedCorrection}"
                    </p>
                  </div>
                  <p className="text-[10px] text-stone-500 font-sans">{sugg.explanation}</p>
                </div>
              ))}

            {grammarSuggestions.length > 0 &&
              grammarSuggestions.filter((s) => !ignoredIds.includes(s.id)).length === 0 && (
                <div className="text-center py-6 text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Todas las sugerencias han sido resueltas!</span>
                </div>
              )}
          </div>
        )}

        {/* TAB 2: MULETILLAS */}
        {activeTab === 'muletillas' && (
          <div className="space-y-3 pt-2">
            {crutchDiagnosis && (
              <p className="p-2.5 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-serif">
                {crutchDiagnosis}
              </p>
            )}

            {crutchFindings.map((finding) => {
              const isStyle = authorStyleList.includes(finding.expression);
              return (
                <div
                  key={finding.id}
                  className={`p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1.5 ${
                    isStyle ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      "{finding.expression}"
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">
                      {finding.count} veces
                    </span>
                  </div>
                  {finding.alternatives?.length > 0 && (
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Alternativas: {finding.alternatives.join(', ')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAuthorStyleList((prev) =>
                        isStyle ? prev.filter((e) => e !== finding.expression) : [...prev, finding.expression]
                      )
                    }
                    className="text-[10px] underline text-stone-500 hover:text-stone-800"
                  >
                    {isStyle ? 'Quitar marca de estilo' : 'Marcar como estilo del autor'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: CONTINUIDAD */}
        {activeTab === 'continuidad' && (
          <div className="space-y-3 pt-2">
            {continuityVerdict && (
              <p className="p-2.5 rounded-xl bg-purple-500/10 text-purple-900 dark:text-purple-200 text-xs font-serif">
                {continuityVerdict}
              </p>
            )}

            {continuityIssues
              .filter((i) => !resolvedContinuityIds.includes(i.id))
              .map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-rose-600 uppercase">
                      {issue.relatedEntity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setResolvedContinuityIds((p) => [...p, issue.id])}
                      className="text-[10px] text-stone-500 hover:text-stone-800 underline"
                    >
                      Marcar resuelto
                    </button>
                  </div>
                  <p className="font-serif italic text-stone-700 dark:text-stone-300 text-[11px]">
                    "{issue.fragment}"
                  </p>
                  <p className="text-[10px] text-stone-500">{issue.explanation}</p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-400 flex items-center justify-between">
        <span>No reescribe texto automáticamente</span>
        <span>Gemini 3.8 Flash</span>
      </div>
    </div>
  );
};
