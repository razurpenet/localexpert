import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ClipboardCheck, Award, GitPullRequest, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  const [
    { count: pendingRtw },
    { count: pendingCreds },
    { count: pendingRequests },
    { count: staleRequests },
    { count: totalProviders },
    { count: totalCustomers },
    { count: completedJobs },
    { count: activeProviders },
  ] = await Promise.all([
    admin.from('rtw_checks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('credentials').select('*', { count: 'exact', head: true }).eq('verified', false).is('reviewed_at', null),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('provider_details').select('*', { count: 'exact', head: true }).eq('is_available', true),
  ])

  const stats = [
    { label: 'Pending RTW',        value: pendingRtw ?? 0,       icon: Shield,          href: '/dashboard/admin/rtw',         alert: (pendingRtw ?? 0) > 0 },
    { label: 'Pending Credentials', value: pendingCreds ?? 0,     icon: Award,           href: '/dashboard/admin/credentials', alert: (pendingCreds ?? 0) > 0 },
    { label: 'Pending Requests',    value: pendingRequests ?? 0,  icon: GitPullRequest,  href: '/dashboard/admin/pipeline',    alert: false },
    { label: 'Stale (>24h)',        value: staleRequests ?? 0,    icon: AlertTriangle,   href: '/dashboard/admin/pipeline?filter=stale', alert: (staleRequests ?? 0) > 0 },
    { label: 'Total Providers',     value: totalProviders ?? 0,   icon: Users,           href: '/dashboard/admin/users?role=provider', alert: false },
    { label: 'Total Customers',     value: totalCustomers ?? 0,   icon: Users,           href: '/dashboard/admin/users?role=customer', alert: false },
    { label: 'Completed Jobs',      value: completedJobs ?? 0,    icon: ClipboardCheck,  href: '/dashboard/admin/pipeline?filter=completed', alert: false },
    { label: 'Active Providers',    value: activeProviders ?? 0,  icon: Users,           href: '/dashboard/admin/users?available=true', alert: false },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and action items.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={s.alert ? 'border-amber-300 bg-amber-50/50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.alert ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
