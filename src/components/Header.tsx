import React, { useState } from 'react';
import {
  Sliders,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Download,
  Sun,
  Moon,
  Plus,
  Music2,
  Sparkles,
  FileAudio,
  Info
} from 'lucide-react';

interface HeaderProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  onNewProject: () => void;
  onOpenProjectModal: () => void;
  onSaveProject: () => void;
  onImportAudio: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLoadDemoTrack: (type: 'synthwave' | 'acoustic' | 'ambient') => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onRenameProject,
  onNewProject,
  onOpenProjectModal,
  onSaveProject,
  onImportAudio,
  onExport,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isDark,
  onToggleTheme,
  onLoadDemoTrack,
  onOpenAbout,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(projectName);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleFinishEditing = () => {
    setIsEditingName(false);
    if (nameValue.trim()) {
      onRenameProject(nameValue.trim());
    } else {
      setNameValue(projectName);
    }
  };

  return (
    <header className="flex items-center justify-between gap-6 px-5 py-2.5 bg-neutral-900 border-b border-neutral-800 text-neutral-200 select-none">
      {/* Zone 1: Brand & Project Name */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
            <Sliders className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Audio Studio
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        {/* Project Name editable */}
        <div className="flex items-center gap-1.5">
          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={(e) => e.key === 'Enter' && handleFinishEditing()}
              autoFocus
              className="px-2 py-1 bg-neutral-800 border border-amber-500/50 rounded text-xs text-white outline-none font-medium max-w-[180px]"
            />
          ) : (
            <button
              onClick={() => {
                setNameValue(projectName);
                setIsEditingName(true);
              }}
              title="Click para renombrar proyecto"
              className="text-xs font-semibold text-neutral-300 hover:text-amber-400 px-2 py-1 rounded hover:bg-neutral-800/80 transition-colors truncate max-w-[160px] text-left"
            >
              {projectName}
            </button>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation & Project Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors whitespace-nowrap"
          title="Nuevo Proyecto Vacío"
        >
          <Plus className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden md:inline">Nuevo</span>
        </button>

        <button
          onClick={onImportAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors whitespace-nowrap"
          title="Importar archivo de audio (MP3, WAV, FLAC, OGG, AAC...)"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
          <span>Abrir Audio</span>
        </button>

        {/* Demo track loader popover */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors whitespace-nowrap"
            title="Cargar muestras de audio para probar"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Demos</span>
          </button>

          {showDemoMenu && (
            <div
              className="absolute left-0 mt-1 w-52 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl p-1 z-50 text-xs"
              onClick={() => setShowDemoMenu(false)}
            >
              <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Muestras para probar
              </div>
              <button
                onClick={() => onLoadDemoTrack('synthwave')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-neutral-800 rounded text-left text-neutral-200"
              >
                <Music2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Synthwave & Bass</div>
                  <div className="text-[10px] text-neutral-400">Ritmo 120 BPM con bajo y sintes</div>
                </div>
              </button>
              <button
                onClick={() => onLoadDemoTrack('acoustic')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-neutral-800 rounded text-left text-neutral-200"
              >
                <FileAudio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Acústico & Acordes</div>
                  <div className="text-[10px] text-neutral-400">Guitarra cálida y armonías</div>
                </div>
              </button>
              <button
                onClick={() => onLoadDemoTrack('ambient')}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-neutral-800 rounded text-left text-neutral-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Ambiente & Texturas</div>
                  <div className="text-[10px] text-neutral-400">Paisaje sonoro espacial</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onOpenProjectModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors whitespace-nowrap"
          title="Guardar o cargar proyectos guardados localmente"
        >
          <Save className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Proyectos</span>
        </button>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-md transition-colors ${
            canUndo
              ? 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-md transition-colors ${
            canRedo
              ? 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
          title="Rehacer (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zone 3: Primary Action & Theme Switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          title="Acerca de Audio Studio"
        >
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Acerca de</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-300" />}
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-md shadow-sm transition-all whitespace-nowrap"
          title="Exportar archivo de audio (WAV, MP3, FLAC, OGG...)"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
};
