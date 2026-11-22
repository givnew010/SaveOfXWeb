import React, { useState } from 'react';
import { Check, Copy, Download, Share2, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { buildBookmarkletHref } from '../utils/bookmarks';

interface ShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateShareTarget: () => void;
}

export const ShareGuideModal: React.FC<ShareGuideModalProps> = ({
  isOpen,
  onClose,
  onSimulateShareTarget,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const bookmarkletHref = buildBookmarkletHref(origin);

  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletHref);
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-guide-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[#EFF3F4] bg-white p-5 shadow-2xl dark:border-[#2F3336] dark:bg-[#16181C]">
        <div className="flex items-center justify-between border-b border-[#EFF3F4] pb-3.5 dark:border-[#2F3336]">
          <h2
            id="share-guide-title"
            className="text-lg font-bold text-[#0F1419] dark:text-[#E7E9EA]"
          >
            المشاركة المباشرة من منصة X وتثبيت التطبيق
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق دليل المشاركة"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#536471] hover:bg-[#F7F9F9] dark:text-[#71767B] dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* 1. PWA Web Share Target */}
          <section className="rounded-xl border border-[#EFF3F4] p-4 dark:border-[#2F3336]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D9BF0]/10 text-[#1D9BF0]">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#0F1419] dark:text-[#E7E9EA]">
                  1. المشاركة من تطبيق X على الجوال (Web Share Target)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#536471] dark:text-[#71767B]">
                  بعد تثبيت هذا التطبيق على هاتفك أو متصفحك، سيظهر <strong>«مجموعات X»</strong> داخل قائمة المشاركة في النظام. عند الضغط على مشاركة أي تغريدة من X، ستُفتح نافذة اختيار المجموعة تلقائياً.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {isInstalled ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      التطبيق مثبّت ويعمل كـ PWA
                    </span>
                  ) : isInstallable ? (
                    <button
                      type="button"
                      onClick={install}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#1D9BF0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1A8CD8]"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>تثبيت التطبيق الآن</span>
                    </button>
                  ) : isIOS ? (
                    <p className="text-xs text-[#536471] dark:text-[#71767B]">
                      على iPhone / iPad: اضغط زر <strong>المشاركة</strong> في Safari ثم اختر{' '}
                      <strong>إضافة إلى الشاشة الرئيسية</strong>.
                    </p>
                  ) : (
                    <p className="text-xs text-[#536471] dark:text-[#71767B]">
                      يمكنك تثبيت التطبيق من شريط العنوان في Chrome أو Edge عبر أيقونة التثبيت.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSimulateShareTarget();
                    }}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CFD9DE] px-3.5 py-2 text-xs font-semibold text-[#0F1419] hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-white/5"
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#1D9BF0]" aria-hidden="true" />
                    <span>اختبار استقبال مشاركة (/share)</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Desktop Bookmarklet */}
          <section className="rounded-xl border border-[#EFF3F4] p-4 dark:border-[#2F3336]">
            <h3 className="text-sm font-bold text-[#0F1419] dark:text-[#E7E9EA]">
              2. الحفظ السريع من متصفح سطح المكتب (Bookmarklet)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#536471] dark:text-[#71767B]">
              اسحب الزر التالي إلى شريط المفضلة في متصفحك، أو انسخ الكود وأضفه كإشارة مرجعية. عند تصفح أي منشور على <span className="font-mono-ltr">x.com</span> واضغطك عليه، سيفتح لك نافذة الحفظ مباشرة مع تعبئة الرابط تلقائياً.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <a
                href={bookmarkletHref}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex min-h-[40px] cursor-grab items-center gap-2 rounded-xl bg-[#0F1419] px-4 py-2 text-xs font-semibold text-white dark:bg-[#E7E9EA] dark:text-[#0F1419]"
              >
                حفظ في مجموعات X
              </a>
              <button
                type="button"
                onClick={handleCopyBookmarklet}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CFD9DE] px-3.5 py-2 text-xs font-medium text-[#0F1419] hover:bg-[#F7F9F9] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-white/5"
              >
                {copiedBookmarklet ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span>تم نسخ الكود</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>نسخ كود الاختصار</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-[#F7F9F9] px-5 py-2 text-sm font-semibold text-[#0F1419] hover:bg-[#EFF3F4] dark:bg-[#202327] dark:text-[#E7E9EA] dark:hover:bg-[#2F3336]"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
