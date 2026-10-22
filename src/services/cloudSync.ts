import { UserAccount, Book } from '../types';
import { dbService } from './db';

export interface CloudBackupSummary {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  summary: {
    booksCount: number;
    chaptersCount: number;
    charactersCount: number;
    detailsCount: number;
    ideasCount: number;
    eventsCount: number;
  };
}

class CloudSyncService {
  private lastSyncTimestamp: string | null = null;
  private isSyncing = false;

  public getLastSyncTime(): string | null {
    return this.lastSyncTimestamp;
  }

  // --- Check username availability globally ---
  public async checkUsername(
    username: string,
    excludeUserId?: string
  ): Promise<{ available: boolean; message: string }> {
    try {
      const res = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, excludeUserId }),
      });
      const data = await res.json();
      return {
        available: Boolean(data.available),
        message: data.message || (data.available ? 'Disponible' : 'No disponible'),
      };
    } catch (err: any) {
      console.warn('Could not verify username with cloud server:', err);
      // Fallback to local check
      const localUser = await dbService.getUserByUsername(username);
      const available = !localUser || Boolean(excludeUserId && localUser.id === excludeUserId);
      return {
        available,
        message: available ? 'Disponible' : 'Este nombre ya existe localmente',
      };
    }
  }

  // --- Universal Register (Saves in Cloud & Local IndexedDB) ---
  public async register(
    username: string,
    password: string,
    displayName?: string
  ): Promise<UserAccount> {
    const cleanUsername = username.trim().toLowerCase();

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password, displayName }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Fallo al registrar la cuenta en la nube.');
    }

    const { user } = await response.json();

    // Cache user in local IndexedDB
    try {
      await dbService.saveUserAccount(user);
    } catch (e) {
      console.warn('Error caching registered user to IndexedDB:', e);
    }
    dbService.setCurrentSessionUserId(user.id);

    // Initial push of any pending user items
    await this.pushToCloud(user.id).catch((e) => {
      console.warn('Initial cloud sync notice:', e);
    });

    return user;
  }

  // --- Universal Login from ANY device ---
  public async login(username: string, password: string): Promise<{ user: UserAccount; booksCount: number }> {
    const cleanUsername = username.trim().toLowerCase();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Credenciales inválidas en la nube.');
    }

    const { user, books, bundle } = await response.json();

    // Store user locally
    await dbService.saveUserAccount(user);
    dbService.setCurrentSessionUserId(user.id);

    // Synchronize books and entities into local IndexedDB for this user
    let booksCount = 0;
    if (bundle && Array.isArray(bundle.books)) {
      await this.hydrateLocalDatabaseWithCloudBundle(user.id, bundle);
      booksCount = bundle.books.length;
    } else if (Array.isArray(books)) {
      for (const b of books) {
        await dbService.saveBook(b);
      }
      booksCount = books.length;
    }

    this.lastSyncTimestamp = new Date().toISOString();
    return { user, booksCount };
  }

  // --- Hydrate local IndexedDB from cloud bundle with strict user scoping ---
  public async hydrateLocalDatabaseWithCloudBundle(userId: string, bundle: any): Promise<void> {
    if (!bundle) return;

    // Books
    for (const b of bundle.books || []) {
      // Ensure userId matches if owned
      if (!b.userId && (!b.collaborators || !b.collaborators.length)) {
        b.userId = userId;
      }
      await dbService.saveBook(b);
    }

    // Chapters
    for (const c of bundle.chapters || []) {
      await dbService.saveChapter(c);
    }

    // Characters & Categories
    for (const ch of bundle.characters || []) {
      await dbService.saveCharacter(ch);
    }
    for (const ccat of bundle.characterCategories || []) {
      await dbService.saveCharacterCategory(ccat);
    }

    // Details & Categories
    for (const d of bundle.details || []) {
      await dbService.saveDetail(d);
    }
    for (const dcat of bundle.detailCategories || []) {
      await dbService.saveDetailCategory(dcat);
    }

    // Ideas & Categories
    for (const i of bundle.ideas || []) {
      await dbService.saveIdea(i);
    }
    for (const icat of bundle.ideaCategories || []) {
      await dbService.saveIdeaCategory(icat);
    }

    // Timeline tracks, lanes, categories, events, connections
    for (const trk of bundle.timelineTracks || []) {
      await dbService.saveTimelineTrack(trk);
    }
    for (const l of bundle.timelineLanes || []) {
      await dbService.saveTimelineLane(l);
    }
    for (const tc of bundle.timelineCategories || []) {
      await dbService.saveTimelineCategory(tc);
    }
    for (const e of bundle.timelineEvents || []) {
      await dbService.saveTimelineEvent(e);
    }
    for (const conn of bundle.timelineConnections || []) {
      await dbService.saveTimelineConnection(conn);
    }

    // Writing logs
    for (const wl of bundle.writingLogs || []) {
      await dbService.saveDailyWritingLog(wl);
    }

    // Custom Palettes
    for (const pal of bundle.customPalettes || []) {
      await dbService.saveCustomPalette(pal);
    }
  }

  // --- Push author books & entities to Cloud (Backup & Multidevice Sync) ---
  public async pushToCloud(userId: string, isManualSnapshot = false): Promise<{
    success: boolean;
    timestamp: string;
    backupId?: string;
  }> {
    if (this.isSyncing) return { success: true, timestamp: new Date().toISOString() };
    this.isSyncing = true;

    try {
      // Build author payload
      const backupJson = await dbService.exportFullUserBackup(userId);
      const parsed = JSON.parse(backupJson);

      const payload = {
        userId,
        isManualBackupSnapshot: isManualSnapshot,
        books: parsed.books || [],
        chapters: parsed.chapters || [],
        characters: parsed.characters || [],
        characterCategories: parsed.characterCategories || [],
        details: parsed.details || [],
        detailCategories: parsed.detailCategories || [],
        ideas: parsed.ideas || [],
        ideaCategories: parsed.ideaCategories || [],
        timelineTracks: parsed.timelineTracks || [],
        timelineLanes: parsed.timelineLanes || [],
        timelineCategories: parsed.timelineCategories || [],
        timelineEvents: parsed.timelineEvents || [],
        timelineConnections: parsed.timelineConnections || [],
        writingLogs: parsed.writingLogs || [],
        customPalettes: parsed.customPalettes || [],
      };

      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al sincronizar con el servidor.');
      }

      const result = await response.json();
      this.lastSyncTimestamp = result.timestamp;
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Pull author books & entities from Cloud ---
  public async pullFromCloud(userId: string): Promise<number> {
    const res = await fetch(`/api/sync/pull?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      throw new Error('Error al consultar libros en la nube.');
    }
    const data = await res.json();
    if (data.bundle) {
      await this.hydrateLocalDatabaseWithCloudBundle(userId, data.bundle);
      this.lastSyncTimestamp = data.lastSyncedAt || new Date().toISOString();
      return (data.bundle.books || []).length;
    }
    return 0;
  }

  // --- Cloud Backups listing ---
  public async getCloudBackups(userId: string): Promise<CloudBackupSummary[]> {
    const res = await fetch(`/api/sync/backups?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.backups || [];
  }

  // --- Restore Cloud Backup ---
  public async restoreCloudBackup(userId: string, backupId: string): Promise<void> {
    const res = await fetch('/api/sync/restore-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, backupId }),
    });

    if (!res.ok) {
      const err = await responseError(res);
      throw new Error(err);
    }

    const { data } = await res.json();
    if (data) {
      await this.hydrateLocalDatabaseWithCloudBundle(userId, data);
      this.lastSyncTimestamp = new Date().toISOString();
    }
  }

  // --- Update user profile in Cloud ---
  public async updateProfile(
    userId: string,
    updates: {
      username?: string;
      displayName?: string;
      email?: string;
      avatarUrl?: string;
      avatarColor?: string;
      bio?: string;
    }
  ): Promise<UserAccount> {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    });

    if (!res.ok) {
      const err = await responseError(res);
      throw new Error(err);
    }

    const { user } = await res.json();
    await dbService.saveUserAccount(user);
    return user;
  }

  // --- Change Password in Cloud ---
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });

    if (!res.ok) {
      const err = await responseError(res);
      throw new Error(err);
    }
  }
}

async function responseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || `Error HTTP ${res.status}`;
  } catch {
    return `Error HTTP ${res.status}`;
  }
}

export const cloudSyncService = new CloudSyncService();
