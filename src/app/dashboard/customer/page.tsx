import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search, MessageSquare, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const QUICK_SEARCHES = [
  { label: 'Plumber',          q: 'plumber',       category: 'plumbing'        },
  { label: 'Electrician',      q: 'electrician',   category: 'electrical'      },
  { label: 'Cleaner',          q: 'cleaner',       category: 'cleaning'        },
  { label: 'Handyman',         q: 'handyman',      category: ''                },
  { label: 'Gardener',         q: 'gardener',      category: 'gardening'       },
  { label: 'Boiler repair',    q: 'boiler repair', category: 'plumbing'        },
  { label: 'House painter',    q: 'painter',       category: 'painting'        },
  { label: 'Personal trainer', q: '',              category: 'personal-training'},
]

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: openRequests }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', user.id)
      .in('status', ['pending', 'accepted']),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Hello, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find trusted local professionals for any job.
        </p>
      </div>

      {/* Search CTA */}
      <div className="rounded-2xl bg-primary p-8 text-primary-foreground space-y-4">
        <h2 className="text-xl font-bold">What do you need help with?</h2>
        <p className="text-primary-foreground/80 text-sm">
          Browse verified local professionals — no account needed to search.
        </p>
        <Button asChild variant="secondary" size="lg">
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            Find a professional
          </Link>
        </Button>

        {/* Quick search chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_SEARCHES.map((s) => {
            const p = new URLSearchParams()
            if (s.q) p.set('q', s.q)
            if (s.category) p.set('category', s.category)
            return (
              <Link
                key={s.label}
                href={`/search?${p.toString()}`}
                className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-medium text-white transition-colors"
              >
                {s.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/customer/requests"
          className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md transition-shadow"
        >
          <MessageSquare className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">My Requests</p>
              {(openRequests ?? 0) > 0 && (
                <Badge className="text-xs px-1.5 py-0">{openRequests} open</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Track your quote requests and bookings</p>
          </div>
        </Link>

        <Link href="/search?sort=rating" className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md transition-shadow">
          <Star className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Top Rated Providers</p>
            <p className="text-sm text-muted-foreground mt-0.5">Browse highest-rated professionals near you</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
