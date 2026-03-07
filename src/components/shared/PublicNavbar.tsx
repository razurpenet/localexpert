import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { MapPin, Search } from 'lucide-react'

export default async function PublicNavbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary">
            <MapPin className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Hand<span className="text-primary">by</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Browse
          </Link>
          <Link
            href="/search?category=plumbing"
            className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/signup?role=provider"
            className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            For Providers
          </Link>
          <Link
            href="/#how-it-works"
            className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            How it works
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Button asChild size="sm"><Link href="/dashboard">Dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link href="/signup">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
