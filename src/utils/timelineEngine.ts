import { TimelineEvent, TimelineConnection } from '../types';

export interface TemporalConflict {
  eventId: string;
  referenceEventId: string;
  message: string;
  severity: 'advertencia' | 'error';
}

/**
 * Resolves dates for events, calculating numericSortValue for relative dates
 * and detecting cyclic or contradictory references.
 */
export function resolveEventDates(events: TimelineEvent[]): {
  resolvedEvents: TimelineEvent[];
  conflicts: TemporalConflict[];
} {
  const eventMap = new Map<string, TimelineEvent>();
  events.forEach((e) => eventMap.set(e.id, { ...e }));

  const conflicts: TemporalConflict[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function resolveNumericValue(id: string): number {
    if (visiting.has(id)) {
      conflicts.push({
        eventId: id,
        referenceEventId: id,
        message: 'Bucle de dependencia temporal circular detectado.',
        severity: 'error',
      });
      return 1500;
    }
    if (visited.has(id)) {
      return eventMap.get(id)?.numericSortValue ?? 1500;
    }

    visiting.add(id);
    const ev = eventMap.get(id);
    if (!ev) {
      visiting.delete(id);
      return 1500;
    }

    let val = ev.numericSortValue;

    if (ev.dateType === 'relativa' && ev.relativeToEventId) {
      const refEv = eventMap.get(ev.relativeToEventId);
      if (refEv) {
        const refVal = resolveNumericValue(refEv.id);
        const offset = ev.relativeOffsetYears || 0;
        val = refVal + offset;
        ev.numericSortValue = val;
      } else {
        conflicts.push({
          eventId: ev.id,
          referenceEventId: ev.relativeToEventId,
          message: `El acontecimiento de referencia ya no existe. Conservando fecha relativa aproximada.`,
          severity: 'advertencia',
        });
      }
    }

    visiting.delete(id);
    visited.add(id);
    return val;
  }

  events.forEach((e) => resolveNumericValue(e.id));

  // Secondary pass: Check logical connection contradictions (e.g. cause must precede effect)
  return {
    resolvedEvents: Array.from(eventMap.values()),
    conflicts,
  };
}

/**
 * Checks for connection contradictions between two events
 */
export function checkConnectionConsistency(
  conn: TimelineConnection,
  sourceEvent?: TimelineEvent,
  targetEvent?: TimelineEvent
): TemporalConflict | null {
  if (!sourceEvent || !targetEvent) return null;

  if (conn.relationType === 'causa_consecuencia') {
    if (sourceEvent.numericSortValue > targetEvent.numericSortValue) {
      return {
        eventId: sourceEvent.id,
        referenceEventId: targetEvent.id,
        message: `Inconsistencia: "${sourceEvent.title}" está marcada como causa de "${targetEvent.title}", pero ocurre cronológicamente después.`,
        severity: 'advertencia',
      };
    }
  }

  return null;
}

/**
 * Formats a duration in seconds into mm:ss or hh:mm:ss
 */
export function formatAudioDuration(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Formats byte size into human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
