import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ResetPasswordForm } from '../../../features/auth/components/ResetPasswordForm';
import {
  AuthExperience,
  authExperienceStyles,
} from '@/features/auth/components/AuthExperience';

export const metadata = {
  title: 'Restablecer contraseña | SofLIA Academy',
  description: 'Crea una nueva contraseña segura para tu cuenta',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <ResetPasswordForm />
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
