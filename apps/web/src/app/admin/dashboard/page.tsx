import { Metadata } from 'next'
import { AdminDashboard } from '@/features/admin/components/AdminDashboard'

export const metadata: Metadata = {
  title: 'Panel de Administración | SofLIA Academy',
  description: 'Panel de administración para gestionar talleres, comunidades, prompts, apps de IA, noticias y usuarios.',
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
