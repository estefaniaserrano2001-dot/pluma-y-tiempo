import { PaletteTheme, CustomPaletteConfig } from '../types';

export interface ThemeColors {
  bgApp: string;
  bgWorkspace: string;
  bgCard: string;
  bgSidebar: string;
  borderCard: string;
  borderSidebar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryBtn: string;
  primaryBtnHover: string;
  accentBadge: string;
  accentBadgeText: string;
  accentText: string;
  activeTab: string;
  activeBorder: string;
  activeRing: string;
  accentHex: string;
  secondaryHex: string;
  timelineCanvasBg: string;
  timelineGridColor: string;
}

export interface ThemeConfig {
  id: PaletteTheme;
  name: string;
  description: string;
  preview: [string, string, string]; // 3 representative swatches
  light: ThemeColors;
  dark: ThemeColors;
}

export const PALETTES: Record<PaletteTheme, ThemeConfig> = {
  bosque: {
    id: 'bosque',
    name: 'Bosque Intenso',
    description: 'Esmeralda vibrante, jade radiante y crema botánico vivo.',
    preview: ['#047857', '#10B981', '#ECFDF5'],
    light: {
      bgApp: 'bg-[#F0FDF4]',
      bgWorkspace: 'bg-[#F6FEF9]',
      bgCard: 'bg-white',
      bgSidebar: 'bg-[#DCFCE7]',
      borderCard: 'border-[#86EFAC]',
      borderSidebar: 'border-[#4ADE80]',
      textPrimary: 'text-[#064E3B]',
      textSecondary: 'text-[#065F46]',
      textMuted: 'text-[#047857]',
      primaryBtn: 'bg-[#047857] hover:bg-[#065F46] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#065F46]',
      accentBadge: 'bg-[#D1FAE5]',
      accentBadgeText: 'text-[#065F46] font-bold',
      accentText: 'text-[#047857]',
      activeTab: 'bg-[#047857] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#059669]',
      activeRing: 'ring-[#059669]/40',
      accentHex: '#059669',
      secondaryHex: '#10B981',
      timelineCanvasBg: '#F0FDF4',
      timelineGridColor: '#BBF7D0',
    },
    dark: {
      bgApp: 'bg-[#022115]',
      bgWorkspace: 'bg-[#042E1E]',
      bgCard: 'bg-[#073D28]',
      bgSidebar: 'bg-[#032619]',
      borderCard: 'border-[#059669]',
      borderSidebar: 'border-[#047857]',
      textPrimary: 'text-[#ECFDF5]',
      textSecondary: 'text-[#A7F3D0]',
      textMuted: 'text-[#6EE7B7]',
      primaryBtn: 'bg-[#059669] hover:bg-[#10B981] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#10B981]',
      accentBadge: 'bg-[#064E3B]',
      accentBadgeText: 'text-[#6EE7B7] font-bold',
      accentText: 'text-[#34D399]',
      activeTab: 'bg-[#059669] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#10B981]',
      activeRing: 'ring-[#10B981]/50',
      accentHex: '#10B981',
      secondaryHex: '#34D399',
      timelineCanvasBg: '#042E1E',
      timelineGridColor: '#065F46',
    },
  },
  oceano: {
    id: 'oceano',
    name: 'Océano Zafiro',
    description: 'Azul zafiro eléctrico, celeste brillante y blanco nórdico.',
    preview: ['#0284C7', '#38BDF8', '#F0F9FF'],
    light: {
      bgApp: 'bg-[#F0F9FF]',
      bgWorkspace: 'bg-[#F6FBFF]',
      bgCard: 'bg-white',
      bgSidebar: 'bg-[#E0F2FE]',
      borderCard: 'border-[#7DD3FC]',
      borderSidebar: 'border-[#38BDF8]',
      textPrimary: 'text-[#0C4A6E]',
      textSecondary: 'text-[#0369A1]',
      textMuted: 'text-[#0284C7]',
      primaryBtn: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#0369A1]',
      accentBadge: 'bg-[#BAE6FD]',
      accentBadgeText: 'text-[#0369A1] font-bold',
      accentText: 'text-[#0284C7]',
      activeTab: 'bg-[#0284C7] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#0284C7]',
      activeRing: 'ring-[#0284C7]/40',
      accentHex: '#0284C7',
      secondaryHex: '#38BDF8',
      timelineCanvasBg: '#F0F9FF',
      timelineGridColor: '#BAE6FD',
    },
    dark: {
      bgApp: 'bg-[#031E38]',
      bgWorkspace: 'bg-[#052A4E]',
      bgCard: 'bg-[#083866]',
      bgSidebar: 'bg-[#042341]',
      borderCard: 'border-[#0284C7]',
      borderSidebar: 'border-[#0369A1]',
      textPrimary: 'text-[#F0F9FF]',
      textSecondary: 'text-[#BAE6FD]',
      textMuted: 'text-[#7DD3FC]',
      primaryBtn: 'bg-[#0284C7] hover:bg-[#38BDF8] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#38BDF8]',
      accentBadge: 'bg-[#075985]',
      accentBadgeText: 'text-[#7DD3FC] font-bold',
      accentText: 'text-[#38BDF8]',
      activeTab: 'bg-[#0284C7] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#38BDF8]',
      activeRing: 'ring-[#38BDF8]/50',
      accentHex: '#38BDF8',
      secondaryHex: '#7DD3FC',
      timelineCanvasBg: '#052A4E',
      timelineGridColor: '#075985',
    },
  },
  atardecer: {
    id: 'atardecer',
    name: 'Atardecer Fuego',
    description: 'Terracota ardiente, naranja solar y resplandor ambarino.',
    preview: ['#C2410C', '#FB923C', '#FFF7ED'],
    light: {
      bgApp: 'bg-[#FFF7ED]',
      bgWorkspace: 'bg-[#FFFAF4]',
      bgCard: 'bg-white',
      bgSidebar: 'bg-[#FFEDD5]',
      borderCard: 'border-[#FDBA74]',
      borderSidebar: 'border-[#FB923C]',
      textPrimary: 'text-[#7C2D12]',
      textSecondary: 'text-[#9A3412]',
      textMuted: 'text-[#C2410C]',
      primaryBtn: 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#C2410C]',
      accentBadge: 'bg-[#FED7AA]',
      accentBadgeText: 'text-[#9A3412] font-bold',
      accentText: 'text-[#EA580C]',
      activeTab: 'bg-[#EA580C] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#EA580C]',
      activeRing: 'ring-[#EA580C]/40',
      accentHex: '#EA580C',
      secondaryHex: '#F97316',
      timelineCanvasBg: '#FFF7ED',
      timelineGridColor: '#FED7AA',
    },
    dark: {
      bgApp: 'bg-[#270E04]',
      bgWorkspace: 'bg-[#371507]',
      bgCard: 'bg-[#4D1E0B]',
      bgSidebar: 'bg-[#2D1005]',
      borderCard: 'border-[#C2410C]',
      borderSidebar: 'border-[#9A3412]',
      textPrimary: 'text-[#FFF7ED]',
      textSecondary: 'text-[#FED7AA]',
      textMuted: 'text-[#FDBA74]',
      primaryBtn: 'bg-[#EA580C] hover:bg-[#FB923C] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#FB923C]',
      accentBadge: 'bg-[#7C2D12]',
      accentBadgeText: 'text-[#FDBA74] font-bold',
      accentText: 'text-[#FB923C]',
      activeTab: 'bg-[#EA580C] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#FB923C]',
      activeRing: 'ring-[#FB923C]/50',
      accentHex: '#FB923C',
      secondaryHex: '#FDBA74',
      timelineCanvasBg: '#371507',
      timelineGridColor: '#7C2D12',
    },
  },
  lavanda: {
    id: 'lavanda',
    name: 'Lavanda Amatista',
    description: 'Púrpura imperial intenso, violeta radiante y blanco sedoso.',
    preview: ['#7C3AED', '#C084FC', '#FAF5FF'],
    light: {
      bgApp: 'bg-[#FAF5FF]',
      bgWorkspace: 'bg-[#FCF9FF]',
      bgCard: 'bg-white',
      bgSidebar: 'bg-[#F3E8FF]',
      borderCard: 'border-[#D8B4FE]',
      borderSidebar: 'border-[#C084FC]',
      textPrimary: 'text-[#4C1D95]',
      textSecondary: 'text-[#5B21B6]',
      textMuted: 'text-[#7C3AED]',
      primaryBtn: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#6D28D9]',
      accentBadge: 'bg-[#E9D5FF]',
      accentBadgeText: 'text-[#581C87] font-bold',
      accentText: 'text-[#7C3AED]',
      activeTab: 'bg-[#7C3AED] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#7C3AED]',
      activeRing: 'ring-[#7C3AED]/40',
      accentHex: '#7C3AED',
      secondaryHex: '#A855F7',
      timelineCanvasBg: '#FAF5FF',
      timelineGridColor: '#E9D5FF',
    },
    dark: {
      bgApp: 'bg-[#1A0A30]',
      bgWorkspace: 'bg-[#250E45]',
      bgCard: 'bg-[#351561]',
      bgSidebar: 'bg-[#1E0C37]',
      borderCard: 'border-[#7C3AED]',
      borderSidebar: 'border-[#6D28D9]',
      textPrimary: 'text-[#FAF5FF]',
      textSecondary: 'text-[#E9D5FF]',
      textMuted: 'text-[#C084FC]',
      primaryBtn: 'bg-[#7C3AED] hover:bg-[#9333EA] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#9333EA]',
      accentBadge: 'bg-[#581C87]',
      accentBadgeText: 'text-[#E9D5FF] font-bold',
      accentText: 'text-[#C084FC]',
      activeTab: 'bg-[#7C3AED] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#A855F7]',
      activeRing: 'ring-[#A855F7]/50',
      accentHex: '#A855F7',
      secondaryHex: '#C084FC',
      timelineCanvasBg: '#250E45',
      timelineGridColor: '#581C87',
    },
  },
  nocturna: {
    id: 'nocturna',
    name: 'Nocturna Neón',
    description: 'Índigo cósmico, azul cobalto eléctrico y contrastes de alta intensidad.',
    preview: ['#4F46E5', '#818CF8', '#EEF2FF'],
    light: {
      bgApp: 'bg-[#EEF2FF]',
      bgWorkspace: 'bg-[#F5F7FF]',
      bgCard: 'bg-white',
      bgSidebar: 'bg-[#E0E7FF]',
      borderCard: 'border-[#A5B4FC]',
      borderSidebar: 'border-[#818CF8]',
      textPrimary: 'text-[#1E1B4B]',
      textSecondary: 'text-[#312E81]',
      textMuted: 'text-[#4338CA]',
      primaryBtn: 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#4338CA]',
      accentBadge: 'bg-[#C7D2FE]',
      accentBadgeText: 'text-[#312E81] font-bold',
      accentText: 'text-[#4F46E5]',
      activeTab: 'bg-[#4F46E5] text-white shadow-sm font-semibold',
      activeBorder: 'border-[#4F46E5]',
      activeRing: 'ring-[#4F46E5]/40',
      accentHex: '#4F46E5',
      secondaryHex: '#6366F1',
      timelineCanvasBg: '#EEF2FF',
      timelineGridColor: '#C7D2FE',
    },
    dark: {
      bgApp: 'bg-[#0C1026]',
      bgWorkspace: 'bg-[#131A3D]',
      bgCard: 'bg-[#1B2454]',
      bgSidebar: 'bg-[#0F1430]',
      borderCard: 'border-[#4F46E5]',
      borderSidebar: 'border-[#4338CA]',
      textPrimary: 'text-[#EEF2FF]',
      textSecondary: 'text-[#C7D2FE]',
      textMuted: 'text-[#818CF8]',
      primaryBtn: 'bg-[#4F46E5] hover:bg-[#6366F1] text-white shadow-sm font-semibold',
      primaryBtnHover: 'hover:bg-[#6366F1]',
      accentBadge: 'bg-[#312E81]',
      accentBadgeText: 'text-[#C7D2FE] font-bold',
      accentText: 'text-[#818CF8]',
      activeTab: 'bg-[#4F46E5] text-white font-semibold shadow-sm',
      activeBorder: 'border-[#6366F1]',
      activeRing: 'ring-[#6366F1]/50',
      accentHex: '#6366F1',
      secondaryHex: '#818CF8',
      timelineCanvasBg: '#131A3D',
      timelineGridColor: '#312E81',
    },
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getLuminance(hex: string): number {
  try {
    const { r, g, b } = hexToRgb(hex);
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  } catch (e) {
    return 0.5;
  }
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function hexToRgba(hex: string, alpha: number): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return hex;
  }
}

let registeredCustomPalettes: CustomPaletteConfig[] = [];

export function registerCustomPalettes(palettes: CustomPaletteConfig[] = []) {
  registeredCustomPalettes = palettes;
}

export function getRegisteredCustomPalettes(): CustomPaletteConfig[] {
  return registeredCustomPalettes;
}

export function generateCustomThemeConfig(custom: CustomPaletteConfig): ThemeConfig {
  const p = custom.primary || '#243B35';
  const s = custom.secondary || '#87A878';
  const a = custom.accent || '#D4AF37';

  // Light tints
  const lightBgApp = hexToRgba(s, 0.08);
  const lightBgWorkspace = hexToRgba(s, 0.04);
  const lightBgSidebar = hexToRgba(s, 0.12);
  const lightBorder = hexToRgba(p, 0.2);
  const lightAccentBadge = hexToRgba(s, 0.2);

  // Dark tints
  const darkBgApp = '#0f1412';
  const darkBgWorkspace = '#141a18';
  const darkBgCard = '#19221f';
  const darkBgSidebar = '#111715';
  const darkBorder = hexToRgba(s, 0.25);
  const darkAccentBadge = hexToRgba(p, 0.4);

  return {
    id: custom.id as any,
    name: custom.name,
    description: `Paleta personalizada (${custom.name})`,
    preview: [p, s, a],
    light: {
      bgApp: 'bg-[var(--theme-bg-app)]',
      bgWorkspace: 'bg-[var(--theme-bg-workspace)]',
      bgCard: 'bg-white',
      bgSidebar: 'bg-[var(--theme-bg-sidebar)]',
      borderCard: 'border-[var(--theme-border-card)]',
      borderSidebar: 'border-[var(--theme-border-sidebar)]',
      textPrimary: 'text-stone-900',
      textSecondary: 'text-stone-700',
      textMuted: 'text-stone-500',
      primaryBtn: 'bg-[var(--theme-primary)] hover:opacity-90 text-white shadow-sm',
      primaryBtnHover: 'hover:opacity-90',
      accentBadge: 'bg-[var(--theme-accent-badge)]',
      accentBadgeText: 'text-[var(--theme-primary)] font-semibold',
      accentText: 'text-[var(--theme-primary)]',
      activeTab: 'bg-[var(--theme-primary)] text-white shadow-sm',
      activeBorder: 'border-[var(--theme-primary)]',
      activeRing: 'ring-[var(--theme-primary)]/30',
      accentHex: p,
      secondaryHex: s,
      timelineCanvasBg: '#fbfaf8',
      timelineGridColor: hexToRgba(p, 0.12),
    },
    dark: {
      bgApp: 'bg-[var(--theme-bg-app)]',
      bgWorkspace: 'bg-[var(--theme-bg-workspace)]',
      bgCard: 'bg-[var(--theme-bg-card)]',
      bgSidebar: 'bg-[var(--theme-bg-sidebar)]',
      borderCard: 'border-[var(--theme-border-card)]',
      borderSidebar: 'border-[var(--theme-border-sidebar)]',
      textPrimary: 'text-stone-100',
      textSecondary: 'text-stone-300',
      textMuted: 'text-stone-400',
      primaryBtn: 'bg-[var(--theme-primary)] hover:opacity-90 text-white shadow-sm',
      primaryBtnHover: 'hover:opacity-90',
      accentBadge: 'bg-[var(--theme-accent-badge)]',
      accentBadgeText: 'text-[var(--theme-secondary)] font-semibold',
      accentText: 'text-[var(--theme-secondary)]',
      activeTab: 'bg-[var(--theme-primary)] text-white shadow-sm',
      activeBorder: 'border-[var(--theme-secondary)]',
      activeRing: 'ring-[var(--theme-secondary)]/40',
      accentHex: p,
      secondaryHex: s,
      timelineCanvasBg: '#121715',
      timelineGridColor: hexToRgba(s, 0.2),
    },
  };
}

export function applyDynamicPaletteVariables(
  paletteKey: string,
  darkMode: boolean,
  customPalettes?: CustomPaletteConfig[]
) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const allCustom = customPalettes || registeredCustomPalettes;
  const custom = allCustom?.find((cp) => cp.id === paletteKey);

  if (custom) {
    const p = custom.primary || '#243B35';
    const s = custom.secondary || '#87A878';
    const a = custom.accent || '#D4AF37';

    if (darkMode) {
      root.style.setProperty('--theme-primary', p);
      root.style.setProperty('--theme-secondary', s);
      root.style.setProperty('--theme-accent', a);
      root.style.setProperty('--theme-bg-app', '#0e1411');
      root.style.setProperty('--theme-bg-workspace', '#121916');
      root.style.setProperty('--theme-bg-card', '#18221e');
      root.style.setProperty('--theme-bg-sidebar', '#101714');
      root.style.setProperty('--theme-border-card', hexToRgba(s, 0.22));
      root.style.setProperty('--theme-border-sidebar', hexToRgba(s, 0.28));
      root.style.setProperty('--theme-accent-badge', hexToRgba(s, 0.2));
      root.style.setProperty('--theme-text-primary', '#F1F5F3');
      root.style.setProperty('--theme-text-secondary', '#CAD8D1');
      root.style.setProperty('--theme-text-muted', '#7E978C');
    } else {
      root.style.setProperty('--theme-primary', p);
      root.style.setProperty('--theme-secondary', s);
      root.style.setProperty('--theme-accent', a);
      root.style.setProperty('--theme-bg-app', hexToRgba(s, 0.08));
      root.style.setProperty('--theme-bg-workspace', hexToRgba(s, 0.04));
      root.style.setProperty('--theme-bg-card', '#FFFFFF');
      root.style.setProperty('--theme-bg-sidebar', hexToRgba(s, 0.12));
      root.style.setProperty('--theme-border-card', hexToRgba(p, 0.18));
      root.style.setProperty('--theme-border-sidebar', hexToRgba(p, 0.25));
      root.style.setProperty('--theme-accent-badge', hexToRgba(s, 0.18));
      root.style.setProperty('--theme-text-primary', '#15221B');
      root.style.setProperty('--theme-text-secondary', '#2E4739');
      root.style.setProperty('--theme-text-muted', '#5E796B');
    }
    return;
  }

  // Predefined theme variables fallback
  const preset = (PALETTES as any)[paletteKey] || PALETTES.bosque;
  const current = darkMode ? preset.dark : preset.light;
  root.style.setProperty('--theme-primary', current.accentHex);
  root.style.setProperty('--theme-secondary', current.secondaryHex);
  root.style.setProperty('--theme-accent', current.accentHex);
  root.style.setProperty('--theme-timeline-bg', current.timelineCanvasBg);
  root.style.setProperty('--theme-timeline-grid', current.timelineGridColor);
}

export function getTheme(
  palette: PaletteTheme | string = 'bosque',
  darkMode: boolean = false,
  customPalettes?: CustomPaletteConfig[]
): ThemeColors {
  const allCustom = customPalettes || registeredCustomPalettes;
  if (allCustom && allCustom.length > 0) {
    const custom = allCustom.find((cp) => cp.id === palette);
    if (custom) {
      const generated = generateCustomThemeConfig(custom);
      return darkMode ? generated.dark : generated.light;
    }
  }
  const current = (PALETTES as any)[palette] || PALETTES.bosque;
  return darkMode ? current.dark : current.light;
}

