export type FolderColor =
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate';

export type FolderIconId =
  | 'folder'
  | 'code'
  | 'sparkles'
  | 'book'
  | 'briefcase'
  | 'palette'
  | 'flame'
  | 'lightbulb';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: FolderColor;
  icon: FolderIconId;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkPost {
  id: string;
  url: string;
  statusId?: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  content: string;
  mediaUrl?: string;
  note?: string;
  folderId: string | null;
  savedAt: string;
  source: 'share_target' | 'manual' | 'bookmarklet' | 'seed';
}

export interface VaultState {
  folders: Folder[];
  bookmarks: BookmarkPost[];
}

export type ActiveFilter = 'all' | 'uncategorized' | string;

export type SortOption = 'newest' | 'oldest' | 'author';

export interface ParsedShareInput {
  isValidUrl: boolean;
  url: string;
  canonicalUrl: string;
  authorHandle: string;
  statusId: string;
  extractedText: string;
  title: string;
}

export interface ResolvedPostPreview {
  authorName: string;
  authorHandle: string;
  content: string;
  canonicalUrl: string;
  statusId: string;
  resolvedFromOEmbed: boolean;
}
