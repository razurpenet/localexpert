import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shield, Award, GitPullRequest, Users, BarChart3, HeartPulse, Map, Heart } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard/admin',                label: 'Overview',         icon: BarChart3 },
  { href: '/dashboard/admin/rtw',            label: 'RTW Queue',        icon: Shield },
  { href: '/dashboard/admin/credentials',    label: 'Credentials',      icon: Award },
  { href: '/dashboard/admin/pipeline',       label: 'Pipeline',         icon: GitPullRequest },
  { href: '/dashboard/admin/users',          label: 'Users',            icon: Users },
  { href: '/dashboard/admin/kpis',           label: 'KPIs',             icon: BarChart3 },
  { href: '/dashboard/admin/provider-health',label: 'Provider Health',  icon: HeartPulse },
  { href: '/dashboard/admin/supply',         label: 'Supply/Demand',    icon: Map },
  { href: '/dashboard/admin/customer-health',label: 'Customer Health',  icon: Heart },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
