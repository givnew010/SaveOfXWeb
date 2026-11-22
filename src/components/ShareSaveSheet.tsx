import React, { useEffect, useState } from 'react';
import { Check, FolderPlus, Inbox, Link2, Loader2, Sparkles, X } from 'lucide-react';
import type { BookmarkPost, Folder, FolderColor, FolderIconId, ResolvedPostPreview } from '../types/vault';
import { FOLDER_COLOR_STYLES, parseSharedPostInput } from '../utils/bookmarks';
import { FolderIcon } from './FolderIcon';

export interface SharePayload {
  url?: string;
  text?: string;
  title?: string;
  source?: BookmarkPost['source'];
}

interface ShareSaveSheetProps {
  isOpen: boolean;
  initialPayload: SharePayload | null;
  folders: Folder[];
  folderCounts: Record<string, number>;
  defaultFolderId: string | null;
  onClose: () => void;
  onCreateFolderInline: (input: {
    name: string;
    color: FolderColor;
    icon: FolderIconId;
  }) => Promise<{ ok: true; folder: Folder } | { ok: false; error: string }>;
  onSave: (input: {
    url: string;
    statusId?: string;
    authorName: string;
    authorHandle: string;
    content: string;
    note?: string;
    folderId: string | null;
    source: BookmarkPost['source'];
  }) => Promise<{ ok: true; bookmark: BookmarkPost } | { ok: false; error: string }>;
}

const SAMPLE_SHARES = [
  {
    label: 'تجربة تغريدة تقنية',
    url: 'https://x.com/karpathy/status/1857120491002311099',
    authorName: 'Andrej Karpathy',
    authorHandle: '@karpathy',
    content:
      'Software 2.0 is shifting how we build systems: clear evaluation harnesses and crisp user workflows matter more than ever.',
  },
  {
    label: 'تجربة تغريدة تصميم',
    url: 'https://x.com/rauno/status/1857120491002311055',
    authorName: 'Rauno Freiberg',
    authorHandle: '@rauno',
    content:
      'Great interfaces feel effortless because every micro-interaction respects human rhythm and removes visual noise.',
  },
];

export const ShareSaveSheet: React.FC<ShareSaveSheetProps> = ({
  isOpen,
  initialPayload,
  folders,
  folderCounts,
  defaultFolderId,
  onClose,
  onCreateFolderInline,
  onSave,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline new folder state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setResolveNote(null);
    setShowNewFolder(false);
    setNewFolderName('');
    setNewFolderError(null);
    setSelectedFolderId(defaultFolderId);
    setNote('');

    const parsed = parseSharedPostInput({
      url: initialPayload?.url,
      text: initialPayload?.text,
      title: initialPayload?.title,
    });

    setUrlInput(parsed.canonicalUrl || parsed.url || '');
    setAuthorHandle(parsed.authorHandle || '');
    setAuthorName(parsed.authorHandle ? parsed.authorHandle.slice(1) : '');
    setContent(parsed.extractedText || '');

    if (parsed.isValidUrl) {
      void resolveFromServer(parsed.canonicalUrl || parsed.url, parsed.extractedText, parsed.title);
    }
  }, [isOpen, initialPayload, defaultFolderId]);

  const resolveFromServer = async (targetUrl: string, text?: string, title?: string) => {
    setResolving(true);
    setResolveNote(null);
    try {
      const res = await fetch('/api/resolve-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, text, title }),
      });
      if (res.ok) {
        const data = (await res.json()) as ResolvedPostPreview;
        if (data.authorName) setAuthorName(data.authorName);
        if (data.authorHandle) setAuthorHandle(data.authorHandle);
        if (data.content) setContent(data.content);
        if (data.canonicalUrl) setUrlInput(data.canonicalUrl);
        setResolveNote(
          data.resolvedFromOEmbed
            ? 'تم جلب نص المنشور تلقائياً من X.'
            : 'تم التعرف على الرابط. يمكنك مراجعة النص أو تعديله قبل الحفظ.'
        );
      }
    } catch {
      // Fallback to local parsed values
    } finally {
      setResolving(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    setError(null);
    const parsed = parseSharedPostInput({ url: urlInput, text: content });
    if (!parsed.isValidUrl) {
      setError('يرجى إدخال رابط منشور صالح من x.com أو twitter.com.');
      return;
    }
    setUrlInput(parsed.canonicalUrl);
    if (parsed.authorHandle && !authorHandle) setAuthorHandle(parsed.authorHandle);
    if (parsed.authorHandle && !authorName) setAuthorName(parsed.authorHandle.slice(1));
    await resolveFromServer(parsed.canonicalUrl, content);
  };

  const handleInlineCreateFolder = async () => {
    setNewFolderError(null);
    setCreatingFolder(true);
    const result = await onCreateFolderInline({
      name: newFolderName,
      color: 'sky',
      icon: 'folder',
    });
    setCreatingFolder(false);
    if (!result.ok) {
      setNewFolderError(result.error);
      return;
    }
    setSelectedFolderId(result.folder.id);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseSharedPostInput({ url: urlInput, text: content });
    if (!parsed.isValidUrl) {
      setError('يرجى إدخال رابط صالح لمنشور من منصة X (مثال: https://x.com/user/status/123).');
      return;
    }

    const finalContent = content.trim();
    if (!finalContent) {
      setError('يرجى إدخال نص المنشور أو جلبه قبل الحفظ.');
      return;
    }

    const cleanHandle = (authorHandle || parsed.authorHandle || '@x_user').trim();
    const normalizedHandle = cleanHandle.startsWith('@') ? cleanHandle : `@${cleanHandle}`;

    setSubmitting(true);
    const res = await onSave({
      url: parsed.canonicalUrl || urlInput.trim(),
      statusId: parsed.statusId || undefined,
      authorName: authorName.trim() || normalizedHandle.slice(1),
      authorHandle: normalizedHandle,
      content: finalContent,
      note: note.trim() || undefined,
      folderId: selectedFolderId,
      source: initialPayload?.source || 'manual',
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  const isShareTargetLaunch = initialPayload?.source === 'share_target';
  const selectedFolderObj = folders.find((f) => f.id === selectedFolderId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-[#EFF3F4] bg-white shadow-2xl dark:border-[#2F3336] dark:bg-[#16181C]">
        {/* Mobile grab handle */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#CFD9DE] dark:bg-[#2F3336] sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFF3F4] px-5 py-4 dark:border-[#2F3336]">
          <div>
            <h2
              id="share-sheet-title"
              className="text-lg font-bold text-[#0F1419] dark:text-[#E7E9EA]"
            >
              {isShareTargetLaunch ? 'حفظ المنشور المُشارك في مجموعة' : 'حفظ منشور من منصة X'}
            </h2>
            <p className="mt-0.5 text-xs text-[#536471] dark:text-[#71767B]">
              اختر المجموعة التي تريد حفظ التغريدة بداخلها مباشرة
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الحفظ"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#536471] transition-colors hover:bg-[#F7F9F9] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-white/10 dark:hover:text-[#E7E9EA]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Quick Demo Sample Links for Instant Testing */}
          {!isShareTargetLaunch && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#536471] dark:text-[#71767B]">تعبئة سريعة للتجربة:</span>
              {SAMPLE_SHARES.map((sample) => (
                <button
                  key={sample.url}
                  type="button"
                  onClick={() => {
                    setUrlInput(sample.url);
                    setAuthorName(sample.authorName);
                    setAuthorHandle(sample.authorHandle);
                    setContent(sample.content);
                    setError(null);
                  }}
                  className="rounded-lg border border-[#CFD9DE] px-2.5 py-1 font-medium text-[#0F1419] transition-colors hover:border-[#1D9BF0] hover:text-[#1D9BF0] dark:border-[#2F3336] dark:text-[#E7E9EA]"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          )}

          {/* 1. URL Input */}
          <div>
            <label
              htmlFor="share-url-input"
              className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
            >
              رابط المنشور على منصة X
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#536471]"
                  aria-hidden="true"
                />
                <input
                  id="share-url-input"
                  type="url"
                  dir="ltr"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://x.com/username/status/1234567890"
                  className="h-11 w-full rounded-xl border border-[#CFD9DE] bg-white pr-9 pl-3 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
                />
              </div>
              <button
                type="button"
                onClick={handleAnalyzeUrl}
                disabled={resolving}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#CFD9DE] px-3.5 text-xs font-semibold text-[#0F1419] transition-colors hover:bg-[#F7F9F9] disabled:opacity-60 dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-white/5 whitespace-nowrap shrink-0"
              >
                {resolving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4 text-[#1D9BF0]" aria-hidden="true" />
                )}
                <span>جلب التفاصيل</span>
              </button>
            </div>
            {resolveNote && (
              <p className="mt-1.5 text-xs text-[#1D9BF0]">{resolveNote}</p>
            )}
          </div>

          {/* 2. Target Collection Picker (Core X Bookmark Folders Experience) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
                اختر المجموعة للحفظ
              </span>
              <button
                type="button"
                onClick={() => setShowNewFolder((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D9BF0] hover:underline"
              >
                <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إنشاء مجموعة جديدة</span>
              </button>
            </div>

            {showNewFolder && (
              <div className="mb-3 rounded-xl border border-[#1D9BF0]/40 bg-[#1D9BF0]/5 p-3">
                <div className="flex gap-2">
                  <label htmlFor="inline-folder-name" className="sr-only">
                    اسم المجموعة الجديدة
                  </label>
                  <input
                    id="inline-folder-name"
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="اسم المجموعة الجديدة (مثال: تسويق رقمي)"
                    className="h-10 flex-1 rounded-lg border border-[#CFD9DE] bg-white px-3 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
                  />
                  <button
                    type="button"
                    onClick={handleInlineCreateFolder}
                    disabled={creatingFolder}
                    className="h-10 rounded-lg bg-[#1D9BF0] px-3.5 text-xs font-semibold text-white hover:bg-[#1A8CD8] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {creatingFolder ? 'جاري الإنشاء...' : 'إنشاء وتحديد'}
                  </button>
                </div>
                {newFolderError && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                    {newFolderError}
                  </p>
                )}
              </div>
            )}

            <div
              role="radiogroup"
              aria-label="اختيار المجموعة"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {folders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                const style = FOLDER_COLOR_STYLES[folder.color] || FOLDER_COLOR_STYLES.sky;
                const count = folderCounts[folder.id] ?? 0;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-right transition-colors ${
                      isSelected
                        ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 dark:bg-[#1D9BF0]/15'
                        : 'border-[#EFF3F4] bg-white hover:border-[#CFD9DE] dark:border-[#2F3336] dark:bg-black dark:hover:border-[#3E4144]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.softBg} ${style.text}`}
                      >
                        <FolderIcon icon={folder.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
                          {folder.name}
                        </span>
                        <span className="block tabular-nums text-[11px] text-[#536471] dark:text-[#71767B]">
                          {count} منشور
                        </span>
                      </span>
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[#1D9BF0]" aria-hidden="true" />
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                role="radio"
                aria-checked={selectedFolderId === null}
                onClick={() => setSelectedFolderId(null)}
                className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-right transition-colors ${
                  selectedFolderId === null
                    ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 dark:bg-[#1D9BF0]/15'
                    : 'border-[#EFF3F4] bg-white hover:border-[#CFD9DE] dark:border-[#2F3336] dark:bg-black dark:hover:border-[#3E4144]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F9F9] text-[#536471] dark:bg-[#1E2126] dark:text-[#71767B]">
                    <Inbox className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
                      غير مصنفة
                    </span>
                    <span className="block text-[11px] text-[#536471] dark:text-[#71767B]">
                      حفظ بدون مجموعة
                    </span>
                  </span>
                </span>
                {selectedFolderId === null && (
                  <Check className="h-4 w-4 shrink-0 text-[#1D9BF0]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Author & Post Content */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="share-author-name"
                className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
              >
                اسم الكاتب
              </label>
              <input
                id="share-author-name"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: طارق المنصور"
                className="h-10 w-full rounded-xl border border-[#CFD9DE] bg-white px-3 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
              />
            </div>

            <div>
              <label
                htmlFor="share-author-handle"
                className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
              >
                معرّف الحساب
              </label>
              <input
                id="share-author-handle"
                type="text"
                dir="ltr"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                placeholder="@username"
                className="h-10 w-full rounded-xl border border-[#CFD9DE] bg-white px-3 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="share-post-content"
              className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
            >
              نص المنشور (التغريدة)
            </label>
            <textarea
              id="share-post-content"
              rows={3}
              dir="auto"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب أو الصق نص المنشور هنا..."
              className="w-full rounded-xl border border-[#CFD9DE] bg-white px-3 py-2.5 text-sm leading-relaxed text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
            />
          </div>

          <div>
            <label
              htmlFor="share-post-note"
              className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
            >
              ملاحظة شخصية (اختياري)
            </label>
            <input
              id="share-post-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="سبب الحفظ أو خلاصة سريعة للرجوع إليها..."
              className="h-10 w-full rounded-xl border border-[#CFD9DE] bg-white px-3 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-[#EFF3F4] pt-4 dark:border-[#2F3336]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium text-[#536471] hover:bg-[#F7F9F9] dark:text-[#71767B] dark:hover:bg-white/10"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1D9BF0] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1A8CD8] disabled:opacity-60"
            >
              {submitting
                ? 'جاري الحفظ...'
                : selectedFolderObj
                  ? `حفظ في "${selectedFolderObj.name}"`
                  : 'حفظ في المحفوظات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
