interface DialogueAvatarProps {
  role: "assistant" | "system" | "user";
  userDisplayName: string;
  userInitials: string;
  userProfilePictureUrl?: string | null;
}

export function DialogueAvatar({
  role,
  userDisplayName,
  userInitials,
  userProfilePictureUrl,
}: DialogueAvatarProps) {
  if (role !== "user") {
    return (
      <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-accent/30">
        <img src="/assets/soflia-avatar/badge-idle.webp" alt="SofLIA" className="h-full w-full object-contain" />
      </div>
    );
  }

  if (userProfilePictureUrl) {
    return <img src={userProfilePictureUrl} alt={userDisplayName} className="mt-1 h-8 w-8 flex-shrink-0 rounded-full object-contain" />;
  }

  return (
    <div
      className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--learn-accent) 15%, transparent)',
        color: 'var(--learn-accent)',
      }}
    >
      {userInitials}
    </div>
  );
}
