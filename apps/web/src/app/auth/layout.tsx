import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso seguro | SofLIA Academy',
  description:
    'Inicia sesión o crea tu cuenta para continuar tu experiencia en SofLIA.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
