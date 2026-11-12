"use client";

import { SofliaChatProvider, SofliaComposerPresence } from "@/core/components/SofliaAvatar/SofliaChatProvider";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DialogueFooter } from "./soflia-dialogue/DialogueFooter";
import { DialogueHeader } from "./soflia-dialogue/DialogueHeader";
import { DialogueLoadingState } from "./soflia-dialogue/DialogueLoadingState";
import { DialogueMessagesList } from "./soflia-dialogue/DialogueMessagesList";
import { getUserDisplayName, getUserInitials } from "./soflia-dialogue/dialogue-user";
import type { SofliaDialogueActivityRendererProps } from "./soflia-dialogue/dialogue.types";
import { useSofliaDialogueSession } from "./soflia-dialogue/useSofliaDialogueSession";
import styles from "../ActivitiesExperience.module.css";

export function SofliaDialogueActivityRenderer({
  activity,
  lessonId,
  onSessionUpdated,
  slug,
}: SofliaDialogueActivityRendererProps) {
  const { t } = useTranslation("learn");
  const { user } = useAuth();
  const dialogue = useSofliaDialogueSession({
    activityId: activity.activity_id,
    lessonId,
    onSessionUpdated,
    slug,
  });
  const userDisplayName = getUserDisplayName(user) || t("activities.dialogue.userLabel");
  const userInitials = getUserInitials(userDisplayName);

  if (dialogue.loading) {
    return <DialogueLoadingState />;
  }

  return (
    <SofliaChatProvider scope={`dialogue:${user?.id ?? ''}:${lessonId}:${activity.activity_id}`}
      conversationId={dialogue.session?.sessionId} turn={dialogue.session?.turnsCount}
      loading={dialogue.sending} draft={dialogue.draftMessage} error={Boolean(dialogue.error)} permission={dialogue.showInactivityPrompt}
      response={dialogue.session?.messages.filter(message => message.role === 'assistant').slice(-1)[0]}
      result={dialogue.session?.result ? { key: `${dialogue.session.sessionId}:${dialogue.session.result.activityResult}`, expression: dialogue.session.result.activityResult === 'completed' ? 'success' : 'concerned' } : undefined}>
    <div className={styles.dialogueSurface}>
      <DialogueHeader
        canPracticeAgain={dialogue.canPracticeAgain}
        canRetry={dialogue.canRetry}
        criteriaProgress={dialogue.criteriaProgress}
        scoreValue={dialogue.scoreValue}
        session={dialogue.session}
        stateLabel={dialogue.stateLabel}
        totalCriteria={dialogue.totalCriteria}
      />
      <DialogueMessagesList
        messagesEndRef={dialogue.messagesEndRef}
        sending={dialogue.sending}
        session={dialogue.session}
        userDisplayName={userDisplayName}
        userInitials={userInitials}
        userProfilePictureUrl={user?.profile_picture_url}
      />
      <SofliaComposerPresence />
      <DialogueFooter
        canPracticeAgain={dialogue.canPracticeAgain}
        canSendMessage={dialogue.canSendMessage}
        canStartNewAttempt={dialogue.canStartNewAttempt}
        draftMessage={dialogue.draftMessage}
        error={dialogue.error}
        isTerminal={dialogue.isTerminal}
        onDismissInactivityPrompt={dialogue.dismissInactivityPrompt}
        onDraftMessageChange={dialogue.setDraftMessage}
        onRestartFromInactivity={dialogue.restartFromInactivity}
        onRetrySession={dialogue.retrySession}
        onSendMessage={dialogue.sendMessage}
        sending={dialogue.sending}
        session={dialogue.session}
        showInactivityPrompt={dialogue.showInactivityPrompt}
      />
    </div>
    </SofliaChatProvider>
  );
}
