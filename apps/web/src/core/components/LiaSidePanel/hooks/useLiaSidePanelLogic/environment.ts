import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLiaPanel } from '@/core/contexts/LiaPanelContext';
import { useLiaGeneralChat } from '@/core/hooks/useLiaGeneralChat';
import { useSofLIAPersonalization } from '@/core/hooks/useSofLIAPersonalization';
import { useLanguage } from '@/core/providers/I18nProvider';
import { useThemeStore } from '@/core/stores/themeStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext';
import {
  getLiaThemeColors,
  isLiaDashboardRoute,
} from '../../services/lia-side-panel-theme.service';

export function useLiaSidePanelEnvironment() {
  const { t } = useTranslation('common');
  const { isOpen, closePanel, pageContext } = useLiaPanel();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  const isLightTheme = !isDarkMode;
  const organizationStyles = useOrganizationStylesContext();
  const orgStyles = organizationStyles.effectiveStyles || organizationStyles.styles;
  const activeStyles = isLiaDashboardRoute(pathname)
    ? orgStyles?.userDashboard || orgStyles?.panel
    : orgStyles?.panel;
  const themeColors = getLiaThemeColors(isLightTheme, activeStyles);
  const chat = useLiaGeneralChat();
  const { settings: liaSettings, updateSettings: updateLiaSettings } = useSofLIAPersonalization();
  const { language } = useLanguage();
  const tips = (t('lia.tips', { returnObjects: true }) as string[]) || [];

  return {
    t,
    user,
    router,
    pageContext,
    isOpen,
    closePanel,
    isDarkMode,
    isLightTheme,
    themeColors,
    language,
    tips,
    liaSettings,
    updateLiaSettings,
    avatarTurn: chat.avatarTurn,
    avatarScope: chat.avatarScope,
    chatError: chat.error,
    messages: chat.messages,
    isLoading: chat.isLoading,
    sendMessage: chat.sendMessage,
    clearHistory: chat.clearHistory,
    loadConversation: chat.loadConversation,
    currentConversationId: chat.currentConversationId,
  };
}
