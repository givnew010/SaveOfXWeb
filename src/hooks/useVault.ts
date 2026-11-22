import { useCallback, useEffect, useState } from 'react';
import { INITIAL_SEED_VAULT } from '../data/seed';
import type {
  BookmarkPost,
  Folder,
  FolderColor,
  FolderIconId,
  VaultState,
} from '../types/vault';
import { validateFolderName } from '../utils/bookmarks';

const CACHE_KEY = 'x_vault_cache_v1';

function readCachedVault(): VaultState {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VaultState;
      if (Array.isArray(parsed.folders) && Array.isArray(parsed.bookmarks)) {
        return parsed;
      }
    }
  } catch {
    // ignore storage failures
  }
  return INITIAL_SEED_VAULT;
}

function writeCachedVault(state: VaultState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

export function useVault() {
  const [vault, setVault] = useState<VaultState>(() => readCachedVault());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault');
      if (!res.ok) throw new Error('تعذر تحميل المحفوظات من الخادم.');
      const data = (await res.json()) as VaultState;
      setVault(data);
      writeCachedVault(data);
    } catch {
      const cached = readCachedVault();
      setVault(cached);
      setError('يتم استخدام النسخة المحلية المحفوظة مؤقتاً.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFolder = useCallback(
    async (input: {
      name: string;
      description?: string;
      color: FolderColor;
      icon: FolderIconId;
    }): Promise<{ ok: true; folder: Folder } | { ok: false; error: string }> => {
      const check = validateFolderName(input.name, vault.folders);
      if (!check.valid) {
        return { ok: false, error: check.error || 'اسم غير صالح' };
      }

      try {
        const res = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'فشل إنشاء المجموعة.' };
        }
        setVault((prev) => {
          const next = { ...prev, folders: [...prev.folders, data as Folder] };
          writeCachedVault(next);
          return next;
        });
        return { ok: true, folder: data as Folder };
      } catch {
        const now = new Date().toISOString();
        const localFolder: Folder = {
          id: `folder-${Date.now()}`,
          name: check.normalized,
          description: input.description?.trim() || undefined,
          color: input.color,
          icon: input.icon,
          createdAt: now,
          updatedAt: now,
        };
        setVault((prev) => {
          const next = { ...prev, folders: [...prev.folders, localFolder] };
          writeCachedVault(next);
          return next;
        });
        return { ok: true, folder: localFolder };
      }
    },
    [vault.folders]
  );

  const updateFolder = useCallback(
    async (
      id: string,
      input: {
        name: string;
        description?: string;
        color: FolderColor;
        icon: FolderIconId;
      }
    ): Promise<{ ok: true; folder: Folder } | { ok: false; error: string }> => {
      const check = validateFolderName(input.name, vault.folders, id);
      if (!check.valid) {
        return { ok: false, error: check.error || 'اسم غير صالح' };
      }

      try {
        const res = await fetch(`/api/folders/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'فشل تعديل المجموعة.' };
        }
        setVault((prev) => {
          const next = {
            ...prev,
            folders: prev.folders.map((f) => (f.id === id ? (data as Folder) : f)),
          };
          writeCachedVault(next);
          return next;
        });
        return { ok: true, folder: data as Folder };
      } catch {
        const updated: Folder = {
          ...(vault.folders.find((f) => f.id === id)!),
          name: check.normalized,
          description: input.description?.trim() || undefined,
          color: input.color,
          icon: input.icon,
          updatedAt: new Date().toISOString(),
        };
        setVault((prev) => {
          const next = {
            ...prev,
            folders: prev.folders.map((f) => (f.id === id ? updated : f)),
          };
          writeCachedVault(next);
          return next;
        });
        return { ok: true, folder: updated };
      }
    },
    [vault.folders]
  );

  const deleteFolder = useCallback(
    async (id: string, strategy: 'uncategorized' | 'delete_posts') => {
      try {
        const res = await fetch(
          `/api/folders/${encodeURIComponent(id)}?strategy=${strategy}`,
          { method: 'DELETE' }
        );
        if (res.ok) {
          const data = (await res.json()) as VaultState;
          setVault(data);
          writeCachedVault(data);
          return;
        }
      } catch {
        // offline fallback below
      }

      setVault((prev) => {
        const folders = prev.folders.filter((f) => f.id !== id);
        const bookmarks =
          strategy === 'delete_posts'
            ? prev.bookmarks.filter((b) => b.folderId !== id)
            : prev.bookmarks.map((b) => (b.folderId === id ? { ...b, folderId: null } : b));
        const next = { folders, bookmarks };
        writeCachedVault(next);
        return next;
      });
    },
    []
  );

  const saveBookmark = useCallback(
    async (input: {
      url: string;
      statusId?: string;
      authorName: string;
      authorHandle: string;
      content: string;
      note?: string;
      folderId: string | null;
      source: BookmarkPost['source'];
    }): Promise<{ ok: true; bookmark: BookmarkPost } | { ok: false; error: string }> => {
      try {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'تعذر حفظ المنشور.' };
        }
        setVault((prev) => {
          const next = { ...prev, bookmarks: [data as BookmarkPost, ...prev.bookmarks] };
          writeCachedVault(next);
          return next;
        });
        return { ok: true, bookmark: data as BookmarkPost };
      } catch {
        const localBookmark: BookmarkPost = {
          id: `bm-${Date.now()}`,
          url: input.url,
          statusId: input.statusId,
          authorName: input.authorName,
          authorHandle: input.authorHandle,
          content: input.content,
          note: input.note?.trim() || undefined,
          folderId: input.folderId,
          savedAt: new Date().toISOString(),
          source: input.source,
        };
        setVault((prev) => {
          const next = { ...prev, bookmarks: [localBookmark, ...prev.bookmarks] };
          writeCachedVault(next);
          return next;
        });
        return { ok: true, bookmark: localBookmark };
      }
    },
    []
  );

  const updateBookmark = useCallback(
    async (
      id: string,
      patch: { folderId?: string | null; note?: string; content?: string }
    ) => {
      setVault((prev) => {
        const next = {
          ...prev,
          bookmarks: prev.bookmarks.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...('folderId' in patch ? { folderId: patch.folderId ?? null } : {}),
                  ...('note' in patch ? { note: patch.note?.trim() || undefined } : {}),
                  ...('content' in patch && patch.content?.trim()
                    ? { content: patch.content.trim() }
                    : {}),
                }
              : b
          ),
        };
        writeCachedVault(next);
        return next;
      });

      try {
        await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch {
        // optimistic state remains cached
      }
    },
    []
  );

  const deleteBookmark = useCallback(async (id: string) => {
    setVault((prev) => {
      const next = {
        ...prev,
        bookmarks: prev.bookmarks.filter((b) => b.id !== id),
      };
      writeCachedVault(next);
      return next;
    });

    try {
      await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // optimistic state remains cached
    }
  }, []);

  return {
    folders: vault.folders,
    bookmarks: vault.bookmarks,
    loading,
    error,
    refresh,
    createFolder,
    updateFolder,
    deleteFolder,
    saveBookmark,
    updateBookmark,
    deleteBookmark,
  };
}
