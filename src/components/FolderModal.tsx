import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Folder, FolderColor, FolderIconId } from '../types/vault';
import { FOLDER_COLOR_STYLES } from '../utils/bookmarks';
import { FolderIcon } from './FolderIcon';

interface FolderModalProps {
  isOpen: boolean;
  editingFolder: Folder | null;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    description?: string;
    color: FolderColor;
    icon: FolderIconId;
  }) => Promise<{ ok: true; folder: Folder } | { ok: false; error: string }>;
}

const COLOR_OPTIONS: FolderColor[] = ['sky', 'violet', 'emerald', 'amber', 'rose', 'slate'];
const ICON_OPTIONS: { id: FolderIconId; label: string }[] = [
  { id: 'folder', label: 'مجلد' },
  { id: 'code', label: 'برمجة' },
  { id: 'palette', label: 'تصميم' },
  { id: 'sparkles', label: 'ذكاء' },
  { id: 'book', label: 'قراءة' },
  { id: 'briefcase', label: 'أعمال' },
  { id: 'lightbulb', label: 'أفكار' },
  { id: 'flame', label: 'مهم' },
];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  editingFolder,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<FolderColor>('sky');
  const [icon, setIcon] = useState<FolderIconId>('folder');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingFolder) {
      setName(editingFolder.name);
      setDescription(editingFolder.description || '');
      setColor(editingFolder.color);
      setIcon(editingFolder.icon);
    } else {
      setName('');
      setDescription('');
      setColor('sky');
      setIcon('folder');
    }
  }, [isOpen, editingFolder]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await onSubmit({
      name,
      description,
      color,
      icon,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#EFF3F4] bg-white p-5 shadow-2xl dark:border-[#2F3336] dark:bg-[#16181C]">
        <div className="flex items-center justify-between border-b border-[#EFF3F4] pb-3.5 dark:border-[#2F3336]">
          <h2
            id="folder-modal-title"
            className="text-lg font-bold text-[#0F1419] dark:text-[#E7E9EA]"
          >
            {editingFolder ? 'تعديل المجموعة' : 'إنشاء مجموعة جديدة'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة المجموعة"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#536471] hover:bg-[#F7F9F9] dark:text-[#71767B] dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="folder-name-input"
              className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
            >
              اسم المجموعة
            </label>
            <input
              id="folder-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: موارد التطوير، تسويق، إلهام..."
              maxLength={40}
              autoFocus
              className="h-11 w-full rounded-xl border border-[#CFD9DE] bg-white px-3.5 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
            />
          </div>

          <div>
            <label
              htmlFor="folder-desc-input"
              className="mb-1.5 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]"
            >
              وصف مختصر (اختياري)
            </label>
            <input
              id="folder-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما نوع المنشورات المحفوظة هنا؟"
              maxLength={120}
              className="h-11 w-full rounded-xl border border-[#CFD9DE] bg-white px-3.5 text-sm text-[#0F1419] focus:border-[#1D9BF0] focus:outline-none dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
              اللون المميز
            </span>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => {
                const style = FOLDER_COLOR_STYLES[c];
                const selected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={style.label}
                    aria-pressed={selected}
                    className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-[#0F1419] bg-[#F7F9F9] text-[#0F1419] dark:border-[#E7E9EA] dark:bg-white/10 dark:text-[#E7E9EA]'
                        : 'border-[#EFF3F4] text-[#536471] hover:border-[#CFD9DE] dark:border-[#2F3336] dark:text-[#71767B]'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${style.dot}`} />
                    <span>{style.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
              الأيقونة
            </span>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((item) => {
                const selected = icon === item.id;
                const style = FOLDER_COLOR_STYLES[color];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    aria-pressed={selected}
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-medium transition-colors ${
                      selected
                        ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-[#0F1419] dark:text-[#E7E9EA]'
                        : 'border-[#EFF3F4] text-[#536471] hover:border-[#CFD9DE] dark:border-[#2F3336] dark:text-[#71767B]'
                    }`}
                  >
                    <span className={selected ? style.text : ''}>
                      <FolderIcon icon={item.id} className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#EFF3F4] pt-4 dark:border-[#2F3336]">
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
              className="min-h-[44px] rounded-xl bg-[#0F1419] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:bg-[#E7E9EA] dark:text-[#0F1419]"
            >
              {submitting
                ? 'جاري الحفظ...'
                : editingFolder
                  ? 'حفظ التعديلات'
                  : 'إنشاء المجموعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteFolderModalProps {
  folder: Folder | null;
  postCount: number;
  onClose: () => void;
  onConfirm: (folderId: string, strategy: 'uncategorized' | 'delete_posts') => Promise<void>;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  folder,
  postCount,
  onClose,
  onConfirm,
}) => {
  const [strategy, setStrategy] = useState<'uncategorized' | 'delete_posts'>('uncategorized');
  const [deleting, setDeleting] = useState(false);

  if (!folder) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm(folder.id, strategy);
    setDeleting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-folder-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#EFF3F4] bg-white p-5 shadow-2xl dark:border-[#2F3336] dark:bg-[#16181C]">
        <h2
          id="delete-folder-title"
          className="text-lg font-bold text-[#0F1419] dark:text-[#E7E9EA]"
        >
          حذف مجموعة «{folder.name}»
        </h2>
        <p className="mt-2 text-sm text-[#536471] dark:text-[#71767B]">
          {postCount > 0
            ? `تحتوي هذه المجموعة على ${postCount} منشورات محفوظة. كيف تريد التعامل معها؟`
            : 'هل أنت متأكد من حذف هذه المجموعة الفارغة؟'}
        </p>

        {postCount > 0 && (
          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#EFF3F4] p-3 hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:hover:bg-white/5">
              <input
                type="radio"
                name="delete-strategy"
                checked={strategy === 'uncategorized'}
                onChange={() => setStrategy('uncategorized')}
                className="mt-1 accent-[#1D9BF0]"
              />
              <div>
                <span className="block text-sm font-semibold text-[#0F1419] dark:text-[#E7E9EA]">
                  الاحتفاظ بالمنشورات في «غير مصنفة»
                </span>
                <span className="block text-xs text-[#536471] dark:text-[#71767B]">
                  سيتم حذف المجموعة فقط وتبقى التغريدات في «كل المحفوظات»
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#EFF3F4] p-3 hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:hover:bg-white/5">
              <input
                type="radio"
                name="delete-strategy"
                checked={strategy === 'delete_posts'}
                onChange={() => setStrategy('delete_posts')}
                className="mt-1 accent-rose-600"
              />
              <div>
                <span className="block text-sm font-semibold text-rose-600 dark:text-rose-400">
                  حذف المجموعة مع جميع منشوراتها
                </span>
                <span className="block text-xs text-[#536471] dark:text-[#71767B]">
                  سيتم حذف {postCount} منشورات نهائياً
                </span>
              </div>
            </label>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#EFF3F4] pt-4 dark:border-[#2F3336]">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium text-[#536471] hover:bg-[#F7F9F9] dark:text-[#71767B] dark:hover:bg-white/10"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="min-h-[44px] rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </button>
        </div>
      </div>
    </div>
  );
};
