import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Download, Upload } from 'lucide-react';
import { ProjectMetadata } from '../types/audio';
import { listProjects, deleteProject } from '../utils/db';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onSaveCurrentProject: (name: string) => Promise<void>;
  onLoadProject: (id: string) => Promise<void>;
  onExportProjectFile: () => void;
  onImportProjectFile: (file: File) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectName,
  onSaveCurrentProject,
  onLoadProject,
  onExportProjectFile,
  onImportProjectFile,
}) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [saveName, setSaveName] = useState(projectName);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const list = await listProjects();
      setProjects(list);
    } catch (e) {
      console.error('Error listing projects:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSaveName(projectName);
      fetchProjects();
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      await onSaveCurrentProject(saveName.trim());
      await fetchProjects();
    } catch (e) {
      console.error('Error saving project:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      await onLoadProject(id);
      onClose();
    } catch (e) {
      console.error('Error loading project:', e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProject(id);
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gestor de Proyectos</h3>
              <p className="text-xs text-neutral-400">Guarda y abre tus sesiones localmente (IndexedDB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Section */}
        <div className="py-4 border-b border-neutral-800 space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">Guardar Proyecto Actual</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Nombre del proyecto"
              className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white font-medium outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSave}
              disabled={isSaving || !saveName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>

        {/* Saved Projects List */}
        <div className="py-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span>Proyectos Guardados ({projects.length})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onExportProjectFile}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                title="Descargar archivo de respaldo .json"
              >
                <Download className="w-3 h-3" />
                <span>Exportar JSON</span>
              </button>
              <label className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Importar JSON</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onImportProjectFile(e.target.files[0]);
                      onClose();
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {projects.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 text-xs bg-neutral-950/50 rounded-xl border border-neutral-800/80">
                No hay proyectos guardados en el almacenamiento local todavía.
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleLoad(p.id)}
                  className="flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>{p.trackCount} pista{p.trackCount !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{p.duration.toFixed(1)}s</span>
                      <span>·</span>
                      <span>{formatDate(p.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
