import React from 'react';
import {
  BookOpen,
  Briefcase,
  Code2,
  Flame,
  Folder,
  Lightbulb,
  Palette,
  Sparkles,
} from 'lucide-react';
import type { FolderIconId } from '../types/vault';

interface FolderIconProps {
  icon: FolderIconId;
  className?: string;
}

export const FolderIcon: React.FC<FolderIconProps> = ({ icon, className = 'w-4 h-4' }) => {
  switch (icon) {
    case 'code':
      return <Code2 className={className} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'book':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'palette':
      return <Palette className={className} aria-hidden="true" />;
    case 'flame':
      return <Flame className={className} aria-hidden="true" />;
    case 'lightbulb':
      return <Lightbulb className={className} aria-hidden="true" />;
    case 'folder':
    default:
      return <Folder className={className} aria-hidden="true" />;
  }
};
