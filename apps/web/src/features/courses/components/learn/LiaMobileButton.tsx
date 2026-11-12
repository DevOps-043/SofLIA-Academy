"use client";

import { useTranslation } from "react-i18next";
import { useLiaCourse } from "../../context/LiaCourseContext";

export function LiaMobileButton() {
  const { t } = useTranslation('learn');
  const { isOpen, toggleLia, isInteractionBlocked, setLiaToastMessage } = useLiaCourse();

  return (
    <button
      onClick={isInteractionBlocked ? () => setLiaToastMessage(t('lia.warningDisabledActivities')) : toggleLia}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
        isInteractionBlocked
          ? "opacity-45 grayscale cursor-not-allowed text-gray-400 dark:text-white/40"
          : isOpen
            ? ""
            : "text-gray-500 dark:text-white/60 hover:bg-gray-200/50 dark:hover:bg-primary/30"
      }`}
      style={!isInteractionBlocked && isOpen ? {
        backgroundColor: 'color-mix(in srgb, var(--learn-accent) 15%, transparent)',
        color: 'var(--learn-accent)',
      } : undefined}
    >
      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-current">
        <img src="/assets/soflia-avatar/badge-idle.webp" alt="SofLIA" className="w-full h-full object-contain" />
      </div>
      <span className="text-xs font-medium">SofLIA</span>
      {!isInteractionBlocked && (
        <div className="absolute top-1 right-2 w-2 h-2 bg-success rounded-full border border-white dark:border-carbon-800" />
      )}
    </button>
  );
}
