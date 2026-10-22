import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Feather,
  BookOpen,
  Cloud,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cloudSyncService } from '../../services/cloudSync';
import { getTheme } from '../../utils/theme';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authInitialMode,
    registerUser,
    loginUser,
    allUsers,
    switchUser,
    currentUser,
    currentPalette,
    darkMode,
    customPalettes,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [mode, setMode] = useState<'register' | 'login'>(authInitialMode || 'register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time username check state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string>('');
  const checkDebounceRef = useRef<any>(null);

  // Sync mode if changed from props
  useEffect(() => {
    if (authInitialMode) {
      setMode(authInitialMode);
    }
  }, [authInitialMode]);

  // Live username availability check across all devices in cloud
  useEffect(() => {
    if (mode !== 'register') {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameAvailable(null);
      setUsernameStatusMessage('');
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);

    checkDebounceRef.current = setTimeout(async () => {
      try {
        const res = await cloudSyncService.checkUsername(clean);
        setUsernameAvailable(res.available);
        setUsernameStatusMessage(res.message);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 300);

    return () => {
      if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);
    };
  }, [username, mode]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setIsAuthModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Ingresa un nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Ingresa tu contraseña.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }
      if (cleanUsername.length < 3) {
        setErrorMsg('El usuario debe tener al menos 3 caracteres.');
        return;
      }
      if (password.length < 4) {
        setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
        return;
      }

      setLoading(true);
      try {
        await registerUser(cleanUsername, password, displayName || cleanUsername);
        handleClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al crear la cuenta.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await loginUser(cleanUsername, password);
        handleClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickSwitch = async (userId: string) => {
    try {
      await switchUser(userId);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-[449px] max-w-[95vw] max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Top Header Banner */}
        <div className="p-6 pb-4 border-b border-stone-200 dark:border-stone-800 relative bg-gradient-to-b from-black/5 to-transparent shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Cerrar ventana"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Feather className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>{mode === 'register' ? 'Crear Cuenta de Escritor' : 'Iniciar Sesión'}</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Solo con usuario y contraseña, sin correos
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex gap-1 mt-4 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 pt-5 space-y-4 overflow-y-auto"
          style={{ height: '350px', width: '449px', maxWidth: '100%' }}
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Information pill */}
          {mode === 'register' ? (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <Cloud className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="leading-relaxed">
                <span className="font-semibold block text-stone-900 dark:text-stone-100">
                  Sincronización en la nube y nombre único:
                </span>
                El nombre de usuario no puede repetirse. Al registrarte se crea una copia en la nube para que puedas abrir tu cuenta en cualquier dispositivo con tus libros intactos y aislados.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2.5">
              <Laptop className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="leading-relaxed">
                <span className="font-semibold block text-stone-900 dark:text-stone-100">
                  Acceso multidispositivo:
                </span>
                Inicia sesión desde tu computadora, celular o tablet. Tus libros y perfil de autor se sincronizan automáticamente sin cruzar datos con otros usuarios.
              </div>
            </div>
          )}

          {/* Username Input with Live Cloud Check */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Nombre de Usuario *
              </label>

              {mode === 'register' && (
                <div className="text-[11px] font-medium flex items-center gap-1">
                  {isCheckingUsername ? (
                    <span className="text-stone-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                    </span>
                  ) : usernameAvailable === true ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Disponible en la nube
                    </span>
                  ) : usernameAvailable === false ? (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                      <XCircle className="w-3 h-3" /> Ya registrado por otro autor
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: cervantes_autor, gabriel_noche"
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  mode === 'register' && usernameAvailable === false
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                    : mode === 'register' && usernameAvailable === true
                    ? 'border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : theme.borderCard
                } bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {mode === 'register' && usernameAvailable === true && (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                {mode === 'register' && usernameAvailable === false && (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              {mode === 'register'
                ? 'Debe ser único en la nube. Letras, números o guiones (mínimo 3 caracteres).'
                : 'Ingresa tu usuario único registrado.'}
            </p>
          </div>

          {/* Display Name Input (optional, only in register) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Nombre o Seudónimo literario <span className="font-normal text-stone-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: Miguel de Cervantes"
                className={`w-full px-3 py-2 rounded-xl border text-sm ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
              />
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (only in register) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${theme.primaryBtn}`}
            >
              {mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta y Entrar'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Accediendo...' : 'Iniciar Sesión'}</span>
                </>
              )}
            </button>
          </div>

          {/* Existing accounts quick-switch in this browser */}
          {allUsers.length > 0 && mode === 'login' && (
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
              <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Cuentas en este dispositivo:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickSwitch(u.id)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors border ${
                        isCurrent
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: u.avatarColor || '#2D5A43' }}
                        >
                          {u.displayName?.[0]?.toUpperCase() || u.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold block text-stone-800 dark:text-stone-200">
                            {u.displayName}
                          </span>
                          <span className="text-[10px] text-stone-400">@{u.username}</span>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          Seleccionar
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Guest or Close */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline font-medium"
            >
              Continuar sin cuenta (Modo local / Invitado)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
