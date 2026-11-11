import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ForgotPasswordForm } from '../../../features/auth/components/ForgotPasswordForm';
import {
  AuthExperience,
  authExperienceStyles,
} from '@/features/auth/components/AuthExperience';

export const metadata = {
  title: 'Recuperar contraseña | SofLIA Academy',
  description: 'Solicita un enlace para restablecer tu contraseña',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function AuthFallback() {
  return (
    <AuthExperience>
      <div className={authExperienceStyles.content}>
        <div className={authExperienceStyles.header}>
          <span className={authExperienceStyles.iconBadge}>
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </span>
        </div>
      </div>
    </AuthExperience>
  );
}
