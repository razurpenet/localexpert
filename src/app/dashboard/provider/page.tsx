import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Briefcase, Star, MessageSquare, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProviderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: serviceCount }, { count: portfolioCount }] = await Promise.all([
    supabase.from('profiles').select('*, provider_details(*)').eq('id', user.id).single(),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('provider_id', user.id),
    supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('provider_id', user.id),
  ])

  const details = profile?.provider_details

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {details ? 'Manage your services and requests.' : 'Complete your profile to start getting clients.'}
          </p>
        </div>
        {!details && (
          <Button asChild>
            <Link href="/dashboard/provider/setup">Complete profile</Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label="Rating" value={details?.avg_rating ? `${details.avg_rating} / 5` : '—'} />
        <StatCard icon={<MessageSquare className="h-5 w-5 text-blue-500" />} label="Reviews" value={details?.review_count ?? 0} />
        <StatCard icon={<Briefcase className="h-5 w-5 text-green-500" />} label="Services" value={serviceCount ?? 0} />
        <StatCard icon={<Image className="h-5 w-5 text-purple-500" />} label="Portfolio" value={portfolioCount ?? 0} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink href="/dashboard/provider/services" title="My Services" description="Add or edit the services you offer" />
        <QuickLink href="/dashboard/provider/portfolio" title="Portfolio" description="Upload photos of your work" />
        <QuickLink href="/dashboard/provider/requests" title="Quote Requests" description="View and respond to customer enquiries" />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-border bg-white p-5 hover:shadow-md transition-shadow">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </Link>
  )
}
