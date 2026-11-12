"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DialogueTypingIndicator() {
  const { t } = useTranslation("learn");

  return (
    <div className="flex justify-start gap-2">
      <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-accent/30">
        <img src="/assets/soflia-avatar/badge-idle.webp" alt="SofLIA" className="h-full w-full object-contain" />
      </div>
      <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-200/70 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("activities.dialogue.responding")}
      </div>
    </div>
  );
}
