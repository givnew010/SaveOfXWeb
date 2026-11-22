import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_SEED_VAULT } from './src/data/seed';
import type { BookmarkPost, Folder, FolderColor, FolderIconId, VaultState } from './src/types/vault';
import { parseSharedPostInput, stripHtmlToText, validateFolderName } from './src/utils/bookmarks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'vault.json');

function ensureStore(): VaultState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_SEED_VAULT, null, 2), 'utf-8');
    return structuredClone(INITIAL_SEED_VAULT);
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as VaultState;
    if (Array.isArray(parsed.folders) && Array.isArray(parsed.bookmarks)) {
      return parsed;
    }
  } catch {
    // Fall back to seed if file is corrupted
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_SEED_VAULT, null, 2), 'utf-8');
  return structuredClone(INITIAL_SEED_VAULT);
}

function writeStore(state: VaultState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Read entire vault
  app.get('/api/vault', (_req, res) => {
    const state = ensureStore();
    res.json(state);
  });

  // Create folder
  app.post('/api/folders', (req, res) => {
    const state = ensureStore();
    const { name, description, color, icon } = req.body as {
      name?: string;
      description?: string;
      color?: FolderColor;
      icon?: FolderIconId;
    };

    const validation = validateFolderName(name || '', state.folders);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const now = new Date().toISOString();
    const newFolder: Folder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: validation.normalized,
      description: (description || '').trim() || undefined,
      color: color || 'sky',
      icon: icon || 'folder',
      createdAt: now,
      updatedAt: now,
    };

    state.folders.push(newFolder);
    writeStore(state);
    res.status(201).json(newFolder);
  });

  // Update folder
  app.patch('/api/folders/:id', (req, res) => {
    const state = ensureStore();
    const { id } = req.params;
    const idx = state.folders.findIndex((f) => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'المجموعة غير موجودة.' });
      return;
    }

    const { name, description, color, icon } = req.body as {
      name?: string;
      description?: string;
      color?: FolderColor;
      icon?: FolderIconId;
    };

    if (typeof name === 'string') {
      const validation = validateFolderName(name, state.folders, id);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }
      state.folders[idx].name = validation.normalized;
    }

    if (typeof description === 'string') {
      state.folders[idx].description = description.trim() || undefined;
    }
    if (color) {
      state.folders[idx].color = color;
    }
    if (icon) {
      state.folders[idx].icon = icon;
    }
    state.folders[idx].updatedAt = new Date().toISOString();

    writeStore(state);
    res.json(state.folders[idx]);
  });

  // Delete folder
  app.delete('/api/folders/:id', (req, res) => {
    const state = ensureStore();
    const { id } = req.params;
    const strategy = req.query.strategy === 'delete_posts' ? 'delete_posts' : 'uncategorized';

    const exists = state.folders.some((f) => f.id === id);
    if (!exists) {
      res.status(404).json({ error: 'المجموعة غير موجودة.' });
      return;
    }

    state.folders = state.folders.filter((f) => f.id !== id);
    if (strategy === 'delete_posts') {
      state.bookmarks = state.bookmarks.filter((b) => b.folderId !== id);
    } else {
      state.bookmarks = state.bookmarks.map((b) =>
        b.folderId === id ? { ...b, folderId: null } : b
      );
    }

    writeStore(state);
    res.json(state);
  });

  // Save bookmark (share or manual)
  app.post('/api/bookmarks', (req, res) => {
    const state = ensureStore();
    const body = req.body as Partial<BookmarkPost>;

    const parsed = parseSharedPostInput({
      url: body.url || '',
      text: body.content || '',
    });

    const targetUrl = (parsed.canonicalUrl || body.url || '').trim();
    if (!targetUrl) {
      res.status(400).json({ error: 'يرجى إدخال رابط المنشور.' });
      return;
    }

    const folderId =
      body.folderId && state.folders.some((f) => f.id === body.folderId)
        ? body.folderId
        : null;

    const handle = (body.authorHandle || parsed.authorHandle || '@x_user').trim();
    const normalizedHandle = handle.startsWith('@') ? handle : `@${handle}`;

    const newBookmark: BookmarkPost = {
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: targetUrl,
      statusId: body.statusId || parsed.statusId || undefined,
      authorName: (body.authorName || normalizedHandle.slice(1) || 'مستخدم X').trim(),
      authorHandle: normalizedHandle,
      authorAvatar: body.authorAvatar,
      content:
        (body.content || parsed.extractedText || '').trim() ||
        `منشور محفوظ من ${normalizedHandle} على منصة X.`,
      mediaUrl: body.mediaUrl,
      note: (body.note || '').trim() || undefined,
      folderId,
      savedAt: new Date().toISOString(),
      source: body.source || 'manual',
    };

    state.bookmarks.unshift(newBookmark);
    writeStore(state);
    res.status(201).json(newBookmark);
  });

  // Update bookmark (move folder / edit note / edit content)
  app.patch('/api/bookmarks/:id', (req, res) => {
    const state = ensureStore();
    const { id } = req.params;
    const idx = state.bookmarks.findIndex((b) => b.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'المنشور غير موجود.' });
      return;
    }

    const body = req.body as {
      folderId?: string | null;
      note?: string;
      content?: string;
    };

    if ('folderId' in body) {
      if (body.folderId === null || body.folderId === 'uncategorized') {
        state.bookmarks[idx].folderId = null;
      } else if (typeof body.folderId === 'string' && state.folders.some((f) => f.id === body.folderId)) {
        state.bookmarks[idx].folderId = body.folderId;
      }
    }

    if (typeof body.note === 'string') {
      state.bookmarks[idx].note = body.note.trim() || undefined;
    }

    if (typeof body.content === 'string' && body.content.trim()) {
      state.bookmarks[idx].content = body.content.trim();
    }

    writeStore(state);
    res.json(state.bookmarks[idx]);
  });

  // Delete bookmark
  app.delete('/api/bookmarks/:id', (req, res) => {
    const state = ensureStore();
    const { id } = req.params;
    const before = state.bookmarks.length;
    state.bookmarks = state.bookmarks.filter((b) => b.id !== id);
    if (state.bookmarks.length === before) {
      res.status(404).json({ error: 'المنشور غير موجود.' });
      return;
    }
    writeStore(state);
    res.json({ ok: true });
  });

  // Resolve public X/Twitter post metadata via oEmbed
  app.post('/api/resolve-post', async (req, res) => {
    const { url, text, title } = req.body as {
      url?: string;
      text?: string;
      title?: string;
    };

    const parsed = parseSharedPostInput({ url, text, title });
    if (!parsed.isValidUrl) {
      res.status(400).json({ error: 'رابط X غير صالح. يرجى التأكد من صيغة الرابط.' });
      return;
    }

    const fallbackHandle = parsed.authorHandle || '@x_user';
    const fallbackAuthor = fallbackHandle.slice(1);
    const fallbackContent =
      parsed.extractedText ||
      (title && !title.toLowerCase().includes('post on x') ? title : '') ||
      '';

    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        parsed.canonicalUrl
      )}&omit_script=true`;
      const response = await fetch(oembedUrl, {
        signal: AbortSignal.timeout(3500),
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as {
          author_name?: string;
          author_url?: string;
          html?: string;
        };
        const extractedOEmbedText = stripHtmlToText(data.html || '');
        let handle = fallbackHandle;
        if (data.author_url) {
          const m = data.author_url.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/i);
          if (m && m[1]) handle = `@${m[1]}`;
        }

        res.json({
          authorName: data.author_name || fallbackAuthor,
          authorHandle: handle,
          content: extractedOEmbedText || fallbackContent,
          canonicalUrl: parsed.canonicalUrl,
          statusId: parsed.statusId,
          resolvedFromOEmbed: Boolean(extractedOEmbedText),
        });
        return;
      }
    } catch {
      // Graceful fallback when offline or blocked
    }

    res.json({
      authorName: fallbackAuthor,
      authorHandle: fallbackHandle,
      content: fallbackContent,
      canonicalUrl: parsed.canonicalUrl,
      statusId: parsed.statusId,
      resolvedFromOEmbed: false,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

createApp();
