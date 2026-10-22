import React, { useState } from 'react';
import {
  Share2,
  X,
  Check,
  ArrowRight,
  ArrowLeftRight,
  Minus,
  Sparkles,
  Link as LinkIcon,
  Layers,
} from 'lucide-react';
import {
  TimelineEvent,
  TimelineConnection,
  ConnectionRelationType,
  ConnectionDirection,
} from '../../types';
import { ColorGridPicker } from '../common/ColorGridPicker';
import { getTheme } from '../../utils/theme';
import { PaletteTheme } from '../../types';

interface BatchConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: TimelineEvent[];
  existingConnections: TimelineConnection[];
  onSaveBatch: (connectionsToCreate: Omit<TimelineConnection, 'id' | 'createdAt'>[]) => Promise<void>;
  palette: PaletteTheme;
  darkMode: boolean;
}

const RELATION_TYPES: { id: ConnectionRelationType; label: string }[] = [
  { id: 'causa_consecuencia', label: 'Causa y consecuencia' },
  { id: 'continuacion', label: 'Continuación' },
  { id: 'paralelismo', label: 'Paralelismo' },
  { id: 'contradiccion', label: 'Contradicción' },
  { id: 'revelacion', label: 'Revelación' },
  { id: 'familiar', label: 'Relación familiar' },
  { id: 'historica', label: 'Relación histórica' },
  { id: 'dependencia', label: 'Dependencia' },
  { id: 'coincidencia', label: 'Coincidencia' },
  { id: 'personalizada', label: 'Relación personalizada' },
];

export const BatchConnectionModal: React.FC<BatchConnectionModalProps> = ({
  isOpen,
  onClose,
  events,
  existingConnections,
  onSaveBatch,
  palette,
  darkMode,
}) => {
  const theme = getTheme(palette, darkMode);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [connectionMode, setConnectionMode] = useState<'sequential' | 'hub_spoke' | 'all_to_all'>('sequential');
  const [relationType, setRelationType] = useState<ConnectionRelationType>('causa_consecuencia');
  const [direction, setDirection] = useState<ConnectionDirection>('unidireccional');
  const [color, setColor] = useState('#2D5A43');
  const [titlePrefix, setTitlePrefix] = useState('Cadena causal');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleSelectEvent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 5) {
        alert('Puedes seleccionar un máximo de 5 acontecimientos para esta cadena rápida.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const moveOrder = (index: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedIds.length) return;
    const copy = [...selectedIds];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSelectedIds(copy);
  };

  // Preview the generated pairs
  const generatedPairs = () => {
    const pairs: { source: string; target: string; label: string }[] = [];
    if (selectedIds.length < 2) return pairs;

    if (connectionMode === 'sequential') {
      for (let i = 0; i < selectedIds.length - 1; i++) {
        pairs.push({
          source: selectedIds[i],
          target: selectedIds[i + 1],
          label: `${i + 1} ➔ ${i + 2}`,
        });
      }
    } else if (connectionMode === 'hub_spoke') {
      const hub = selectedIds[0];
      for (let i = 1; i < selectedIds.length; i++) {
        pairs.push({
          source: hub,
          target: selectedIds[i],
          label: `Hito central ➔ Hito ${i + 1}`,
        });
      }
    } else if (connectionMode === 'all_to_all') {
      for (let i = 0; i < selectedIds.length; i++) {
        for (let j = i + 1; j < selectedIds.length; j++) {
          pairs.push({
            source: selectedIds[i],
            target: selectedIds[j],
            label: `${i + 1} ➔ ${j + 1}`,
          });
        }
      }
    }
    return pairs;
  };

  const handleExecute = async () => {
    const pairs = generatedPairs();
    if (pairs.length === 0) return;

    setIsSubmitting(true);
    try {
      const payloads: Omit<TimelineConnection, 'id' | 'createdAt'>[] = pairs.map((pair, index) => {
        const srcEv = events.find((e) => e.id === pair.source);
        const tgtEv = events.find((e) => e.id === pair.target);
        return {
          bookId: srcEv?.bookId || '',
          title: titlePrefix ? `${titlePrefix} (${index + 1})` : `Conexión ${srcEv?.title} ➔ ${tgtEv?.title}`,
          description,
          sourceEventId: pair.source,
          targetEventId: pair.target,
          relationType,
          direction,
          color,
          style: 'solid',
          labelVisible: true,
        };
      });

      await onSaveBatch(payloads);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${theme.accentBadge} ${theme.accentText}`}>
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                Creación Rápida de Cadena de Conexiones (Hasta 5 Puntos)
              </h3>
              <p className="text-xs text-stone-500">
                Conecta acontecimientos secuenciales, divergentes o recíprocos en una sola operación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Select points */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                1. Selecciona hasta 5 acontecimientos ({selectedIds.length}/5 seleccionados)
              </label>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-[11px] text-stone-400 hover:text-stone-700 underline"
                >
                  Limpiar selección
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              {events.map((ev) => {
                const isChecked = selectedIds.includes(ev.id);
                const orderNum = isChecked ? selectedIds.indexOf(ev.id) + 1 : null;
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleSelectEvent(ev.id)}
                    className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isChecked
                        ? 'border-amber-600 bg-amber-500/10 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ev.color }}
                      />
                      <div className="min-w-0">
                        <span className={`font-semibold block truncate ${theme.textPrimary}`}>
                          {ev.title}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {ev.dateDisplay}
                        </span>
                      </div>
                    </div>
                    {orderNum && (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {orderNum}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ordered chain preview */}
          {selectedIds.length > 1 && (
            <div className="p-3 rounded-2xl bg-stone-100/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Secuencia de la cadena:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedIds.map((id, idx) => {
                  const ev = events.find((e) => e.id === id);
                  return (
                    <React.Fragment key={id}>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border text-xs font-semibold flex items-center gap-1 shadow-xs">
                        <span className="text-amber-600 font-mono">{idx + 1}.</span>
                        <span className="truncate max-w-[120px]">{ev?.title}</span>
                      </span>
                      {idx < selectedIds.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Connection mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setConnectionMode('sequential')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                connectionMode === 'sequential'
                  ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs font-semibold`
                  : 'border-stone-200 dark:border-stone-800 hover:bg-black/5'
              }`}
            >
              <span className="text-xs font-bold block mb-1">1. Secuencial</span>
              <span className="text-[10px] text-stone-500">
                A ➔ B ➔ C ➔ D ➔ E (cadena lineal continua)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConnectionMode('hub_spoke')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                connectionMode === 'hub_spoke'
                  ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs font-semibold`
                  : 'border-stone-200 dark:border-stone-800 hover:bg-black/5'
              }`}
            >
              <span className="text-xs font-bold block mb-1">2. Centro radiante</span>
              <span className="text-[10px] text-stone-500">
                Punto 1 conecta con todos los demás (suceso central)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConnectionMode('all_to_all')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                connectionMode === 'all_to_all'
                  ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs font-semibold`
                  : 'border-stone-200 dark:border-stone-800 hover:bg-black/5'
              }`}
            >
              <span className="text-xs font-bold block mb-1">3. Red completa</span>
              <span className="text-[10px] text-stone-500">
                Todos conectados entre sí (alta interdependencia)
              </span>
            </button>
          </div>

          {/* Step 3: Relation type, direction, color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Tipo de relación
              </label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              >
                {RELATION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Dirección del flujo
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              >
                <option value="unidireccional">Flecha directa (A ➔ B)</option>
                <option value="bidireccional">Bidireccional (A ⇆ B)</option>
                <option value="no_dirigida">Línea continua sin flecha (A — B)</option>
              </select>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <ColorGridPicker
              value={color}
              onChange={setColor}
              title="Color de las conexiones generadas"
            />
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nombre de la cadena / conexiones
              </label>
              <input
                type="text"
                value={titlePrefix}
                onChange={(e) => setTitlePrefix(e.target.value)}
                placeholder="Ej: Secuencia del Gran Asedio"
                className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Descripción / Notas narrativas
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explicación de la causalidad entre estos hitos..."
                className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <span className="text-xs text-stone-500">
            Se generarán <strong>{generatedPairs().length}</strong> conexión(es) individuales.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={selectedIds.length < 2 || isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn} disabled:opacity-40`}
            >
              {isSubmitting ? 'Creando...' : 'Crear Conexiones'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
