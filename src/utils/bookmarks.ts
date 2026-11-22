import type { BookmarkPost, Folder, FolderColor, SortOption } from '../types/vault';

const X_HOST_REGEX = /^(?:www\.|mobile\.)?(?:x\.com|twitter\.com|fxtwitter\.com|vxtwitter\.com)$/i;
const URL_IN_TEXT_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function stripHtmlToText(html: string): string {
  if (!html) return '';
  // Try to isolate the first <p>...</p> inside Twitter oEmbed blockquote
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const target = pMatch ? pMatch[1] : html;
  const withBreaks = target.replace(/<br\s*\/?>/gi, '\n');
  const withoutTags = withBreaks.replace(/<[^>]+>/g, '');
  return decodeHtmlEntities(withoutTags).replace(/\s+\n/g, '\n').trim();
}

export function extractXUrlDetails(rawUrl: string): {
  isValidUrl: boolean;
  canonicalUrl: string;
  authorHandle: string;
  statusId: string;
} {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { isValidUrl: false, canonicalUrl: '', authorHandle: '', statusId: '' };
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate) && /^(?:x\.com|twitter\.com)/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!X_HOST_REGEX.test(parsed.hostname)) {
      return { isValidUrl: false, canonicalUrl: '', authorHandle: '', statusId: '' };
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    // Expected: /:handle/status/:id  OR /i/status/:id  OR /:handle
    let authorHandle = '';
    let statusId = '';

    const statusIdx = segments.findIndex((seg) => seg.toLowerCase() === 'status');
    if (statusIdx > 0 && segments[statusIdx + 1]) {
      const rawHandle = segments[statusIdx - 1];
      statusId = segments[statusIdx + 1].replace(/[^0-9]/g, '');
      if (rawHandle && rawHandle !== 'i') {
        authorHandle = `@${rawHandle.replace(/^@/, '')}`;
      }
    } else if (segments.length >= 1 && !['home', 'explore', 'search', 'i', 'intent'].includes(segments[0].toLowerCase())) {
      authorHandle = `@${segments[0].replace(/^@/, '')}`;
    }

    const cleanPath =
      statusId && authorHandle
        ? `/${authorHandle.slice(1)}/status/${statusId}`
        : statusId
          ? `/i/status/${statusId}`
          : parsed.pathname;

    const canonicalUrl = `https://x.com${cleanPath}`;

    return {
      isValidUrl: Boolean(statusId || authorHandle),
      canonicalUrl,
      authorHandle,
      statusId,
    };
  } catch {
    return { isValidUrl: false, canonicalUrl: '', authorHandle: '', statusId: '' };
  }
}

export function parseSharedPostInput(params: {
  url?: string;
  text?: string;
  title?: string;
}): {
  isValidUrl: boolean;
  url: string;
  canonicalUrl: string;
  authorHandle: string;
  statusId: string;
  extractedText: string;
  title: string;
} {
  const rawUrl = (params.url || '').trim();
  const rawText = (params.text || '').trim();
  const rawTitle = (params.title || '').trim();

  let foundUrl = rawUrl;
  let cleanedText = rawText;

  if (!foundUrl && rawText) {
    const matches = rawText.match(URL_IN_TEXT_REGEX);
    if (matches && matches.length > 0) {
      const xCandidate = matches.find((m) => extractXUrlDetails(m).isValidUrl) || matches[0];
      foundUrl = xCandidate;
    }
  }

  if (foundUrl && cleanedText.includes(foundUrl)) {
    cleanedText = cleanedText.replace(foundUrl, '').trim();
  }

  // Also strip any trailing x.com URL from text if rawUrl had no tracking params but text did
  cleanedText = cleanedText
    .replace(URL_IN_TEXT_REGEX, (match) => (extractXUrlDetails(match).isValidUrl ? '' : match))
    .replace(/\s{2,}/g, ' ')
    .trim();

  const details = extractXUrlDetails(foundUrl);

  return {
    isValidUrl: details.isValidUrl,
    url: foundUrl,
    canonicalUrl: details.canonicalUrl || foundUrl,
    authorHandle: details.authorHandle,
    statusId: details.statusId,
    extractedText: cleanedText,
    title: rawTitle,
  };
}

export function validateFolderName(
  name: string,
  existingFolders: Folder[],
  excludeFolderId?: string
): { valid: boolean; error?: string; normalized: string } {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { valid: false, error: 'يرجى إدخال اسم المجموعة.', normalized };
  }
  if (normalized.length > 40) {
    return { valid: false, error: 'اسم المجموعة يجب ألا يتجاوز 40 حرفاً.', normalized };
  }
  const duplicate = existingFolders.some(
    (f) => f.id !== excludeFolderId && f.name.trim().toLowerCase() === normalized.toLowerCase()
  );
  if (duplicate) {
    return { valid: false, error: 'توجد مجموعة بهذا الاسم بالفعل.', normalized };
  }
  return { valid: true, normalized };
}

export function getFolderCounts(
  folders: Folder[],
  bookmarks: BookmarkPost[]
): {
  total: number;
  uncategorized: number;
  byFolder: Record<string, number>;
} {
  const byFolder: Record<string, number> = {};
  for (const folder of folders) {
    byFolder[folder.id] = 0;
  }

  let uncategorized = 0;
  for (const post of bookmarks) {
    if (!post.folderId || !(post.folderId in byFolder)) {
      uncategorized += 1;
    } else {
      byFolder[post.folderId] += 1;
    }
  }

  return {
    total: bookmarks.length,
    uncategorized,
    byFolder,
  };
}

export function filterAndSortBookmarks(
  bookmarks: BookmarkPost[],
  options: {
    folderId: string;
    query: string;
    sort: SortOption;
    validFolderIds?: Set<string>;
  }
): BookmarkPost[] {
  const { folderId, query, sort, validFolderIds } = options;
  const q = query.trim().toLowerCase();

  const filtered = bookmarks.filter((post) => {
    if (folderId === 'uncategorized') {
      const isUncategorized =
        !post.folderId || (validFolderIds ? !validFolderIds.has(post.folderId) : false);
      if (!isUncategorized) return false;
    } else if (folderId !== 'all') {
      if (post.folderId !== folderId) return false;
    }

    if (!q) return true;

    return (
      post.content.toLowerCase().includes(q) ||
      post.authorName.toLowerCase().includes(q) ||
      post.authorHandle.toLowerCase().includes(q) ||
      (post.note || '').toLowerCase().includes(q) ||
      post.url.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
    }
    if (sort === 'author') {
      return a.authorName.localeCompare(b.authorName, 'ar');
    }
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  return sorted;
}

export function formatArabicDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function buildBookmarkletHref(appOrigin: string): string {
  const cleanOrigin = appOrigin.replace(/\/$/, '');
  const script = `javascript:(()=>{const u=encodeURIComponent(location.href);const t=encodeURIComponent(document.title||'');const sel=encodeURIComponent(window.getSelection?window.getSelection().toString():'');window.open('${cleanOrigin}/share?url='+u+'&title='+t+'&text='+sel,'_blank');})();`;
  return script;
}

export const FOLDER_COLOR_STYLES: Record<
  FolderColor,
  { label: string; dot: string; text: string; softBg: string }
> = {
  sky: {
    label: 'أزرق X',
    dot: 'bg-[#1D9BF0]',
    text: 'text-[#1D9BF0]',
    softBg: 'bg-[#1D9BF0]/10',
  },
  emerald: {
    label: 'أخضر',
    dot: 'bg-emerald-600 dark:bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    softBg: 'bg-emerald-500/10',
  },
  amber: {
    label: 'كهرماني',
    dot: 'bg-amber-600 dark:bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    softBg: 'bg-amber-500/10',
  },
  rose: {
    label: 'وردي',
    dot: 'bg-rose-600 dark:bg-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
    softBg: 'bg-rose-500/10',
  },
  violet: {
    label: 'بنفسجي',
    dot: 'bg-violet-600 dark:bg-violet-500',
    text: 'text-violet-700 dark:text-violet-400',
    softBg: 'bg-violet-500/10',
  },
  slate: {
    label: 'رمادي',
    dot: 'bg-slate-600 dark:bg-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
    softBg: 'bg-slate-500/10',
  },
};
