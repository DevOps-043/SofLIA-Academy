import { Metadata } from 'next'
import { AdminLayout } from '@/features/admin/components/AdminLayout'

export const metadata: Metadata = {
  title: 'Panel de Administración | SofLIA Academy',
  description: 'Panel de administración para gestionar la plataforma.',
}

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}


