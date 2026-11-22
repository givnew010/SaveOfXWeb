import React from 'react';
import { Bookmark, FolderPlus, Inbox, Pencil, Trash2 } from 'lucide-react';
import type { ActiveFilter, Folder } from '../types/vault';
import { FOLDER_COLOR_STYLES } from '../utils/bookmarks';
import { FolderIcon } from './FolderIcon';

interface FolderSidebarProps {
  folders: Folder[];
  activeFilter: ActiveFilter;
  counts: {
    total: number;
    uncategorized: number;
    byFolder: Record<string, number>;
  };
  onSelectFilter: (filter: ActiveFilter) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  activeFilter,
  counts,
  onSelectFilter,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}) => {
  return (
    <aside aria-label="قائمة المجموعات" className="w-full space-y-6">
      {/* Built-in smart views */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectFilter('all')}
          className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#0F1419] text-white dark:bg-[#E7E9EA] dark:text-[#0F1419]'
              : 'text-[#0F1419] hover:bg-[#F7F9F9] dark:text-[#E7E9EA] dark:hover:bg-[#16181C]'
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <Bookmark className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">كل المحفوظات</span>
          </span>
          <span className="tabular-nums text-xs opacity-80">{counts.total}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter('uncategorized')}
          className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
            activeFilter === 'uncategorized'
              ? 'bg-[#0F1419] text-white dark:bg-[#E7E9EA] dark:text-[#0F1419]'
              : 'text-[#536471] hover:bg-[#F7F9F9] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-[#16181C] dark:hover:text-[#E7E9EA]'
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">غير مصنفة</span>
          </span>
          <span className="tabular-nums text-xs opacity-80">{counts.uncategorized}</span>
        </button>
      </div>

      {/* Custom folders */}
      <div className="border-t border-[#EFF3F4] pt-5 dark:border-[#2F3336]">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-[#536471] dark:text-[#71767B]">
            المجموعات ({folders.length})
          </h2>
          <button
            type="button"
            onClick={onCreateFolder}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1D9BF0] transition-colors hover:bg-[#1D9BF0]/10 focus-visible:outline-2 focus-visible:outline-[#1D9BF0] whitespace-nowrap shrink-0"
          >
            <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>مجموعة جديدة</span>
          </button>
        </div>

        {folders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#CFD9DE] p-4 text-center dark:border-[#2F3336]">
            <p className="text-xs text-[#536471] dark:text-[#71767B]">
              لا توجد مجموعات مخصصة بعد.
            </p>
            <button
              type="button"
              onClick={onCreateFolder}
              className="mt-2.5 text-xs font-semibold text-[#1D9BF0] hover:underline"
            >
              أنشئ مجموعتك الأولى
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {folders.map((folder) => {
              const isSelected = activeFilter === folder.id;
              const style = FOLDER_COLOR_STYLES[folder.color] || FOLDER_COLOR_STYLES.sky;
              const count = counts.byFolder[folder.id] ?? 0;

              return (
                <li
                  key={folder.id}
                  className={`group flex items-center gap-1 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-[#1D9BF0]/10 dark:bg-[#1D9BF0]/15'
                      : 'hover:bg-[#F7F9F9] dark:hover:bg-[#16181C]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectFilter(folder.id)}
                    className="flex min-h-[44px] flex-1 items-center justify-between gap-2 px-3 py-2 text-right min-w-0"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.softBg} ${style.text}`}
                      >
                        <FolderIcon icon={folder.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span
                        className={`truncate text-sm font-medium ${
                          isSelected
                            ? 'text-[#0F1419] dark:text-[#E7E9EA] font-semibold'
                            : 'text-[#0F1419] dark:text-[#E7E9EA]'
                        }`}
                      >
                        {folder.name}
                      </span>
                    </span>
                    <span className="tabular-nums text-xs text-[#536471] dark:text-[#71767B] shrink-0">
                      {count}
                    </span>
                  </button>

                  <div className="flex items-center overflow-hidden pl-1.5 md:w-0 md:pl-0 md:opacity-0 md:group-hover:w-[70px] md:group-hover:pl-1.5 md:group-hover:opacity-100 md:group-focus-within:w-[70px] md:group-focus-within:pl-1.5 md:group-focus-within:opacity-100 transition-all shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditFolder(folder)}
                      aria-label={`تعديل مجموعة ${folder.name}`}
                      title="تعديل المجموعة"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#536471] hover:bg-black/5 hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-white/10 dark:hover:text-[#E7E9EA]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFolder(folder)}
                      aria-label={`حذف مجموعة ${folder.name}`}
                      title="حذف المجموعة"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#536471] hover:bg-rose-500/10 hover:text-rose-600 dark:text-[#71767B] dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};
