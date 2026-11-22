import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Bookmark,
  Download,
  FolderPlus,
  Moon,
  Pencil,
  Plus,
  Search,
  Share2,
  Sun,
  Trash2,
} from 'lucide-react';
import { BookmarkCard } from './components/BookmarkCard';
import { FolderIcon } from './components/FolderIcon';
import { DeleteFolderModal, FolderModal } from './components/FolderModal';
import { FolderSidebar } from './components/FolderSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { ShareGuideModal } from './components/ShareGuideModal';
import { ShareSaveSheet, type SharePayload } from './components/ShareSaveSheet';
import { TopBar } from './components/TopBar';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useVault } from './hooks/useVault';
import type { ActiveFilter, Folder, FolderColor, FolderIconId, SortOption } from './types/vault';
import {
  FOLDER_COLOR_STYLES,
  filterAndSortBookmarks,
  getFolderCounts,
} from './utils/bookmarks';

function readInitialShareFromLocation(): SharePayload | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const isSharePath = window.location.pathname === '/share';
  const url = params.get('url') || undefined;
  const text = params.get('text') || undefined;
  const title = params.get('title') || undefined;

  if (isSharePath || url || text) {
    return {
      url,
      text,
      title,
      source: 'share_target',
    };
  }
  return null;
}

export default function App() {
  const {
    folders,
    bookmarks,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    saveBookmark,
    updateBookmark,
    deleteBookmark,
  } = useVault();

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('x_vault_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('x_vault_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  const [activeSection, setActiveSection] = useState<'bookmarks' | 'folders'>('bookmarks');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Modals & sheets state
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [shareGuideOpen, setShareGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Detect Web Share Target (/share?url=...&text=...&title=...) on initial load
  useEffect(() => {
    const initialShare = readInitialShareFromLocation();
    if (initialShare) {
      setSharePayload(initialShare);
      setShareSheetOpen(true);
    }
  }, []);

  const counts = useMemo(
    () => getFolderCounts(folders, bookmarks),
    [folders, bookmarks]
  );

  const validFolderIds = useMemo(
    () => new Set(folders.map((f) => f.id)),
    [folders]
  );

  const visibleBookmarks = useMemo(
    () =>
      filterAndSortBookmarks(bookmarks, {
        folderId: activeFilter,
        query: searchQuery,
        sort: sortOption,
        validFolderIds,
      }),
    [bookmarks, activeFilter, searchQuery, sortOption, validFolderIds]
  );

  const activeFolderObj = useMemo(
    () => folders.find((f) => f.id === activeFilter) || null,
    [folders, activeFilter]
  );

  const handleCloseShareSheet = () => {
    setShareSheetOpen(false);
    setSharePayload(null);
    if (window.location.pathname === '/share' || window.location.search) {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleOpenManualShare = () => {
    setSharePayload({ source: 'manual' });
    setShareSheetOpen(true);
  };

  const handleSimulateWebShareTarget = () => {
    const demoUrl = 'https://x.com/tariq_architect/status/1857999000111222333';
    const demoText = 'تجربة مشاركة منشور من تطبيق X مباشرة إلى مجموعاتك المحفوظة';
    window.history.pushState(
      {},
      '',
      `/share?url=${encodeURIComponent(demoUrl)}&text=${encodeURIComponent(demoText)}`
    );
    setSharePayload({
      url: demoUrl,
      text: demoText,
      title: 'Post on X',
      source: 'share_target',
    });
    setShareSheetOpen(true);
  };

  const handleSelectFilter = (filter: ActiveFilter) => {
    setActiveFilter(filter);
    setActiveSection('bookmarks');
  };

  const handleSaveBookmark = async (input: Parameters<typeof saveBookmark>[0]) => {
    const res = await saveBookmark(input);
    if (res.ok) {
      if (res.bookmark.folderId) {
        const folder = folders.find((f) => f.id === res.bookmark.folderId);
        setActiveFilter(res.bookmark.folderId);
        setActiveSection('bookmarks');
        showToast(
          folder
            ? `تم حفظ المنشور في مجموعة «${folder.name}»`
            : 'تم حفظ المنشور بنجاح'
        );
      } else {
        setActiveFilter('all');
        setActiveSection('bookmarks');
        showToast('تم حفظ المنشور في «كل المحفوظات»');
      }
    }
    return res;
  };

  const handleFolderSubmit = async (input: {
    name: string;
    description?: string;
    color: FolderColor;
    icon: FolderIconId;
  }) => {
    if (editingFolder) {
      const res = await updateFolder(editingFolder.id, input);
      if (res.ok) showToast(`تم تحديث مجموعة «${res.folder.name}»`);
      return res;
    }
    const res = await createFolder(input);
    if (res.ok) {
      setActiveFilter(res.folder.id);
      showToast(`تم إنشاء مجموعة «${res.folder.name}»`);
    }
    return res;
  };

  const handleDeleteFolderConfirm = async (
    folderId: string,
    strategy: 'uncategorized' | 'delete_posts'
  ) => {
    const targetName = folders.find((f) => f.id === folderId)?.name || '';
    await deleteFolder(folderId, strategy);
    if (activeFilter === folderId) {
      setActiveFilter('all');
    }
    showToast(`تم حذف مجموعة «${targetName}»`);
  };

  const defaultShareFolderId =
    activeFilter !== 'all' && activeFilter !== 'uncategorized' ? activeFilter : null;

  const headingTitle =
    activeFilter === 'all'
      ? 'كل المحفوظات'
      : activeFilter === 'uncategorized'
        ? 'منشورات غير مصنفة'
        : activeFolderObj?.name || 'المجموعة';

  const headingDescription =
    activeFilter === 'all'
      ? 'جميع المنشورات والتغريدات التي شاركتها أو حفظتها من منصة X.'
      : activeFilter === 'uncategorized'
        ? 'منشورات محفوظة لم تُصنّف داخل مجموعة محددة بعد.'
        : activeFolderObj?.description || 'المنشورات المحفوظة داخل هذه المجموعة.';

  return (
    <div className="min-h-screen bg-white text-[#0F1419] dark:bg-black dark:text-[#E7E9EA]">
      <TopBar
        activeSection={activeSection}
        onSelectAllBookmarks={() => {
          setActiveSection('bookmarks');
          setActiveFilter('all');
        }}
        onSelectFoldersSection={() => setActiveSection('folders')}
        onOpenShareGuide={() => setShareGuideOpen(true)}
        onOpenShareSheet={handleOpenManualShare}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Desktop Sidebar (Folders Navigation) */}
          <div className="hidden md:block md:w-72 md:shrink-0 md:sticky md:top-20">
            <FolderSidebar
              folders={folders}
              activeFilter={activeFilter}
              counts={counts}
              onSelectFilter={handleSelectFilter}
              onCreateFolder={() => {
                setEditingFolder(null);
                setFolderModalOpen(true);
              }}
              onEditFolder={(folder) => {
                setEditingFolder(folder);
                setFolderModalOpen(true);
              }}
              onDeleteFolder={(folder) => setDeletingFolder(folder)}
            />
          </div>

          {/* Main Workspace Area */}
          <div className="min-w-0 flex-1">
            {activeSection === 'folders' ? (
              <section aria-labelledby="folders-manager-heading" className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFF3F4] pb-5 dark:border-[#2F3336]">
                  <div>
                    <h1
                      id="folders-manager-heading"
                      className="text-2xl font-bold tracking-tight text-[#0F1419] dark:text-[#E7E9EA]"
                    >
                      إدارة المجموعات
                    </h1>
                    <p className="mt-1 text-sm text-[#536471] dark:text-[#71767B]">
                      أضف مجموعات جديدة، عدّل أسماءها وألوانها، أو نظّم منشوراتك المحفوظة.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDark((d) => !d)}
                      aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CFD9DE] text-[#0F1419] hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-[#16181C]"
                    >
                      {isDark ? (
                        <Sun className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Moon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(null);
                        setFolderModalOpen(true);
                      }}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#0F1419] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#E7E9EA] dark:text-[#0F1419] whitespace-nowrap shrink-0"
                    >
                      <FolderPlus className="h-4 w-4" aria-hidden="true" />
                      <span>مجموعة جديدة</span>
                    </button>
                  </div>
                </div>

                {/* Folder Management Cards Grid */}
                {folders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#CFD9DE] p-10 text-center dark:border-[#2F3336]">
                    <p className="text-base font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
                      لا توجد مجموعات حالياً
                    </p>
                    <p className="mt-1 text-sm text-[#536471] dark:text-[#71767B]">
                      أنشئ مجموعة لتصنيف التغريدات والمنشورات التي تشاركها من منصة X.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(null);
                        setFolderModalOpen(true);
                      }}
                      className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D9BF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1A8CD8]"
                    >
                      <FolderPlus className="h-4 w-4" aria-hidden="true" />
                      <span>إنشاء أول مجموعة</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {folders.map((folder) => {
                      const style = FOLDER_COLOR_STYLES[folder.color] || FOLDER_COLOR_STYLES.sky;
                      const count = counts.byFolder[folder.id] ?? 0;

                      return (
                        <div
                          key={folder.id}
                          className="flex flex-col justify-between rounded-2xl border border-[#EFF3F4] bg-white p-5 dark:border-[#2F3336] dark:bg-[#16181C]"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.softBg} ${style.text}`}
                                >
                                  <FolderIcon icon={folder.icon} className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <h2 className="truncate text-base font-bold text-[#0F1419] dark:text-[#E7E9EA]">
                                    {folder.name}
                                  </h2>
                                  <p className="tabular-nums text-xs text-[#536471] dark:text-[#71767B]">
                                    {count} منشور محفوظ
                                  </p>
                                </div>
                              </div>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-[#536471] dark:text-[#71767B]">
                              {folder.description || 'بدون وصف مضاف لهذه المجموعة.'}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EFF3F4] pt-3.5 dark:border-[#2F3336]">
                            <button
                              type="button"
                              onClick={() => handleSelectFilter(folder.id)}
                              className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1D9BF0] hover:bg-[#1D9BF0]/10"
                            >
                              عرض المنشورات
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFolder(folder);
                                  setFolderModalOpen(true);
                                }}
                                aria-label={`تعديل مجموعة ${folder.name}`}
                                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#536471] hover:bg-[#F7F9F9] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-white/10 dark:hover:text-[#E7E9EA]"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingFolder(folder)}
                                aria-label={`حذف مجموعة ${folder.name}`}
                                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : (
              <section aria-labelledby="active-folder-heading" className="space-y-5">
                {/* Active Folder Header */}
                <div className="flex flex-col gap-4 border-b border-[#EFF3F4] pb-5 dark:border-[#2F3336]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {activeFolderObj ? (
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            (FOLDER_COLOR_STYLES[activeFolderObj.color] || FOLDER_COLOR_STYLES.sky)
                              .softBg
                          } ${
                            (FOLDER_COLOR_STYLES[activeFolderObj.color] || FOLDER_COLOR_STYLES.sky)
                              .text
                          }`}
                        >
                          <FolderIcon icon={activeFolderObj.icon} className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F7F9F9] text-[#0F1419] dark:bg-[#16181C] dark:text-[#E7E9EA]">
                          <Bookmark className="h-6 w-6 text-[#1D9BF0]" aria-hidden="true" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h1
                            id="active-folder-heading"
                            className="text-2xl font-bold tracking-tight text-[#0F1419] dark:text-[#E7E9EA]"
                          >
                            {headingTitle}
                          </h1>
                          <span className="tabular-nums text-xs font-medium text-[#536471] dark:text-[#71767B]">
                            · {visibleBookmarks.length} منشور
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#536471] dark:text-[#71767B]">
                          {headingDescription}
                        </p>
                      </div>
                    </div>

                    {/* Active Folder Quick Actions */}
                    {activeFolderObj && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolder(activeFolderObj);
                            setFolderModalOpen(true);
                          }}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#CFD9DE] px-3 py-1.5 text-xs font-semibold text-[#0F1419] hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-[#16181C]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>تعديل المجموعة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFolder(activeFolderObj)}
                          aria-label={`حذف مجموعة ${activeFolderObj.name}`}
                          className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-[#CFD9DE] px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:border-[#2F3336] dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Horizontal Folder Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-[#0F1419] text-white dark:bg-[#E7E9EA] dark:text-[#0F1419]'
                          : 'bg-[#F7F9F9] text-[#536471] dark:bg-[#16181C] dark:text-[#71767B]'
                      }`}
                    >
                      الكل ({counts.total})
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setActiveFilter(folder.id)}
                        className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                          activeFilter === folder.id
                            ? 'bg-[#1D9BF0] text-white'
                            : 'bg-[#F7F9F9] text-[#0F1419] dark:bg-[#16181C] dark:text-[#E7E9EA]'
                        }`}
                      >
                        {folder.name} ({counts.byFolder[folder.id] ?? 0})
                      </button>
                    ))}
                  </div>

                  {/* Workspace Toolbar: Search, Sort, Share Test, Theme Toggle, PWA Install */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[220px] flex-1">
                      <Search
                        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#536471]"
                        aria-hidden="true"
                      />
                      <label htmlFor="bookmarks-search" className="sr-only">
                        ابحث في المنشورات المحفوظة
                      </label>
                      <input
                        id="bookmarks-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث في نص التغريدة، @الحساب، أو الملاحظات..."
                        className="h-10 w-full rounded-xl border border-[#CFD9DE] bg-[#F7F9F9] pr-10 pl-3.5 text-sm text-[#0F1419] placeholder:text-[#536471] focus:border-[#1D9BF0] focus:bg-white focus:outline-none dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] dark:focus:bg-black"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <ArrowUpDown
                          className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#536471]"
                          aria-hidden="true"
                        />
                        <label htmlFor="bookmarks-sort" className="sr-only">
                          ترتيب المحفوظات
                        </label>
                        <select
                          id="bookmarks-sort"
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as SortOption)}
                          className="h-10 rounded-xl border border-[#CFD9DE] bg-white pr-8 pl-3 text-xs font-medium text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#E7E9EA]"
                        >
                          <option value="newest">الأحدث حفظاً</option>
                          <option value="oldest">الأقدم حفظاً</option>
                          <option value="author">حسب الكاتب</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulateWebShareTarget}
                        title="اختبار استقبال مشاركة من منصة X عبر Web Share Target"
                        className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#CFD9DE] px-3 text-xs font-semibold text-[#0F1419] transition-colors hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-[#16181C] whitespace-nowrap shrink-0"
                      >
                        <Share2 className="h-3.5 w-3.5 text-[#1D9BF0]" aria-hidden="true" />
                        <span>تجربة المشاركة من X</span>
                      </button>

                      {!isInstalled && isInstallable && (
                        <button
                          type="button"
                          onClick={install}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#1D9BF0]/40 bg-[#1D9BF0]/10 px-3 text-xs font-semibold text-[#1D9BF0] hover:bg-[#1D9BF0]/15 whitespace-nowrap shrink-0"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>تثبيت التطبيق</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsDark((d) => !d)}
                        aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
                        title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CFD9DE] text-[#0F1419] transition-colors hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-[#16181C]"
                      >
                        {isDark ? (
                          <Sun className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Moon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bookmarks List / Loading / Empty States */}
                {loading && bookmarks.length === 0 ? (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-busy="true">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-52 animate-pulse rounded-2xl border border-[#EFF3F4] bg-[#F7F9F9] p-5 dark:border-[#2F3336] dark:bg-[#16181C]"
                      />
                    ))}
                  </div>
                ) : visibleBookmarks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#CFD9DE] p-10 text-center dark:border-[#2F3336]">
                    <Bookmark
                      className="mx-auto h-9 w-9 text-[#536471] dark:text-[#71767B]"
                      aria-hidden="true"
                    />
                    <h2 className="mt-3 text-base font-bold text-[#0F1419] dark:text-[#E7E9EA]">
                      {searchQuery.trim()
                        ? 'لا توجد نتائج مطابقة للبحث'
                        : 'لا توجد منشورات في هذه المجموعة بعد'}
                    </h2>
                    <p className="mt-1 text-sm text-[#536471] dark:text-[#71767B]">
                      {searchQuery.trim()
                        ? 'جرّب البحث بكلمات أخرى أو امسح مربع البحث.'
                        : 'شارك أي منشور من X واختر هذه المجموعة ليظهر هنا فوراً.'}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                      {searchQuery.trim() ? (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="min-h-[44px] rounded-xl border border-[#CFD9DE] px-5 py-2 text-sm font-semibold text-[#0F1419] hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-[#16181C]"
                        >
                          مسح البحث
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenManualShare}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D9BF0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1A8CD8]"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          <span>حفظ أول منشور</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    data-testid="bookmarks-grid"
                    className="grid grid-cols-1 gap-4 xl:grid-cols-2"
                  >
                    {visibleBookmarks.map((post) => (
                      <BookmarkCard
                        key={post.id}
                        post={post}
                        folders={folders}
                        onMoveFolder={(id, folderId) => {
                          updateBookmark(id, { folderId });
                          const target = folders.find((f) => f.id === folderId);
                          showToast(
                            target
                              ? `تم نقل المنشور إلى «${target.name}»`
                              : 'تم نقل المنشور إلى «غير مصنفة»'
                          );
                        }}
                        onUpdateNote={(id, note) => {
                          updateBookmark(id, { note });
                          showToast('تم حفظ الملاحظة');
                        }}
                        onDelete={(id) => {
                          deleteBookmark(id);
                          showToast('تم حذف المنشور من المحفوظات');
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav
        activeSection={activeSection}
        onSelectBookmarks={() => setActiveSection('bookmarks')}
        onSelectFolders={() => setActiveSection('folders')}
        onOpenShareSheet={handleOpenManualShare}
        onOpenShareGuide={() => setShareGuideOpen(true)}
      />

      <ShareSaveSheet
        isOpen={shareSheetOpen}
        initialPayload={sharePayload}
        folders={folders}
        folderCounts={counts.byFolder}
        defaultFolderId={defaultShareFolderId}
        onClose={handleCloseShareSheet}
        onCreateFolderInline={async ({ name, color, icon }) =>
          createFolder({ name, color, icon })
        }
        onSave={handleSaveBookmark}
      />

      <FolderModal
        isOpen={folderModalOpen}
        editingFolder={editingFolder}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={handleFolderSubmit}
      />

      <DeleteFolderModal
        folder={deletingFolder}
        postCount={deletingFolder ? counts.byFolder[deletingFolder.id] ?? 0 : 0}
        onClose={() => setDeletingFolder(null)}
        onConfirm={handleDeleteFolderConfirm}
      />

      <ShareGuideModal
        isOpen={shareGuideOpen}
        onClose={() => setShareGuideOpen(false)}
        onSimulateShareTarget={handleSimulateWebShareTarget}
      />

      <OfflineBanner />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-4 z-50 rounded-xl bg-[#0F1419] px-4 py-2.5 text-xs font-semibold text-white shadow-lg md:bottom-6 dark:bg-[#E7E9EA] dark:text-[#0F1419]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
