"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useThemeStore } from "@/core/stores/themeStore";
import { adjustColorForContrast, chooseReadableTextColor, resolveHexColor } from "@/core/theme/color-engine";
import { DESIGN_HEX_COLOR } from "@/core/theme/color-tokens";
import { useOptionalOrganizationStylesContext } from "@/features/business-panel/contexts/OrganizationStylesContext";
import { getBackgroundStyle } from "@/features/business-panel/utils/styles";
import styles from "./Live.module.css";

export function LiveTheme({ children, className }: { children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const mode = useThemeStore((state) => state.resolvedTheme);
  const isLight = mode === "light";
  const dashboard = useOptionalOrganizationStylesContext()?.effectiveStyles?.userDashboard;
  const card = resolveHexColor(dashboard?.card_background) ??
    (isLight ? DESIGN_HEX_COLOR.bgLight : DESIGN_HEX_COLOR.gray800);
  const accent = adjustColorForContrast(
    isLight
      ? dashboard?.primary_button_color ?? DESIGN_HEX_COLOR.primary
      : dashboard?.accent_color ?? DESIGN_HEX_COLOR.accent,
    card,
    5,
  );

  useEffect(() => setMounted(true), []);

  const themeStyle = mounted ? {
    ...getBackgroundStyle(dashboard),
    colorScheme: mode,
    "--live-card": card,
    "--live-accent": accent,
    "--live-on-accent": chooseReadableTextColor(accent),
  } as CSSProperties : undefined;

  return (
    <div
      className={className ? `${styles.page} ${className}` : styles.page}
      style={themeStyle}
    >
      {children}
    </div>
  );
}
