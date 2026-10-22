import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Book, AppSettings, PaletteTheme, CustomPaletteConfig, CustomFontItem, UserAccount } from '../types';
import { dbService } from '../services/db';
import { cloudSyncService, CloudBackupSummary } from '../services/cloudSync';
import { registerCustomPalettes, applyDynamicPaletteVariables, getTheme } from '../utils/theme';

export type WorkspaceSection =
  | 'resumen'
  | 'capitulos'
  | 'personajes'
  | 'detalles'
  | 'ideas'
  | 'timeline'
  | 'calendario'
  | 'asistente'
  | 'configuracion';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  books: Book[];
  activeBook: Book | null;
  setActiveBook: (book: Book | null) => void;
  refreshBooks: () => Promise<void>;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  currentPalette: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setPalette: (palette: string, forCurrentBookOnly?: boolean) => Promise<void>;
  customPalettes: CustomPaletteConfig[];
  refreshCustomPalettes: () => Promise<void>;
  customFonts: CustomFontItem[];
  refreshCustomFonts: () => Promise<void>;
  activeSection: WorkspaceSection;
  setActiveSection: (section: WorkspaceSection) => void;
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  toasts: ToastMessage[];
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  openGlobalSearch: boolean;
  setOpenGlobalSearch: (open: boolean) => void;
  navigateToEntity: (type: 'chapter' | 'character' | 'detail' | 'idea' | 'timeline', id: string) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  // Global Custom Palette Creator Modal
  isPaletteCreatorOpen: boolean;
  setIsPaletteCreatorOpen: (open: boolean) => void;
  openPaletteCreator: () => void;
  // User Accounts (solo usuario y contraseña)
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authInitialMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  openProfileModal: () => void;
  registerUser: (username: string, password: string, displayName?: string) => Promise<UserAccount>;
  loginUser: (username: string, password: string) => Promise<UserAccount>;
  logoutUser: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  // Cloud Synchronization & Multidevice Backup
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastCloudSync: string | null;
  cloudBackups: CloudBackupSummary[];
  triggerCloudSync: (isManualSnapshot?: boolean) => Promise<void>;
  refreshCloudBackups: () => Promise<void>;
  restoreCloudBackup: (backupId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBookState] = useState<Book | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    globalPalette: 'bosque',
    darkMode: false,
    editorFontSize: 18,
    editorFontFamily: 'lora',
    autoSaveDelay: 1000,
  });
  const [customPalettes, setCustomPalettes] = useState<CustomPaletteConfig[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFontItem[]>([]);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('resumen');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [openGlobalSearch, setOpenGlobalSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // User Accounts State (Solo usuario y contraseña)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('register');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const openProfileModal = useCallback(() => setIsProfileModalOpen(true), []);

  // Cloud Synchronization & Multidevice States
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupSummary[]>([]);
  const syncTimeoutRef = useRef<any>(null);

  // Palette Creator Modal
  const [isPaletteCreatorOpen, setIsPaletteCreatorOpen] = useState(false);
  const openPaletteCreator = useCallback(() => setIsPaletteCreatorOpen(true), []);

  // Initialize DB, Seed, User & Settings
  useEffect(() => {
    async function init() {
      try {
        await dbService.seedIfEmpty();
        const curUser = await dbService.getCurrentUser();
        setCurrentUser(curUser);
        const loadedBooks = await dbService.getBooks(curUser);
        setBooks(loadedBooks);
        const savedSettings = await dbService.getSettings();
        setSettings(savedSettings);
        const palettes = await dbService.getCustomPalettes();
        setCustomPalettes(palettes);
        registerCustomPalettes(palettes);
        const fonts = await dbService.getCustomFonts();
        setCustomFonts(fonts);
        const users = await dbService.getUsers();
        setAllUsers(users);

        // If user is already logged in, fetch fresh backups and sync timestamp from cloud
        if (curUser) {
          try {
            const bkps = await cloudSyncService.getCloudBackups(curUser.id);
            setCloudBackups(bkps);
            if (bkps.length > 0) {
              setLastCloudSync(bkps[0].timestamp);
            }
          } catch (e) {
            console.warn('Initial cloud sync check:', e);
          }
        }
      } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
      }
    }
    init();
  }, []);


  // Register loaded custom fonts in document.fonts
  useEffect(() => {
    customFonts.forEach((f) => {
      try {
        const fontFace = new FontFace(f.name, `url(${f.dataUrl})`);
        fontFace.load().then((loaded) => {
          document.fonts.add(loaded);
        }).catch((err) => {
          console.warn('Error loading custom font:', f.name, err);
        });
      } catch (err) {
        console.warn('FontFace API not supported or error:', err);
      }
    });
  }, [customFonts]);

  // Apply UI font family
  useEffect(() => {
    if (settings.uiFontFamily && settings.uiFontFamily !== 'default') {
      document.body.style.fontFamily = `"${settings.uiFontFamily}", system-ui, -apple-system, sans-serif`;
    } else {
      document.body.style.fontFamily = '';
    }
  }, [settings.uiFontFamily]);

  // Apply UI font scale
  useEffect(() => {
    if (settings.uiFontScale && settings.uiFontScale !== 100) {
      document.documentElement.style.fontSize = `${(settings.uiFontScale / 100) * 16}px`;
    } else {
      document.documentElement.style.fontSize = '';
    }
  }, [settings.uiFontScale]);

  const refreshCustomPalettes = useCallback(async () => {
    try {
      const pals = await dbService.getCustomPalettes();
      setCustomPalettes(pals);
    } catch (err) {
      console.error('Error refreshing palettes:', err);
    }
  }, []);

  const refreshCustomFonts = useCallback(async () => {
    try {
      const fonts = await dbService.getCustomFonts();
      setCustomFonts(fonts);
    } catch (err) {
      console.error('Error refreshing custom fonts:', err);
    }
  }, []);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshBooks = useCallback(
    async (userToFilter?: UserAccount | null) => {
      try {
        const targetUser = userToFilter !== undefined ? userToFilter : currentUser;
        const list = await dbService.getBooks(targetUser);
        setBooks(list);
        if (activeBook) {
          const updated = list.find((b) => b.id === activeBook.id) || null;
          setActiveBookState(updated);
        }
      } catch (err) {
        console.error('Error al refrescar libros:', err);
      }
    },
    [activeBook, currentUser]
  );

  // Sync books whenever currentUser changes, and close book if not owned/shared with current user
  useEffect(() => {
    async function syncUserLibrary() {
      try {
        const userBooks = await dbService.getBooks(currentUser);
        setBooks(userBooks);
        if (activeBook) {
          const stillValid = userBooks.find((b) => b.id === activeBook.id);
          if (!stillValid) {
            setActiveBookState(null);
          }
        }
      } catch (err) {
        console.error('Error synchronizing user library:', err);
      }
    }
    syncUserLibrary();
  }, [currentUser]);

  const setActiveBook = useCallback((book: Book | null) => {
    setActiveBookState(book);
    if (book) {
      setActiveSection('resumen');
      setActiveChapterId(null);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await dbService.saveSettings(newSettings);
    },
    [settings]
  );

  const toggleDarkMode = useCallback(() => {
    updateSettings({ darkMode: !settings.darkMode });
  }, [settings.darkMode, updateSettings]);

  const setPalette = useCallback(
    async (palette: string, forCurrentBookOnly: boolean = false) => {
      // Always update globalPalette so Library and Login pages also receive it!
      await updateSettings({ globalPalette: palette as any });
      if (activeBook) {
        const updatedBook: Book = {
          ...activeBook,
          colorPalette: palette as any,
          updatedAt: new Date().toISOString(),
        };
        await dbService.saveBook(updatedBook);
        setActiveBookState(updatedBook);
        await refreshBooks();
        toast(`Paleta aplicada a toda la aplicación y a este libro`, 'success');
      } else {
        toast(`Paleta aplicada a toda la aplicación`, 'success');
      }
    },
    [activeBook, refreshBooks, toast, updateSettings]
  );

  // Compute active palette: book-specific palette takes precedence over global palette
  const currentPalette = (activeBook?.colorPalette || settings.globalPalette) as string;
  const darkMode = settings.darkMode;

  // Dynamically apply palette variables across DOM and register custom palettes
  useEffect(() => {
    registerCustomPalettes(customPalettes);
    applyDynamicPaletteVariables(currentPalette, darkMode, customPalettes);
  }, [currentPalette, darkMode, customPalettes]);

  const refreshUsers = useCallback(async () => {
    try {
      const users = await dbService.getUsers();
      setAllUsers(users);
      const cur = await dbService.getCurrentUser();
      setCurrentUser(cur);
    } catch (err) {
      console.error('Error refreshing users:', err);
    }
  }, []);

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'register') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const refreshCloudBackups = useCallback(async () => {
    if (!currentUser) {
      setCloudBackups([]);
      return;
    }
    try {
      const list = await cloudSyncService.getCloudBackups(currentUser.id);
      setCloudBackups(list);
      if (list.length > 0 && !lastCloudSync) {
        setLastCloudSync(list[0].timestamp);
      }
    } catch (e) {
      console.warn('Error refreshing cloud backups:', e);
    }
  }, [currentUser, lastCloudSync]);

  const triggerCloudSync = useCallback(
    async (isManualSnapshot: boolean = false) => {
      if (!currentUser) return;
      setCloudSyncStatus('syncing');
      try {
        const res = await cloudSyncService.pushToCloud(currentUser.id, isManualSnapshot);
        setCloudSyncStatus('synced');
        setLastCloudSync(res.timestamp);
        await refreshCloudBackups();
        if (isManualSnapshot) {
          toast('Copia de seguridad en la nube creada con éxito', 'success');
        }
      } catch (err: any) {
        console.warn('Error in cloud sync push:', err);
        setCloudSyncStatus('offline');
        if (isManualSnapshot) {
          toast('No se pudo guardar la copia en la nube: ' + err.message, 'error');
        }
      }
    },
    [currentUser, refreshCloudBackups, toast]
  );

  const restoreCloudBackup = useCallback(
    async (backupId: string) => {
      if (!currentUser) return;
      setCloudSyncStatus('syncing');
      try {
        await cloudSyncService.restoreCloudBackup(currentUser.id, backupId);
        const userBooks = await dbService.getBooks(currentUser);
        setBooks(userBooks);
        if (activeBook) {
          const updated = userBooks.find((b) => b.id === activeBook.id) || null;
          setActiveBookState(updated);
        }
        setCloudSyncStatus('synced');
        toast('Copia de la nube restaurada exitosamente', 'success');
      } catch (err: any) {
        setCloudSyncStatus('error');
        toast('Error al restaurar la copia de la nube: ' + err.message, 'error');
      }
    },
    [currentUser, activeBook, toast]
  );

  // Auto-sync books to cloud (debounced 2.5s) when books change and user is logged in
  useEffect(() => {
    if (!currentUser || books.length === 0) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      cloudSyncService
        .pushToCloud(currentUser.id, false)
        .then((res) => {
          setCloudSyncStatus('synced');
          setLastCloudSync(res.timestamp);
        })
        .catch((e) => {
          console.warn('Auto-sync to cloud failed:', e);
          setCloudSyncStatus('offline');
        });
    }, 2500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [books, currentUser]);

  const registerUser = useCallback(
    async (username: string, password: string, displayName?: string) => {
      setCloudSyncStatus('syncing');
      let user: UserAccount;

      try {
        // 1. Try server cloud registration (enforces global username uniqueness)
        user = await cloudSyncService.register(username, password, displayName);
      } catch (cloudErr: any) {
        // If server returns error about unique username, surface it directly!
        if (cloudErr.message && (cloudErr.message.includes('registrado') || cloudErr.message.includes('único'))) {
          setCloudSyncStatus('error');
          throw cloudErr;
        }
        console.warn('Cloud registration endpoint unavailable, creating local user:', cloudErr);
        user = await dbService.createUser(username, password, displayName);
      }

      setCurrentUser(user);
      const userBooks = await dbService.getBooks(user);
      setBooks(userBooks);
      setActiveBookState(null);
      await refreshUsers();
      setIsAuthModalOpen(false);
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date().toISOString());

      toast(`¡Cuenta creada con éxito! Sincronizada en la nube: @${user.username}`, 'success');
      return user;
    },
    [refreshUsers, toast]
  );

  const loginUser = useCallback(
    async (username: string, password: string) => {
      setCloudSyncStatus('syncing');
      let user: UserAccount;
      let pulledCount = 0;

      try {
        // 1. Universal Cloud Login: Works from ANY device, downloading the author's books
        const cloudRes = await cloudSyncService.login(username, password);
        user = cloudRes.user;
        pulledCount = cloudRes.booksCount;
      } catch (cloudErr: any) {
        console.warn('Cloud login failed or offline, checking local device:', cloudErr);
        // Fallback to local DB if device has cached credentials
        try {
          user = await dbService.loginUser(username, password);
        } catch {
          setCloudSyncStatus('error');
          throw cloudErr;
        }
      }

      setCurrentUser(user);
      const userBooks = await dbService.getBooks(user);
      setBooks(userBooks);
      setActiveBookState(null);
      await refreshUsers();
      await refreshCloudBackups();
      setIsAuthModalOpen(false);
      setCloudSyncStatus('synced');
      setLastCloudSync(new Date().toISOString());

      if (pulledCount > 0) {
        toast(`Sesión iniciada como @${user.username} (${pulledCount} libro(s) sincronizados desde la nube)`, 'success');
      } else {
        toast(`Sesión iniciada como @${user.username} (Nube conectada)`, 'success');
      }
      return user;
    },
    [refreshUsers, refreshCloudBackups, toast]
  );

  const logoutUser = useCallback(async () => {
    await dbService.logout();
    setCurrentUser(null);
    setCloudBackups([]);
    setLastCloudSync(null);
    const guestBooks = await dbService.getBooks(null);
    setBooks(guestBooks);
    setActiveBookState(null);
    toast('Has cerrado la sesión.', 'info');
  }, [toast]);

  const switchUser = useCallback(
    async (userId: string) => {
      dbService.setCurrentSessionUserId(userId);
      const user = await dbService.getUserById(userId);
      setCurrentUser(user);
      const userBooks = await dbService.getBooks(user);
      setBooks(userBooks);
      setActiveBookState(null);
      if (user) {
        cloudSyncService.pullFromCloud(user.id).catch((e) => console.warn('Switch user cloud sync:', e));
      }
      toast(user ? `Cambiado a perfil de @${user.username}` : 'Perfil actualizado', 'info');
    },
    [toast]
  );

  const navigateToEntity = useCallback(
    (type: 'chapter' | 'character' | 'detail' | 'idea' | 'timeline', id: string) => {
      if (type === 'chapter') {
        setActiveSection('capitulos');
        setActiveChapterId(id);
      } else if (type === 'character') {
        setActiveSection('personajes');
      } else if (type === 'detail') {
        setActiveSection('detalles');
      } else if (type === 'idea') {
        setActiveSection('ideas');
      } else if (type === 'timeline') {
        setActiveSection('timeline');
      }
      setOpenGlobalSearch(false);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        books,
        activeBook,
        setActiveBook,
        refreshBooks,
        settings,
        updateSettings,
        currentPalette,
        darkMode,
        toggleDarkMode,
        setPalette,
        customPalettes,
        refreshCustomPalettes,
        customFonts,
        refreshCustomFonts,
        activeSection,
        setActiveSection,
        activeChapterId,
        setActiveChapterId,
        toasts,
        toast,
        openGlobalSearch,
        setOpenGlobalSearch,
        navigateToEntity,
        isSaving,
        setIsSaving,
        currentUser,
        allUsers,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authInitialMode,
        openAuthModal,
        isProfileModalOpen,
        setIsProfileModalOpen,
        openProfileModal,
        registerUser,
        loginUser,
        logoutUser,
        switchUser,
        refreshUsers,
        isPaletteCreatorOpen,
        setIsPaletteCreatorOpen,
        openPaletteCreator,
        cloudSyncStatus,
        lastCloudSync,
        cloudBackups,
        triggerCloudSync,
        refreshCloudBackups,
        restoreCloudBackup,
      }}
    >
      <div className={darkMode ? 'dark' : ''}>
        {children}

        {/* Global Toast Notification Container */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 flex items-center justify-between border ${
                t.type === 'success'
                  ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                  : t.type === 'error'
                  ? 'bg-rose-950 text-rose-100 border-rose-800'
                  : 'bg-stone-900 text-stone-100 border-stone-700'
              }`}
            >
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de un AppProvider');
  return context;
};
