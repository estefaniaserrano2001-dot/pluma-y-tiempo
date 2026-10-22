import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Compass,
  Move,
  ZoomIn,
  Link as LinkIcon,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { getTheme } from '../../utils/theme';
import { PaletteTheme } from '../../types';

interface TimelineCanvasOnboardingProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  palette: PaletteTheme;
  darkMode: boolean;
}

export const TimelineCanvasOnboarding: React.FC<TimelineCanvasOnboardingProps> = ({
  isOpen,
  onClose,
  palette,
  darkMode,
}) => {
  const theme = getTheme(palette, darkMode);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [demoStep, setDemoStep] = useState<number>(0);

  // Interactive micro-demo elements (clearly labeled as demonstration)
  const [demoPoints, setDemoPoints] = useState([
    { id: 'demo_1', title: 'Descubrimiento del artefacto', x: 40, y: 30, color: '#2D5A43' },
    { id: 'demo_2', title: 'Pacto secreto en los muelles', x: 220, y: 30, color: '#1B3B5C' },
    { id: 'demo_3', title: 'El eclipse de invierno', x: 130, y: 120, color: '#933D2D' },
  ]);

  const [activeDemoPoint, setActiveDemoPoint] = useState<string | null>('demo_1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${theme.accentBadge} ${theme.accentText}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-serif font-bold text-lg ${theme.textPrimary}`}>
                  Bienvenido al Lienzo 2D
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Guía visual
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Organización espacial y relaciones dinámicas para tu historia
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(dontShowAgain)}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Description Text (from user prompt) */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            «El <strong>Lienzo 2D</strong> es un espacio visual para organizar y relacionar los elementos de tu historia. Puedes crear puntos para representar acontecimientos, personajes, lugares o ideas, y conectarlos mediante líneas para visualizar sus relaciones. Arrastra los elementos para organizarlos, selecciona uno para consultar sus detalles y utiliza el zoom para explorar el espacio. Tus elementos se pueden relacionar con capítulos, personajes y líneas de tiempo».
          </div>

          {/* Interactive Micro-Demo Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                Demostración interactiva (Elementos de prueba)
              </span>
              <span className="text-[10px] text-stone-400 italic font-mono">
                No afecta tus datos reales
              </span>
            </div>

            <div className="relative h-48 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-100/50 dark:bg-stone-900/40 overflow-hidden p-3 select-none">
              {/* SVG Demo Curves */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d="M 100 50 C 150 50, 180 50, 240 50"
                  stroke="#2D5A43"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                />
                <path
                  d="M 240 50 C 240 100, 200 130, 160 130"
                  stroke="#1B3B5C"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              {/* Demo Nodes */}
              {demoPoints.map((dp) => {
                const isSelected = activeDemoPoint === dp.id;
                return (
                  <div
                    key={dp.id}
                    onClick={() => setActiveDemoPoint(dp.id)}
                    style={{ left: dp.x, top: dp.y }}
                    className={`absolute p-2 rounded-xl border text-xs cursor-pointer shadow-sm transition-transform flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-amber-600 bg-white dark:bg-stone-800 scale-105 shadow-md ring-2 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: dp.color }}
                    />
                    <span className="font-serif font-bold text-[11px] truncate max-w-[130px]">
                      {dp.title}
                    </span>
                  </div>
                );
              })}

              <div className="absolute bottom-2 right-2 text-[10px] text-stone-500 bg-white/80 dark:bg-stone-900/80 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800">
                Punto activo:{' '}
                <strong>
                  {demoPoints.find((p) => p.id === activeDemoPoint)?.title}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick tips list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <Move className="w-4 h-4 text-emerald-600 mb-1" />
              <strong className="block text-stone-800 dark:text-stone-200 mb-0.5">
                Arrastre infinito
              </strong>
              <p className="text-[11px] text-stone-500">
                Mueve el fondo sin límites para explorar eras pasadas o futuras.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <ZoomIn className="w-4 h-4 text-blue-600 mb-1" />
              <strong className="block text-stone-800 dark:text-stone-200 mb-0.5">
                Zoom continuo
              </strong>
              <p className="text-[11px] text-stone-500">
                Usa la rueda del ratón o los controles para acercarte de siglos a horas.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <LinkIcon className="w-4 h-4 text-purple-600 mb-1" />
              <strong className="block text-stone-800 dark:text-stone-200 mb-0.5">
                Conexiones reales
              </strong>
              <p className="text-[11px] text-stone-500">
                Traza relaciones de causa, paralelismo o revelación entre tus hitos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
          <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-amber-600 rounded"
            />
            <span>No volver a mostrar automáticamente</span>
          </label>
          <button
            onClick={() => onClose(dontShowAgain)}
            className={`px-6 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
          >
            Comenzar a Explorar
          </button>
        </div>
      </div>
    </div>
  );
};
