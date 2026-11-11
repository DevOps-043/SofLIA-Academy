import { MapPin } from 'lucide-react';
import type { TFunction } from 'i18next';

interface FooterBottomBarProps {
  currentYear: number;
  t: TFunction<'common'>;
}

export function FooterBottomBar({ currentYear, t }: FooterBottomBarProps) {
  return (
    <div className="border-t border-white/10">
      <div className="container mx-auto px-4 py-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>© {currentYear} SofLIA Academy</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden items-center gap-1 md:flex">
              <MapPin size={14} />
              Mexico
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-white/40 transition-colors hover:text-white/80">
              {t('landing.footer.legal.privacy', 'Privacidad')}
            </a>
            <a href="/terms" className="text-white/40 transition-colors hover:text-white/80">
              {t('landing.footer.legal.terms', 'Terminos')}
            </a>
            <a href="/contact" className="text-white/40 transition-colors hover:text-white/80">
              {t('landing.footer.legal.contact', 'Contacto')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
