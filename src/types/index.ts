export type PaletteTheme = 'bosque' | 'oceano' | 'atardecer' | 'lavanda' | 'nocturna';

export interface MediaImage {
  id: string;
  url: string;
  dataUrl?: string; // Persistent base64 or stored URL
  name?: string;
  caption?: string;
  description?: string;
  isMain?: boolean;
  isCover?: boolean;
  order?: number;
  createdAt: string;
}

export interface BookCollaborator {
  userId: string;
  username: string;
  displayName: string;
  avatarColor?: string;
  avatarUrl?: string;
  role: 'editor' | 'colaborador' | 'visitante';
  addedAt: string;
}

export interface Book {
  id: string;
  userId?: string;
  title: string;
  subtitle?: string;
  description: string;
  genre: string;
  status: 'idea' | 'planificacion' | 'escritura' | 'revision' | 'terminado';
  createdAt: string;
  updatedAt: string;
  colorPalette?: PaletteTheme;
  targetWordCount: number;
  coverGradient: string;
  coverIcon: string;
  coverImageUrl?: string;
  images?: MediaImage[];
  mainImageId?: string;
  isArchived?: boolean;
  collaborators?: BookCollaborator[];
}

export interface Chapter {
  id: string;
  bookId: string;
  order: number;
  number: number;
  title: string;
  synopsis: string;
  content: string; // Rich-text HTML content
  status: 'pendiente' | 'en_proceso' | 'borrador' | 'revision' | 'terminado';
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  characterCount: number;
  privateNotes: string;
  relatedCharacterIds: string[];
  relatedTimelineEventIds: string[];
  audioIds: string[];
}

export interface AudioRecord {
  id: string;
  bookId: string;
  chapterId: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration: number; // in seconds
  createdAt: string;
  notes: string;
  blobDataUrl?: string; // Loaded object URL in memory
  transcription?: string;
}

export interface CharacterRelationship {
  targetCharacterId: string;
  relationType: string;
  description: string;
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  aliases: string;
  age: string;
  birthDate: string;
  role: string;
  categoryIds?: string[];
  tags?: string[];
  appearance: string;
  personality: string;
  backstory: string;
  motivations: string;
  goals: string;
  fears: string;
  strengths: string;
  weaknesses: string;
  secrets: string;
  evolution: string;
  firstAppearance: string;
  additionalNotes: string;
  avatarColor: string;
  avatarUrl?: string;
  images?: MediaImage[];
  mainImageId?: string;
  relationships: CharacterRelationship[];
  createdAt: string;
  updatedAt: string;
}

export interface DetailCategory {
  id: string;
  bookId: string;
  name: string;
  color: string;
  icon?: string;
  order?: number;
  isDefault?: boolean;
  parentId?: string | null; // For hierarchical subcategories
}

export interface WorldDetail {
  id: string;
  bookId: string;
  name: string;
  category: string; // Category ID or name
  subcategoryId?: string; // Subcategory ID
  description: string;
  historicalPeriod: string;
  tags: string[];
  images?: MediaImage[]; // Attached images
  mainImageId?: string;
  immutableInfo: string;
  provisionalInfo: string;
  relatedCharacterIds: string[];
  relatedChapterIds: string[];
  relatedIdeaIds: string[];
  relatedTimelineEventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type IdeaTray = 'en_espera' | 'realizadas' | 'descartadas';

export interface IdeaCategory {
  id: string;
  bookId: string;
  name: string;
  color: string;
  order?: number;
  parentId?: string | null; // For hierarchical subcategories
}

export interface Idea {
  id: string;
  bookId: string;
  title: string;
  content: string;
  tray?: IdeaTray;
  categoryId?: string;
  subcategoryId?: string; // Subcategory ID
  isCompleted?: boolean;
  category?: string;
  tags: string[];
  status: 'nueva' | 'en_desarrollo' | 'utilizada' | 'descartada';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  notes?: string;
  images?: MediaImage[]; // Attached images
  mainImageId?: string;
  relatedCharacterIds: string[];
  relatedChapterIds: string[];
  relatedDetailIds: string[];
  relatedTimelineEventIds?: string[];
  colorTag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCategory {
  id: string;
  bookId: string;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
}

export type TimelineEventDateType = 'exacta' | 'aproximada' | 'ficticia' | 'relativa';

export interface TimelineCategory {
  id: string;
  bookId: string;
  name: string;
  color: string;
  icon?: string;
  order?: number;
}

export interface TimelineTrack {
  id: string;
  bookId: string;
  title: string;
  description?: string;
  color: string;
  icon?: string;
  order: number;
  isMain?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineLane {
  id: string;
  bookId: string;
  name: string;
  description?: string;
  color: string;
  category?: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  bookId: string;
  timelineTrackId?: string;
  title: string;
  description: string;
  dateType: TimelineEventDateType;
  dateDisplay: string;
  numericSortValue: number;
  numericValue?: number;
  relativeToEventId?: string;
  relativeOffsetYears?: number;
  relativeOffsetDays?: number;
  relativeCondition?: string;
  relativeConditionText?: string;
  category: string;
  color: string;
  status: 'confirmado' | 'provisional' | 'descartado';
  importance?: 'alta' | 'media' | 'baja';
  laneId?: string;
  precision?: 'siglo' | 'decada' | 'anio' | 'mes' | 'semana' | 'dia' | 'hora';
  images?: MediaImage[];
  imageUrl?: string;
  characterIds: string[];
  chapterIds: string[];
  detailIds?: string[];
  notes?: string;
  parentEventId?: string | null;
  orderInParent?: number;
  isExpanded?: boolean;
  x?: number;
  y?: number;
  canvasPosition?: { x: number; y: number };
  manualVisualPos?: { x: number; y: number };
  chronologicalPosition?: number;
  connectedEventIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ConnectionRelationType =
  | 'causa_consecuencia'
  | 'continuacion'
  | 'paralelismo'
  | 'contradiccion'
  | 'revelacion'
  | 'familiar'
  | 'historica'
  | 'dependencia'
  | 'coincidencia'
  | 'personalizada';

export type ConnectionDirection =
  | 'source_to_target'
  | 'target_to_source'
  | 'bidirectional'
  | 'none'
  | 'unidireccional'
  | 'bidireccional'
  | 'no_dirigida';

export interface TimelineConnection {
  id: string;
  bookId: string;
  timelineTrackId?: string;
  title: string;
  description: string;
  sourceEventId: string;
  targetEventId: string;
  relationType: ConnectionRelationType;
  direction: ConnectionDirection;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  labelVisible?: boolean;
  createdAt: string;
}

export interface BatchConnectionPayload {
  eventIds: string[];
  mode: 'sequential' | 'all_to_all' | 'hub_spoke';
  relationType: ConnectionRelationType;
  direction: ConnectionDirection;
  color: string;
  title?: string;
  description?: string;
}

export interface CustomPaletteConfig {
  id: string;
  name: string;
  primary: string; // Hex color
  secondary: string; // Hex color
  accent: string; // Hex color
  createdAt: string;
}

export interface CustomFontItem {
  id: string;
  name: string;
  fileName: string;
  format: 'truetype' | 'opentype' | 'woff' | 'woff2';
  dataUrl: string; // Base64 data URL
  createdAt: string;
}

export type AssistantScope =
  | 'completo'
  | 'solo_ortografia'
  | 'solo_puntuacion'
  | 'solo_gramatica'
  | 'solo_muletillas'
  | 'solo_claridad'
  | 'solo_continuidad';

export interface AppSettings {
  globalPalette: PaletteTheme;
  customPaletteId?: string;
  darkMode: boolean;
  editorFontSize: number;
  editorFontFamily: 'lora' | 'sans' | 'mono';
  uiFontFamily?: string;
  uiFontScale?: number;
  autoSaveDelay: number;
  sidebarCollapsed?: boolean;
  canvasOnboardingDismissed?: boolean;
}

export interface UserAccount {
  id: string;
  username: string; // único, solo usuario y contraseña
  displayName: string;
  email?: string; // Correo vinculado para copia de seguridad
  passwordHash: string;
  avatarColor: string;
  avatarUrl?: string; // Foto de perfil
  avatarIcon?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface DailyWritingLog {
  id: string; // "log_YYYY-MM-DD" or "log_userId_YYYY-MM-DD"
  date: string; // "YYYY-MM-DD"
  userId?: string;
  totalWordsWritten: number;
  bookBreakdown: Record<string, {
    bookId: string;
    bookTitle: string;
    wordsWritten: number;
    chaptersWorked?: { chapterId: string; chapterTitle: string; words: number }[];
  }>;
  meetsStreakGoal?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WritingStreakStatus {
  currentStreakDays: number;
  unlockedStreak: boolean; // true if consecutive qualified days >= 5
  consecutiveDaysAchieved: number;
  todayDate: string;
  todayWords: number;
  yesterdayWords: number;
  requiredWordsToday: number; // yesterdayWords + 10 (or 10 if starting)
  todayGoalMet: boolean;
  bestStreakDays: number;
}

export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  tip: string;
  category: 'constancia' | 'bloqueo' | 'habito' | 'superacion';
}

export interface DailyNotificationReminder {
  id: string;
  date: string;
  title: string;
  message: string;
  type: 'streak_danger' | 'streak_active' | 'streak_unlocked' | 'daily_inspiration';
  timestamp: string;
  read?: boolean;
}
