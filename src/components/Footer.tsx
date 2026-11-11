import React from 'react';
import { ExternalLink, Info } from 'lucide-react';

interface FooterProps {
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-900 px-5 py-2.5 text-xs text-neutral-400 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Copyright text */}
        <div className="text-neutral-400 text-center sm:text-left">
          <span>Autor: <strong className="text-neutral-200 font-semibold">Aitor Sánchez Gutiérrez</strong>. © 2026 - Todos los derechos reservados.</span>
        </div>

        {/* Right: Clean links and About button */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <a
            href="https://aitorsanchez.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <span>Blog</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>

          <span className="text-neutral-700" aria-hidden="true">·</span>

          <a
            href="https://aitorhub.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <span>Aitor Hub</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>

          <span className="text-neutral-700" aria-hidden="true">·</span>

          <a
            href="https://aitorsanchez.pages.dev/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <span>Contacto</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>

          <span className="text-neutral-700" aria-hidden="true">·</span>

          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1 text-neutral-300 hover:text-amber-400 font-semibold transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Acerca de</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
