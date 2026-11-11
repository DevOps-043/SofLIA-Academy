import Image from 'next/image';
import Link from 'next/link';
import type { TFunction } from 'i18next';

interface FooterBrandProps {
  t: TFunction<'common'>;
}

export function FooterBrand({ t }: FooterBrandProps) {
  return (
    <div className="col-span-2 md:col-span-3 lg:col-span-2">
      <Link href="/" className="group mb-6 flex items-center gap-3">
        <div className="relative h-10 w-10 lg:h-12 lg:w-12">
          <Image src="/Logo.png" alt="SofLIA Academy" fill className="object-contain brightness-0 invert" />
        </div>
        <div className="text-2xl font-bold tracking-wide text-white lg:text-3xl">
          <span>SofLIA Academy</span>
        </div>
      </Link>

      <p className="max-w-sm text-sm leading-relaxed text-white/60">
        {t(
          'landing.footer.description',
          'Plataforma de capacitacion corporativa en IA que transforma el desarrollo de talento con inteligencia artificial, planificacion inteligente y certificaciones verificables.'
        )}
      </p>
    </div>
  );
}
