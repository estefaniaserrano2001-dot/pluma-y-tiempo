import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Mic,
  Music,
  Play,
  Pause,
  RotateCcw,
  FileDown,
  Sparkles,
  Users,
  Clock,
  BookOpen,
  FileText,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { aiService } from '../../services/aiService';
import { Chapter, AudioRecord, Character, TimelineEvent, WorldDetail, PaletteTheme } from '../../types';
import { getTheme } from '../../utils/theme';
import { formatAudioDuration, formatBytes } from '../../utils/timelineEngine';
import { RichChapterEditor } from './RichChapterEditor';
import { IntegratedChapterAssistant } from './IntegratedChapterAssistant';

export const ChaptersModule: React.FC = () => {
  const {
    activeBook,
    currentPalette,
    darkMode,
    activeChapterId,
    setActiveChapterId,
    toast,
    setIsSaving,
    settings,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [details, setDetails] = useState<WorldDetail[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [chapterAudios, setChapterAudios] = useState<AudioRecord[]>([]);

  // Collapsible panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Editor states
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [content, setContent] = useState('');
  const [plainText, setPlainText] = useState('');
  const [status, setStatus] = useState<Chapter['status']>('borrador');
  const [privateNotes, setPrivateNotes] = useState('');
  const [relatedCharacterIds, setRelatedCharacterIds] = useState<string[]>([]);
  const [relatedTimelineEventIds, setRelatedTimelineEventIds] = useState<string[]>([]);
  const [selectedEditorText, setSelectedEditorText] = useState<string>('');

  // In-chapter search & replace
  const [showSearch, setShowSearch] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Audio recording player states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackTimes, setAudioPlaybackTimes] = useState<Record<string, number>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [isTranscribing, setIsTranscribing] = useState<string | null>(null);

  // Confirmation modal for deleting chapter
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);

  // Load all chapters for the active book
  const loadChapters = useCallback(async () => {
    if (!activeBook) return;
    const list = await dbService.getChaptersByBook(activeBook.id);
    setChapters(list);
    const chars = await dbService.getCharactersByBook(activeBook.id);
    setCharacters(chars);
    const dets = await dbService.getDetailsByBook(activeBook.id);
    setDetails(dets);
    const evs = await dbService.getTimelineEventsByBook(activeBook.id);
    setTimelineEvents(evs);

    if (list.length > 0) {
      if (activeChapterId) {
        const found = list.find((c) => c.id === activeChapterId);
        if (found) {
          selectChapter(found);
          return;
        }
      }
      selectChapter(list[0]);
    } else {
      setSelectedChapter(null);
    }
  }, [activeBook, activeChapterId]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  // Track word count baseline to record daily writing progress in calendar
  const prevWordCountRef = useRef<number>(0);

  const selectChapter = async (chap: Chapter) => {
    setSelectedChapter(chap);
    setActiveChapterId(chap.id);
    setTitle(chap.title);
    setSynopsis(chap.synopsis || '');
    setContent(chap.content || '');
    // compute plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chap.content || '';
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    setPlainText(cleanText);
    prevWordCountRef.current = cleanText.trim() ? cleanText.trim().split(/\s+/).length : 0;
    setStatus(chap.status);
    setPrivateNotes(chap.privateNotes || '');
    setRelatedCharacterIds(chap.relatedCharacterIds || []);
    setRelatedTimelineEventIds(chap.relatedTimelineEventIds || []);

    // Load audios for this chapter
    const audios = await dbService.getAudiosByChapter(chap.id);
    setChapterAudios(audios);
  };

  // Content change callback from RichChapterEditor
  const handleContentUpdate = (htmlVal: string, textVal: string) => {
    setContent(htmlVal);
    setPlainText(textVal);
  };

  // Word count & statistics calculated from clean text
  const wordCount = useMemo(() => {
    const trimmed = plainText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [plainText]);

  const characterCount = plainText.length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 220));

  // Debounced auto-save & calendar writing progress tracking
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!selectedChapter || !activeBook) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      const updated: Chapter = {
        ...selectedChapter,
        title: title || `Capítulo ${selectedChapter.number}`,
        synopsis,
        content,
        status,
        wordCount,
        characterCount,
        privateNotes,
        relatedCharacterIds,
        relatedTimelineEventIds,
        updatedAt: new Date().toISOString(),
      };
      await dbService.saveChapter(updated);
      setSelectedChapter(updated);
      setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      // If user typed new words, record in daily calendar writing log
      const prevWords = prevWordCountRef.current;
      if (wordCount > prevWords) {
        const delta = wordCount - prevWords;
        await dbService.recordWritingSession(
          activeBook.id,
          activeBook.title,
          delta,
          selectedChapter.id,
          updated.title
        );
        prevWordCountRef.current = wordCount;
      }

      setIsSaving(false);
    }, settings.autoSaveDelay || 1200);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [
    title,
    synopsis,
    content,
    status,
    privateNotes,
    relatedCharacterIds,
    relatedTimelineEventIds,
    wordCount,
    characterCount,
    selectedChapter,
    activeBook,
    settings.autoSaveDelay,
    setIsSaving,
  ]);

  // Create new chapter
  const handleCreateChapter = async () => {
    if (!activeBook) return;
    setIsSaving(true);
    const nextNumber = chapters.length + 1;
    const newChap: Chapter = {
      id: 'chap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      bookId: activeBook.id,
      order: nextNumber,
      number: nextNumber,
      title: `Capítulo ${nextNumber}`,
      synopsis: '',
      content: '<p></p>',
      status: 'pendiente',
      wordCount: 0,
      characterCount: 0,
      privateNotes: '',
      relatedCharacterIds: [],
      relatedTimelineEventIds: [],
      audioIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbService.saveChapter(newChap);
    await loadChapters();
    selectChapter(newChap);
    setIsSaving(false);
    toast(`Capítulo ${nextNumber} creado`, 'success');
  };

  // Reorder chapters (Up / Down)
  const handleMoveChapter = async (chap: Chapter, direction: 'up' | 'down') => {
    const idx = chapters.findIndex((c) => c.id === chap.id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === chapters.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...chapters];
    const temp = reordered[idx];
    reordered[idx] = reordered[swapIdx];
    reordered[swapIdx] = temp;

    for (let i = 0; i < reordered.length; i++) {
      reordered[i].order = i + 1;
      reordered[i].number = i + 1;
      await dbService.saveChapter(reordered[i]);
    }
    setChapters(reordered);
    toast('Orden de capítulos actualizado', 'info');
  };

  // Duplicate chapter
  const handleDuplicateChapter = async (chap: Chapter) => {
    if (!activeBook) return;
    setIsSaving(true);
    const nextNum = chapters.length + 1;
    const dup: Chapter = {
      ...chap,
      id: 'chap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: `${chap.title} (Copia)`,
      order: nextNum,
      number: nextNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audioIds: [],
    };
    await dbService.saveChapter(dup);
    await loadChapters();
    selectChapter(dup);
    setIsSaving(false);
    toast(`Capítulo duplicado como Capítulo ${nextNum}`, 'success');
  };

  // Delete chapter
  const handleDeleteConfirm = async () => {
    if (!chapterToDelete) return;
    setIsSaving(true);
    await dbService.deleteChapter(chapterToDelete.id);
    setChapterToDelete(null);
    await loadChapters();
    setIsSaving(false);
    toast('Capítulo eliminado', 'info');
  };

  // Search & Replace inside chapter HTML/text
  const handleReplaceOnce = () => {
    if (!findText) return;
    const idx = content.indexOf(findText);
    if (idx !== -1) {
      const updated = content.slice(0, idx) + replaceText + content.slice(idx + findText.length);
      setContent(updated);
      toast('Texto reemplazado en el documento', 'success');
    } else {
      toast('Coincidencia no encontrada', 'info');
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    if (content.includes(findText)) {
      const count = content.split(findText).length - 1;
      const updated = content.replaceAll(findText, replaceText);
      setContent(updated);
      toast(`${count} coincidencias reemplazadas`, 'success');
    } else {
      toast('Coincidencia no encontrada', 'info');
    }
  };

  // Apply correction suggested by Writing Assistant
  const handleApplyAssistantCorrection = (original: string, replacement: string) => {
    if (!content.includes(original)) {
      toast('No se encontró el fragmento exacto en el texto actual.', 'info');
      return;
    }
    const updated = content.replace(original, replacement);
    setContent(updated);
    toast('Corrección aplicada con éxito', 'success');
  };

  // Export current chapter to TXT file
  const handleExportTxt = () => {
    if (!selectedChapter) return;
    const header = `${selectedChapter.title.toUpperCase()}\n${'='.repeat(
      selectedChapter.title.length
    )}\nSinopsis: ${selectedChapter.synopsis || 'N/A'}\nPalabras: ${wordCount}\n\n`;
    const fullText = header + plainText;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedChapter.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Capítulo exportado a TXT', 'success');
  };

  // Audio upload handler (storing real Blobs in IndexedDB)
  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChapter || !activeBook) return;

    try {
      setIsSaving(true);
      const tempUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(tempUrl);

      const duration: number = await new Promise((resolve) => {
        tempAudio.onloadedmetadata = () => resolve(tempAudio.duration || 0);
        tempAudio.onerror = () => resolve(0);
      });
      URL.revokeObjectURL(tempUrl);

      const newAudioId = 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const audioRecord: AudioRecord = {
        id: newAudioId,
        bookId: activeBook.id,
        chapterId: selectedChapter.id,
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        mimeType: file.type || 'audio/mp3',
        size: file.size,
        duration,
        createdAt: new Date().toISOString(),
        notes: '',
      };

      await dbService.saveAudio(audioRecord, file);
      const updatedList = await dbService.getAudiosByChapter(selectedChapter.id);
      setChapterAudios(updatedList);
      toast(`Audio "${file.name}" cargado y guardado`, 'success');
    } catch (err: any) {
      toast('Error al guardar audio: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  // Audio Playback controls
  const togglePlayAudio = (audioId: string, url?: string) => {
    if (!url) return;

    let el = audioRefs.current[audioId];
    if (!el) {
      el = new Audio(url);
      el.playbackRate = playbackSpeed;
      audioRefs.current[audioId] = el;

      el.ontimeupdate = () => {
        setAudioPlaybackTimes((prev) => ({ ...prev, [audioId]: el.currentTime }));
      };
      el.onended = () => {
        setPlayingAudioId(null);
        setAudioPlaybackTimes((prev) => ({ ...prev, [audioId]: 0 }));
      };
      el.onloadedmetadata = () => {
        setAudioDurations((prev) => ({ ...prev, [audioId]: el.duration }));
      };
    }

    if (playingAudioId === audioId) {
      el.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId].pause();
      }
      el.play();
      setPlayingAudioId(audioId);
    }
  };

  const handleAudioSeek = (audioId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const el = audioRefs.current[audioId];
    if (el) {
      el.currentTime = val;
      setAudioPlaybackTimes((prev) => ({ ...prev, [audioId]: val }));
    }
  };

  const handleAudioSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    Object.values(audioRefs.current).forEach((el) => {
      el.playbackRate = speed;
    });
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!selectedChapter) return;
    if (playingAudioId === audioId && audioRefs.current[audioId]) {
      audioRefs.current[audioId].pause();
      setPlayingAudioId(null);
    }
    await dbService.deleteAudio(audioId);
    setChapterAudios((prev) => prev.filter((a) => a.id !== audioId));
    toast('Grabación eliminada', 'info');
  };

  // Real Audio Transcription via Gemini Transcribe
  const handleTranscribeAudio = async (record: AudioRecord) => {
    try {
      setIsTranscribing(record.id);
      const blob = await dbService.getAudioBlob(record.id);
      if (!blob) throw new Error('No se pudo recuperar el archivo de audio de la base de datos.');

      const res = await aiService.transcribeAudio(blob);
      if (res.transcription) {
        await dbService.updateAudioMetadata(record.id, {
          transcription: res.transcription,
        });
        setChapterAudios((prev) =>
          prev.map((a) => (a.id === record.id ? { ...a, transcription: res.transcription } : a))
        );
        toast('Transcripción completada con éxito', 'success');
      }
    } catch (err: any) {
      toast('Fallo al transcribir: ' + err.message, 'error');
    } finally {
      setIsTranscribing(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-10rem)] relative">
      {/* Collapsible Left Sidebar Button (when closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-2 bottom-6 z-40 p-2.5 rounded-xl border shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${theme.bgCard} ${theme.borderCard} ${theme.textPrimary}`}
          title="Mostrar lista de capítulos"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Capítulos ({chapters.length})</span>
        </button>
      )}

      {/* Left Sidebar: Chapters List & Reordering */}
      {isSidebarOpen && (
        <div
          className={`w-full lg:w-72 shrink-0 rounded-2xl border p-4 flex flex-col justify-between shadow-xs transition-all duration-300 ${theme.bgCard} ${theme.borderCard}`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  Capítulos
                </h3>
                <span className="text-[11px] text-stone-500">
                  {chapters.length} partes • {chapters.reduce((a, b) => a + b.wordCount, 0).toLocaleString()} palabras
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCreateChapter}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm ${theme.primaryBtn}`}
                  title="Añadir nuevo capítulo"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5"
                  title="Plegar panel lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapter cards in sidebar */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {chapters.map((chap) => {
                const isSelected = selectedChapter?.id === chap.id;
                return (
                  <div
                    key={chap.id}
                    onClick={() => selectChapter(chap)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? `${theme.activeBorder} ${theme.accentBadge} shadow-xs`
                        : `${theme.borderCard} hover:bg-black/5 dark:hover:bg-white/5`
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold ${theme.accentText}`}>
                          {chap.number}.
                        </span>
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? theme.textPrimary : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {chap.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-1">
                        <span>{chap.wordCount} palabras</span>
                        <span>•</span>
                        <span className="capitalize">{chap.status}</span>
                        {chap.audioIds?.length > 0 && (
                          <span className="flex items-center gap-0.5 text-blue-600">
                            <Music className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Move Up / Down order controls */}
                    <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveChapter(chap, 'up');
                        }}
                        className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        title="Mover hacia arriba"
                      >
                        <ChevronUp className="w-3 h-3 text-stone-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveChapter(chap, 'down');
                        }}
                        className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        title="Mover hacia abajo"
                      >
                        <ChevronDown className="w-3 h-3 text-stone-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Reorganiza con las flechas</span>
            <FileText className="w-3.5 h-3.5 text-stone-400" />
          </div>
        </div>
      )}

      {/* Main Chapter Workspace */}
      {selectedChapter ? (
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Chapter Meta Toolbar */}
          <div
            className={`p-3.5 md:p-4 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-3 ${theme.bgCard} ${theme.borderCard}`}
          >
            {/* Title & Status */}
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className={`px-2.5 py-1 rounded-lg ${theme.accentBadge} ${theme.accentText} font-mono text-xs font-bold shrink-0`}>
                Cap. {selectedChapter.number}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del capítulo..."
                className={`text-base font-serif font-bold bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:outline-none w-full ${theme.textPrimary}`}
              />
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="borrador">Borrador</option>
                <option value="revision">En Revisión</option>
                <option value="terminado">Terminado</option>
              </select>

              {/* In-chapter search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-xl border transition-all ${
                  showSearch
                    ? `${theme.activeTab} shadow-xs`
                    : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 border-stone-300 dark:border-stone-700'
                }`}
                title="Buscar y reemplazar dentro del capítulo"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Integrated Assistant Button */}
              <button
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  isAssistantOpen
                    ? `${theme.activeTab} shadow-md`
                    : `${theme.accentBadge} ${theme.accentText} hover:opacity-90 border-transparent`
                }`}
                title="Abrir Asistente de Escritura integrado para este capítulo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Asistente de Escritura</span>
              </button>

              {/* Export Chapter to TXT */}
              <button
                onClick={handleExportTxt}
                className="p-2 rounded-xl border text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 border-stone-300 dark:border-stone-700"
                title="Descargar este capítulo en formato TXT"
              >
                <FileDown className="w-3.5 h-3.5" />
              </button>

              {/* Duplicate chapter */}
              <button
                onClick={() => handleDuplicateChapter(selectedChapter)}
                className="p-2 rounded-xl border text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 border-stone-300 dark:border-stone-700"
                title="Duplicar capítulo"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Delete chapter */}
              <button
                onClick={() => setChapterToDelete(selectedChapter)}
                className="p-2 rounded-xl border text-rose-600 hover:bg-rose-500/10 border-rose-300 dark:border-rose-900"
                title="Eliminar capítulo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* In-Chapter Search & Replace Bar */}
          {showSearch && (
            <div
              className={`p-3.5 rounded-xl border flex flex-wrap items-center gap-3 animate-in fade-in duration-100 ${theme.bgCard} ${theme.borderCard}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar texto en el capítulo..."
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  className={`w-full text-xs bg-transparent focus:outline-none ${theme.textPrimary}`}
                />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Reemplazar por..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className={`w-full text-xs bg-transparent focus:outline-none ${theme.textPrimary}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReplaceOnce}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300"
                >
                  Reemplazar
                </button>
                <button
                  onClick={handleReplaceAll}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
                >
                  Todo
                </button>
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Chapter Synopsis Input */}
          <div className={`p-3.5 rounded-xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Sinopsis y objetivo del capítulo
            </label>
            <input
              type="text"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="¿Qué ocurre en este capítulo? (Objetivo dramático, giro o revelación principal)..."
              className={`w-full text-xs bg-transparent focus:outline-none ${theme.textPrimary}`}
            />
          </div>

          {/* Editor & Auxiliary Assistant Container */}
          <div className="flex flex-col xl:flex-row gap-5 items-start">
            {/* Rich Text Editor */}
            <div className="flex-1 w-full min-w-0">
              <RichChapterEditor
                initialContent={content}
                onChange={handleContentUpdate}
                palette={currentPalette as PaletteTheme}
                darkMode={darkMode}
                onTextSelected={setSelectedEditorText}
              />

              {/* Bottom Editor Bar: Metrics */}
              <div className={`p-3 mt-3 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between text-xs text-stone-500 gap-3 select-none ${theme.bgCard} ${theme.borderCard}`}>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium">
                    {wordCount.toLocaleString()} palabras
                  </span>
                  <span>•</span>
                  <span className="font-mono">{characterCount.toLocaleString()} caracteres</span>
                  <span>•</span>
                  <span>~{estimatedReadTime} min de lectura estimada</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400">
                    Última edición: {new Date(selectedChapter.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Auxiliary Writing Assistant Panel (integrated in chapter) */}
            {isAssistantOpen && (
              <div className="w-full xl:w-96 shrink-0 sticky top-4">
                <IntegratedChapterAssistant
                  chapter={{ ...selectedChapter, content }}
                  characters={characters}
                  details={details}
                  timelineEvents={timelineEvents}
                  palette={currentPalette as PaletteTheme}
                  darkMode={darkMode}
                  selectedText={selectedEditorText}
                  onApplyCorrection={handleApplyAssistantCorrection}
                  onClose={() => setIsAssistantOpen(false)}
                  isOpen={isAssistantOpen}
                />
              </div>
            )}
          </div>

          {/* Connected Entities: Characters & Timeline Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Related Characters */}
            <div className={`p-4 rounded-2xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  Personajes presentes en este capítulo
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {characters.length === 0 ? (
                  <span className="text-xs text-stone-400">No hay personajes creados aún.</span>
                ) : (
                  characters.map((char) => {
                    const isChecked = relatedCharacterIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          setRelatedCharacterIds(
                            isChecked
                              ? relatedCharacterIds.filter((id) => id !== char.id)
                              : [...relatedCharacterIds, char.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? 'border-purple-600 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold'
                            : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-purple-600" />}
                        <span>{char.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Related Timeline Events */}
            <div className={`p-4 rounded-2xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Acontecimientos temporales vinculados
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {timelineEvents.length === 0 ? (
                  <span className="text-xs text-stone-400">No hay acontecimientos en la línea de tiempo.</span>
                ) : (
                  timelineEvents.map((ev) => {
                    const isChecked = relatedTimelineEventIds.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setRelatedTimelineEventIds(
                            isChecked
                              ? relatedTimelineEventIds.filter((id) => id !== ev.id)
                              : [...relatedTimelineEventIds, ev.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? 'border-rose-600 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold'
                            : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-rose-600" />}
                        <span>{ev.title}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Private Notes Section */}
          <div className={`p-4 rounded-2xl border shadow-xs ${theme.bgCard} ${theme.borderCard}`}>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Notas privadas del autor para este capítulo
            </label>
            <textarea
              rows={2}
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Anotaciones para la próxima sesión, dudas sobre el ritmo, pistas sembradas..."
              className={`w-full p-3 rounded-xl border text-xs ${theme.borderCard} bg-stone-50/50 dark:bg-stone-900/50 ${theme.textPrimary} focus:outline-none font-sans`}
            />
          </div>

          {/* AUDIO RECORDINGS FOR THIS CHAPTER */}
          <div
            className={`p-5 rounded-3xl border shadow-sm space-y-4 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                    Grabaciones de Audio de este Capítulo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Sube audios con notas de voz, lecturas o ideas. Se guardan en almacenamiento local persistente (IndexedDB).
                  </p>
                </div>
              </div>

              {/* Upload audio button */}
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 shadow-xs self-start sm:self-auto">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Subir Grabación (MP3, WAV, M4A)</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                  className="hidden"
                  onChange={handleUploadAudio}
                />
              </label>
            </div>

            {/* Audios List */}
            {chapterAudios.length === 0 ? (
              <div className="text-center py-6 text-stone-500 text-xs">
                <Music className="w-7 h-7 mx-auto mb-2 opacity-40 text-stone-400" />
                No hay grabaciones añadidas a este capítulo. Puedes grabar notas con tu móvil o micrófono y subirlas aquí.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Global Speed Selector */}
                <div className="flex items-center justify-end gap-1.5 text-xs text-stone-500 pb-1">
                  <span>Velocidad de reproducción:</span>
                  {[0.75, 1, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleAudioSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                        playbackSpeed === spd
                          ? `${theme.activeTab} shadow-xs`
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {chapterAudios.map((aud) => {
                  const isPlaying = playingAudioId === aud.id;
                  const currentTime = audioPlaybackTimes[aud.id] || 0;
                  const duration = audioDurations[aud.id] || aud.duration || 1;
                  const isTranscribingThis = isTranscribing === aud.id;

                  return (
                    <div
                      key={aud.id}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className={`text-sm font-bold truncate ${theme.textPrimary}`}>
                            {aud.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-0.5">
                            <span>{aud.fileName}</span>
                            <span>•</span>
                            <span>{formatBytes(aud.size)}</span>
                            <span>•</span>
                            <span>{new Date(aud.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Transcribe Button */}
                          <button
                            onClick={() => handleTranscribeAudio(aud)}
                            disabled={isTranscribingThis}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-xs ${
                              aud.transcription
                                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : `${theme.accentBadge} ${theme.accentText} hover:opacity-90`
                            }`}
                            title="Transcribir con Gemini Transcribe"
                          >
                            {isTranscribingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Transcribiendo...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{aud.transcription ? 'Re-transcribir' : 'Transcribir con IA'}</span>
                              </>
                            )}
                          </button>

                          {/* Delete audio */}
                          <button
                            onClick={() => handleDeleteAudio(aud.id)}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-500/10"
                            title="Eliminar grabación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Interactive Player Scrubber */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlayAudio(aud.id, aud.blobDataUrl)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all shrink-0 ${theme.primaryBtn}`}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 flex items-center gap-2 font-mono text-xs text-stone-500">
                          <span>{formatAudioDuration(currentTime)}</span>
                          <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => handleAudioSeek(aud.id, e)}
                            className="w-full cursor-pointer"
                          />
                          <span>{formatAudioDuration(duration)}</span>
                        </div>
                      </div>

                      {/* Transcription Preview if available */}
                      {aud.transcription && (
                        <div className={`p-3 rounded-xl border text-xs space-y-2 ${theme.accentBadge} border-stone-200 dark:border-stone-800`}>
                          <div className={`flex items-center justify-between font-semibold ${theme.accentText}`}>
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Transcripción del audio (Gemini Transcribe):
                            </span>
                            <button
                              onClick={() => {
                                const addition = `<p><em>${aud.transcription}</em></p>`;
                                setContent(content + addition);
                                toast('Texto insertado al final del capítulo', 'success');
                              }}
                              className="text-[11px] underline hover:opacity-80"
                            >
                              Insertar en el capítulo
                            </button>
                          </div>
                          <p className="text-stone-700 dark:text-stone-300 font-serif leading-relaxed italic">
                            "{aud.transcription}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 p-16 rounded-3xl border text-center flex flex-col items-center justify-center ${theme.bgCard} ${theme.borderCard}`}
        >
          <BookOpen className="w-12 h-12 mb-3 text-stone-400 opacity-60" />
          <h3 className={`font-serif text-lg font-bold ${theme.textPrimary}`}>
            No hay ningún capítulo seleccionado
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
            Crea tu primer capítulo para comenzar a redactar y organizar tu narrativa.
          </p>
          <button
            onClick={handleCreateChapter}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md ${theme.primaryBtn}`}
          >
            Crear Capítulo 1
          </button>
        </div>
      )}

      {/* Delete Chapter Confirmation Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg">¿Eliminar este capítulo?</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              Estás a punto de eliminar permanentemente el{' '}
              <strong>"{chapterToDelete.title}"</strong> ({chapterToDelete.wordCount} palabras).
              Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setChapterToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-md"
              >
                Eliminar Capítulo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
