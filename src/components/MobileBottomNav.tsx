import React from 'react';
import { Bookmark, FolderKanban, Plus, Share2 } from 'lucide-react';

interface MobileBottomNavProps {
  activeSection: 'bookmarks' | 'folders';
  onSelectBookmarks: () => void;
  onSelectFolders: () => void;
  onOpenShareSheet: () => void;
  onOpenShareGuide: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onSelectBookmarks,
  onSelectFolders,
  onOpenShareSheet,
  onOpenShareGuide,
}) => {
  return (
    <nav
      aria-label="التنقل السريع للجوال"
      className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 items-center border-t border-[#EFF3F4] bg-white/95 backdrop-blur-md md:hidden dark:border-[#2F3336] dark:bg-black/95"
    >
      <button
        type="button"
        onClick={onSelectBookmarks}
        className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
          activeSection === 'bookmarks'
            ? 'text-[#1D9BF0]'
            : 'text-[#536471] dark:text-[#71767B]'
        }`}
      >
        <Bookmark className="h-5 w-5" aria-hidden="true" />
        <span>المحفوظات</span>
      </button>

      <button
        type="button"
        onClick={onSelectFolders}
        className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
          activeSection === 'folders'
            ? 'text-[#1D9BF0]'
            : 'text-[#536471] dark:text-[#71767B]'
        }`}
      >
        <FolderKanban className="h-5 w-5" aria-hidden="true" />
        <span>المجموعات</span>
      </button>

      <button
        type="button"
        onClick={onOpenShareSheet}
        className="flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1D9BF0]"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span>حفظ منشور</span>
      </button>

      <button
        type="button"
        onClick={onOpenShareGuide}
        className="flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#536471] dark:text-[#71767B]"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
        <span>دليل X</span>
      </button>
    </nav>
  );
};
