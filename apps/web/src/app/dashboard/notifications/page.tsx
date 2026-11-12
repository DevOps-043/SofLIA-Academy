import { NotificationPage } from '@/features/notifications/components/NotificationPage'
import { DashboardNavbar } from '@/core/components/DashboardNavbar/DashboardNavbar'

export const metadata = {
  title: 'Notificaciones | SofLIA Academy',
  description: 'Gestiona tus notificaciones y mantente al día con tu aprendizaje.'
}

export default function NotificationsRoute() {
  return (
    <>
      <DashboardNavbar showNotificationBell={false} />
      <main>
        <NotificationPage />
      </main>
    </>
  )
}
