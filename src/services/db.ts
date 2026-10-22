import {
  Book,
  Chapter,
  AudioRecord,
  Character,
  WorldDetail,
  Idea,
  TimelineEvent,
  TimelineConnection,
  TimelineTrack,
  TimelineLane,
  DetailCategory,
  IdeaCategory,
  TimelineCategory,
  CharacterCategory,
  CustomPaletteConfig,
  CustomFontItem,
  AppSettings,
  UserAccount,
  DailyWritingLog,
  WritingStreakStatus,
  MotivationalQuote,
  DailyNotificationReminder,
} from '../types';

const DB_NAME = 'PlumaTiempoDB';
const DB_VERSION = 6;

interface StoredAudio {
  id: string;
  bookId: string;
  chapterId: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
  createdAt: string;
  notes: string;
  transcription?: string;
  blob?: Blob;
}

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chapters')) {
          const store = db.createObjectStore('chapters', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('characters')) {
          const store = db.createObjectStore('characters', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('characterCategories')) {
          const store = db.createObjectStore('characterCategories', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('details')) {
          const store = db.createObjectStore('details', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('detailCategories')) {
          const store = db.createObjectStore('detailCategories', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('ideas')) {
          const store = db.createObjectStore('ideas', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('ideaCategories')) {
          const store = db.createObjectStore('ideaCategories', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('timelineEvents')) {
          const store = db.createObjectStore('timelineEvents', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('timelineCategories')) {
          const store = db.createObjectStore('timelineCategories', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('timelineConnections')) {
          const store = db.createObjectStore('timelineConnections', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('timelineLanes')) {
          const store = db.createObjectStore('timelineLanes', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('timelineTracks')) {
          const store = db.createObjectStore('timelineTracks', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('audios')) {
          const store = db.createObjectStore('audios', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
          store.createIndex('chapterId', 'chapterId', { unique: false });
        }
        if (!db.objectStoreNames.contains('customPalettes')) {
          db.createObjectStore('customPalettes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customFonts')) {
          db.createObjectStore('customFonts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'id' });
          store.createIndex('username', 'username', { unique: true });
        }
        if (!db.objectStoreNames.contains('dailyWritingLogs')) {
          const store = db.createObjectStore('dailyWritingLogs', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: true });
        }
        if (!db.objectStoreNames.contains('writingNotifications')) {
          db.createObjectStore('writingNotifications', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Generic Helpers ---
  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async getById<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const idx = store.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Books ---
  async getBooks(filterUser?: UserAccount | null | 'all'): Promise<Book[]> {
    const all = await this.getAll<Book>('books');
    if (filterUser === 'all') return all;

    if (filterUser !== undefined) {
      if (filterUser === null) {
        // Guest mode: only unassigned books with no owner
        return all.filter((b) => !b.userId);
      }
      // Strict account isolation: only owned books or explicitly shared collaborator books
      return all.filter((b) => {
        const isOwner = b.userId === filterUser.id;
        const isCollab = b.collaborators?.some(
          (c) =>
            c.userId === filterUser.id ||
            (c.username && c.username.toLowerCase() === filterUser.username.toLowerCase())
        );
        return isOwner || isCollab;
      });
    }

    // Default to the current logged-in user in session if not passed
    const sessionUser = await this.getCurrentUser();
    if (sessionUser) {
      return all.filter((b) => {
        const isOwner = b.userId === sessionUser.id;
        const isCollab = b.collaborators?.some(
          (c) =>
            c.userId === sessionUser.id ||
            (c.username && c.username.toLowerCase() === sessionUser.username.toLowerCase())
        );
        return isOwner || isCollab;
      });
    }

    // No session: only guest/unassigned books
    return all.filter((b) => !b.userId);
  }

  async getAllBooksRaw(): Promise<Book[]> {
    return this.getAll<Book>('books');
  }

  async saveBook(book: Book): Promise<void> {
    await this.put('books', book);
  }

  async deleteBook(bookId: string): Promise<void> {
    // Cascade delete all entities of that book
    const chapters = await this.getChaptersByBook(bookId);
    for (const c of chapters) {
      await this.deleteChapter(c.id);
    }
    const characters = await this.getCharactersByBook(bookId);
    for (const c of characters) {
      await this.delete('characters', c.id);
    }
    const details = await this.getDetailsByBook(bookId);
    for (const d of details) {
      await this.delete('details', d.id);
    }
    const ideas = await this.getIdeasByBook(bookId);
    for (const i of ideas) {
      await this.delete('ideas', i.id);
    }
    const events = await this.getTimelineEventsByBook(bookId);
    for (const e of events) {
      await this.delete('timelineEvents', e.id);
    }
    const connections = await this.getTimelineConnectionsByBook(bookId);
    for (const c of connections) {
      await this.delete('timelineConnections', c.id);
    }
    await this.delete('books', bookId);
  }

  // --- Chapters ---
  async getChaptersByBook(bookId: string): Promise<Chapter[]> {
    const list = await this.getByIndex<Chapter>('chapters', 'bookId', bookId);
    return list.sort((a, b) => a.order - b.order);
  }

  async saveChapter(chapter: Chapter): Promise<void> {
    await this.put('chapters', chapter);
  }

  async deleteChapter(chapterId: string): Promise<void> {
    // Delete chapter audios too
    const audios = await this.getAudiosByChapter(chapterId);
    for (const a of audios) {
      await this.deleteAudio(a.id);
    }
    await this.delete('chapters', chapterId);
  }

  // --- Characters ---
  async getCharactersByBook(bookId: string): Promise<Character[]> {
    return this.getByIndex<Character>('characters', 'bookId', bookId);
  }

  async saveCharacter(character: Character): Promise<void> {
    await this.put('characters', character);
  }

  async deleteCharacter(characterId: string): Promise<void> {
    await this.delete('characters', characterId);
  }

  // --- World Details ---
  async getDetailsByBook(bookId: string): Promise<WorldDetail[]> {
    return this.getByIndex<WorldDetail>('details', 'bookId', bookId);
  }

  async saveDetail(detail: WorldDetail): Promise<void> {
    await this.put('details', detail);
  }

  async deleteDetail(detailId: string): Promise<void> {
    await this.delete('details', detailId);
  }

  // --- Detail Categories ---
  async getDetailCategoriesByBook(bookId: string): Promise<DetailCategory[]> {
    let list = await this.getByIndex<DetailCategory>('detailCategories', 'bookId', bookId);
    if (list.length === 0) {
      const defaults: DetailCategory[] = [
        // Top-level categories
        { id: `dcat_lug_${bookId}`, bookId, name: 'Lugares', color: '#2D5A43', icon: 'MapPin', isDefault: true, parentId: null, order: 0 },
        { id: `dcat_obj_${bookId}`, bookId, name: 'Objetos', color: '#1B3B5C', icon: 'Sparkles', isDefault: true, parentId: null, order: 1 },
        { id: `dcat_org_${bookId}`, bookId, name: 'Organizaciones', color: '#933D2D', icon: 'Shield', isDefault: true, parentId: null, order: 2 },
        { id: `dcat_fam_${bookId}`, bookId, name: 'Familias y linajes', color: '#583778', icon: 'Users', isDefault: true, parentId: null, order: 3 },
        { id: `dcat_his_${bookId}`, bookId, name: 'Historia', color: '#8C6D3B', icon: 'Clock', isDefault: true, parentId: null, order: 4 },
        { id: `dcat_reg_${bookId}`, bookId, name: 'Reglas del mundo', color: '#165B54', icon: 'Lock', isDefault: true, parentId: null, order: 5 },
        { id: `dcat_mag_${bookId}`, bookId, name: 'Magia o tecnología', color: '#4F6C8D', icon: 'Sparkles', isDefault: true, parentId: null, order: 6 },
        { id: `dcat_otr_${bookId}`, bookId, name: 'Otros', color: '#64748B', icon: 'Compass', isDefault: true, parentId: null, order: 7 },

        // Hierarchical Subcategories (Lugares)
        { id: `dcat_lug_ciu_${bookId}`, bookId, name: 'Ciudades y Capitales', color: '#3E7A5A', icon: 'MapPin', parentId: `dcat_lug_${bookId}`, order: 0 },
        { id: `dcat_lug_for_${bookId}`, bookId, name: 'Fortalezas y Castillos', color: '#2A553F', icon: 'Shield', parentId: `dcat_lug_${bookId}`, order: 1 },
        { id: `dcat_lug_bos_${bookId}`, bookId, name: 'Bosques y Naturaleza', color: '#4E8C68', icon: 'Compass', parentId: `dcat_lug_${bookId}`, order: 2 },

        // Hierarchical Subcategories (Objetos)
        { id: `dcat_obj_rel_${bookId}`, bookId, name: 'Reliquias Mágicas', color: '#295480', icon: 'Sparkles', parentId: `dcat_obj_${bookId}`, order: 0 },
        { id: `dcat_obj_arm_${bookId}`, bookId, name: 'Armamento Legendario', color: '#16314D', icon: 'Shield', parentId: `dcat_obj_${bookId}`, order: 1 },

        // Hierarchical Subcategories (Organizaciones)
        { id: `dcat_org_gre_${bookId}`, bookId, name: 'Gremios y Cofradías', color: '#B34A36', icon: 'Users', parentId: `dcat_org_${bookId}`, order: 0 },
        { id: `dcat_org_tri_${bookId}`, bookId, name: 'Tribunales y Órdenes', color: '#732E22', icon: 'Lock', parentId: `dcat_org_${bookId}`, order: 1 },

        // Hierarchical Subcategories (Reglas del mundo)
        { id: `dcat_reg_mag_${bookId}`, bookId, name: 'Leyes Mágicas y Prohibiciones', color: '#247D74', icon: 'Sparkles', parentId: `dcat_reg_${bookId}`, order: 0 },
        { id: `dcat_reg_cli_${bookId}`, bookId, name: 'Leyes Físicas y Clima', color: '#10433E', icon: 'Compass', parentId: `dcat_reg_${bookId}`, order: 1 },
      ];
      for (const d of defaults) {
        await this.put('detailCategories', d);
      }
      list = defaults;
    }
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async saveDetailCategory(cat: DetailCategory): Promise<void> {
    await this.put('detailCategories', cat);
  }

  async deleteDetailCategory(bookId: string, catId: string, reassignToCatId?: string): Promise<void> {
    const details = await this.getDetailsByBook(bookId);
    for (const d of details) {
      if (d.category === catId || d.subcategoryId === catId) {
        await this.saveDetail({
          ...d,
          category: d.category === catId ? (reassignToCatId || 'sin_categoria') : d.category,
          subcategoryId: d.subcategoryId === catId ? undefined : d.subcategoryId,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    // Reassign or orphan subcategories whose parent was deleted
    const allCats = await this.getDetailCategoriesByBook(bookId);
    for (const c of allCats) {
      if (c.parentId === catId) {
        await this.saveDetailCategory({
          ...c,
          parentId: null,
        });
      }
    }
    await this.delete('detailCategories', catId);
  }

  async getDetailCategories(bookId: string): Promise<DetailCategory[]> {
    return this.getDetailCategoriesByBook(bookId);
  }

  async deleteDetailCategoryAndReassign(catId: string, reassignToCatId: string, bookId: string): Promise<void> {
    return this.deleteDetailCategory(bookId, catId, reassignToCatId);
  }

  async resetDetailCategoriesToDefault(bookId: string): Promise<DetailCategory[]> {
    const existing = await this.getByIndex<DetailCategory>('detailCategories', 'bookId', bookId);
    for (const c of existing) {
      await this.delete('detailCategories', c.id);
    }
    return this.getDetailCategoriesByBook(bookId);
  }

  // --- Ideas ---
  async getIdeasByBook(bookId: string): Promise<Idea[]> {
    const list = await this.getByIndex<Idea>('ideas', 'bookId', bookId);
    // Backward compatibility: ensure tray property exists
    return list.map((i) => {
      let tray = i.tray;
      if (!tray) {
        if (i.status === 'utilizada') tray = 'realizadas';
        else if (i.status === 'descartada') tray = 'descartadas';
        else tray = 'en_espera';
      }
      return { ...i, tray };
    });
  }

  async saveIdea(idea: Idea): Promise<void> {
    await this.put('ideas', idea);
  }

  async deleteIdea(ideaId: string): Promise<void> {
    await this.delete('ideas', ideaId);
  }

  // --- Idea Categories ---
  async getIdeaCategoriesByBook(bookId: string): Promise<IdeaCategory[]> {
    let list = await this.getByIndex<IdeaCategory>('ideaCategories', 'bookId', bookId);
    if (list.length === 0) {
      const defaults: IdeaCategory[] = [
        // Top-level categories
        { id: `icat_tra_${bookId}`, bookId, name: 'Trama principal', color: '#2D5A43', parentId: null, order: 0 },
        { id: `icat_per_${bookId}`, bookId, name: 'Personajes', color: '#583778', parentId: null, order: 1 },
        { id: `icat_esc_${bookId}`, bookId, name: 'Escenas clave', color: '#933D2D', parentId: null, order: 2 },
        { id: `icat_dia_${bookId}`, bookId, name: 'Diálogos memorables', color: '#8C6D3B', parentId: null, order: 3 },
        { id: `icat_mun_${bookId}`, bookId, name: 'Mundo y ambientación', color: '#165B54', parentId: null, order: 4 },
        { id: `icat_sub_${bookId}`, bookId, name: 'Subtramas', color: '#1B3B5C', parentId: null, order: 5 },
        { id: `icat_ins_${bookId}`, bookId, name: 'Inspiración y notas', color: '#4F6C8D', parentId: null, order: 6 },
        { id: `icat_otr_${bookId}`, bookId, name: 'Otros', color: '#64748B', parentId: null, order: 7 },

        // Subcategories (Trama)
        { id: `icat_tra_giros_${bookId}`, bookId, name: 'Giros y Revelaciones', color: '#3E7A5A', parentId: `icat_tra_${bookId}`, order: 0 },
        { id: `icat_tra_climax_${bookId}`, bookId, name: 'Clímax y Desenlace', color: '#254E38', parentId: `icat_tra_${bookId}`, order: 1 },
        { id: `icat_tra_pistas_${bookId}`, bookId, name: 'Pistas Ocultas (Foreshadowing)', color: '#509972', parentId: `icat_tra_${bookId}`, order: 2 },

        // Subcategories (Personajes)
        { id: `icat_per_arcos_${bookId}`, bookId, name: 'Arcos de Transformación', color: '#7649A2', parentId: `icat_per_${bookId}`, order: 0 },
        { id: `icat_per_secretos_${bookId}`, bookId, name: 'Secretos y Mentiras', color: '#442A5C', parentId: `icat_per_${bookId}`, order: 1 },

        // Subcategories (Mundo)
        { id: `icat_mun_mitos_${bookId}`, bookId, name: 'Mitos y Leyendas', color: '#217A71', parentId: `icat_mun_${bookId}`, order: 0 },
        { id: `icat_mun_criaturas_${bookId}`, bookId, name: 'Criaturas y Bestias', color: '#0E3B36', parentId: `icat_mun_${bookId}`, order: 1 },
      ];
      for (const d of defaults) {
        await this.put('ideaCategories', d);
      }
      list = defaults;
    }
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async saveIdeaCategory(cat: IdeaCategory): Promise<void> {
    await this.put('ideaCategories', cat);
  }

  async deleteIdeaCategory(bookId: string, catId: string, reassignToCatId?: string): Promise<void> {
    const ideas = await this.getIdeasByBook(bookId);
    for (const i of ideas) {
      if (i.category === catId || i.categoryId === catId || i.subcategoryId === catId) {
        await this.saveIdea({
          ...i,
          category: i.category === catId ? (reassignToCatId || 'sin_categoria') : i.category,
          categoryId: i.categoryId === catId ? (reassignToCatId || 'sin_categoria') : i.categoryId,
          subcategoryId: i.subcategoryId === catId ? undefined : i.subcategoryId,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    // Reassign or orphan subcategories
    const allCats = await this.getIdeaCategoriesByBook(bookId);
    for (const c of allCats) {
      if (c.parentId === catId) {
        await this.saveIdeaCategory({
          ...c,
          parentId: null,
        });
      }
    }
    await this.delete('ideaCategories', catId);
  }

  // --- Timeline Categories ---
  async getTimelineCategoriesByBook(bookId: string): Promise<TimelineCategory[]> {
    let list = await this.getByIndex<TimelineCategory>('timelineCategories', 'bookId', bookId);
    if (list.length === 0) {
      const defaults: TimelineCategory[] = [
        { id: `tcat_tra_${bookId}`, bookId, name: 'Trama principal', color: '#2D5A43' },
        { id: `tcat_sub_${bookId}`, bookId, name: 'Subtrama', color: '#4F6C8D' },
        { id: `tcat_per_${bookId}`, bookId, name: 'Personajes', color: '#583778' },
        { id: `tcat_his_${bookId}`, bookId, name: 'Historia del mundo', color: '#1B3B5C' },
        { id: `tcat_rev_${bookId}`, bookId, name: 'Revelaciones', color: '#D47754' },
        { id: `tcat_con_${bookId}`, bookId, name: 'Conflictos', color: '#933D2D' },
        { id: `tcat_rel_${bookId}`, bookId, name: 'Relaciones', color: '#8C6D3B' },
        { id: `tcat_otr_${bookId}`, bookId, name: 'Otros', color: '#64748B' },
      ];
      for (const d of defaults) {
        await this.put('timelineCategories', d);
      }
      list = defaults;
    }
    return list;
  }

  async saveTimelineCategory(cat: TimelineCategory): Promise<void> {
    await this.put('timelineCategories', cat);
  }

  async deleteTimelineCategory(bookId: string, catId: string, reassignToCatId?: string): Promise<void> {
    const events = await this.getTimelineEventsByBook(bookId);
    for (const e of events) {
      if (e.category === catId) {
        await this.saveTimelineEvent({
          ...e,
          category: reassignToCatId || 'sin_categoria',
          updatedAt: new Date().toISOString(),
        });
      }
    }
    await this.delete('timelineCategories', catId);
  }

  async getTimelineCategories(bookId: string): Promise<TimelineCategory[]> {
    return this.getTimelineCategoriesByBook(bookId);
  }

  async deleteTimelineCategoryAndReassign(catId: string, reassignToCatId: string, bookId: string): Promise<void> {
    return this.deleteTimelineCategory(bookId, catId, reassignToCatId);
  }

  async resetTimelineCategoriesToDefault(bookId: string): Promise<TimelineCategory[]> {
    const existing = await this.getByIndex<TimelineCategory>('timelineCategories', 'bookId', bookId);
    for (const c of existing) {
      await this.delete('timelineCategories', c.id);
    }
    return this.getTimelineCategoriesByBook(bookId);
  }

  async getIdeaCategories(bookId: string): Promise<IdeaCategory[]> {
    return this.getIdeaCategoriesByBook(bookId);
  }

  async deleteIdeaCategoryAndReassign(catId: string, reassignToCatId: string, bookId: string): Promise<void> {
    return this.deleteIdeaCategory(bookId, catId, reassignToCatId);
  }

  async resetIdeaCategoriesToDefault(bookId: string): Promise<IdeaCategory[]> {
    const existing = await this.getByIndex<IdeaCategory>('ideaCategories', 'bookId', bookId);
    for (const c of existing) {
      await this.delete('ideaCategories', c.id);
    }
    return this.getIdeaCategoriesByBook(bookId);
  }

  // --- Timeline Tracks (Múltiples Líneas de Tiempo) ---
  async getTimelineTracksByBook(bookId: string): Promise<TimelineTrack[]> {
    let list = await this.getByIndex<TimelineTrack>('timelineTracks', 'bookId', bookId);
    if (!list || list.length === 0) {
      const defaultTrack: TimelineTrack = {
        id: `track_main_${bookId}`,
        bookId,
        title: 'Línea Temporal Principal',
        description: 'Secuencia cronológica principal de la historia',
        color: '#D4AF37',
        order: 0,
        isMain: true,
        createdAt: new Date().toISOString(),
      };
      await this.put('timelineTracks', defaultTrack);
      list = [defaultTrack];

      // Backfill any existing unassigned events and connections to this main track
      try {
        const existingEvents = await this.getByIndex<TimelineEvent>('timelineEvents', 'bookId', bookId);
        for (const ev of existingEvents) {
          if (!ev.timelineTrackId) {
            await this.put('timelineEvents', { ...ev, timelineTrackId: defaultTrack.id });
          }
        }
        const existingConns = await this.getByIndex<TimelineConnection>('timelineConnections', 'bookId', bookId);
        for (const conn of existingConns) {
          if (!conn.timelineTrackId) {
            await this.put('timelineConnections', { ...conn, timelineTrackId: defaultTrack.id });
          }
        }
      } catch (err) {
        console.warn('Migration to default track notice:', err);
      }
    }
    return list.sort((a, b) => a.order - b.order);
  }

  async saveTimelineTrack(track: TimelineTrack): Promise<void> {
    await this.put('timelineTracks', track);
  }

  async deleteTimelineTrack(trackId: string, bookId: string): Promise<void> {
    const tracks = await this.getTimelineTracksByBook(bookId);
    const fallbackTrack = tracks.find((t) => t.isMain && t.id !== trackId) || tracks.find((t) => t.id !== trackId);

    if (fallbackTrack) {
      const allEvents = await this.getByIndex<TimelineEvent>('timelineEvents', 'bookId', bookId);
      for (const ev of allEvents) {
        if (ev.timelineTrackId === trackId) {
          await this.put('timelineEvents', { ...ev, timelineTrackId: fallbackTrack.id });
        }
      }
      const allConns = await this.getByIndex<TimelineConnection>('timelineConnections', 'bookId', bookId);
      for (const conn of allConns) {
        if (conn.timelineTrackId === trackId) {
          await this.put('timelineConnections', { ...conn, timelineTrackId: fallbackTrack.id });
        }
      }
    }
    await this.delete('timelineTracks', trackId);
  }

  // --- Timeline Events ---
  async getTimelineEventsByBook(bookId: string): Promise<TimelineEvent[]> {
    return this.getByIndex<TimelineEvent>('timelineEvents', 'bookId', bookId);
  }

  async saveTimelineEvent(event: TimelineEvent): Promise<void> {
    await this.put('timelineEvents', event);
  }

  async deleteTimelineEvent(eventId: string): Promise<void> {
    // Also delete connections touching this event
    const allConns = await this.getAll<TimelineConnection>('timelineConnections');
    for (const c of allConns) {
      if (c.sourceEventId === eventId || c.targetEventId === eventId) {
        await this.delete('timelineConnections', c.id);
      }
    }
    // Also re-parent or delete sub-events
    const allEvents = await this.getAll<TimelineEvent>('timelineEvents');
    for (const e of allEvents) {
      if (e.parentEventId === eventId) {
        // detach sub-event
        await this.put('timelineEvents', { ...e, parentEventId: null });
      }
    }
    await this.delete('timelineEvents', eventId);
  }

  // --- Timeline Connections ---
  async getTimelineConnectionsByBook(bookId: string): Promise<TimelineConnection[]> {
    return this.getByIndex<TimelineConnection>('timelineConnections', 'bookId', bookId);
  }

  async saveTimelineConnection(connection: TimelineConnection): Promise<void> {
    await this.put('timelineConnections', connection);
  }

  async deleteTimelineConnection(connectionId: string): Promise<void> {
    await this.delete('timelineConnections', connectionId);
  }

  // --- Timeline Lanes (Carriles / Modo B) ---
  async getTimelineLanesByBook(bookId: string): Promise<TimelineLane[]> {
    let list = await this.getByIndex<TimelineLane>('timelineLanes', 'bookId', bookId);
    if (list.length === 0) {
      const defaults: TimelineLane[] = [
        {
          id: `lane_trama_${bookId}`,
          bookId,
          name: 'Trama Principal',
          description: 'Hitos clave y giros de la trama principal',
          color: '#2D5A43',
          category: 'trama_principal',
          order: 0,
          isVisible: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: `lane_personajes_${bookId}`,
          bookId,
          name: 'Vida de Personajes',
          description: 'Líneas biográficas, nacimientos, arcos evolutivos',
          color: '#1B3B5C',
          category: 'personajes',
          order: 1,
          isVisible: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: `lane_historia_${bookId}`,
          bookId,
          name: 'Historia y Política',
          description: 'Acontecimientos del reino, guerras y tratados',
          color: '#8C6D3B',
          category: 'historia',
          order: 2,
          isVisible: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: `lane_revelaciones_${bookId}`,
          bookId,
          name: 'Revelaciones y Misterios',
          description: 'Pistas descubiertas, secretos desvelados',
          color: '#583778',
          category: 'revelaciones',
          order: 3,
          isVisible: true,
          createdAt: new Date().toISOString(),
        },
      ];
      for (const lane of defaults) {
        await this.put('timelineLanes', lane);
      }
      list = defaults;
    }
    return list.sort((a, b) => a.order - b.order);
  }

  async saveTimelineLane(lane: TimelineLane): Promise<void> {
    await this.put('timelineLanes', lane);
  }

  async deleteTimelineLane(laneId: string): Promise<void> {
    await this.delete('timelineLanes', laneId);
  }

  async reorderTimelineLanes(lanes: TimelineLane[]): Promise<void> {
    for (const lane of lanes) {
      await this.put('timelineLanes', lane);
    }
  }

  // --- Character Categories (Arquetipos y Roles Expandidos) ---
  async getCharacterCategoriesByBook(bookId: string): Promise<CharacterCategory[]> {
    let list = await this.getByIndex<CharacterCategory>('characterCategories', 'bookId', bookId);
    if (list.length === 0) {
      const defaults: Omit<CharacterCategory, 'id'>[] = [
        { bookId, name: 'Protagonista', color: '#1E3B5C', order: 0, isDefault: true },
        { bookId, name: 'Antagonista', color: '#933D2D', order: 1, isDefault: true },
        { bookId, name: 'Deuteragonista', color: '#2D5A43', order: 2, isDefault: true },
        { bookId, name: 'Tritagonista', color: '#583778', order: 3, isDefault: true },
        { bookId, name: 'Secundario', color: '#32526F', order: 4, isDefault: true },
        { bookId, name: 'Mentor / Sabio', color: '#8C6D3B', order: 5, isDefault: true },
        { bookId, name: 'Aliado / Cómplice', color: '#2A5682', order: 6, isDefault: true },
        { bookId, name: 'Interés Romántico', color: '#A64452', order: 7, isDefault: true },
        { bookId, name: 'Guardián del Umbral', color: '#785434', order: 8, isDefault: true },
        { bookId, name: 'Héroe Trágico', color: '#822A2A', order: 9, isDefault: true },
        { bookId, name: 'Falso Aliado / Traidor', color: '#7A324E', order: 10, isDefault: true },
        { bookId, name: 'Coro / Voces', color: '#4A5568', order: 11, isDefault: true },
        { bookId, name: 'Narrador', color: '#3B6E64', order: 12, isDefault: true },
        { bookId, name: 'Personaje Histórico', color: '#6B4F35', order: 13, isDefault: true },
        { bookId, name: 'Símbolo / Alegoría', color: '#70487E', order: 14, isDefault: true },
        { bookId, name: 'Animal / Criatura', color: '#4F6D44', order: 15, isDefault: true },
        { bookId, name: 'Entidad Sobrenatural', color: '#2E6B6B', order: 16, isDefault: true },
        { bookId, name: 'Terciario / Extra', color: '#64748B', order: 17, isDefault: true },
        { bookId, name: 'Otro', color: '#475569', order: 18, isDefault: true },
      ];
      const created: CharacterCategory[] = [];
      for (let i = 0; i < defaults.length; i++) {
        const item: CharacterCategory = {
          ...defaults[i],
          id: `ccat_${i}_${bookId}`,
        };
        await this.put('characterCategories', item);
        created.push(item);
      }
      list = created;
    }
    return list.sort((a, b) => a.order - b.order);
  }

  async saveCharacterCategory(category: CharacterCategory): Promise<void> {
    await this.put('characterCategories', category);
  }

  async deleteCharacterCategory(bookId: string, catId: string, reassignToCatId?: string): Promise<void> {
    const chars = await this.getCharactersByBook(bookId);
    for (const c of chars) {
      if (c.role === catId || (c.categoryIds && c.categoryIds.includes(catId))) {
        const updatedCatIds = (c.categoryIds || []).filter((id) => id !== catId);
        if (reassignToCatId && !updatedCatIds.includes(reassignToCatId)) {
          updatedCatIds.push(reassignToCatId);
        }
        await this.saveCharacter({
          ...c,
          role: c.role === catId ? (reassignToCatId || 'secundario') : c.role,
          categoryIds: updatedCatIds,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    await this.delete('characterCategories', catId);
  }

  async resetCharacterCategoriesToDefault(bookId: string): Promise<CharacterCategory[]> {
    const existing = await this.getByIndex<CharacterCategory>('characterCategories', 'bookId', bookId);
    for (const c of existing) {
      await this.delete('characterCategories', c.id);
    }
    return this.getCharacterCategoriesByBook(bookId);
  }

  // --- Custom Palettes (3-Color Custom Themes) ---
  async getCustomPalettes(): Promise<CustomPaletteConfig[]> {
    return this.getAll<CustomPaletteConfig>('customPalettes');
  }

  async saveCustomPalette(palette: CustomPaletteConfig): Promise<void> {
    await this.put('customPalettes', palette);
  }

  async deleteCustomPalette(paletteId: string): Promise<void> {
    await this.delete('customPalettes', paletteId);
  }

  // --- Custom Fonts (Local TTF/OTF Files in IndexedDB) ---
  async getCustomFonts(): Promise<CustomFontItem[]> {
    return this.getAll<CustomFontItem>('customFonts');
  }

  async saveCustomFont(font: CustomFontItem): Promise<void> {
    await this.put('customFonts', font);
  }

  async deleteCustomFont(fontId: string): Promise<void> {
    await this.delete('customFonts', fontId);
  }

  // --- Detail Category Reordering ---
  async saveDetailCategoryOrder(categories: DetailCategory[]): Promise<void> {
    for (let i = 0; i < categories.length; i++) {
      const cat = { ...categories[i], order: i };
      await this.put('detailCategories', cat);
    }
  }

  // --- Audios (Blob Storage) ---
  async saveAudio(audioRecord: AudioRecord, fileBlob: Blob): Promise<void> {
    const stored: StoredAudio = {
      ...audioRecord,
      blob: fileBlob,
    };
    await this.put('audios', stored);
  }

  async getAudiosByChapter(chapterId: string): Promise<AudioRecord[]> {
    const list = await this.getByIndex<StoredAudio>('audios', 'chapterId', chapterId);
    return list.map((item) => {
      let blobUrl: string | undefined;
      if (item.blob) {
        try {
          blobUrl = URL.createObjectURL(item.blob);
        } catch (e) {
          console.warn('Could not create ObjectURL', e);
        }
      }
      return {
        id: item.id,
        bookId: item.bookId,
        chapterId: item.chapterId,
        name: item.name,
        fileName: item.fileName,
        mimeType: item.mimeType,
        size: item.size,
        duration: item.duration,
        createdAt: item.createdAt,
        notes: item.notes,
        transcription: item.transcription,
        blobDataUrl: blobUrl,
      };
    });
  }

  async getAudioBlob(audioId: string): Promise<Blob | null> {
    const item = await this.getById<StoredAudio>('audios', audioId);
    return item?.blob || null;
  }

  async updateAudioMetadata(
    audioId: string,
    updates: Partial<Pick<AudioRecord, 'name' | 'notes' | 'transcription'>>
  ): Promise<void> {
    const item = await this.getById<StoredAudio>('audios', audioId);
    if (!item) return;
    const updated = { ...item, ...updates };
    await this.put('audios', updated);
  }

  async deleteAudio(audioId: string): Promise<void> {
    await this.delete('audios', audioId);
  }

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    const record = await this.getById<{ key: string; value: AppSettings }>('settings', 'app_config');
    if (record?.value) return record.value;
    return {
      globalPalette: 'bosque',
      darkMode: false,
      editorFontSize: 18,
      editorFontFamily: 'lora',
      autoSaveDelay: 1000,
    };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.put('settings', { key: 'app_config', value: settings });
  }

  // --- User Accounts (Solo usuario y contraseña) ---
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_pluma_tiempo_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async getUsers(): Promise<UserAccount[]> {
    return this.getAll<UserAccount>('users');
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    return this.getById<UserAccount>('users', id);
  }

  async getUserByUsername(username: string): Promise<UserAccount | null> {
    const normalized = username.trim().toLowerCase();
    const users = await this.getUsers();
    return users.find((u) => u.username.toLowerCase() === normalized) || null;
  }

  async createUser(username: string, password: string, displayName?: string): Promise<UserAccount> {
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

    const existing = await this.getUserByUsername(cleanUsername);
    if (existing) {
      throw new Error(`El usuario "${cleanUsername}" ya existe. Por favor elige otro o inicia sesión.`);
    }

    const passwordHash = await this.hashPassword(password);
    const colors = ['#2D5A43', '#1B3B5C', '#933D2D', '#583778', '#D47754', '#165B54', '#4F6C8D'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: UserAccount = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      displayName: displayName?.trim() || cleanUsername,
      passwordHash,
      avatarColor: randomColor,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await this.put('users', newUser);
    this.setCurrentSessionUserId(newUser.id);
    return newUser;
  }

  async saveUserAccount(user: UserAccount): Promise<void> {
    await this.put('users', user);
  }

  async loginUser(username: string, password: string): Promise<UserAccount> {
    const cleanUsername = username.trim().toLowerCase();
    const user = await this.getUserByUsername(cleanUsername);
    if (!user) {
      throw new Error('Usuario no encontrado. Comprueba el nombre o crea una nueva cuenta.');
    }

    const passwordHash = await this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Contraseña incorrecta.');
    }

    const updatedUser: UserAccount = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };
    await this.put('users', updatedUser);
    this.setCurrentSessionUserId(updatedUser.id);
    return updatedUser;
  }

  getCurrentSessionUserId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('pluma_current_user_id');
  }

  setCurrentSessionUserId(userId: string | null): void {
    if (typeof localStorage === 'undefined') return;
    if (userId) {
      localStorage.setItem('pluma_current_user_id', userId);
    } else {
      localStorage.removeItem('pluma_current_user_id');
    }
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    const id = this.getCurrentSessionUserId();
    if (!id) return null;
    return this.getUserById(id);
  }

  async logout(): Promise<void> {
    this.setCurrentSessionUserId(null);
  }

  async updateUserProfile(
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
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    // If username is being updated, verify it is strictly unique across all other accounts
    if (updates.username && updates.username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
      }
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUsername)) {
        throw new Error('El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.');
      }
      const existing = await this.getUserByUsername(cleanUsername);
      if (existing && existing.id !== userId) {
        throw new Error(`El nombre de usuario "${cleanUsername}" ya está registrado por otro escritor. Por favor elige otro.`);
      }
      user.username = cleanUsername;
    }

    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.email !== undefined) user.email = updates.email.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.avatarColor !== undefined) user.avatarColor = updates.avatarColor;
    if (updates.bio !== undefined) user.bio = updates.bio.trim();

    await this.put('users', user);

    // Sync collaborator display in any books where this user is collaborating
    try {
      const allBooks = await this.getAll<Book>('books');
      for (const b of allBooks) {
        if (b.collaborators && b.collaborators.some((c) => c.userId === userId)) {
          const updatedCollabs = b.collaborators.map((c) =>
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
          await this.put('books', { ...b, collaborators: updatedCollabs });
        }
      }
    } catch (e) {
      console.warn('Error syncing collaborator profiles in books:', e);
    }

    return user;
  }

  async changeUserPassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado.');

    const currentHash = await this.hashPassword(currentPass);
    if (user.passwordHash !== currentHash) {
      throw new Error('La contraseña actual es incorrecta.');
    }

    if (!newPass || newPass.length < 4) {
      throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
    }

    user.passwordHash = await this.hashPassword(newPass);
    await this.put('users', user);
  }

  // --- User-Scoped Books (Cada cuenta guarda los libros de ese usuario o compartidos) ---
  async getBooksForUser(userId: string | null): Promise<{ myBooks: Book[]; sharedBooks: Book[] }> {
    const all = await this.getAllBooksRaw();
    if (!userId) {
      // Guest or no account: only books without specific owner
      return {
        myBooks: all.filter((b) => !b.userId),
        sharedBooks: [],
      };
    }

    const curUser = await this.getUserById(userId);
    const myBooks = all.filter((b) => b.userId === userId);
    const sharedBooks = all.filter(
      (b) =>
        b.userId !== userId &&
        b.collaborators?.some(
          (c) =>
            c.userId === userId ||
            (curUser && c.username && c.username.toLowerCase() === curUser.username.toLowerCase())
        )
    );

    return { myBooks, sharedBooks };
  }

  // --- Book Collaborators (Compartir libros con otros usuarios por nombre) ---
  async addBookCollaborator(
    bookId: string,
    usernameToAdd: string,
    role: 'editor' | 'colaborador' | 'visitante'
  ): Promise<Book> {
    const book = await this.getById<Book>('books', bookId);
    if (!book) throw new Error('Libro no encontrado.');

    const cleanUsername = usernameToAdd.trim().toLowerCase();
    const targetUser = await this.getUserByUsername(cleanUsername);
    if (!targetUser) {
      throw new Error(`El usuario "@${usernameToAdd}" no está registrado en la plataforma. Verifica el nombre exacto.`);
    }

    if (book.userId && book.userId === targetUser.id) {
      throw new Error('No puedes añadirte a ti mismo como colaborador de tu propio libro.');
    }

    const collaborators = book.collaborators ? [...book.collaborators] : [];
    const existingIndex = collaborators.findIndex(
      (c) => c.userId === targetUser.id || c.username.toLowerCase() === cleanUsername
    );

    if (existingIndex >= 0) {
      collaborators[existingIndex].role = role;
    } else {
      collaborators.push({
        userId: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName || targetUser.username,
        avatarColor: targetUser.avatarColor,
        avatarUrl: targetUser.avatarUrl,
        role,
        addedAt: new Date().toISOString(),
      });
    }

    const updatedBook: Book = {
      ...book,
      collaborators,
      updatedAt: new Date().toISOString(),
    };

    await this.put('books', updatedBook);
    return updatedBook;
  }

  async removeBookCollaborator(bookId: string, collaboratorUserId: string): Promise<Book> {
    const book = await this.getById<Book>('books', bookId);
    if (!book) throw new Error('Libro no encontrado.');

    const collaborators = (book.collaborators || []).filter(
      (c) => c.userId !== collaboratorUserId && c.username !== collaboratorUserId
    );

    const updatedBook: Book = {
      ...book,
      collaborators,
      updatedAt: new Date().toISOString(),
    };

    await this.put('books', updatedBook);
    return updatedBook;
  }

  async updateCollaboratorRole(
    bookId: string,
    collaboratorUserId: string,
    newRole: 'editor' | 'colaborador' | 'visitante'
  ): Promise<Book> {
    const book = await this.getById<Book>('books', bookId);
    if (!book) throw new Error('Libro no encontrado.');

    const collaborators = (book.collaborators || []).map((c) =>
      c.userId === collaboratorUserId || c.username === collaboratorUserId
        ? { ...c, role: newRole }
        : c
    );

    const updatedBook: Book = {
      ...book,
      collaborators,
      updatedAt: new Date().toISOString(),
    };

    await this.put('books', updatedBook);
    return updatedBook;
  }

  // --- Writing Calendar & Streaks (Rachas de Constancia) ---
  async getDailyWritingLogs(): Promise<DailyWritingLog[]> {
    const list = await this.getAll<DailyWritingLog>('dailyWritingLogs');
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDailyWritingLogByDate(dateStr: string): Promise<DailyWritingLog | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('dailyWritingLogs', 'readonly');
      const store = tx.objectStore('dailyWritingLogs');
      const idx = store.index('date');
      const req = idx.get(dateStr);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveDailyWritingLog(log: DailyWritingLog): Promise<void> {
    await this.put('dailyWritingLogs', log);
  }

  async deleteDailyWritingLog(id: string): Promise<void> {
    await this.delete('dailyWritingLogs', id);
  }

  async recordWritingSession(
    bookId: string,
    bookTitle: string,
    wordsAdded: number,
    chapterId?: string,
    chapterTitle?: string,
    customDateStr?: string
  ): Promise<DailyWritingLog> {
    const dateStr = customDateStr || new Date().toISOString().slice(0, 10);
    const existing = await this.getDailyWritingLogByDate(dateStr);

    const logId = existing ? existing.id : `log_${dateStr}`;
    const prevTotal = existing ? existing.totalWordsWritten : 0;
    const newTotal = Math.max(0, prevTotal + wordsAdded);

    const bookBreakdown = existing?.bookBreakdown ? { ...existing.bookBreakdown } : {};
    const currentBookEntry = bookBreakdown[bookId] || {
      bookId,
      bookTitle,
      wordsWritten: 0,
      chaptersWorked: [],
    };

    const newBookWords = Math.max(0, currentBookEntry.wordsWritten + wordsAdded);
    const chaptersWorked = currentBookEntry.chaptersWorked ? [...currentBookEntry.chaptersWorked] : [];

    if (chapterId && chapterTitle) {
      const chIdx = chaptersWorked.findIndex((c) => c.chapterId === chapterId);
      if (chIdx >= 0) {
        chaptersWorked[chIdx].words += wordsAdded;
      } else {
        chaptersWorked.push({ chapterId, chapterTitle, words: wordsAdded });
      }
    }

    bookBreakdown[bookId] = {
      bookId,
      bookTitle,
      wordsWritten: newBookWords,
      chaptersWorked,
    };

    const log: DailyWritingLog = {
      id: logId,
      date: dateStr,
      totalWordsWritten: newTotal,
      bookBreakdown,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveDailyWritingLog(log);
    return log;
  }

  /**
   * Calculates writing streak based on the explicit prompt rule:
   * "tener una racha de escritura despues de 5 dias y haber escrito como minimo 10 palabras mas que el dia anterior"
   */
  async calculateStreakStatus(todayDateStr?: string): Promise<WritingStreakStatus> {
    const today = todayDateStr || new Date().toISOString().slice(0, 10);
    const logs = await this.getDailyWritingLogs();
    const logMap = new Map<string, DailyWritingLog>();
    logs.forEach((l) => logMap.set(l.date, l));

    // Yesterday's date
    const todayDateObj = new Date(today + 'T12:00:00Z');
    const yesterdayDateObj = new Date(todayDateObj);
    yesterdayDateObj.setUTCDate(yesterdayDateObj.getUTCDate() - 1);
    const yesterdayStr = yesterdayDateObj.toISOString().slice(0, 10);

    const todayWords = logMap.get(today)?.totalWordsWritten || 0;
    const yesterdayWords = logMap.get(yesterdayStr)?.totalWordsWritten || 0;

    // Requirement: at least 10 words more than previous day (or 10 if starting)
    const requiredWordsToday = yesterdayWords > 0 ? yesterdayWords + 10 : 10;
    const todayGoalMet = todayWords >= requiredWordsToday && todayWords > 0;

    // Evaluate consecutive qualified days
    let consecutiveDays = 0;
    let checkDateObj = new Date(todayDateObj);

    // If today has met goal, include today; otherwise start verifying from yesterday
    if (!todayGoalMet) {
      checkDateObj.setUTCDate(checkDateObj.getUTCDate() - 1);
    }

    while (true) {
      const curStr = checkDateObj.toISOString().slice(0, 10);
      const prevDateObj = new Date(checkDateObj);
      prevDateObj.setUTCDate(prevDateObj.getUTCDate() - 1);
      const prevStr = prevDateObj.toISOString().slice(0, 10);

      const curWords = logMap.get(curStr)?.totalWordsWritten || 0;
      const prevWords = logMap.get(prevStr)?.totalWordsWritten || 0;

      if (curWords === 0) {
        break;
      }

      const reqWords = prevWords > 0 ? prevWords + 10 : 10;
      if (curWords >= reqWords) {
        consecutiveDays++;
        checkDateObj = prevDateObj;
      } else {
        // First starting day with >= 10 words qualifies
        if (prevWords === 0 && curWords >= 10) {
          consecutiveDays++;
        }
        break;
      }
    }

    // Historical best streak calculation
    let bestStreak = consecutiveDays;
    let runningStreak = 0;
    for (let i = 0; i < logs.length; i++) {
      const cur = logs[i];
      const prev = i > 0 ? logs[i - 1] : null;

      if (prev) {
        const curD = new Date(cur.date + 'T12:00:00Z');
        const prevD = new Date(prev.date + 'T12:00:00Z');
        const diffDays = Math.round((curD.getTime() - prevD.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1 && cur.totalWordsWritten >= prev.totalWordsWritten + 10) {
          runningStreak++;
        } else {
          runningStreak = cur.totalWordsWritten >= 10 ? 1 : 0;
        }
      } else {
        runningStreak = cur.totalWordsWritten >= 10 ? 1 : 0;
      }

      if (runningStreak > bestStreak) bestStreak = runningStreak;
    }

    // Streak unlocks after 5 consecutive qualifying days
    const isUnlocked = consecutiveDays >= 5;

    return {
      currentStreakDays: isUnlocked ? consecutiveDays : 0,
      unlockedStreak: isUnlocked,
      consecutiveDaysAchieved: consecutiveDays,
      todayDate: today,
      todayWords,
      yesterdayWords,
      requiredWordsToday,
      todayGoalMet,
      bestStreakDays: Math.max(bestStreak, isUnlocked ? consecutiveDays : 0),
    };
  }

  // --- Writing Notifications & Motivational Reminders ---
  async getWritingNotifications(): Promise<DailyNotificationReminder[]> {
    const list = await this.getAll<DailyNotificationReminder>('writingNotifications');
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async saveWritingNotification(notif: DailyNotificationReminder): Promise<void> {
    await this.put('writingNotifications', notif);
  }

  async markNotificationRead(id: string): Promise<void> {
    const notif = await this.getById<DailyNotificationReminder>('writingNotifications', id);
    if (notif) {
      await this.put('writingNotifications', { ...notif, read: true });
    }
  }

  async seedWritingHistoryIfEmpty(bookId: string, bookTitle: string): Promise<void> {
    const existing = await this.getDailyWritingLogs();
    if (existing.length > 0) return;

    // Seed 6 days of progressive writing (+15 to +20 words per day)
    // to showcase the 5-day streak unlocked and currently active!
    const today = new Date();
    const wordProgression = [50, 70, 95, 120, 145, 175]; // All satisfy >= previous + 10

    for (let i = 0; i < wordProgression.length; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - (5 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const words = wordProgression[i];

      const log: DailyWritingLog = {
        id: `log_${dateStr}`,
        date: dateStr,
        totalWordsWritten: words,
        bookBreakdown: {
          [bookId]: {
            bookId,
            bookTitle,
            wordsWritten: words,
            chaptersWorked: [
              { chapterId: 'chap_1', chapterTitle: 'El tic-tac de la niebla', words: Math.round(words * 0.6) },
              { chapterId: 'chap_2', chapterTitle: 'El precio de un secreto', words: Math.round(words * 0.4) },
            ],
          },
        },
        meetsStreakGoal: true,
        notes: i === 5 ? '¡Meta del día superada con éxito!' : 'Sesión de escritura diaria completada.',
        createdAt: d.toISOString(),
        updatedAt: d.toISOString(),
      };
      await this.saveDailyWritingLog(log);
    }

    // Add initial motivational notification
    const initialNotif: DailyNotificationReminder = {
      id: 'notif_welcome_streak',
      date: new Date().toISOString().slice(0, 10),
      title: '🔥 ¡Racha de 5 días desbloqueada!',
      message: 'Has mantenido una constancia admirable superando en más de 10 palabras la meta de cada día anterior. ¡Sigue así hoy!',
      type: 'streak_unlocked',
      timestamp: new Date().toISOString(),
      read: false,
    };
    await this.saveWritingNotification(initialNotif);
  }


  // --- Storage Quota info ---
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return { usage: est.usage || 0, quota: est.quota || 0 };
    }
    return { usage: 0, quota: 0 };
  }

  // --- Export and Import Project ---
  async exportBookToJson(bookId: string): Promise<string> {
    const book = await this.getById<Book>('books', bookId);
    if (!book) throw new Error('Libro no encontrado');

    const chapters = await this.getChaptersByBook(bookId);
    const characters = await this.getCharactersByBook(bookId);
    const details = await this.getDetailsByBook(bookId);
    const ideas = await this.getIdeasByBook(bookId);
    const timelineTracks = await this.getTimelineTracksByBook(bookId);
    const timelineEvents = await this.getTimelineEventsByBook(bookId);
    const timelineConnections = await this.getTimelineConnectionsByBook(bookId);

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      book,
      chapters,
      characters,
      details,
      ideas,
      timelineTracks,
      timelineEvents,
      timelineConnections,
    };

    return JSON.stringify(data, null, 2);
  }

  // --- Comprehensive User Backup & Restore ---
  async exportFullUserBackup(userId: string): Promise<string> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado para exportar copia de seguridad.');

    // Fetch user books
    const allBooks = await this.getAllBooksRaw();
    const userBooks = allBooks.filter(
      (b) =>
        b.userId === userId ||
        b.collaborators?.some(
          (c) =>
            c.userId === userId ||
            (c.username && c.username.toLowerCase() === user.username.toLowerCase())
        )
    );

    const userBookIds = new Set(userBooks.map((b) => b.id));

    // Gather all related items across all user books
    const allChapters = await this.getAll<Chapter>('chapters');
    const chapters = allChapters.filter((c) => userBookIds.has(c.bookId));

    const allCharacters = await this.getAll<Character>('characters');
    const characters = allCharacters.filter((c) => userBookIds.has(c.bookId));

    const allCharCats = await this.getAll<CharacterCategory>('characterCategories');
    const characterCategories = allCharCats.filter((c) => userBookIds.has(c.bookId));

    const allDetails = await this.getAll<WorldDetail>('details');
    const details = allDetails.filter((d) => userBookIds.has(d.bookId));

    const allDetailCats = await this.getAll<DetailCategory>('detailCategories');
    const detailCategories = allDetailCats.filter((c) => userBookIds.has(c.bookId));

    const allIdeas = await this.getAll<Idea>('ideas');
    const ideas = allIdeas.filter((i) => userBookIds.has(i.bookId));

    const allIdeaCats = await this.getAll<IdeaCategory>('ideaCategories');
    const ideaCategories = allIdeaCats.filter((c) => userBookIds.has(c.bookId));

    const allTimelineTracks = await this.getAll<TimelineTrack>('timelineTracks');
    const timelineTracks = allTimelineTracks.filter((t) => userBookIds.has(t.bookId));

    const allTimelineLanes = await this.getAll<TimelineLane>('timelineLanes');
    const timelineLanes = allTimelineLanes.filter((l) => userBookIds.has(l.bookId));

    const allTimelineCats = await this.getAll<TimelineCategory>('timelineCategories');
    const timelineCategories = allTimelineCats.filter((c) => userBookIds.has(c.bookId));

    const allTimelineEvents = await this.getAll<TimelineEvent>('timelineEvents');
    const timelineEvents = allTimelineEvents.filter((e) => userBookIds.has(e.bookId));

    const allTimelineConns = await this.getAll<TimelineConnection>('timelineConnections');
    const timelineConnections = allTimelineConns.filter((c) => userBookIds.has(c.bookId));

    const writingLogs = await this.getDailyWritingLogs();
    const customPalettes = await this.getCustomPalettes();

    const backupData = {
      app: 'Pluma & Tiempo',
      backupVersion: '3.0',
      type: 'full_backup',
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      },
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

    return JSON.stringify(backupData, null, 2);
  }

  async restoreBackupFromJson(
    jsonString: string,
    targetUserId?: string
  ): Promise<{
    booksCount: number;
    chaptersCount: number;
    charactersCount: number;
    detailsCount: number;
    ideasCount: number;
    eventsCount: number;
    connectionsCount: number;
    firstRestoredBookId?: string;
  }> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      throw new Error('El archivo no es un archivo JSON válido: ' + e.message);
    }

    let booksCount = 0;
    let chaptersCount = 0;
    let charactersCount = 0;
    let detailsCount = 0;
    let ideasCount = 0;
    let eventsCount = 0;
    let connectionsCount = 0;
    let firstRestoredBookId: string | undefined;

    // Format A: Single book export object { book: Book, chapters: [...], ... }
    if (parsed.book && parsed.book.title) {
      const bookObj = parsed.book;
      const newBookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const oldBookId = bookObj.id;
      const idMap: Record<string, string> = { [oldBookId]: newBookId };

      const restoredBook: Book = {
        ...bookObj,
        id: newBookId,
        userId: targetUserId || bookObj.userId,
        title: `${bookObj.title} (Restaurado)`,
        updatedAt: new Date().toISOString(),
      };
      await this.saveBook(restoredBook);
      booksCount++;
      firstRestoredBookId = newBookId;

      for (const c of parsed.chapters || []) {
        const newChapId = 'chap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        idMap[c.id] = newChapId;
        await this.saveChapter({ ...c, id: newChapId, bookId: newBookId, audioIds: [] });
        chaptersCount++;
      }

      for (const ch of parsed.characters || []) {
        const newCharId = 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        idMap[ch.id] = newCharId;
        await this.saveCharacter({ ...ch, id: newCharId, bookId: newBookId });
        charactersCount++;
      }

      for (const d of parsed.details || []) {
        const newDetId = 'det_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        idMap[d.id] = newDetId;
        await this.saveDetail({ ...d, id: newDetId, bookId: newBookId });
        detailsCount++;
      }

      for (const i of parsed.ideas || []) {
        const newIdeaId = 'idea_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        idMap[i.id] = newIdeaId;
        await this.saveIdea({ ...i, id: newIdeaId, bookId: newBookId });
        ideasCount++;
      }

      for (const trk of parsed.timelineTracks || []) {
        const newTrkId = 'track_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        idMap[trk.id] = newTrkId;
        await this.saveTimelineTrack({ ...trk, id: newTrkId, bookId: newBookId });
      }

      for (const e of parsed.timelineEvents || []) {
        const newEvId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        idMap[e.id] = newEvId;
        await this.saveTimelineEvent({
          ...e,
          id: newEvId,
          bookId: newBookId,
          timelineTrackId: e.timelineTrackId ? (idMap[e.timelineTrackId] || e.timelineTrackId) : undefined,
          parentEventId: e.parentEventId ? (idMap[e.parentEventId] || e.parentEventId) : null,
        });
        eventsCount++;
      }

      for (const conn of parsed.timelineConnections || []) {
        const newConnId = 'conn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await this.saveTimelineConnection({
          ...conn,
          id: newConnId,
          bookId: newBookId,
          timelineTrackId: conn.timelineTrackId ? (idMap[conn.timelineTrackId] || conn.timelineTrackId) : undefined,
          sourceEventId: idMap[conn.sourceEventId] || conn.sourceEventId,
          targetEventId: idMap[conn.targetEventId] || conn.targetEventId,
        });
        connectionsCount++;
      }

      return {
        booksCount,
        chaptersCount,
        charactersCount,
        detailsCount,
        ideasCount,
        eventsCount,
        connectionsCount,
        firstRestoredBookId,
      };
    }

    // Format B: Multi-book full backup package or array of books
    const booksList: Book[] = Array.isArray(parsed.books)
      ? parsed.books
      : Array.isArray(parsed)
      ? parsed
      : parsed.title
      ? [parsed]
      : [];

    if (booksList.length === 0) {
      throw new Error('El archivo no contiene manuscritos ni proyectos literarios reconocibles.');
    }

    // Save all books
    for (const b of booksList) {
      const bookToSave: Book = {
        ...b,
        userId: targetUserId || b.userId,
        updatedAt: new Date().toISOString(),
      };
      await this.saveBook(bookToSave);
      booksCount++;
      if (!firstRestoredBookId) firstRestoredBookId = bookToSave.id;

      // Extract nested children if they were packaged directly inside book object
      if (Array.isArray((b as any).chapters)) {
        for (const c of (b as any).chapters) {
          await this.saveChapter({ ...c, bookId: bookToSave.id });
          chaptersCount++;
        }
      }
      if (Array.isArray((b as any).characters)) {
        for (const c of (b as any).characters) {
          await this.saveCharacter({ ...c, bookId: bookToSave.id });
          charactersCount++;
        }
      }
      if (Array.isArray((b as any).details)) {
        for (const d of (b as any).details) {
          await this.saveDetail({ ...d, bookId: bookToSave.id });
          detailsCount++;
        }
      }
      if (Array.isArray((b as any).ideas)) {
        for (const i of (b as any).ideas) {
          await this.saveIdea({ ...i, bookId: bookToSave.id });
          ideasCount++;
        }
      }
    }

    // Save top-level collections
    if (Array.isArray(parsed.chapters)) {
      for (const c of parsed.chapters) {
        await this.saveChapter(c);
        chaptersCount++;
      }
    }

    if (Array.isArray(parsed.characters)) {
      for (const c of parsed.characters) {
        await this.saveCharacter(c);
        charactersCount++;
      }
    }

    if (Array.isArray(parsed.characterCategories)) {
      for (const c of parsed.characterCategories) {
        await this.put('characterCategories', c);
      }
    }

    if (Array.isArray(parsed.details)) {
      for (const d of parsed.details) {
        await this.saveDetail(d);
        detailsCount++;
      }
    }

    if (Array.isArray(parsed.detailCategories)) {
      for (const c of parsed.detailCategories) {
        await this.put('detailCategories', c);
      }
    }

    if (Array.isArray(parsed.ideas)) {
      for (const i of parsed.ideas) {
        await this.saveIdea(i);
        ideasCount++;
      }
    }

    if (Array.isArray(parsed.ideaCategories)) {
      for (const c of parsed.ideaCategories) {
        await this.put('ideaCategories', c);
      }
    }

    if (Array.isArray(parsed.timelineTracks)) {
      for (const t of parsed.timelineTracks) {
        await this.saveTimelineTrack(t);
      }
    }

    if (Array.isArray(parsed.timelineLanes)) {
      for (const l of parsed.timelineLanes) {
        await this.saveTimelineLane(l);
      }
    }

    if (Array.isArray(parsed.timelineCategories)) {
      for (const c of parsed.timelineCategories) {
        await this.saveTimelineCategory(c);
      }
    }

    if (Array.isArray(parsed.timelineEvents)) {
      for (const e of parsed.timelineEvents) {
        await this.saveTimelineEvent(e);
        eventsCount++;
      }
    }

    if (Array.isArray(parsed.timelineConnections)) {
      for (const c of parsed.timelineConnections) {
        await this.saveTimelineConnection(c);
        connectionsCount++;
      }
    }

    if (Array.isArray(parsed.writingLogs)) {
      for (const log of parsed.writingLogs) {
        const logToSave = targetUserId ? { ...log, userId: targetUserId } : log;
        await this.saveDailyWritingLog(logToSave);
      }
    }

    if (Array.isArray(parsed.customPalettes)) {
      for (const pal of parsed.customPalettes) {
        await this.saveCustomPalette(pal);
      }
    }

    return {
      booksCount,
      chaptersCount,
      charactersCount,
      detailsCount,
      ideasCount,
      eventsCount,
      connectionsCount,
      firstRestoredBookId,
    };
  }

  async importBookFromJson(jsonString: string, targetUserId?: string): Promise<string> {
    const res = await this.restoreBackupFromJson(jsonString, targetUserId);
    if (!res.firstRestoredBookId) {
      throw new Error('No se pudo identificar ningún libro en el archivo proporcionado.');
    }
    return res.firstRestoredBookId;
  }

  // --- Seed initial data if database is brand new ---
  async seedIfEmpty(): Promise<void> {
    const books = await this.getBooks();
    if (books.length > 0) return;

    // Create rich initial demonstration book
    const bookId = 'book_cronicas_valoria';
    const demoBook: Book = {
      id: bookId,
      title: 'Las Sombras de Valoria',
      subtitle: 'El despertar del linaje olvidado',
      description:
        'En una ciudad suspendida sobre un mar de niebla eterna, un relojero descubre un mecanismo que revela memorias de reyes caídos y profecías de una rebelión inminente.',
      genre: 'Fantasía Oscura y Misterio',
      status: 'escritura',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
      colorPalette: 'bosque',
      targetWordCount: 80000,
      coverGradient: 'from-emerald-950 via-teal-900 to-stone-900',
      coverIcon: 'Compass',
      isArchived: false,
    };
    await this.saveBook(demoBook);

    // Characters
    const char1: Character = {
      id: 'char_aelys',
      bookId,
      name: 'Aélys Vane',
      aliases: 'El Relojero Ciego, La Sombra del Campanario',
      age: '29 años',
      birthDate: 'Año 1412, Noche de la Lente Roja',
      role: 'protagonista',
      appearance: 'Cabello cenizo desordenado, ojos ambarinos de mirada huidiza, manos curtidas por engranajes y ácidos de orfebrería.',
      personality: 'Metódico, escéptico ante la magia formal, leal en silencio y atormentado por pesadillas recurrentes.',
      backstory: 'Huérfano tras el Gran Incendio del Distrito de los Fuegos. Aprendiz del maestro Horologer hasta que este desapareció misteriosamente.',
      motivations: 'Descubrir qué causó la demencia de su mentor y descifrar la llave octogonal.',
      goals: 'Reparar el Astrolabio de la Catedral antes del eclipse solar de invierno.',
      fears: 'Perder el control de sus recuerdos y la ceguera progresiva.',
      strengths: 'Oído absoluto para metales, intuición deductiva y memoria eidética.',
      weaknesses: 'Dificultad extrema para confiar en aliados y renuencia al uso de armas.',
      secrets: 'Conserva en un doble fondo la carta sellada de la última emperatriz de Valoria.',
      evolution: 'Pasa del retraimiento artesanal a asumir el liderazgo táctico de la Resistencia.',
      firstAppearance: 'Capítulo 1: El tic-tac de la niebla',
      additionalNotes: 'Nunca duerme sin encender una vela aromática de salvia.',
      avatarColor: '#2D5A43',
      relationships: [
        {
          targetCharacterId: 'char_morrigan',
          relationType: 'Aliado',
          description: 'Pacto de conveniencia mutua; ella le suministra planos prohibidos.',
        },
        {
          targetCharacterId: 'char_valerius',
          relationType: 'Enemigo',
          description: 'Inquisidor del Tribunal que persigue a los relojeros independientes.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const char2: Character = {
      id: 'char_morrigan',
      bookId,
      name: 'Lady Morrigan Drake',
      aliases: 'La Grulla de Ceniza',
      age: '34 años',
      birthDate: 'Año 1407, Solsticio de Invierno',
      role: 'secundario',
      appearance: 'Vestiduras de seda carbón, hombreras con filigrana de plata, porte altivo y una cicatriz fina en la mejilla izquierda.',
      personality: 'Estratega calculadora, ingeniosa, amante de la música sacra y ferozmente protectora de los suyos.',
      backstory: 'Hija desterrada de la Casa Drake por negarse a entregar la biblioteca familiar a la Inquisición.',
      motivations: 'Recuperar el honor de su linaje y derrocar el monopolio del éter.',
      goals: 'Comprar los votos de tres senadores antes del equinoccio.',
      fears: 'Que el veneno que corre en su sangre por el pacto ancestral despierte.',
      strengths: 'Finanzas, diplomacia despiadada y esgrima cortesana.',
      weaknesses: 'Orgullo aristocrático y rencor implacable.',
      secrets: 'Mantiene una red secreta de espías niños en los muelles de niebla.',
      evolution: 'Comprende que el sacrificio personal es inevitable para salvar la ciudad.',
      firstAppearance: 'Capítulo 2: El precio de un secreto',
      additionalNotes: 'Porta siempre un anillo con cianuro líquido.',
      avatarColor: '#583778',
      relationships: [
        {
          targetCharacterId: 'char_aelys',
          relationType: 'Aliado',
          description: 'Socia comercial y confidente cautelosa.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const char3: Character = {
      id: 'char_valerius',
      bookId,
      name: 'Canciller Valerius Thorne',
      aliases: 'La Mano de Hierro',
      age: '56 años',
      birthDate: 'Año 1385, Primavera',
      role: 'antagonista',
      appearance: 'Hombre corpulento de mirada gélida, túnica cardenalicia escarlata y guantelete de latón.',
      personality: 'Fanático del orden absoluto, implacable, elocuente y convencido de que la libertad conduce al caos.',
      backstory: 'Veterano de la Guerra de los Canales, ascendió sofocando las revueltas obreras.',
      motivations: 'Consolidar el gobierno teocrático y purificar la tecnología herética.',
      goals: 'Incautar el Astrolabio y ejecutar a los conspiradores.',
      fears: 'Que el pueblo descubra que el núcleo de éter de la ciudad se está apagando.',
      strengths: 'Poder político ilimitado, oratoria persuasiva y guardia pretoriana.',
      weaknesses: 'Paranoia creciente y arrogancia institucional.',
      secrets: 'Él mismo ordenó el Gran Incendio hace quince años.',
      evolution: 'Se aísla progresivamente hasta quedar atrapado en su propia fortaleza.',
      firstAppearance: 'Capítulo 1: Mencionado en pregones',
      additionalNotes: 'Padece gota y consume polvo de loto para el dolor.',
      avatarColor: '#933D2D',
      relationships: [
        {
          targetCharacterId: 'char_aelys',
          relationType: 'Enemigo',
          description: 'Orden de captura y confiscación de su taller.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveCharacter(char1);
    await this.saveCharacter(char2);
    await this.saveCharacter(char3);

    // Chapters
    const chap1: Chapter = {
      id: 'chap_1',
      bookId,
      order: 1,
      number: 1,
      title: 'El tic-tac de la niebla',
      synopsis: 'Aélys trabaja en su taller durante una noche de tormenta cuando un cliente anónimo le entrega un artefacto octogonal con inscripciones imperiales.',
      content: `La niebla nunca descansaba sobre los tejados de Valoria. Se deslizaba entre las cornisas como el aliento frío de un león dormido, acariciando las veletas de latón y apagando los faroles de gas antes de la medianoche.

Aélys Vane sostenía la pinza de precisión con la firmeza de quien ha aprendido a respirar solo entre pulsaciones de engranajes. Frente a él, sobre el tapete de fieltro verde botella, el corazón de un reloj de agua vibraba con una cadencia irregular. Tres latidos rápidos, un suspiro de vapor y una pausa ominosa.

—Falta un diente en la rueda de escape —murmuró para sí mismo. Su voz sonó rasposa en el silencio del taller.

En la calle de los Plateros, los pasos apresurados resonaron sobre los adoquines húmedos. Aélys no levantó la vista de la lupa de joyero sujeta a su ojo derecho. En aquel distrito, mirar a través del cristal a deshoras atraía preguntas que ningún artesano honrado deseaba responder.

Sin embargo, los nudillos sonaron contra el portón de roble reforzado. Tres golpes secos, una pausa calculada, dos golpes más. El código de la Cofradía de Horologers. Una señal que nadie había utilizado desde hacía quince inviernos, cuando el Gran Incendio consumió la biblioteca del archivo municipal.

Aélys bajó la pinza con lentitud. Su pulgar rozó la empuñadura del estilete oculto bajo el borde del banco de trabajo.

—El taller está cerrado hasta el toque del alba —dijo en voz alta, sin moverse.

—El alba no vendrá esta noche si no abres, Aélys —respondió una voz desde el otro lado, amortiguada por la niebla pero teñida de una autoridad inconfundible—. Traigo lo que tu maestro enterró en las criptas de San Jude.`,
      status: 'borrador',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 268,
      characterCount: 1690,
      privateNotes: 'Asegurar que la mención a los quince inviernos coincida con la fecha del Gran Incendio en la línea de tiempo.',
      relatedCharacterIds: ['char_aelys'],
      relatedTimelineEventIds: ['ev_mecanismo_octogonal'],
      audioIds: [],
    };

    const chap2: Chapter = {
      id: 'chap_2',
      bookId,
      order: 2,
      number: 2,
      title: 'El precio de un secreto',
      synopsis: 'Aélys se reúne con Lady Morrigan en los muelles bajos para descifrar el pergamino encíclico.',
      content: `Los muelles de niebla olían a brea rancia, salitre condensado y carbón vegetal quemado a media combustión. Las gabarras mecánicas atracaban entre gruñidos de cadenas oxidadas, descargando fardos de seda envueltos en lona encerada.

Lady Morrigan aguardaba bajo el alero del almacén diecisiete. Portaba una capa impermeable de tono humo, con la capucha levantada lo suficiente como para ocultar sus ojos pero dejar al descubierto la sonrisa afilada de sus labios pálidos.

—Llegas tarde, artesano —dijo ella, sin girar la cabeza—. En mi mundo, tres minutos de retraso son equivalentes a una sentencia de destierro.

—En mi mundo, apresurarse con un mecanismo de resorte de éter significa perder tres dedos y el techo del taller —replicó Aélys, quitándose el fango de las botas contra el bordillo.

Morrigan extrajo de su manguito de piel una lámina de cobre perforada. Los orificios formaban constelaciones que Aélys reconoció al instante: no eran mapas náuticos, sino la partitura armónica del Gran Astrolabio.

—Valerius ha convocado al consejo de censura para mañana al mediodía —advirtió la dama—. Si no ponemos la llave en funcionamiento antes de que caiga la campana mayor, el Canciller declarará herético cualquier instrumento de cuerda mecánica. Y tú serás el primero en subir al cadalso de la Plaza del Reloj.`,
      status: 'en_proceso',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 206,
      characterCount: 1350,
      privateNotes: 'Revisar si Morrigan ya conocía a Valerius antes de la Guerra de los Canales.',
      relatedCharacterIds: ['char_aelys', 'char_morrigan'],
      relatedTimelineEventIds: ['ev_pacto_muelles'],
      audioIds: [],
    };

    await this.saveChapter(chap1);
    await this.saveChapter(chap2);

    // World Details
    const det1: WorldDetail = {
      id: 'det_astrolabio',
      bookId,
      name: 'El Gran Astrolabio de Valoria',
      category: 'magia_tecnologia',
      description: 'Monumental mecanismo esférico de bronce y cristal de cuarzo situado en la cúpula de la Catedral del Eón. Regula las compuertas que impiden que el mar de niebla tóxica inunde los distritos habitados.',
      historicalPeriod: 'Construido en el Año 1280 por la dinastía solar',
      tags: ['tecnologia', 'relojería', 'éther', 'vital'],
      immutableInfo: 'CANON FIJO: Requiere tres llaves octogonales gemelas giradas al unísono para modificar su ciclo de 72 horas. Sin este ciclo, la niebla sube 10 metros por día.',
      provisionalInfo: 'Teoría: Se cree que el núcleo contiene un fragmento de una estrella caída que aún late.',
      relatedCharacterIds: ['char_aelys'],
      relatedChapterIds: ['chap_1', 'chap_2'],
      relatedIdeaIds: [],
      relatedTimelineEventIds: ['ev_creacion_astrolabio'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const det2: WorldDetail = {
      id: 'det_niebla_eterna',
      bookId,
      name: 'El Mar de Niebla (Calina del Abismo)',
      category: 'reglas_mundo',
      description: 'Manto gaseoso denso y pesado que cubre el mundo inferior. A nivel de suelo contiene esporas fosforescentes que inducen amnesia si se respiran sin filtro de salmuera.',
      historicalPeriod: 'Surgió tras la Fractura del Eón hace 400 años',
      tags: ['peligro', 'medioambiente', 'ley_fisica'],
      immutableInfo: 'CANON: Ningún ser humano sobrevive más de 20 minutos expuesto directamente a la niebla sin máscara con carbón activo y sal gema.',
      provisionalInfo: 'Los contrabandistas afirman que existen bestias aladas ciegas que habitan en sus profundidades.',
      relatedCharacterIds: [],
      relatedChapterIds: ['chap_1'],
      relatedIdeaIds: [],
      relatedTimelineEventIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const det3: WorldDetail = {
      id: 'det_tribunal_censura',
      bookId,
      name: 'El Tribunal de la Balanza de Hierro',
      category: 'organizaciones',
      description: 'Brazo inquisitorial teocrático encabezado por el Canciller Valerius Thorne. Controla la distribución de éter y quema cualquier invención que no cuente con el sello pontificio.',
      historicalPeriod: 'Fundado tras el Gran Incendio del Año 1426',
      tags: ['gobierno', 'inquisicion', 'antagonistas'],
      immutableInfo: 'Cuentan con un ejército privado de 2.000 Guardias Escarlata y control de las reservas de alimentos.',
      provisionalInfo: 'Varios capitanes de la guardia dudan de la legitimidad de Thorne.',
      relatedCharacterIds: ['char_valerius'],
      relatedChapterIds: ['chap_2'],
      relatedIdeaIds: [],
      relatedTimelineEventIds: ['ev_gran_incendio'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveDetail(det1);
    await this.saveDetail(det2);
    await this.saveDetail(det3);

    // Ideas
    const idea1: Idea = {
      id: 'idea_1',
      bookId,
      title: 'El traidor dentro de la Cofradía de Relojeros',
      content: '¿Y si el anciano Horologer fingió su secuestro para obligar a Aélys a resolver el acertijo final que él nunca pudo descifrar por orgullo?',
      tags: ['giro_trama', 'personajes', 'misterio'],
      status: 'en_desarrollo',
      tray: 'en_espera',
      priority: 'alta',
      relatedCharacterIds: ['char_aelys'],
      relatedChapterIds: ['chap_1'],
      relatedDetailIds: ['det_astrolabio'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idea2: Idea = {
      id: 'idea_2',
      bookId,
      title: 'Capítulo en el puente levadizo durante el eclipse',
      content: 'Escena de persecución en carruajes de vapor sobre el Gran Viaducto mientras la niebla empieza a lamer los pilares superiores.',
      tags: ['accion', 'climax', 'escenario'],
      status: 'nueva',
      tray: 'en_espera',
      priority: 'media',
      relatedCharacterIds: ['char_aelys', 'char_morrigan', 'char_valerius'],
      relatedChapterIds: [],
      relatedDetailIds: ['det_niebla_eterna'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveIdea(idea1);
    await this.saveIdea(idea2);

    // Timeline Events (Showing off absolute, relative, hierarchical and connected points)
    const ev1: TimelineEvent = {
      id: 'ev_creacion_astrolabio',
      bookId,
      title: 'Construcción del Gran Astrolabio',
      description: 'El gremio de arquitectos celestiales instala la maquinaria primordial sobre la aguja de la Catedral de Valoria.',
      dateType: 'exacta',
      dateDisplay: 'Año 1280 (Era Solar)',
      numericSortValue: 1280,
      category: 'trasfondo_historico',
      color: '#4A7C59',
      status: 'confirmado',
      characterIds: [],
      chapterIds: [],
      detailIds: ['det_astrolabio'],
      notes: 'Punto de partida del cómputo cronológico moderno de la ciudad.',
      parentEventId: null,
      x: 100,
      y: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ev2: TimelineEvent = {
      id: 'ev_gran_incendio',
      bookId,
      title: 'El Gran Incendio de los Archivos',
      description: 'Fuego misterioso que destruye los registros imperiales y la biblioteca secreta de los relojeros.',
      dateType: 'exacta',
      dateDisplay: 'Año 1426 (Hace 15 años)',
      numericSortValue: 1426,
      category: 'batalla_conflicto',
      color: '#933D2D',
      status: 'confirmado',
      characterIds: ['char_valerius'],
      chapterIds: ['chap_1'],
      detailIds: ['det_tribunal_censura'],
      notes: 'Valerius utilizó la catástrofe para proclamar la Ley Marcial.',
      parentEventId: null,
      x: 450,
      y: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sub-events of Gran Incendio
    const ev2_1: TimelineEvent = {
      id: 'ev_incendio_sub1',
      bookId,
      title: 'A.1: Explosión del ala norte',
      description: 'Estallido en la cámara de alquimia subterránea que incomunica a los guardias.',
      dateType: 'exacta',
      dateDisplay: 'Año 1426, 21:00 hs',
      numericSortValue: 1426.1,
      category: 'batalla_conflicto',
      color: '#D47754',
      status: 'confirmado',
      characterIds: [],
      chapterIds: [],
      detailIds: [],
      notes: 'Primer indicio de sabotaje deliberado.',
      parentEventId: 'ev_gran_incendio',
      orderInParent: 1,
      x: 420,
      y: 350,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ev2_2: TimelineEvent = {
      id: 'ev_incendio_sub2',
      bookId,
      title: 'A.2: Desaparición de las crónicas dinásticas',
      description: 'Tres encapuchados escapan en una barcaza fluvial con los pergaminos de sangre.',
      dateType: 'exacta',
      dateDisplay: 'Año 1426, Medianoche',
      numericSortValue: 1426.2,
      category: 'revelacion',
      color: '#D47754',
      status: 'confirmado',
      characterIds: [],
      chapterIds: [],
      detailIds: [],
      notes: 'Testigo: el padre de Aélys antes de fallecer.',
      parentEventId: 'ev_gran_incendio',
      orderInParent: 2,
      x: 580,
      y: 350,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Relative event: 15 years after Gran Incendio!
    const ev3: TimelineEvent = {
      id: 'ev_mecanismo_octogonal',
      bookId,
      title: 'Entrega del Artefacto Octogonal',
      description: 'Un emisario anónimo entrega a Aélys la llave perdida que reactiva el núcleo del Astrolabio.',
      dateType: 'relativa',
      dateDisplay: '15 años después del Gran Incendio (Año 1441)',
      numericSortValue: 1441,
      relativeToEventId: 'ev_gran_incendio',
      relativeOffsetYears: 15,
      relativeConditionText: 'Exactamente 15 años después de las cenizas del archivo',
      category: 'trama_principal',
      color: '#2D5A43',
      status: 'confirmado',
      characterIds: ['char_aelys'],
      chapterIds: ['chap_1'],
      detailIds: ['det_astrolabio'],
      notes: 'Inicio formal de la novela en tiempo presente.',
      parentEventId: null,
      x: 850,
      y: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Subsequent connected event: Pacto de los Muelles
    const ev4: TimelineEvent = {
      id: 'ev_pacto_muelles',
      bookId,
      title: 'El Pacto de los Muelles de Niebla',
      description: 'Aélys y Morrigan sellan una alianza secreta para desencriptar el códice antes del eclipse.',
      dateType: 'relativa',
      dateDisplay: '3 días después del Artefacto Octogonal',
      numericSortValue: 1441.02,
      relativeToEventId: 'ev_mecanismo_octogonal',
      relativeOffsetYears: 0,
      relativeConditionText: 'Tres jornadas tras la llegada del emisario',
      category: 'arco_personaje',
      color: '#583778',
      status: 'confirmado',
      characterIds: ['char_aelys', 'char_morrigan'],
      chapterIds: ['chap_2'],
      detailIds: [],
      notes: 'Ambos se arriesgan a la pena de decapitación pública.',
      parentEventId: null,
      x: 1200,
      y: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Future event: El Eclipse de Invierno
    const ev5: TimelineEvent = {
      id: 'ev_eclipse_invierno',
      bookId,
      title: 'El Eclipse de Invierno (Clímax Pronosticado)',
      description: 'Momento en que el Astrolabio se alineará con los tres soles menores y decidirá la salvación o sepultura de Valoria.',
      dateType: 'aproximada',
      dateDisplay: 'Solsticio de Invierno, Año 1441',
      numericSortValue: 1441.9,
      category: 'trama_principal',
      color: '#1B3B5C',
      status: 'provisional',
      characterIds: ['char_aelys', 'char_morrigan', 'char_valerius'],
      chapterIds: [],
      detailIds: ['det_astrolabio', 'det_niebla_eterna'],
      notes: 'Límite temporal estricto para la resistencia.',
      parentEventId: null,
      x: 1550,
      y: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveTimelineEvent(ev1);
    await this.saveTimelineEvent(ev2);
    await this.saveTimelineEvent(ev2_1);
    await this.saveTimelineEvent(ev2_2);
    await this.saveTimelineEvent(ev3);
    await this.saveTimelineEvent(ev4);
    await this.saveTimelineEvent(ev5);

    // Connections between timeline points
    const conn1: TimelineConnection = {
      id: 'conn_1',
      bookId,
      title: 'Legado tecnológico de origen',
      description: 'El diseño del astrolabio guardó las directrices que provocaron la codicia del tribunal siglos después.',
      sourceEventId: 'ev_creacion_astrolabio',
      targetEventId: 'ev_gran_incendio',
      relationType: 'historica',
      direction: 'source_to_target',
      color: '#6E9BB8',
      style: 'solid',
      labelVisible: true,
      createdAt: new Date().toISOString(),
    };

    const conn2: TimelineConnection = {
      id: 'conn_2',
      bookId,
      title: 'Consecuencia directa: 15 años de silencio',
      description: 'El incendio provocó la ocultación del artefacto hasta que la muerte del maestro forzó su reaparición.',
      sourceEventId: 'ev_gran_incendio',
      targetEventId: 'ev_mecanismo_octogonal',
      relationType: 'causa_consecuencia',
      direction: 'source_to_target',
      color: '#933D2D',
      style: 'solid',
      labelVisible: true,
      createdAt: new Date().toISOString(),
    };

    const conn3: TimelineConnection = {
      id: 'conn_3',
      bookId,
      title: 'Pacto de urgencia táctica',
      description: 'La entrega del artefacto desata la persecución que empuja a Aélys hacia Morrigan.',
      sourceEventId: 'ev_mecanismo_octogonal',
      targetEventId: 'ev_pacto_muelles',
      relationType: 'continuacion',
      direction: 'source_to_target',
      color: '#2D5A43',
      style: 'solid',
      labelVisible: true,
      createdAt: new Date().toISOString(),
    };

    const conn4: TimelineConnection = {
      id: 'conn_4',
      bookId,
      title: 'Dependencia del destino de la ciudad',
      description: 'El éxito del pacto en los muelles determinará si la ciudad sobrevive al eclipse.',
      sourceEventId: 'ev_pacto_muelles',
      targetEventId: 'ev_eclipse_invierno',
      relationType: 'dependencia',
      direction: 'source_to_target',
      color: '#583778',
      style: 'dashed',
      labelVisible: true,
      createdAt: new Date().toISOString(),
    };

    await this.saveTimelineConnection(conn1);
    await this.saveTimelineConnection(conn2);
    await this.saveTimelineConnection(conn3);
    await this.saveTimelineConnection(conn4);

    await this.seedWritingHistoryIfEmpty(bookId, demoBook.title);
  }
}

export const dbService = new DatabaseService();
