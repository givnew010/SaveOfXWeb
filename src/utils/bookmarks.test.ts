import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractXUrlDetails,
  parseSharedPostInput,
  stripHtmlToText,
  validateFolderName,
  getFolderCounts,
  filterAndSortBookmarks,
} from './bookmarks';
import type { BookmarkPost, Folder } from '../types/vault';

const sampleFolders: Folder[] = [
  {
    id: 'f-tech',
    name: 'هندسة البرمجيات',
    color: 'sky',
    icon: 'code',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'f-design',
    name: 'تصميم المنتجات',
    color: 'violet',
    icon: 'palette',
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
  },
];

const sampleBookmarks: BookmarkPost[] = [
  {
    id: 'b-1',
    url: 'https://x.com/tariq_dev/status/18500001',
    statusId: '18500001',
    authorName: 'طارق المنصور',
    authorHandle: '@tariq_dev',
    content: 'أفضل طريقة لتقليل تعقيد الواجهات هي فصل منطق الحالة عن العرض.',
    note: 'مهم لمشروع لوحة التحكم',
    folderId: 'f-tech',
    savedAt: '2026-11-18T12:00:00Z',
    source: 'seed',
  },
  {
    id: 'b-2',
    url: 'https://x.com/noura_ux/status/18500002',
    statusId: '18500002',
    authorName: 'نورة العتيبي',
    authorHandle: '@noura_ux',
    content: 'التباين اللوني والخطوط العربية المقروءة هما أساس تجربة المستخدم.',
    folderId: 'f-design',
    savedAt: '2026-11-19T09:00:00Z',
    source: 'seed',
  },
  {
    id: 'b-3',
    url: 'https://x.com/omar_ai/status/18500003',
    statusId: '18500003',
    authorName: 'عمر السالم',
    authorHandle: '@omar_ai',
    content: 'ملخص لأحدث أبحاث النماذج اللغوية الصغيرة.',
    folderId: null,
    savedAt: '2026-11-17T08:00:00Z',
    source: 'manual',
  },
];

test('extractXUrlDetails parses x.com and twitter.com links and strips tracking params', () => {
  const res1 = extractXUrlDetails('https://x.com/karpathy/status/1850000000000000001?s=20&t=abc');
  assert.equal(res1.isValidUrl, true);
  assert.equal(res1.authorHandle, '@karpathy');
  assert.equal(res1.statusId, '1850000000000000001');
  assert.equal(res1.canonicalUrl, 'https://x.com/karpathy/status/1850000000000000001');

  const res2 = extractXUrlDetails('https://mobile.twitter.com/vercel/status/9988776655');
  assert.equal(res2.isValidUrl, true);
  assert.equal(res2.authorHandle, '@vercel');
  assert.equal(res2.canonicalUrl, 'https://x.com/vercel/status/9988776655');

  const res3 = extractXUrlDetails('https://example.com/article/123');
  assert.equal(res3.isValidUrl, false);
});

test('parseSharedPostInput extracts X URL embedded inside mobile share text', () => {
  const parsed = parseSharedPostInput({
    text: 'تغريدة رائعة عن الأداء https://x.com/dan_abramov/status/1234567890?s=46',
    title: 'Post on X',
  });
  assert.equal(parsed.isValidUrl, true);
  assert.equal(parsed.authorHandle, '@dan_abramov');
  assert.equal(parsed.statusId, '1234567890');
  assert.equal(parsed.canonicalUrl, 'https://x.com/dan_abramov/status/1234567890');
  assert.equal(parsed.extractedText, 'تغريدة رائعة عن الأداء');
});

test('stripHtmlToText extracts clean tweet prose from Twitter oEmbed HTML', () => {
  const html =
    '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Hello &amp; welcome!<br>Line two.</p>&mdash; User (@u)</blockquote>';
  assert.equal(stripHtmlToText(html), 'Hello & welcome!\nLine two.');
});

test('validateFolderName enforces non-empty, max length, and uniqueness', () => {
  assert.equal(validateFolderName('   ', sampleFolders).valid, false);
  assert.equal(validateFolderName('هندسة البرمجيات', sampleFolders).valid, false);
  assert.equal(validateFolderName('هندسة البرمجيات', sampleFolders, 'f-tech').valid, true);
  assert.equal(validateFolderName('أبحاث الذكاء', sampleFolders).valid, true);
});

test('getFolderCounts computes total, uncategorized, and per-folder counts accurately', () => {
  const counts = getFolderCounts(sampleFolders, sampleBookmarks);
  assert.equal(counts.total, 3);
  assert.equal(counts.uncategorized, 1);
  assert.equal(counts.byFolder['f-tech'], 1);
  assert.equal(counts.byFolder['f-design'], 1);
});

test('filterAndSortBookmarks filters by folder, search query, and sorts correctly', () => {
  const allNewest = filterAndSortBookmarks(sampleBookmarks, {
    folderId: 'all',
    query: '',
    sort: 'newest',
  });
  assert.deepEqual(
    allNewest.map((b) => b.id),
    ['b-2', 'b-1', 'b-3']
  );

  const techOnly = filterAndSortBookmarks(sampleBookmarks, {
    folderId: 'f-tech',
    query: '',
    sort: 'newest',
  });
  assert.deepEqual(
    techOnly.map((b) => b.id),
    ['b-1']
  );

  const searchNote = filterAndSortBookmarks(sampleBookmarks, {
    folderId: 'all',
    query: 'لوحة التحكم',
    sort: 'newest',
  });
  assert.deepEqual(
    searchNote.map((b) => b.id),
    ['b-1']
  );

  const uncategorized = filterAndSortBookmarks(sampleBookmarks, {
    folderId: 'uncategorized',
    query: '',
    sort: 'newest',
    validFolderIds: new Set(sampleFolders.map((f) => f.id)),
  });
  assert.deepEqual(
    uncategorized.map((b) => b.id),
    ['b-3']
  );
});
