"use client";

import { SofliaAvatar } from "@/core/components/SofliaAvatar/SofliaAvatar";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

type QuizFeedbackPanelProps = {
  content: string | null;
  error: string | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

function FeedbackBody({
  content,
  error,
  isLoading,
  onRetry,
}: Pick<
  QuizFeedbackPanelProps,
  "content" | "error" | "isLoading" | "onRetry"
>) {
  const { t } = useTranslation("learn");

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div
        className="flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)', color: 'var(--learn-accent)' }}
      >
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("activities.quizFeedback.loadingTitle")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/50">
            {t("activities.quizFeedback.loadingDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
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
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-3 last:mb-0">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-white">
                {children}
              </strong>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                {children}
              </ol>
            ),
            li: ({ children }) => <li>{children}</li>,
          }}
        >
          {content || ""}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function QuizFeedbackPanel({
  content,
  error,
  isLoading,
  isOpen,
  onClose,
  onRetry,
}: QuizFeedbackPanelProps) {
  const { t } = useTranslation("learn");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="pointer-events-none fixed bottom-3 right-3 top-20 z-[9997] flex w-[calc(100%-1.5rem)] justify-end md:bottom-4 md:right-4 md:w-[calc(100%-2rem)]"
          role="dialog"
          aria-modal="false"
          aria-labelledby="quiz-feedback-panel-title"
        >
          <motion.aside
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-auto flex h-full min-h-0 w-full max-w-[360px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-gray-900"
          >
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-white/10">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center">
                  <SofliaAvatar state={isLoading ? "thinking" : error ? "concerned" : "acknowledging"} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="quiz-feedback-panel-title"
                    className="truncate text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {t("activities.quizFeedback.title")}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    {t("activities.quizFeedback.subtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={t("activities.quizFeedback.close")}
                title={t("activities.quizFeedback.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <FeedbackBody
              content={content}
              error={error}
              isLoading={isLoading}
              onRetry={onRetry}
            />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
