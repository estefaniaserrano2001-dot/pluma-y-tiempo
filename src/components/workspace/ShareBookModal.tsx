import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  Check,
  Shield,
  Eye,
  Edit3,
  UserCheck,
  Search,
  BookOpen,
  Share2,
} from 'lucide-react';
import { Book, BookCollaborator, UserAccount } from '../../types';
import { dbService } from '../../services/db';
import { getTheme } from '../../utils/theme';
import { useApp } from '../../context/AppContext';

interface ShareBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onBookUpdated?: (updatedBook: Book) => void;
}

export const ShareBookModal: React.FC<ShareBookModalProps> = ({
  isOpen,
  onClose,
  book,
  onBookUpdated,
}) => {
  const { currentPalette, darkMode, customPalettes, toast, setIsSaving } = useApp();
  const theme = getTheme(currentPalette, darkMode, customPalettes);

  const [usernameInput, setUsernameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'colaborador' | 'visitante'>('colaborador');
  const [collaborators, setCollaborators] = useState<BookCollaborator[]>(book.collaborators || []);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCollaborators(book.collaborators || []);
    setUsernameInput('');
    setErrorMsg(null);
    async function loadRegisteredUsers() {
      const users = await dbService.getUsers();
      setAllUsers(users);
    }
    loadRegisteredUsers();
  }, [book, isOpen]);

  if (!isOpen) return null;

  // Add collaborator
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/^@/, '');

    if (!cleanUsername) {
      setErrorMsg('Escribe el nombre de usuario a invitar.');
      return;
    }

    setLoading(true);
    setIsSaving(true);
    try {
      const updated = await dbService.addBookCollaborator(book.id, cleanUsername, selectedRole);
      setCollaborators(updated.collaborators || []);
      setUsernameInput('');
      toast(`Libro compartido con @${cleanUsername} como ${selectedRole}`, 'success');
      if (onBookUpdated) onBookUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al compartir el libro.');
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Change collaborator role
  const handleRoleChange = async (userId: string, newRole: 'editor' | 'colaborador' | 'visitante') => {
    setIsSaving(true);
    try {
      const updated = await dbService.updateCollaboratorRole(book.id, userId, newRole);
      setCollaborators(updated.collaborators || []);
      toast('Permiso de colaborador actualizado', 'info');
      if (onBookUpdated) onBookUpdated(updated);
    } catch (err: any) {
      toast('Error al actualizar rol: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove collaborator
  const handleRemove = async (userId: string) => {
    setIsSaving(true);
    try {
      const updated = await dbService.removeBookCollaborator(book.id, userId);
      setCollaborators(updated.collaborators || []);
      toast('Colaborador retirado del proyecto', 'info');
      if (onBookUpdated) onBookUpdated(updated);
    } catch (err: any) {
      toast('Error al retirar colaborador: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${theme.bgCard} ${theme.borderCard}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Compartir "{book.title}"
              </h3>
              <p className="text-xs text-stone-400">
                Invita a otros escritores registrados por su nombre de usuario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Add Collaborator Form */}
          <form onSubmit={handleAddCollaborator} className="space-y-3 p-4 rounded-2xl bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
              Invitar por Nombre de Usuario:
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="usuario_escritor"
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-mono ${theme.borderCard} bg-white dark:bg-stone-800 ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold ${theme.borderCard} bg-white dark:bg-stone-800 ${theme.textPrimary} focus:outline-none`}
              >
                <option value="editor">Editor (Acceso completo)</option>
                <option value="colaborador">Colaborador (Ideas y notas)</option>
                <option value="visitante">Solo visitante (Lectura)</option>
              </select>

              <button
                type="submit"
                disabled={loading || !usernameInput.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 ${theme.primaryBtn} disabled:opacity-40 shrink-0`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </button>
            </div>

            {/* Quick suggestion tags of registered users */}
            {allUsers.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-stone-400 block mb-1">
                  Escritores inscritos en la plataforma:
                </span>
                <div className="flex flex-wrap gap-1">
                  {allUsers
                    .filter((u) => u.id !== book.userId)
                    .slice(0, 6)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUsernameInput(u.username)}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 hover:bg-amber-500/20 text-stone-700 dark:text-stone-300 font-mono transition-colors"
                      >
                        @{u.username}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </form>

          {/* Current Collaborators List */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Colaboradores con acceso a este libro ({collaborators.length})
            </span>

            {collaborators.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-2xl text-xs text-stone-400 italic">
                Este libro es privado. Nadie más tiene acceso todavía.
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((c) => (
                  <div
                    key={c.userId}
                    className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.displayName}
                          className="w-9 h-9 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: c.avatarColor || '#2D5A43' }}
                        >
                          {c.displayName?.[0]?.toUpperCase() || c.username[0]?.toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate text-stone-900 dark:text-stone-100">
                          {c.displayName}
                        </span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono block">
                          @{c.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(c.userId, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${theme.borderCard} bg-stone-50 dark:bg-stone-800 ${theme.textPrimary} focus:outline-none`}
                      >
                        <option value="editor">Editor</option>
                        <option value="colaborador">Colaborador</option>
                        <option value="visitante">Visitante</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemove(c.userId)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Quitar acceso a este libro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-black/5"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
