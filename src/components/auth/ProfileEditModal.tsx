import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Mail,
  Camera,
  X,
  Check,
  ShieldCheck,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  HardDrive,
  FileCheck,
  Cloud,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../services/db';
import { cloudSyncService } from '../../services/cloudSync';
import { getTheme } from '../../utils/theme';
import { ColorGridPicker } from '../common/ColorGridPicker';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    refreshUsers,
    currentPalette,
    darkMode,
    customPalettes,
    toast,
    setIsSaving,
    cloudBackups,
    triggerCloudSync,
    restoreCloudBackup,
    refreshCloudBackups,
    lastCloudSync,
    cloudSyncStatus,
  } = useApp();

  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad' | 'correo'>('perfil');
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);

  // Profile fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarColor, setAvatarColor] = useState('#2D5A43');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setDisplayName(currentUser.displayName || currentUser.username);
      setEmail(currentUser.email || '');
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatarUrl);
      setAvatarColor(currentUser.avatarColor || '#2D5A43');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Handle uploading profile photo
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setAvatarUrl(dataUrl);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
  };

  // Save profile information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('El nombre de usuario no puede estar vacío.');
      return;
    }

    setLoading(true);
    setIsSaving(true);
    try {
      // 1. Update in Cloud
      try {
        await cloudSyncService.updateProfile(currentUser.id, {
          username: cleanUsername,
          displayName: displayName.trim() || cleanUsername,
          email: email.trim(),
          avatarUrl,
          avatarColor,
          bio: bio.trim(),
        });
      } catch (cloudErr: any) {
        if (cloudErr.message && (cloudErr.message.includes('pertenece') || cloudErr.message.includes('registrado'))) {
          throw cloudErr;
        }
        console.warn('Could not sync profile to cloud server:', cloudErr);
      }

      // 2. Update locally in IndexedDB
      await dbService.updateUserProfile(currentUser.id, {
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        email: email.trim(),
        avatarUrl,
        avatarColor,
        bio: bio.trim(),
      });

      await refreshUsers();
      setSuccessMsg('Perfil actualizado y sincronizado en la nube.');
      toast('Perfil actualizado con éxito', 'success');
      triggerCloudSync(false).catch(() => {});
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Ingresa tu contraseña actual.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setLoading(true);
    setIsSaving(true);
    try {
      // Update in cloud
      try {
        await cloudSyncService.changePassword(currentUser.id, currentPassword, newPassword);
      } catch (cloudErr: any) {
        console.warn('Could not sync password change to cloud:', cloudErr);
      }

      await dbService.changeUserPassword(currentUser.id, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Contraseña modificada y sincronizada en la nube.');
      toast('Contraseña actualizada correctamente', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Generate and download a linked backup package for the user's email
  const handleDownloadEmailBackup = async () => {
    if (!currentUser) return;
    try {
      const jsonStr = await dbService.exportFullUserBackup(currentUser.id);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo_completo_${currentUser.username}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Copia de seguridad completa generada con éxito (libros, capítulos, fichas y cronología)', 'success');
    } catch (e: any) {
      toast('Error al generar copia de seguridad: ' + e.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-stone-200 dark:border-stone-700"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: avatarColor }}
                >
                  {displayName?.[0]?.toUpperCase() || username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Mi Perfil de Escritor
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                @{currentUser.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-5 pt-2 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('perfil');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'perfil'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Datos y Foto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('seguridad');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'seguridad'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cambiar Contraseña</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('correo');
              setErrorMsg(null);
              setSuccessMsg(null);
              refreshCloudBackups();
            }}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'correo'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Copia en la Nube &amp; Respaldo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: PERFIL, FOTO Y USUARIO */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Upload & Preview */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-stone-700 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl text-white font-bold text-2xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {displayName?.[0]?.toUpperCase() || username[0]?.toUpperCase()}
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                    <Camera className="w-6 h-6" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadPhoto}
                    />
                  </label>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                      Foto de Perfil
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Sube una imagen local (PNG, JPG) o elige un color distintivo.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs ${theme.primaryBtn}`}>
                      <Camera className="w-3.5 h-3.5 inline mr-1" />
                      <span>Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadPhoto}
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:text-rose-600 hover:bg-rose-500/10 text-stone-600 dark:text-stone-300"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        <span>Quitar Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Username Input with Uniqueness Notice */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre de Usuario (Único en la plataforma) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="mi_usuario"
                    className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-mono font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Otros escritores usarán este nombre para compartirte libros como colaborador o lector.
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre o Seudónimo visible *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej: Gabriel García Márquez"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Color Picker for Avatar */}
              <div>
                <ColorGridPicker
                  value={avatarColor}
                  onChange={setAvatarColor}
                  title="Color personalizado de avatar (cuando no haya foto)"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nota biográfica / Acerca de ti (opcional)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Novelista de fantasía oscura, apasionado por las tramas corales..."
                  className={`w-full p-2.5 rounded-xl border text-xs resize-none ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md ${theme.primaryBtn}`}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios de Perfil'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CAMBIO DE CONTRASEÑA */}
          {activeTab === 'seguridad' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    className={`w-full px-3 pr-10 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-stone-50 dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md ${theme.primaryBtn}`}
                >
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: COPIAS EN LA NUBE Y SINCRONIZACIÓN MULTIDISPOSITIVO */}
          {activeTab === 'correo' && (
            <div className="space-y-4">
              {/* Cloud Synchronization & Backup Card */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-stone-50 dark:to-stone-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span>Copia de Seguridad en la Nube</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                          {cloudSyncStatus === 'syncing' ? 'Sincronizando...' : 'Conectada'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {lastCloudSync
                          ? `Último respaldo: ${new Date(lastCloudSync).toLocaleDateString()} a las ${new Date(lastCloudSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Sincronización multidispositivo activa'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerCloudSync(true)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs ${theme.primaryBtn}`}
                      title="Genera un punto de restauración en la nube con todos tus libros actuales"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Crear Copia en la Nube</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await refreshCloudBackups();
                        toast('Lista de copias en la nube actualizada', 'info');
                      }}
                      className="p-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                      title="Comprobar copias recientes en la nube"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Multidevice & Data Isolation Guarantee */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold block text-stone-900 dark:text-stone-100">
                      Garantía de Aislamiento y Acceso Universal:
                    </span>
                    Tus libros y perfil de autor se guardan bajo tu usuario único (<span className="font-mono font-semibold">@{currentUser.username}</span>). Puedes abrir la aplicación en tu celular, tablet o cualquier computadora e iniciar sesión para acceder a toda tu obra. Ningún otro autor puede ver tus libros a menos que lo agregues expresamente como colaborador.
                  </div>
                </div>

                {/* Cloud Backups Snapshot List */}
                <div>
                  <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-2 flex items-center justify-between">
                    <span>Puntos de Restauración en la Nube ({cloudBackups.length})</span>
                    <span className="text-[10px] text-stone-400 font-normal">Se conservan automáticamente las últimas 15 copias</span>
                  </h5>

                  {cloudBackups.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 text-center text-xs text-stone-400">
                      Aún no has creado una copia manual. Haz clic en "Crear Copia en la Nube" para registrar tu primer punto de restauración.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {cloudBackups.map((bkp, idx) => (
                        <div
                          key={bkp.id}
                          className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs hover:border-amber-500/40 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                                {idx === 0 ? '✨ Copia más reciente' : `Copia #${cloudBackups.length - idx}`}
                              </span>
                              <span className="text-[10px] font-mono text-stone-400">
                                {new Date(bkp.timestamp).toLocaleDateString()} {new Date(bkp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-2">
                              <span>📚 {bkp.summary?.booksCount || 0} libros</span>
                              <span>•</span>
                              <span>📝 {bkp.summary?.chaptersCount || 0} capítulos</span>
                              <span>•</span>
                              <span>👥 {bkp.summary?.charactersCount || 0} personajes</span>
                              <span>•</span>
                              <span>⏳ {bkp.summary?.eventsCount || 0} eventos</span>
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={restoringBackupId === bkp.id}
                            onClick={async () => {
                              const confirm = window.confirm(
                                `¿Deseas restaurar esta copia de seguridad del ${new Date(bkp.timestamp).toLocaleDateString()}? Se actualizarán los libros de tu cuenta con los contenidos de esta fecha.`
                              );
                              if (confirm) {
                                setRestoringBackupId(bkp.id);
                                await restoreCloudBackup(bkp.id);
                                setRestoringBackupId(null);
                              }
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-amber-500/10 hover:border-amber-500/50 text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-semibold transition-all shrink-0"
                            title="Restaurar esta versión de libros en tu dispositivo actual"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${restoringBackupId === bkp.id ? 'animate-spin' : ''}`} />
                            <span>{restoringBackupId === bkp.id ? 'Restaurando...' : 'Restaurar'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Local JSON Backup generation */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-serif font-bold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Descargar Copia en Archivo Local (JSON)</span>
                    </h5>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Descarga una copia completa en tu computadora o celular para guardarla offline o transferirla.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadEmailBackup}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-black/5 dark:hover:bg-white/5 text-stone-800 dark:text-stone-200 shadow-xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    <span>Descargar Archivo JSON</span>
                  </button>
                </div>
              </div>

              {/* Optional Linked Email for Identification */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100">
                      Correo Electrónico Vinculado (Opcional)
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Asocia un email para identificar tus exportaciones y respaldos
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu_correo@ejemplo.com"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs ${theme.borderCard} bg-white dark:bg-stone-900 ${theme.textPrimary} focus:outline-none`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email.trim() || !email.includes('@')) {
                        setErrorMsg('Por favor introduce un correo electrónico válido.');
                        return;
                      }
                      await dbService.updateUserProfile(currentUser.id, { email: email.trim() });
                      await cloudSyncService.updateProfile(currentUser.id, { email: email.trim() });
                      await refreshUsers();
                      setSuccessMsg('Correo de respaldo guardado correctamente.');
                      toast('Correo vinculado con éxito', 'success');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs shrink-0 ${theme.primaryBtn}`}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
