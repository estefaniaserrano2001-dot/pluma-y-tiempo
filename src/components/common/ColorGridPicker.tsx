import React, { useState } from 'react';
import { Check, Pipette } from 'lucide-react';

export interface ColorFamily {
  name: string;
  colors: {
    hex: string;
    label: string;
    variant: 'clara' | 'media' | 'oscura';
  }[];
}

export const COLOR_FAMILIES: ColorFamily[] = [
  {
    name: 'Rojos',
    colors: [
      { hex: '#FCA5A5', label: 'Rojo claro', variant: 'clara' },
      { hex: '#EF4444', label: 'Rojo medio', variant: 'media' },
      { hex: '#991B1B', label: 'Rojo oscuro', variant: 'oscura' },
      { hex: '#7F1D1D', label: 'Granate profundo', variant: 'oscura' },
    ],
  },
  {
    name: 'Naranjas',
    colors: [
      { hex: '#FDBA74', label: 'Naranja claro', variant: 'clara' },
      { hex: '#F97316', label: 'Naranja medio', variant: 'media' },
      { hex: '#C2410C', label: 'Terracota', variant: 'oscura' },
      { hex: '#7C2D12', label: 'Óxido oscuro', variant: 'oscura' },
    ],
  },
  {
    name: 'Amarillos',
    colors: [
      { hex: '#FEF08A', label: 'Amarillo pastel', variant: 'clara' },
      { hex: '#EAB308', label: 'Oro medio', variant: 'media' },
      { hex: '#A16207', label: 'Ámbar tostado', variant: 'oscura' },
      { hex: '#713F12', label: 'Oro viejo', variant: 'oscura' },
    ],
  },
  {
    name: 'Verdes',
    colors: [
      { hex: '#86EFAC', label: 'Verde menta', variant: 'clara' },
      { hex: '#22C55E', label: 'Verde bosque', variant: 'media' },
      { hex: '#166534', label: 'Verde pino', variant: 'oscura' },
      { hex: '#14532D', label: 'Ciprés profundo', variant: 'oscura' },
    ],
  },
  {
    name: 'Turquesas',
    colors: [
      { hex: '#99F6E4', label: 'Turquesa claro', variant: 'clara' },
      { hex: '#14B8A6', label: 'Turquesa medio', variant: 'media' },
      { hex: '#0F766E', label: 'Verde azulado', variant: 'oscura' },
      { hex: '#134E4A', label: 'Abisal turquesa', variant: 'oscura' },
    ],
  },
  {
    name: 'Azules',
    colors: [
      { hex: '#93C5FD', label: 'Celeste', variant: 'clara' },
      { hex: '#3B82F6', label: 'Azul cobalto', variant: 'media' },
      { hex: '#1D4ED8', label: 'Azul marino', variant: 'oscura' },
      { hex: '#1E3A8A', label: 'Azul noche', variant: 'oscura' },
    ],
  },
  {
    name: 'Violetas',
    colors: [
      { hex: '#D8B4FE', label: 'Lila suave', variant: 'clara' },
      { hex: '#A855F7', label: 'Púrpura medio', variant: 'media' },
      { hex: '#6B21A8', label: 'Violeta imperial', variant: 'oscura' },
      { hex: '#581C87', label: 'Ciruela oscuro', variant: 'oscura' },
    ],
  },
  {
    name: 'Rosados',
    colors: [
      { hex: '#F9A8D4', label: 'Rosa pastel', variant: 'clara' },
      { hex: '#EC4899', label: 'Rosa fucsia', variant: 'media' },
      { hex: '#BE185D', label: 'Rosa carmesí', variant: 'oscura' },
      { hex: '#831843', label: 'Vino rosado', variant: 'oscura' },
    ],
  },
  {
    name: 'Marrones',
    colors: [
      { hex: '#D7BA9D', label: 'Arena cálida', variant: 'clara' },
      { hex: '#A2703F', label: 'Cuero artesanal', variant: 'media' },
      { hex: '#633B18', label: 'Nogal', variant: 'oscura' },
      { hex: '#3E240D', label: 'Café oscuro', variant: 'oscura' },
    ],
  },
  {
    name: 'Grises',
    colors: [
      { hex: '#E2E8F0', label: 'Gris perla', variant: 'clara' },
      { hex: '#94A3B8', label: 'Gris pizarra', variant: 'media' },
      { hex: '#475569', label: 'Gris grafito', variant: 'oscura' },
      { hex: '#1E293B', label: 'Carbón', variant: 'oscura' },
    ],
  },
  {
    name: 'Blanco & Negro',
    colors: [
      { hex: '#FFFFFF', label: 'Blanco puro', variant: 'clara' },
      { hex: '#F1F5F9', label: 'Humo neutro', variant: 'clara' },
      { hex: '#334155', label: 'Antracita', variant: 'oscura' },
      { hex: '#000000', label: 'Negro azabache', variant: 'oscura' },
    ],
  },
];

interface ColorGridPickerProps {
  value: string;
  onChange: (hex: string) => void;
  title?: string;
  showHexInput?: boolean;
}

export const ColorGridPicker: React.FC<ColorGridPickerProps> = ({
  value,
  onChange,
  title = 'Seleccionar color',
  showHexInput = true,
}) => {
  const [customHex, setCustomHex] = useState(value || '#2D5A43');
  const [hoveredColor, setHoveredColor] = useState<{ hex: string; label: string } | null>(null);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="space-y-3 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {hoveredColor ? (
            <span className="text-[11px] font-mono font-medium text-stone-600 dark:text-stone-400">
              {hoveredColor.label} ({hoveredColor.hex.toUpperCase()})
            </span>
          ) : (
            <span className="text-[11px] font-mono text-stone-500">
              {value?.toUpperCase() || '#2D5A43'}
            </span>
          )}
          <div
            className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 shadow-xs"
            style={{ backgroundColor: value || '#2D5A43' }}
          />
        </div>
      </div>

      {/* Grid of families */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
        {COLOR_FAMILIES.map((family) => (
          <div
            key={family.name}
            className="p-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-stone-950/40"
          >
            <span className="text-[10px] font-medium text-stone-500 block mb-1">
              {family.name}
            </span>
            <div className="flex items-center gap-1">
              {family.colors.map((c) => {
                const isSelected = value?.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      onChange(c.hex);
                      setCustomHex(c.hex);
                    }}
                    onMouseEnter={() => setHoveredColor({ hex: c.hex, label: c.label })}
                    onMouseLeave={() => setHoveredColor(null)}
                    className={`flex-1 h-6 rounded-md transition-transform relative flex items-center justify-center border border-black/10 dark:border-white/10 ${
                      isSelected
                        ? 'scale-110 ring-2 ring-amber-500 ring-offset-1 z-10 shadow-xs'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`${family.name}: ${c.label} (${c.hex})`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 ${
                          c.variant === 'clara' ? 'text-stone-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Picker and Hex input */}
      {showHexInput && (
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
          <label
            className="p-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 cursor-pointer flex items-center gap-1.5 hover:bg-stone-50 text-stone-700 dark:text-stone-300"
            title="Selector libre de color nativo"
          >
            <Pipette className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Selector</span>
            <input
              type="color"
              value={value || '#2D5A43'}
              onChange={(e) => {
                onChange(e.target.value);
                setCustomHex(e.target.value);
              }}
              className="sr-only"
            />
          </label>
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400">
              #
            </span>
            <input
              type="text"
              value={customHex.replace(/^#/, '')}
              onChange={(e) => handleCustomChange({ ...e, target: { ...e.target, value: '#' + e.target.value } })}
              placeholder="RRGGBB"
              maxLength={6}
              className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-mono bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
