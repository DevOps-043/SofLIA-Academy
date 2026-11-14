"use client";

import { SofliaChatWelcome } from "@/core/components/SofliaAvatar/SofliaChatProvider";

import { useTranslation } from "react-i18next";
import type { DialogueMessagesEndRef, DialogueSession } from "./dialogue.types";
import { DialogueMessageBubble } from "./DialogueMessageBubble";
import { DialogueTypingIndicator } from "./DialogueTypingIndicator";

interface DialogueMessagesListProps {
  messagesEndRef: DialogueMessagesEndRef;
  sending: boolean;
  session: DialogueSession | null;
  userDisplayName: string;
  userInitials: string;
  userProfilePictureUrl?: string | null;
}

export function DialogueMessagesList({
  messagesEndRef,
  sending,
  session,
  userDisplayName,
  userInitials,
  userProfilePictureUrl,
}: DialogueMessagesListProps) {
  const { t } = useTranslation("learn");

  return (
    <div className="max-h-[34rem] space-y-3 overflow-y-auto px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5">
      {session?.messages.length ? (
        session.messages.map(message => (
          <DialogueMessageBubble
            key={message.id}
            message={message}
            userDisplayName={userDisplayName}
            userInitials={userInitials}
            userProfilePictureUrl={userProfilePictureUrl}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/55 px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.025]">
          <SofliaChatWelcome />
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t("activities.dialogue.emptyTitle")}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/40">{t("activities.dialogue.emptyDescription")}</p>
        </div>
      )}
      {sending && <DialogueTypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}
