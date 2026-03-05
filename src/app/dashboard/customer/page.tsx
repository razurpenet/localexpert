import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search, MessageSquare, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

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
      <div className="rounded-2xl bg-primary p-8 text-primary-foreground text-center space-y-4">
        <h2 className="text-xl font-bold">What do you need help with?</h2>
        <p className="text-primary-foreground/80 text-sm">
          Browse hundreds of verified local professionals.
        </p>
        <Button asChild variant="secondary" size="lg">
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            Find a professional
          </Link>
        </Button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/customer/requests" className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md transition-shadow">
          <MessageSquare className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">My Requests</p>
            <p className="text-sm text-muted-foreground mt-0.5">Track your quote requests and bookings</p>
          </div>
        </Link>

        <Link href="/search" className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 hover:shadow-md transition-shadow">
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
