import { DESIGN_HEX_COLOR as colors } from '@/core/theme/color-tokens';
/** Tema controlado sólo en QA: los componentes productivos conservan su hook real. */
export function useBusinessPanelTheme() {
  const dark = document.documentElement.classList.contains('dark');
  return { actionColor: colors.accent, onActionColor: colors.primary,
    primary: colors.primary, accentColor: colors.accent, primaryColor: colors.primary,
    textColor: 'var(--editor-text)', subtextColor: 'var(--editor-subtext)',
    mutedTextColor: 'var(--editor-muted)', borderColor: dark ? colors.gray800 : colors.gray200,
    cardBackground: dark ? colors.gray800 : colors.white, isDarkMode: dark };
}
