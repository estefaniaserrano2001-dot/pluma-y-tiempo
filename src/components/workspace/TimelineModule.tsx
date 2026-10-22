import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Clock,
  GitBranch,
  Link as LinkIcon,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  Layers,
  ArrowRight,
  CornerDownRight,
  LayoutList,
  Sparkles,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import {
  TimelineEvent,
  TimelineConnection,
  TimelineTrack,
  TimelineCategory,
  ConnectionRelationType,
  ConnectionDirection,
} from '../../types';
import { getTheme } from '../../utils/theme';
import { ColorGridPicker } from '../common/ColorGridPicker';

const RELATION_TYPES: { id: ConnectionRelationType; label: string }[] = [
  { id: 'causa_consecuencia', label: 'Causa y consecuencia' },
  { id: 'continuacion', label: 'Continuación temporal' },
  { id: 'paralelismo', label: 'Paralelismo simultáneo' },
  { id: 'contradiccion', label: 'Contradicción / Paradoja' },
  { id: 'revelacion', label: 'Revelación clave' },
  { id: 'dependencia', label: 'Dependencia' },
  { id: 'coincidencia', label: 'Coincidencia' },
  { id: 'personalizada', label: 'Relación libre' },
];

export const TimelineModule: React.FC = () => {
  const { activeBook, currentPalette, darkMode, toast, setIsSaving, customPalettes } = useApp();
  const theme = getTheme(currentPalette, darkMode, customPalettes);

  // Core Data
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [connections, setConnections] = useState<TimelineConnection[]>([]);
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [categories, setCategories] = useState<TimelineCategory[]>([]);

  // Active track filter (tabs like chapters)
  const [activeTrackId, setActiveTrackId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewOrientation, setViewOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Selected item to display in the Details Window
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Zoom / Pan for horizontal timeline window
  const [zoom, setZoom] = useState<number>(1);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const [isSubPointModalOpen, setIsSubPointModalOpen] = useState(false);
  const [subPointParentId, setSubPointParentId] = useState<string>('');

  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<TimelineConnection | null>(null);

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TimelineTrack | null>(null);

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'event' | 'connection' | 'track';
    id: string;
    title: string;
  } | null>(null);

  // Point Form
  const [pointTitle, setPointTitle] = useState('');
  const [pointDateDisplay, setPointDateDisplay] = useState('');
  const [pointNumericValue, setPointNumericValue] = useState<number>(1400);
  const [pointTrackId, setPointTrackId] = useState('');
  const [pointColor, setPointColor] = useState('#D4AF37');
  const [pointDesc, setPointDesc] = useState('');

  // SubPoint Form
  const [subTitle, setSubTitle] = useState('');
  const [subDateDisplay, setSubDateDisplay] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subColor, setSubColor] = useState('#3E5C49');

  // Connection Form
  const [connSourceId, setConnSourceId] = useState('');
  const [connTargetId, setConnTargetId] = useState('');
  const [connRelation, setConnRelation] = useState<ConnectionRelationType>('causa_consecuencia');
  const [connDirection, setConnDirection] = useState<ConnectionDirection>('unidireccional');
  const [connTitle, setConnTitle] = useState('');
  const [connColor, setConnColor] = useState('#D4AF37');

  // Track Form
  const [trackTitle, setTrackTitle] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  const [trackColor, setTrackColor] = useState('#D4AF37');

  // Load data
  const loadData = useCallback(async () => {
    if (!activeBook) return;
    const [evs, conns, trks, cats] = await Promise.all([
      dbService.getTimelineEventsByBook(activeBook.id),
      dbService.getTimelineConnectionsByBook(activeBook.id),
      dbService.getTimelineTracksByBook(activeBook.id),
      dbService.getTimelineCategories(activeBook.id),
    ]);

    setEvents(evs);
    setConnections(conns);
    setTracks(trks);
    setCategories(cats);

    if (trks.length > 0) {
      setActiveTrackId((prev) => {
        if (prev === 'all' || trks.some((t) => t.id === prev)) return prev;
        const main = trks.find((t) => t.isMain) || trks[0];
        return main.id;
      });
    }
  }, [activeBook]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active track object
  const activeTrack = useMemo(() => {
    if (activeTrackId === 'all') return null;
    return tracks.find((t) => t.id === activeTrackId) || null;
  }, [tracks, activeTrackId]);

  // Separate main points (root events) from sub-points (events with parentEventId)
  const { rootEvents, subEventsByParent, allFilteredEvents } = useMemo(() => {
    // 1. Filter events based on active track and search
    const filtered = events.filter((ev) => {
      if (activeTrackId !== 'all') {
        const matchesTrack =
          ev.timelineTrackId === activeTrackId ||
          (!ev.timelineTrackId && activeTrack?.isMain);
        if (!matchesTrack) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.description?.toLowerCase().includes(q) ||
          ev.dateDisplay?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // 2. Sort chronologically by numericSortValue
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a.numericSortValue ?? a.numericValue ?? 0;
      const bVal = b.numericSortValue ?? b.numericValue ?? 0;
      return aVal - bVal;
    });

    const roots: TimelineEvent[] = [];
    const subsMap = new Map<string, TimelineEvent[]>();

    sorted.forEach((ev) => {
      if (ev.parentEventId) {
        const list = subsMap.get(ev.parentEventId) || [];
        list.push(ev);
        subsMap.set(ev.parentEventId, list);
      } else {
        roots.push(ev);
      }
    });

    return {
      rootEvents: roots,
      subEventsByParent: subsMap,
      allFilteredEvents: sorted,
    };
  }, [events, activeTrackId, activeTrack, searchQuery]);

  // Selected event object (can be main point or subpoint)
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // If selected event is a sub-point, find its parent
  const selectedEventParent = useMemo(() => {
    if (!selectedEvent?.parentEventId) return null;
    return events.find((e) => e.id === selectedEvent.parentEventId) || null;
  }, [selectedEvent, events]);

  // Subpoints of the currently selected event
  const selectedEventSubPoints = useMemo(() => {
    if (!selectedEventId) return [];
    return subEventsByParent.get(selectedEventId) || [];
  }, [selectedEventId, subEventsByParent]);

  // Connections linked to the currently selected event
  const selectedEventConnections = useMemo(() => {
    if (!selectedEventId) return [];
    return connections.filter(
      (c) => c.sourceEventId === selectedEventId || c.targetEventId === selectedEventId
    );
  }, [selectedEventId, connections]);

  // Filtered connections visible in current track
  const visibleConnections = useMemo(() => {
    const eventIdSet = new Set(allFilteredEvents.map((e) => e.id));
    return connections.filter((c) => {
      const hasSrc = eventIdSet.has(c.sourceEventId);
      const hasTgt = eventIdSet.has(c.targetEventId);
      return hasSrc && hasTgt;
    });
  }, [connections, allFilteredEvents]);

  // Event positions on horizontal track to draw connection curves
  const eventPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const cardWidth = 260 * zoom;
    const gap = 60 * zoom;
    const startX = 60;
    const axisY = 160;

    rootEvents.forEach((ev, idx) => {
      const x = startX + idx * (cardWidth + gap) + cardWidth / 2;
      positions.set(ev.id, { x, y: axisY });

      // Sub-points positions under this root
      const subs = subEventsByParent.get(ev.id) || [];
      subs.forEach((sub, sIdx) => {
        const subY = axisY + 140 + sIdx * 54;
        positions.set(sub.id, { x, y: subY });
      });
    });

    return positions;
  }, [rootEvents, subEventsByParent, zoom]);

  // Handlers for Point (Hito Principal)
  const openNewPointModal = () => {
    setEditingEvent(null);
    setPointTitle('');
    setPointDateDisplay(`Año ${events.length > 0 ? 1400 + events.length * 5 : 1400}`);
    setPointNumericValue(events.length > 0 ? 1400 + events.length * 5 : 1400);
    setPointTrackId(activeTrackId !== 'all' ? activeTrackId : tracks[0]?.id || '');
    setPointColor(activeTrack?.color || '#D4AF37');
    setPointDesc('');
    setIsPointModalOpen(true);
  };

  const openEditPointModal = (ev: TimelineEvent) => {
    setEditingEvent(ev);
    setPointTitle(ev.title);
    setPointDateDisplay(ev.dateDisplay || `Año ${ev.numericSortValue}`);
    setPointNumericValue(ev.numericValue ?? ev.numericSortValue ?? 1400);
    setPointTrackId(ev.timelineTrackId || tracks[0]?.id || '');
    setPointColor(ev.color || '#D4AF37');
    setPointDesc(ev.description || '');
    setIsPointModalOpen(true);
  };

  const handleSavePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointTitle.trim() || !activeBook) return;

    setIsSaving(true);
    try {
      const eventId =
        editingEvent?.id || 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const record: TimelineEvent = {
        id: eventId,
        bookId: activeBook.id,
        timelineTrackId: pointTrackId || (activeTrackId !== 'all' ? activeTrackId : tracks[0]?.id),
        title: pointTitle.trim(),
        description: pointDesc.trim(),
        dateType: editingEvent?.dateType || 'exacta',
        dateDisplay: pointDateDisplay.trim() || `Año ${pointNumericValue}`,
        numericSortValue: Number(pointNumericValue) || 1400,
        numericValue: Number(pointNumericValue) || 1400,
        category: editingEvent?.category || 'trama_principal',
        color: pointColor,
        status: editingEvent?.status || 'confirmado',
        characterIds: editingEvent?.characterIds || [],
        chapterIds: editingEvent?.chapterIds || [],
        parentEventId: editingEvent?.parentEventId || null,
        createdAt: editingEvent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveTimelineEvent(record);
      await loadData();
      setSelectedEventId(record.id);
      setIsPointModalOpen(false);
      toast(editingEvent ? 'Punto actualizado' : 'Punto añadido a la línea de tiempo', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Sub-point
  const openNewSubPointModal = (parentId?: string) => {
    const parent = parentId || selectedEventId || (rootEvents[0]?.id ?? '');
    if (!parent) {
      toast('Primero debes crear o seleccionar un punto principal', 'info');
      return;
    }
    setSubPointParentId(parent);
    setSubTitle('');
    setSubDateDisplay('Poco después');
    setSubDesc('');
    const parentObj = events.find((e) => e.id === parent);
    setSubColor(parentObj?.color || '#3E5C49');
    setIsSubPointModalOpen(true);
  };

  const handleSaveSubPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim() || !subPointParentId || !activeBook) return;

    setIsSaving(true);
    try {
      const parent = events.find((e) => e.id === subPointParentId);
      const subId = 'ev_sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const parentNum = parent?.numericSortValue ?? 1400;

      const record: TimelineEvent = {
        id: subId,
        bookId: activeBook.id,
        timelineTrackId: parent?.timelineTrackId || (activeTrackId !== 'all' ? activeTrackId : tracks[0]?.id),
        title: subTitle.trim(),
        description: subDesc.trim(),
        dateType: 'relativa',
        dateDisplay: subDateDisplay.trim() || 'Sub-acontecimiento',
        numericSortValue: parentNum + 0.1,
        numericValue: parentNum + 0.1,
        category: parent?.category || 'trama_principal',
        color: subColor,
        status: 'confirmado',
        characterIds: [],
        chapterIds: [],
        parentEventId: subPointParentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveTimelineEvent(record);
      await loadData();
      setSelectedEventId(record.id);
      setIsSubPointModalOpen(false);
      toast('Sub-punto añadido con éxito', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Connection
  const openNewConnectionModal = (sourceId?: string, targetId?: string) => {
    if (events.length < 2) {
      toast('Se requieren al menos 2 acontecimientos para crear una conexión', 'info');
      return;
    }
    setEditingConnection(null);
    const src = sourceId || selectedEventId || events[0]?.id || '';
    const tgt = targetId || events.find((e) => e.id !== src)?.id || '';
    setConnSourceId(src);
    setConnTargetId(tgt);
    setConnRelation('causa_consecuencia');
    setConnDirection('unidireccional');
    setConnTitle('Causa y efecto');
    setConnColor('#D4AF37');
    setIsConnModalOpen(true);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connSourceId || !connTargetId || connSourceId === connTargetId || !activeBook) {
      toast('Selecciona dos puntos distintos para enlazar', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const connId =
        editingConnection?.id ||
        'conn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const record: TimelineConnection = {
        id: connId,
        bookId: activeBook.id,
        timelineTrackId: activeTrackId !== 'all' ? activeTrackId : tracks[0]?.id,
        title: connTitle.trim() || 'Conexión causal',
        description: '',
        sourceEventId: connSourceId,
        targetEventId: connTargetId,
        relationType: connRelation,
        direction: connDirection,
        color: connColor,
        style: 'solid',
        labelVisible: true,
        createdAt: editingConnection?.createdAt || new Date().toISOString(),
      };

      await dbService.saveTimelineConnection(record);
      await loadData();
      setIsConnModalOpen(false);
      toast('Conexión guardada con éxito', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Track (Línea de tiempo)
  const openNewTrackModal = (track?: TimelineTrack) => {
    if (track) {
      setEditingTrack(track);
      setTrackTitle(track.title);
      setTrackDesc(track.description || '');
      setTrackColor(track.color || '#D4AF37');
    } else {
      setEditingTrack(null);
      setTrackTitle('');
      setTrackDesc('');
      setTrackColor('#D4AF37');
    }
    setIsTrackModalOpen(true);
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !activeBook) return;

    setIsSaving(true);
    try {
      const trackId =
        editingTrack?.id ||
        'track_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const record: TimelineTrack = {
        id: trackId,
        bookId: activeBook.id,
        title: trackTitle.trim(),
        description: trackDesc.trim(),
        color: trackColor,
        order: editingTrack?.order ?? tracks.length,
        isMain: editingTrack?.isMain ?? (tracks.length === 0),
        createdAt: editingTrack?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveTimelineTrack(record);
      await loadData();
      setActiveTrackId(record.id);
      setIsTrackModalOpen(false);
      toast(editingTrack ? 'Línea de tiempo actualizada' : 'Nueva línea de tiempo creada', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Action Dispatcher
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem || !activeBook) return;
    setIsSaving(true);
    try {
      if (deleteConfirmItem.type === 'event') {
        await dbService.deleteTimelineEvent(deleteConfirmItem.id);
        if (selectedEventId === deleteConfirmItem.id) setSelectedEventId(null);
        toast(`Acontecimiento "${deleteConfirmItem.title}" eliminado`, 'info');
      } else if (deleteConfirmItem.type === 'connection') {
        await dbService.deleteTimelineConnection(deleteConfirmItem.id);
        toast('Conexión eliminada', 'info');
      } else if (deleteConfirmItem.type === 'track') {
        if (tracks.length <= 1) {
          toast('No puedes eliminar la única línea de tiempo del libro', 'error');
          return;
        }
        await dbService.deleteTimelineTrack(deleteConfirmItem.id, activeBook.id);
        const remaining = tracks.filter((t) => t.id !== deleteConfirmItem.id);
        setActiveTrackId(remaining[0]?.id || 'all');
        toast(`Línea "${deleteConfirmItem.title}" eliminada`, 'info');
      }
      await loadData();
      setDeleteConfirmItem(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-[calc(100vh-10rem)]">
      {/* 1. TIMELINE TRACKS TABS BAR (Líneas de tiempo como capítulos) */}
      <div
        className={`p-2.5 rounded-2xl border shadow-xs flex items-center justify-between gap-3 overflow-x-auto no-scrollbar ${theme.bgCard} ${theme.borderCard}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-serif font-bold text-stone-600 dark:text-stone-300 shrink-0">
            <GitBranch className="w-4 h-4 text-amber-500" />
            <span>Líneas:</span>
          </div>

          {/* Unified All-Tracks Tab */}
          <button
            onClick={() => setActiveTrackId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activeTrackId === 'all'
                ? `${theme.activeTab} shadow-xs font-bold`
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Todas ({events.filter((e) => !e.parentEventId).length})
          </button>

          {/* Individual Track Tabs */}
          {tracks.map((trk) => {
            const count = events.filter(
              (e) =>
                !e.parentEventId &&
                (e.timelineTrackId === trk.id || (!e.timelineTrackId && trk.isMain))
            ).length;
            const isActive = activeTrackId === trk.id;

            return (
              <div
                key={trk.id}
                className={`group flex items-center rounded-xl transition-all shrink-0 ${
                  isActive
                    ? 'bg-amber-500/15 border border-amber-500/30 font-bold'
                    : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <button
                  onClick={() => setActiveTrackId(trk.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: trk.color }}
                  />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{trk.title}</span>
                  <span className="text-[10px] font-mono text-stone-400">({count})</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openNewTrackModal(trk);
                  }}
                  className="p-1 mr-1 text-stone-400 hover:text-amber-600 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Editar nombre y color de esta línea"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* New Track Button */}
          <button
            onClick={() => openNewTrackModal()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-stone-300 dark:border-stone-700 text-stone-500 hover:text-amber-600 hover:border-amber-500 shrink-0 transition-all"
            title="Crear una nueva línea de tiempo"
          >
            <Plus className="w-3 h-3" />
            <span>Nueva Línea</span>
          </button>
        </div>

        {/* View Layout Toggle: Horizontal vs Vertical */}
        <div className="flex items-center gap-1 shrink-0 bg-stone-100 dark:bg-stone-800/80 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => setViewOrientation('horizontal')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewOrientation === 'horizontal'
                ? `${theme.activeTab} font-semibold shadow-xs`
                : 'text-stone-500'
            }`}
            title="Vista horizontal interactiva en eje de tiempo"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horizontal</span>
          </button>
          <button
            onClick={() => setViewOrientation('vertical')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              viewOrientation === 'vertical'
                ? `${theme.activeTab} font-semibold shadow-xs`
                : 'text-stone-500'
            }`}
            title="Vista vertical en lista cronológica continua"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Vertical</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN OPTIONS BAR (Línea de opciones clara para agregar punto, sub-punto y conexiones) */}
      <div
        className={`p-3 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-3 ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Left: Direct Creation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. AGREGAR PUNTO PRINCIPAL */}
          <button
            onClick={openNewPointModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs ${theme.primaryBtn}`}
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Punto</span>
          </button>

          {/* 2. AGREGAR SUB-PUNTO */}
          <button
            onClick={() => openNewSubPointModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 bg-stone-100/70 dark:bg-stone-800/70 hover:bg-stone-200/80 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-all shadow-xs"
            title="Agregar un sub-acontecimiento que depende de un punto principal"
          >
            <CornerDownRight className="w-3.5 h-3.5 text-amber-500" />
            <span>Agregar Sub-punto</span>
          </button>

          {/* 3. AGREGAR CONEXIÓN */}
          <button
            onClick={() => openNewConnectionModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 bg-stone-100/70 dark:bg-stone-800/70 hover:bg-stone-200/80 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-all shadow-xs"
            title="Crear un vínculo o relación entre dos puntos"
          >
            <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>Agregar Conexión</span>
          </button>
        </div>

        {/* Right: Search & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en la línea..."
              className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none w-36 sm:w-48`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {viewOrientation === 'horizontal' && (
            <div className="flex items-center gap-0.5 border border-stone-200 dark:border-stone-800 rounded-xl p-0.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-black/5 dark:hover:bg-white/5"
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 text-stone-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-black/5 dark:hover:bg-white/5"
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE (Ventana organizada como una línea de tiempo + Ventana de detalles) */}
      <div className="flex-1 flex gap-3 h-[72vh] relative overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm bg-stone-100/40 dark:bg-stone-950/60">
        {/* TIMELINE WINDOW */}
        <div
          ref={timelineScrollRef}
          className="flex-1 overflow-auto p-4 sm:p-6 relative select-none"
        >
          {rootEvents.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 mb-2">
                Línea de tiempo despejada
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed">
                Organiza aquí los acontecimientos clave de tu historia. Puedes agregar puntos
                principales, desplegar sub-puntos y trazar conexiones de causa y efecto.
              </p>
              <button
                onClick={openNewPointModal}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md ${theme.primaryBtn}`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Primer Punto</span>
              </button>
            </div>
          ) : viewOrientation === 'horizontal' ? (
            /* HORIZONTAL TIMELINE CANVAS */
            <div
              className="relative min-w-max min-h-[580px] pb-16 pt-8 pr-24"
              style={{ minWidth: `${Math.max(1000, rootEvents.length * 320 * zoom + 160)}px` }}
            >
              {/* Luminous Central Timeline Track Axis (Tappable to add points) */}
              <div
                onClick={openNewPointModal}
                className="absolute left-10 right-10 h-2 rounded-full top-[160px] cursor-pointer group z-0 transition-all hover:h-2.5 hover:ring-2 hover:ring-amber-400/40"
                style={{
                  background: `linear-gradient(90deg, ${theme.accentHex}40, #D4AF37, ${theme.accentHex}40)`,
                  boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
                }}
                title="Toca para agregar un punto en la línea de tiempo"
              />

              {/* SVG Connections Layer */}
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="glow-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#E6CA65" stopOpacity="0.8" />
                  </linearGradient>
                  <marker
                    id="arrow-end"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#D4AF37" />
                  </marker>
                  <marker
                    id="arrow-start"
                    viewBox="0 0 10 10"
                    refX="2"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 10 1 L 0 5 L 10 9 z" fill="#D4AF37" />
                  </marker>
                </defs>

                {visibleConnections.map((conn) => {
                  const p1 = eventPositions.get(conn.sourceEventId);
                  const p2 = eventPositions.get(conn.targetEventId);
                  if (!p1 || !p2) return null;

                  const isSelected =
                    selectedEventId === conn.sourceEventId ||
                    selectedEventId === conn.targetEventId;

                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const curveHeight = Math.max(50, Math.min(130, Math.abs(dx) * 0.25));
                  const cy = Math.min(p1.y, p2.y) - curveHeight;

                  const path = `M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${cy}, ${p2.x} ${p2.y}`;
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2 - curveHeight * 0.5;

                  const color = conn.color || '#D4AF37';

                  return (
                    <g key={conn.id} className="cursor-pointer pointer-events-auto">
                      {/* Glow stroke */}
                      <path
                        d={path}
                        stroke={color}
                        strokeWidth={isSelected ? 6 : 3.5}
                        opacity={isSelected ? 0.7 : 0.35}
                        fill="none"
                      />
                      {/* Foreground line */}
                      <path
                        d={path}
                        stroke={color}
                        strokeWidth={isSelected ? 2.5 : 1.8}
                        strokeDasharray={conn.relationType === 'contradiccion' ? '4,4' : undefined}
                        fill="none"
                        markerEnd="url(#arrow-end)"
                        markerStart={
                          conn.direction === 'bidireccional' ? 'url(#arrow-start)' : undefined
                        }
                      />
                      {/* Relationship Pill */}
                      <foreignObject
                        x={midX - 60}
                        y={midY - 12}
                        width={120}
                        height={26}
                        className="overflow-visible"
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConnection(conn);
                            setConnSourceId(conn.sourceEventId);
                            setConnTargetId(conn.targetEventId);
                            setConnRelation(conn.relationType);
                            setConnDirection(conn.direction);
                            setConnTitle(conn.title);
                            setConnColor(conn.color || '#D4AF37');
                            setIsConnModalOpen(true);
                          }}
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold text-center truncate cursor-pointer transition-all shadow-xs ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300'
                              : 'bg-stone-900/90 text-stone-100 border-stone-700 hover:bg-stone-800'
                          }`}
                          title={`${conn.title} (${conn.relationType}) - Clic para editar`}
                        >
                          {conn.title || 'Conexión'}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>

              {/* Points & Sub-Points Nodes Row */}
              <div className="flex items-start gap-14 relative z-10 pt-2 pl-4">
                {rootEvents.map((ev, index) => {
                  const isSelected = selectedEventId === ev.id;
                  const subs = subEventsByParent.get(ev.id) || [];
                  const eventColor = ev.color || '#D4AF37';

                  return (
                    <div
                      key={ev.id}
                      style={{ width: `${260 * zoom}px` }}
                      className="flex flex-col items-center shrink-0"
                    >
                      {/* Top: Date Pill */}
                      <div className="mb-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-xs border border-stone-300 dark:border-stone-700">
                          {ev.dateDisplay || `Año ${ev.numericSortValue}`}
                        </span>
                      </div>

                      {/* Timeline Central Marker Node */}
                      <div
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`w-7 h-7 rounded-full border-2 border-white dark:border-stone-900 shadow-md cursor-pointer flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-4 ring-amber-500 scale-125 z-20'
                            : 'hover:scale-115 hover:ring-2 hover:ring-amber-400'
                        }`}
                        style={{ backgroundColor: eventColor }}
                        title="Toca para ver detalles"
                      >
                        <span className="text-[10px] font-bold text-white font-mono">
                          {index + 1}
                        </span>
                      </div>

                      {/* Main Point Card */}
                      <div
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`w-full mt-3 p-3.5 rounded-2xl border text-left cursor-pointer transition-all shadow-sm ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug">
                            {ev.title}
                          </h4>
                        </div>

                        {ev.description && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mb-2">
                            {ev.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                          <span>{subs.length} sub-puntos</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                            Ver detalles →
                          </span>
                        </div>
                      </div>

                      {/* Sub-Points Branching Under This Point */}
                      {subs.length > 0 && (
                        <div className="w-full mt-2 pl-3 relative flex flex-col gap-1.5">
                          {/* Connector line to sub-points */}
                          <div className="absolute left-1 top-0 bottom-2 w-0.5 bg-amber-500/40" />

                          {subs.map((sub) => {
                            const isSubSelected = selectedEventId === sub.id;
                            return (
                              <div
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventId(sub.id);
                                }}
                                className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs ${
                                  isSubSelected
                                    ? 'bg-amber-500/15 border-amber-500 font-bold'
                                    : 'bg-stone-50/90 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700/60 hover:bg-stone-100 dark:hover:bg-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: sub.color || eventColor }}
                                  />
                                  <div className="truncate">
                                    <p className="text-[11px] truncate text-stone-800 dark:text-stone-200">
                                      {sub.title}
                                    </p>
                                    <span className="text-[9px] font-mono text-stone-400 block">
                                      {sub.dateDisplay}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Direct "+ Sub-punto" shortcut under the card */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNewSubPointModal(ev.id);
                        }}
                        className="mt-2 text-[10px] font-semibold text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir sub-punto</span>
                      </button>
                    </div>
                  );
                })}

                {/* Card to add a new point directly on tap */}
                <div className="flex flex-col items-center shrink-0 pt-6">
                  <button
                    onClick={openNewPointModal}
                    className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition-all w-48 h-56 cursor-pointer group shadow-xs"
                    title="Toca para agregar un punto"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 group-hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner transition-transform group-hover:scale-110">
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <span className="font-serif font-bold text-xs text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                      Agregar Punto
                    </span>
                    <span className="text-[10px] text-stone-400 text-center mt-1">
                      Toca para abrir la ventana
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VERTICAL CHRONOLOGICAL TIMELINE */
            <div className="max-w-2xl mx-auto py-4 relative pl-6">
              {/* Continuous vertical line */}
              <div
                className="absolute left-[31px] top-6 bottom-6 w-1 rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${theme.accentHex}40, #D4AF37, ${theme.accentHex}40)`,
                }}
              />

              <div className="space-y-6">
                {rootEvents.map((ev, index) => {
                  const isSelected = selectedEventId === ev.id;
                  const subs = subEventsByParent.get(ev.id) || [];
                  const eventColor = ev.color || '#D4AF37';

                  return (
                    <div key={ev.id} className="relative flex items-start gap-4">
                      {/* Node Bullet */}
                      <div
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`w-8 h-8 rounded-full border-2 border-white dark:border-stone-900 shadow-md cursor-pointer flex items-center justify-center shrink-0 z-10 transition-transform ${
                          isSelected ? 'ring-4 ring-amber-500 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: eventColor }}
                      >
                        <span className="text-xs font-bold text-white font-mono">{index + 1}</span>
                      </div>

                      {/* Content Card */}
                      <div
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            {ev.dateDisplay || `Año ${ev.numericSortValue}`}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {subs.length} sub-puntos
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-1">
                          {ev.title}
                        </h4>

                        {ev.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed mb-3">
                            {ev.description}
                          </p>
                        )}

                        {/* Nested Sub-points */}
                        {subs.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-1.5 pl-2 border-l-2 border-l-amber-500/40">
                            {subs.map((sub) => (
                              <div
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventId(sub.id);
                                }}
                                className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                                    {sub.title}
                                  </span>
                                  <span className="text-[10px] text-stone-400 ml-2 font-mono">
                                    {sub.dateDisplay}
                                  </span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tap to add point in vertical view */}
              <div className="pt-4 pl-12">
                <button
                  onClick={openNewPointModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-xs font-bold text-amber-800 dark:text-amber-300 transition-all cursor-pointer shadow-xs"
                  title="Toca para agregar un punto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Toca para agregar un nuevo punto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. VENTANA DE DETALLES DEL PUNTO (Al tocar un punto se ven detalles y título) */}
        {selectedEvent ? (
          <div
            className={`w-80 sm:w-96 shrink-0 border-l flex flex-col justify-between shadow-xl z-20 animate-in slide-in-from-right duration-200 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedEvent.color || '#D4AF37' }}
                    />
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {selectedEvent.parentEventId ? 'Sub-punto' : 'Punto Principal'}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-snug">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    {selectedEvent.dateDisplay || `Año ${selectedEvent.numericSortValue}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-black/5"
                  title="Cerrar ventana de detalles"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable details content */}
              <div className="p-4 space-y-5 flex-1 overflow-y-auto">
                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Descripción del Acontecimiento
                  </label>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs font-serif leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                    {selectedEvent.description || 'Sin descripción detallada registrada.'}
                  </div>
                </div>

                {/* If it's a sub-point, show link to parent */}
                {selectedEventParent && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Punto Principal Superior
                    </label>
                    <div
                      onClick={() => setSelectedEventId(selectedEventParent.id)}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <span className="font-serif font-bold text-stone-800 dark:text-stone-200">
                        {selectedEventParent.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                )}

                {/* Sub-points List (if this is a main point) */}
                {!selectedEvent.parentEventId && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Sub-puntos ({selectedEventSubPoints.length})
                      </label>
                      <button
                        onClick={() => openNewSubPointModal(selectedEvent.id)}
                        className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar sub-punto</span>
                      </button>
                    </div>

                    {selectedEventSubPoints.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">
                        No hay sub-puntos vinculados todavía.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedEventSubPoints.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedEventId(sub.id)}
                            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-stone-800 dark:text-stone-200">
                                {sub.title}
                              </p>
                              <span className="text-[10px] font-mono text-stone-400">
                                {sub.dateDisplay}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Connections associated with this event */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Conexiones ({selectedEventConnections.length})
                    </label>
                    <button
                      onClick={() => openNewConnectionModal(selectedEvent.id)}
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Conectar</span>
                    </button>
                  </div>

                  {selectedEventConnections.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">
                      No hay conexiones directas a este acontecimiento.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedEventConnections.map((c) => {
                        const isSource = c.sourceEventId === selectedEvent.id;
                        const otherId = isSource ? c.targetEventId : c.sourceEventId;
                        const otherEvent = events.find((e) => e.id === otherId);

                        return (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="text-[9px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold block">
                                {isSource ? 'Hacia ➔' : 'Desde ➔'} {c.relationType.replace('_', ' ')}
                              </span>
                              <p className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                                {otherEvent?.title || 'Acontecimiento'}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setDeleteConfirmItem({
                                  type: 'connection',
                                  id: c.id,
                                  title: c.title,
                                })
                              }
                              className="p-1 rounded text-stone-400 hover:text-rose-600"
                              title="Eliminar conexión"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar in Details Panel */}
              <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
                <button
                  onClick={() => openEditPointModal(selectedEvent)}
                  className="flex-1 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() =>
                    setDeleteConfirmItem({
                      type: 'event',
                      id: selectedEvent.id,
                      title: selectedEvent.title,
                    })
                  }
                  className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  title="Eliminar acontecimiento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Details hint */
          <div className="hidden lg:flex w-72 shrink-0 border-l border-stone-200 dark:border-stone-800 items-center justify-center p-6 text-center text-stone-400">
            <div className="space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
              <p className="text-xs">Toca cualquier punto en la línea de tiempo para ver sus detalles, título y sub-puntos.</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODALS */}

      {/* A. AGREGAR / EDITAR PUNTO */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-[508px] max-w-full h-[500px] rounded-3xl border shadow-2xl p-6 flex flex-col overflow-y-auto ${theme.bgCard} ${theme.borderCard}`}
            style={{ width: '508px', height: '500px' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="font-serif font-bold text-base text-[#0d0d0c]"
                    style={{ color: '#0d0d0c' }}
                  >
                    {editingEvent ? 'Editar Punto' : 'Nuevo Punto en la Línea de Tiempo'}
                  </h3>
                  <p className="text-xs text-stone-400">Hito cronológico fundamental de la trama</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  form="timeline-point-form"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${theme.primaryBtn}`}
                  title="Guardar lo realizado"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Guardar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Cerrar ventana"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form id="timeline-point-form" onSubmit={handleSavePoint} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título del acontecimiento *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={pointTitle}
                  onChange={(e) => setPointTitle(e.target.value)}
                  placeholder="Ej: El Asedio a las Torres de Cristal"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Texto visual de fecha
                  </label>
                  <input
                    type="text"
                    value={pointDateDisplay}
                    onChange={(e) => setPointDateDisplay(e.target.value)}
                    placeholder="Año 1412, Otoño"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Año / Valor para ordenar
                  </label>
                  <input
                    type="number"
                    value={pointNumericValue}
                    onChange={(e) => setPointNumericValue(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Línea de Tiempo
                </label>
                <select
                  value={pointTrackId}
                  onChange={(e) => setPointTrackId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.isMain ? '(Principal)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <ColorGridPicker
                  value={pointColor}
                  onChange={setPointColor}
                  title="Color distintivo del punto"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Detalles y descripción
                </label>
                <textarea
                  rows={3}
                  value={pointDesc}
                  onChange={(e) => setPointDesc(e.target.value)}
                  placeholder="Explica qué sucede, personajes involucrados o consecuencias..."
                  className={`w-full p-3 rounded-xl border text-xs font-serif ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  title="Cerrar ventana sin guardar"
                >
                  <X className="w-4 h-4" />
                  <span>Cerrar</span>
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${theme.primaryBtn}`}
                  title="Guardar lo realizado"
                >
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Guardar lo realizado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. AGREGAR SUB-PUNTO */}
      {isSubPointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <CornerDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    Agregar Sub-punto
                  </h3>
                  <p className="text-xs text-stone-400">Sub-evento derivado de un punto principal</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  form="subpoint-form"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${theme.primaryBtn}`}
                  title="Guardar lo realizado"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Guardar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubPointModalOpen(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Cerrar ventana"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form id="subpoint-form" onSubmit={handleSaveSubPoint} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Punto Principal Padre *
                </label>
                <select
                  value={subPointParentId}
                  onChange={(e) => setSubPointParentId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                >
                  {rootEvents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.dateDisplay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título del sub-punto *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="Ej: Infiltración en la biblioteca secreta"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Fecha o Momento relativo
                </label>
                <input
                  type="text"
                  value={subDateDisplay}
                  onChange={(e) => setSubDateDisplay(e.target.value)}
                  placeholder="Ej: Tres días después, al atardecer"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Detalles específicos de este momento..."
                  className={`w-full p-3 rounded-xl border text-xs resize-none ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsSubPointModalOpen(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  title="Cerrar ventana sin guardar"
                >
                  <X className="w-4 h-4" />
                  <span>Cerrar</span>
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${theme.primaryBtn}`}
                  title="Guardar lo realizado"
                >
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Guardar lo realizado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. AGREGAR / EDITAR CONEXIÓN */}
      {isConnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {editingConnection ? 'Editar Conexión' : 'Nueva Conexión Narrativa'}
                  </h3>
                  <p className="text-xs text-stone-400">Vínculo de causa, revelación o continuidad</p>
                </div>
              </div>
              <button
                onClick={() => setIsConnModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Etiqueta de la conexión *
                </label>
                <input
                  type="text"
                  required
                  value={connTitle}
                  onChange={(e) => setConnTitle(e.target.value)}
                  placeholder="Ej: Causa directa de la huida"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Punto Origen
                  </label>
                  <select
                    value={connSourceId}
                    onChange={(e) => setConnSourceId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Punto Destino
                  </label>
                  <select
                    value={connTargetId}
                    onChange={(e) => setConnTargetId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tipo de Relación
                  </label>
                  <select
                    value={connRelation}
                    onChange={(e) => setConnRelation(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
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
                    Dirección
                  </label>
                  <select
                    value={connDirection}
                    onChange={(e) => setConnDirection(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="unidireccional">Flecha (➔)</option>
                    <option value="bidireccional">Recíproca (⇆)</option>
                    <option value="no_dirigida">Sin flecha (—)</option>
                  </select>
                </div>
              </div>

              <div>
                <ColorGridPicker
                  value={connColor}
                  onChange={setConnColor}
                  title="Color de la conexión"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsConnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
                >
                  Guardar Conexión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. CREAR / EDITAR LÍNEA DE TIEMPO */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {editingTrack ? 'Editar Línea' : 'Nueva Línea de Tiempo'}
                  </h3>
                  <p className="text-xs text-stone-400">Tramas paralelas o arcos cronológicos</p>
                </div>
              </div>
              <button
                onClick={() => setIsTrackModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre de la línea de tiempo *
                </label>
                <input
                  type="text"
                  required
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="Ej: Trama Secundaria del Reino del Norte"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={trackDesc}
                  onChange={(e) => setTrackDesc(e.target.value)}
                  placeholder="Marco histórico o tema..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs resize-none ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <ColorGridPicker
                  value={trackColor}
                  onChange={setTrackColor}
                  title="Color identificativo"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
                {editingTrack && !editingTrack.isMain && tracks.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrackModalOpen(false);
                      setDeleteConfirmItem({
                        type: 'track',
                        id: editingTrack.id,
                        title: editingTrack.title,
                      });
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Eliminar línea
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTrackModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. CONFIRMAR ELIMINACIÓN */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}>
            <h4 className="font-serif font-bold text-base text-rose-600 mb-2">
              ¿Eliminar {deleteConfirmItem.type === 'event' ? 'acontecimiento' : deleteConfirmItem.type === 'connection' ? 'conexión' : 'línea'}?
            </h4>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              Estás a punto de eliminar <strong>"{deleteConfirmItem.title}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-md"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
