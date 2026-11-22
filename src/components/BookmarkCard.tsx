import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  FolderInput,
  MessageSquareText,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { BookmarkPost, Folder } from '../types/vault';
import { formatArabicDate } from '../utils/bookmarks';

interface BookmarkCardProps {
  post: BookmarkPost;
  folders: Folder[];
  onMoveFolder: (bookmarkId: string, folderId: string | null) => void;
  onUpdateNote: (bookmarkId: string, note: string) => void;
  onDelete: (bookmarkId: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  post,
  folders,
  onMoveFolder,
  onUpdateNote,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(post.note || '');
  const [imgFailed, setImgFailed] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);

  const currentFolder = folders.find((f) => f.id === post.folderId) || null;
  const initials = (post.authorName || post.authorHandle.replace('@', '') || 'X')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(post.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNote(post.id, noteDraft);
    setEditingNote(false);
  };

  return (
    <article
      data-testid={`bookmark-card-${post.id}`}
      className="flex flex-col justify-between rounded-2xl border border-[#EFF3F4] bg-white p-5 transition-colors hover:border-[#CFD9DE] dark:border-[#2F3336] dark:bg-[#16181C] dark:hover:border-[#3E4144]"
    >
      <div>
        {/* Author + Unboxed Metadata Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {post.authorAvatar && !imgFailed ? (
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-11 w-11 shrink-0 rounded-full object-cover border border-[#EFF3F4] dark:border-[#2F3336]"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F1419] text-xs font-semibold text-white dark:bg-[#2F3336]"
              >
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
                  {post.authorName}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#536471] dark:text-[#71767B]">
                <span className="font-mono-ltr truncate max-w-[150px]">{post.authorHandle}</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.savedAt}>{formatArabicDate(post.savedAt)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-[#1D9BF0]">
                  <span aria-hidden="true" className="text-[#536471] dark:text-[#71767B]">·</span>
                  <span>{currentFolder ? currentFolder.name : 'غير مصنفة'}</span>
                </span>
              </div>
            </div>
          </div>

          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`فتح منشور ${post.authorName} على منصة X`}
            title="فتح المنشور الأصلي في X"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#536471] transition-colors hover:bg-[#F7F9F9] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-white/10 dark:hover:text-[#E7E9EA]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        {/* Post Body */}
        <p
          dir="auto"
          className="mt-3.5 whitespace-pre-line text-[15px] leading-relaxed text-[#0F1419] dark:text-[#E7E9EA]"
        >
          {post.content}
        </p>

        {/* Optional Media Thumbnail */}
        {post.mediaUrl && !mediaFailed && (
          <div className="mt-3.5 overflow-hidden rounded-xl border border-[#EFF3F4] dark:border-[#2F3336]">
            <img
              src={post.mediaUrl}
              alt={`صورة مرفقة مع منشور ${post.authorName}`}
              referrerPolicy="no-referrer"
              onError={() => setMediaFailed(true)}
              className="aspect-video w-full object-cover"
            />
          </div>
        )}

        {/* Personal Note Section */}
        {editingNote ? (
          <form onSubmit={handleSaveNote} className="mt-3.5 space-y-2">
            <label htmlFor={`note-input-${post.id}`} className="sr-only">
              ملاحظة شخصية
            </label>
            <textarea
              id={`note-input-${post.id}`}
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="اكتب ملاحظتك حول هذا المنشور..."
              className="w-full rounded-xl border border-[#CFD9DE] bg-white px-3 py-2 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(post.note || '');
                  setEditingNote(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#536471] hover:bg-[#F7F9F9] dark:text-[#71767B] dark:hover:bg-white/10"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0F1419] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 dark:bg-[#E7E9EA] dark:text-[#0F1419]"
              >
                حفظ الملاحظة
              </button>
            </div>
          </form>
        ) : post.note ? (
          <div className="mt-3.5 flex items-start justify-between gap-2 rounded-xl bg-[#F7F9F9] px-3.5 py-2.5 text-xs leading-relaxed text-[#536471] dark:bg-[#1E2126] dark:text-[#A0A8B0]">
            <div className="flex items-start gap-2 min-w-0">
              <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1D9BF0]" aria-hidden="true" />
              <p className="break-words">{post.note}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNoteDraft(post.note || '');
                setEditingNote(true);
              }}
              aria-label={`تعديل ملاحظة منشور ${post.authorName}`}
              className="shrink-0 rounded p-1 text-[#536471] hover:text-[#0F1419] dark:hover:text-[#E7E9EA]"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFF3F4] pt-3.5 dark:border-[#2F3336]">
        {/* Quick Move Folder Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderInput className="h-3.5 w-3.5 shrink-0 text-[#536471] dark:text-[#71767B]" aria-hidden="true" />
          <label htmlFor={`move-folder-${post.id}`} className="sr-only">
            تغيير مجموعة منشور {post.authorName}
          </label>
          <select
            id={`move-folder-${post.id}`}
            value={post.folderId || 'uncategorized'}
            onChange={(e) => {
              const val = e.target.value;
              onMoveFolder(post.id, val === 'uncategorized' ? null : val);
            }}
            className="h-9 max-w-[170px] rounded-lg border border-[#CFD9DE] bg-white px-2.5 text-xs font-medium text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
          >
            <option value="uncategorized">غير مصنفة</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* Utility buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!post.note && !editingNote && (
            <button
              type="button"
              onClick={() => {
                setNoteDraft('');
                setEditingNote(true);
              }}
              aria-label={`إضافة ملاحظة لمنشور ${post.authorName}`}
              title="إضافة ملاحظة"
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#536471] transition-colors hover:bg-[#F7F9F9] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-white/10 dark:hover:text-[#E7E9EA]"
            >
              <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">ملاحظة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={`نسخ رابط منشور ${post.authorName}`}
            title="نسخ رابط المنشور"
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#536471] transition-colors hover:bg-[#F7F9F9] hover:text-[#0F1419] dark:text-[#71767B] dark:hover:bg-white/10 dark:hover:text-[#E7E9EA]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-600">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">نسخ</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onDelete(post.id)}
            aria-label={`حذف منشور ${post.authorName}`}
            title="حذف المنشور"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#536471] transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:text-[#71767B] dark:hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
