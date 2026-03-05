import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Briefcase, Star, MessageSquare, Image, CheckCircle2, Circle, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toggleAvailability } from './setup/actions'

export default async function ProviderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: serviceCount }, { count: portfolioCount }] = await Promise.all([
    supabase.from('profiles').select('*, provider_details(*)').eq('id', user.id).single(),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('provider_id', user.id),
    supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('provider_id', user.id),
  ])

  const details     = profile?.provider_details as Record<string, unknown> | null
  const isAvailable = Boolean(details?.is_available)

  // Profile completeness checklist
  const checks = [
    { label: 'Business profile set up', done: Boolean(details) },
    { label: 'Location added',          done: Boolean(profile?.lat && profile?.lng) },
    { label: 'At least one service',    done: (serviceCount ?? 0) > 0 },
    { label: 'Portfolio photo added',   done: (portfolioCount ?? 0) > 0 },
    { label: 'Profile photo',           done: Boolean(profile?.avatar_url) },
  ]
  const completedCount = checks.filter((c) => c.done).length
  const allDone        = completedCount === checks.length
  const pct            = Math.round((completedCount / checks.length) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {details ? 'Manage your services and requests.' : 'Complete your profile to start getting clients.'}
          </p>
        </div>

        {/* Availability toggle */}
        {details && (
          <form
            action={async () => {
              'use server'
              await toggleAvailability(!isAvailable)
            }}
          >
            <button
              type="submit"
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                isAvailable
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-border bg-white text-muted-foreground hover:border-primary/40'
              }`}
            >
              {isAvailable
                ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                : <ToggleLeft className="h-5 w-5" />
              }
              {isAvailable ? 'Available for work' : 'Set as available'}
            </button>
          </form>
        )}

        {!details && (
          <Button asChild>
            <Link href="/dashboard/provider/setup">Complete profile</Link>
          </Button>
        )}
      </div>

      {/* Profile completeness — only show when not 100% */}
      {!allDone && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Profile strength — {pct}%</CardTitle>
              <span className="text-sm text-muted-foreground">{completedCount}/{checks.length} done</span>
            </div>
            <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={c.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                    {c.label}
                  </span>
                  {!c.done && (
                    <Link
                      href={
                        c.label.includes('service') ? '/dashboard/provider/services' :
                        c.label.includes('Portfolio') ? '/dashboard/provider/portfolio' :
                        '/dashboard/provider/setup'
                      }
                      className="ml-auto text-xs text-primary hover:underline"
                    >
                      Add →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label="Rating" value={(details?.avg_rating as number | null) ? `${details?.avg_rating} / 5` : '—'} />
        <StatCard icon={<MessageSquare className="h-5 w-5 text-blue-500" />} label="Reviews" value={(details?.review_count as number) ?? 0} />
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
