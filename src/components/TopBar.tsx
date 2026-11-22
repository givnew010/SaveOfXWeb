import React from 'react';
import { Plus } from 'lucide-react';

interface TopBarProps {
  activeSection: 'bookmarks' | 'folders';
  onSelectAllBookmarks: () => void;
  onSelectFoldersSection: () => void;
  onOpenShareGuide: () => void;
  onOpenShareSheet: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onSelectAllBookmarks,
  onSelectFoldersSection,
  onOpenShareGuide,
  onOpenShareSheet,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#EFF3F4] bg-white/95 backdrop-blur-md dark:border-[#2F3336] dark:bg-black/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectAllBookmarks();
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#0F1419] dark:text-[#E7E9EA] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D9BF0] rounded"
        >
          <svg
            className="h-6 w-6 shrink-0"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 4H25C26.1046 4 27 4.89543 27 6V28L16 21.5L5 28V6C5 4.89543 5.89543 4 7 4Z"
              fill="#1D9BF0"
            />
            <path
              d="M12.5 10.5L19.5 17.5M19.5 10.5L12.5 17.5"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span>مجموعات X</span>
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={onSelectAllBookmarks}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeSection === 'bookmarks'
                ? 'border-[#1D9BF0] text-[#0F1419] dark:text-[#E7E9EA]'
                : 'border-transparent text-[#536471] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:text-[#E7E9EA]'
            }`}
          >
            كل المحفوظات
          </button>
          <button
            type="button"
            onClick={onSelectFoldersSection}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeSection === 'folders'
                ? 'border-[#1D9BF0] text-[#0F1419] dark:text-[#E7E9EA]'
                : 'border-transparent text-[#536471] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:text-[#E7E9EA]'
            }`}
          >
            إدارة المجموعات
          </button>
          <button
            type="button"
            onClick={onOpenShareGuide}
            className="py-1 border-b-2 border-transparent text-[#536471] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:text-[#E7E9EA] transition-colors whitespace-nowrap shrink-0"
          >
            المشاركة والتثبيت
          </button>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenShareSheet}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#1D9BF0] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1A8CD8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>حفظ منشور</span>
          </button>
        </div>
      </div>
    </header>
  );
};
