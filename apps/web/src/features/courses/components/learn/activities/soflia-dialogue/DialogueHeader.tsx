"use client";

import { SofliaChatProfile } from "@/core/components/SofliaAvatar/SofliaChatProvider";
import { AlertCircle, CheckCircle2, Gauge, MessageSquareText, Sparkles, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getStateTone } from "./dialogue-state";
import type { DialogueSession } from "./dialogue.types";
import { DialogueMetricBar } from "./DialogueMetricBar";

interface DialogueHeaderProps {
  canPracticeAgain: boolean;
  canRetry: boolean;
  criteriaProgress: number;
  scoreValue: number;
  session: DialogueSession | null;
  stateLabel: string;
  totalCriteria: number;
}

/**
 * Cabecera minimalista de la conversación guiada: una sola fila slim con el estado,
 * las interacciones y las barras de Criterios/Puntaje. Sin título/subtítulo ni caja
 * propia para evitar el "card dentro de card" y dejar el diseño limpio.
 */
export function DialogueHeader({
  canPracticeAgain,
  canRetry,
  criteriaProgress,
  scoreValue,
  session,
  stateLabel,
  totalCriteria,
}: DialogueHeaderProps) {
  const { t } = useTranslation("learn");

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-gray-200/70 bg-white/45 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]">
      <SofliaChatProfile />
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${getStateTone(session?.state)}`}>
        {canPracticeAgain ? <CheckCircle2 className="h-3.5 w-3.5" /> : canRetry ? <AlertCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
        {stateLabel}
      </span>
      <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-white/40">
        <MessageSquareText className="h-3 w-3" />
        {session?.turnsCount || 0} {t("activities.dialogue.metrics.turns")}
      </span>

      <div className="ml-auto flex min-w-[220px] flex-1 items-center gap-5">
        <div className="flex-1">
          <DialogueMetricBar
            icon={<Target className="h-3.5 w-3.5" />}
            label={t("activities.dialogue.metrics.criteria")}
            progress={criteriaProgress}
            valueText={`${session?.criteriaMet.length || 0}/${totalCriteria || 0}`}
          />
        </div>
        <div className="flex-1">
          <DialogueMetricBar
            icon={<Gauge className="h-3.5 w-3.5" />}
            label={t("activities.dialogue.metrics.score")}
            progress={scoreValue}
            valueText={`${scoreValue}%`}
          />
        </div>
      </div>
    </header>
  );
}
