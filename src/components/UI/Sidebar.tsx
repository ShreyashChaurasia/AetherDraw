import React from "react";
import { X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <aside className="w-96 border-l border-neutral-800 bg-neutral-950 flex flex-col h-full z-20 shrink-0 shadow-2xl">
      <div className="h-10 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
          {title}
        </span>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 transition-colors p-1 rounded cursor-pointer"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </aside>
  );
};
