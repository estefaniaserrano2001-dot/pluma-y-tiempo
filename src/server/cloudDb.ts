import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CloudUser {
  id: string;
  username: string; // strictly unique, lowercased
  displayName: string;
  passwordHash: string;
  email?: string;
  avatarColor: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface CloudBackupItem {
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
  data: any;
}

export interface CloudDatabaseSchema {
  version: number;
  lastUpdated: string;
  users: CloudUser[];
  books: any[];
  chapters: any[];
  characters: any[];
  characterCategories: any[];
  details: any[];
  detailCategories: any[];
  ideas: any[];
  ideaCategories: any[];
  timelineTracks: any[];
  timelineLanes: any[];
  timelineCategories: any[];
  timelineEvents: any[];
  timelineConnections: any[];
  writingLogs: any[];
  customPalettes: any[];
  backups: CloudBackupItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cloud_pluma_db.json');

class CloudDatabaseService {
  private inMemoryDb: CloudDatabaseSchema | null = null;
  private isSaving = false;

  constructor() {
    this.ensureDataDir();
    this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Error creating data directory:', err);
      }
    }
  }

  private loadDatabase(): CloudDatabaseSchema {
    if (this.inMemoryDb) return this.inMemoryDb;

    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.inMemoryDb = {
          version: parsed.version || 1,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          users: parsed.users || [],
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
          backups: parsed.backups || [],
        };
        return this.inMemoryDb;
      }
    } catch (e) {
      console.warn('Error reading cloud database file, initializing fresh schema:', e);
    }

    this.inMemoryDb = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      users: [],
      books: [],
      chapters: [],
      characters: [],
      characterCategories: [],
      details: [],
      detailCategories: [],
      ideas: [],
      ideaCategories: [],
      timelineTracks: [],
      timelineLanes: [],
      timelineCategories: [],
      timelineEvents: [],
      timelineConnections: [],
      writingLogs: [],
      customPalettes: [],
      backups: [],
    };
    this.persistToDisk();
    return this.inMemoryDb;
  }

  private persistToDisk() {
    if (!this.inMemoryDb) return;
    this.ensureDataDir();

    try {
      this.inMemoryDb.lastUpdated = new Date().toISOString();
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.inMemoryDb, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error persisting cloud database to disk:', err);
    }
  }

  public hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + '_pluma_tiempo_salt')
      .digest('hex');
  }

  // --- User Accounts with Global Username Uniqueness ---

  public isUsernameAvailable(username: string, excludeUserId?: string): boolean {
    const clean = username.trim().toLowerCase();
    if (!clean || clean.length < 3) return false;
    const db = this.loadDatabase();
    return !db.users.some(
      (u) => u.username.toLowerCase() === clean && (!excludeUserId || u.id !== excludeUserId)
    );
  }

  public registerUser(
    username: string,
    password: string,
    displayName?: string
  ): { user: CloudUser } {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUsername)) {
      throw new Error('El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.');
    }
    if (!password || password.length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres.');
    }

    const db = this.loadDatabase();
    const existing = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      throw new Error(`El nombre de usuario "@${cleanUsername}" ya está registrado en la nube por otro escritor. Por favor elige otro.`);
    }

    const colors = ['#2D5A43', '#1B3B5C', '#933D2D', '#583778', '#D47754', '#165B54', '#4F6C8D'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: CloudUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      displayName: displayName?.trim() || cleanUsername,
      passwordHash: this.hashPassword(password),
      avatarColor: randomColor,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    this.persistToDisk();
    return { user: newUser };
  }

  public loginUser(username: string, password: string): { user: CloudUser } {
    const cleanUsername = username.trim().toLowerCase();
    const db = this.loadDatabase();
    const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      throw new Error('Usuario no encontrado. Comprueba el nombre o crea una cuenta nueva.');
    }

    const passHash = this.hashPassword(password);
    if (user.passwordHash !== passHash) {
      throw new Error('Contraseña incorrecta.');
    }

    user.lastLoginAt = new Date().toISOString();
    this.persistToDisk();
    return { user };
  }

  public updateUserProfile(
    userId: string,
    updates: {
      username?: string;
      displayName?: string;
      email?: string;
      avatarUrl?: string;
      avatarColor?: string;
      bio?: string;
    }
  ): CloudUser {
    const db = this.loadDatabase();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado.');

    if (updates.username && updates.username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const clean = updates.username.trim().toLowerCase();
      if (!this.isUsernameAvailable(clean, userId)) {
        throw new Error(`El nombre de usuario "@${clean}" ya pertenece a otro escritor.`);
      }
      user.username = clean;
    }

    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.email !== undefined) user.email = updates.email.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.avatarColor !== undefined) user.avatarColor = updates.avatarColor;
    if (updates.bio !== undefined) user.bio = updates.bio.trim();

    // Sync collaborators in books
    for (const b of db.books) {
      if (b.collaborators) {
        b.collaborators = b.collaborators.map((c: any) =>
          c.userId === userId
            ? {
                ...c,
                username: user.username,
                displayName: user.displayName,
                avatarColor: user.avatarColor,
                avatarUrl: user.avatarUrl,
              }
            : c
        );
      }
    }

    this.persistToDisk();
    return user;
  }

  public changePassword(userId: string, oldPass: string, newPass: string): void {
    const db = this.loadDatabase();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado.');

    if (user.passwordHash !== this.hashPassword(oldPass)) {
      throw new Error('La contraseña actual es incorrecta.');
    }
    if (!newPass || newPass.length < 4) {
      throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
    }

    user.passwordHash = this.hashPassword(newPass);
    this.persistToDisk();
  }

  // --- Strict Data Isolation: Books & Related Entities ---

  public getUserBundle(userId: string): {
    user: CloudUser | null;
    books: any[];
    bundle: any;
  } {
    const db = this.loadDatabase();
    const user = db.users.find((u) => u.id === userId) || null;

    // Strict account isolation: only owned books or books where user is collaborator
    const userBooks = db.books.filter((b) => {
      const isOwner = b.userId === userId;
      const isCollab =
        user &&
        b.collaborators?.some(
          (c: any) =>
            c.userId === userId ||
            (c.username && c.username.toLowerCase() === user.username.toLowerCase())
        );
      return isOwner || isCollab;
    });

    const bookIds = new Set(userBooks.map((b) => b.id));

    const chapters = db.chapters.filter((c) => bookIds.has(c.bookId));
    const characters = db.characters.filter((c) => bookIds.has(c.bookId));
    const characterCategories = db.characterCategories.filter((c) => bookIds.has(c.bookId));
    const details = db.details.filter((d) => bookIds.has(d.bookId));
    const detailCategories = db.detailCategories.filter((c) => bookIds.has(c.bookId));
    const ideas = db.ideas.filter((i) => bookIds.has(i.bookId));
    const ideaCategories = db.ideaCategories.filter((c) => bookIds.has(c.bookId));
    const timelineTracks = db.timelineTracks.filter((t) => bookIds.has(t.bookId));
    const timelineLanes = db.timelineLanes.filter((l) => bookIds.has(l.bookId));
    const timelineCategories = db.timelineCategories.filter((c) => bookIds.has(c.bookId));
    const timelineEvents = db.timelineEvents.filter((e) => bookIds.has(e.bookId));
    const timelineConnections = db.timelineConnections.filter((c) => bookIds.has(c.bookId));

    const writingLogs = db.writingLogs.filter((l) => !l.userId || l.userId === userId);
    const customPalettes = db.customPalettes;

    const bundle = {
      app: 'Pluma & Tiempo',
      backupVersion: '3.0',
      syncedAt: new Date().toISOString(),
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
          }
        : null,
      summary: {
        booksCount: userBooks.length,
        chaptersCount: chapters.length,
        charactersCount: characters.length,
        detailsCount: details.length,
        ideasCount: ideas.length,
        eventsCount: timelineEvents.length,
      },
      books: userBooks,
      chapters,
      characters,
      characterCategories,
      details,
      detailCategories,
      ideas,
      ideaCategories,
      timelineTracks,
      timelineLanes,
      timelineCategories,
      timelineEvents,
      timelineConnections,
      writingLogs,
      customPalettes,
    };

    return { user, books: userBooks, bundle };
  }

  // --- Push/Sync User Data to Cloud ---

  public syncUserBundle(
    userId: string,
    payload: {
      books?: any[];
      chapters?: any[];
      characters?: any[];
      characterCategories?: any[];
      details?: any[];
      detailCategories?: any[];
      ideas?: any[];
      ideaCategories?: any[];
      timelineTracks?: any[];
      timelineLanes?: any[];
      timelineCategories?: any[];
      timelineEvents?: any[];
      timelineConnections?: any[];
      writingLogs?: any[];
      customPalettes?: any[];
      isManualBackupSnapshot?: boolean;
    }
  ): {
    success: boolean;
    timestamp: string;
    backupId?: string;
    summary: any;
  } {
    const db = this.loadDatabase();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Usuario no registrado en la nube.');
    }

    const incomingBooks = payload.books || [];
    const incomingBookIds = new Set(incomingBooks.map((b) => b.id));

    // Ensure all incoming books are explicitly assigned to this user if not already set
    for (const b of incomingBooks) {
      if (!b.userId) b.userId = userId;
    }

    // Replace or merge author's books without touching other authors' books
    const otherBooks = db.books.filter((b) => b.userId !== userId && !incomingBookIds.has(b.id));
    db.books = [...otherBooks, ...incomingBooks];

    // Helper to merge entity collections tied to author's books
    const mergeEntities = (existingList: any[], incomingList: any[] = []) => {
      const remaining = existingList.filter((item) => !incomingBookIds.has(item.bookId));
      return [...remaining, ...incomingList];
    };

    if (payload.chapters) db.chapters = mergeEntities(db.chapters, payload.chapters);
    if (payload.characters) db.characters = mergeEntities(db.characters, payload.characters);
    if (payload.characterCategories) db.characterCategories = mergeEntities(db.characterCategories, payload.characterCategories);
    if (payload.details) db.details = mergeEntities(db.details, payload.details);
    if (payload.detailCategories) db.detailCategories = mergeEntities(db.detailCategories, payload.detailCategories);
    if (payload.ideas) db.ideas = mergeEntities(db.ideas, payload.ideas);
    if (payload.ideaCategories) db.ideaCategories = mergeEntities(db.ideaCategories, payload.ideaCategories);
    if (payload.timelineTracks) db.timelineTracks = mergeEntities(db.timelineTracks, payload.timelineTracks);
    if (payload.timelineLanes) db.timelineLanes = mergeEntities(db.timelineLanes, payload.timelineLanes);
    if (payload.timelineCategories) db.timelineCategories = mergeEntities(db.timelineCategories, payload.timelineCategories);
    if (payload.timelineEvents) db.timelineEvents = mergeEntities(db.timelineEvents, payload.timelineEvents);
    if (payload.timelineConnections) db.timelineConnections = mergeEntities(db.timelineConnections, payload.timelineConnections);

    if (payload.writingLogs) {
      const remainingLogs = db.writingLogs.filter((l) => l.userId && l.userId !== userId);
      const taggedIncoming = payload.writingLogs.map((l) => ({ ...l, userId }));
      db.writingLogs = [...remainingLogs, ...taggedIncoming];
    }

    if (payload.customPalettes && payload.customPalettes.length > 0) {
      const existingIds = new Set(db.customPalettes.map((p) => p.id));
      for (const p of payload.customPalettes) {
        if (!existingIds.has(p.id)) {
          db.customPalettes.push(p);
        }
      }
    }

    // Save Cloud Backup Snapshot
    const backupId = 'cbkp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const summary = {
      booksCount: incomingBooks.length,
      chaptersCount: (payload.chapters || []).length,
      charactersCount: (payload.characters || []).length,
      detailsCount: (payload.details || []).length,
      ideasCount: (payload.ideas || []).length,
      eventsCount: (payload.timelineEvents || []).length,
    };

    const newBackup: CloudBackupItem = {
      id: backupId,
      userId,
      username: user.username,
      timestamp: new Date().toISOString(),
      summary,
      data: {
        books: incomingBooks,
        chapters: payload.chapters || [],
        characters: payload.characters || [],
        characterCategories: payload.characterCategories || [],
        details: payload.details || [],
        detailCategories: payload.detailCategories || [],
        ideas: payload.ideas || [],
        ideaCategories: payload.ideaCategories || [],
        timelineTracks: payload.timelineTracks || [],
        timelineLanes: payload.timelineLanes || [],
        timelineCategories: payload.timelineCategories || [],
        timelineEvents: payload.timelineEvents || [],
        timelineConnections: payload.timelineConnections || [],
        writingLogs: payload.writingLogs || [],
        customPalettes: payload.customPalettes || [],
      },
    };

    // Keep last 15 cloud backup snapshots per user
    const userBackups = db.backups.filter((b) => b.userId === userId);
    const otherBackups = db.backups.filter((b) => b.userId !== userId);
    userBackups.unshift(newBackup);
    if (userBackups.length > 15) {
      userBackups.length = 15;
    }
    db.backups = [...userBackups, ...otherBackups];

    this.persistToDisk();

    return {
      success: true,
      timestamp: newBackup.timestamp,
      backupId,
      summary,
    };
  }

  // --- Cloud Backups Listing & Restoration ---

  public getUserBackups(userId: string): Omit<CloudBackupItem, 'data'>[] {
    const db = this.loadDatabase();
    return db.backups
      .filter((b) => b.userId === userId)
      .map(({ id, userId, username, timestamp, summary }) => ({
        id,
        userId,
        username,
        timestamp,
        summary,
      }));
  }

  public getBackupData(userId: string, backupId: string): any {
    const db = this.loadDatabase();
    const backup = db.backups.find((b) => b.userId === userId && b.id === backupId);
    if (!backup) throw new Error('Copia de seguridad en la nube no encontrada.');
    return backup.data;
  }

  public getSystemStats(): { usersCount: number; booksCount: number; status: string } {
    const db = this.loadDatabase();
    return {
      status: 'online',
      usersCount: db.users.length,
      booksCount: db.books.length,
    };
  }
}

export const cloudDb = new CloudDatabaseService();
