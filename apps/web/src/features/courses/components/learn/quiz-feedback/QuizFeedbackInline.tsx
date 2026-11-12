"use client";

import { SofliaAvatar } from "@/core/components/SofliaAvatar/SofliaAvatar";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

type QuizFeedbackInlineProps = {
  content: string | null;
  error: string | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

export function QuizFeedbackInline({
  content,
  error,
  isLoading,
  isOpen,
  onClose,
  onRetry,
}: QuizFeedbackInlineProps) {
  const { t } = useTranslation("learn");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center">
                <SofliaAvatar state={isLoading ? "thinking" : error ? "concerned" : "acknowledging"} />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {t("activities.quizFeedback.title")}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label={t("activities.quizFeedback.close")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>

          <div className="px-4 py-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-6">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)', color: 'var(--learn-accent)' }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("activities.quizFeedback.loadingTitle")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    {t("activities.quizFeedback.loadingDescription")}
                  </p>
                </div>
              </div>
            )}

            {!isLoading && error && (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 w-full">
                  {error}
                </div>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("activities.quizFeedback.retry")}
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && content && (
              <div className="max-h-[min(60vh,560px)] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-3 break-words last:mb-0">{children}</p>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
