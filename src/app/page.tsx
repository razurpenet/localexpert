import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Search, Star, Shield, Zap, MapPin } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .order('name')
    .limit(8)

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary">
              <MapPin className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Local<span className="text-primary">Expert</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild><Link href="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
                <Button asChild><Link href="/signup">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-slate-50 py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Find trusted local<br />professionals
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with verified handymen, caterers, cleaners, and more — all in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/search">
                <Search className="h-4 w-4 mr-2" />
                Find a professional
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup?role=provider">List your services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-center">Browse by category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/search?category=${c.slug}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-slate-50 p-5 text-center hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <span className="text-2xl">
                    {CATEGORY_EMOJI[c.slug] ?? '🔧'}
                  </span>
                  <span className="text-sm font-medium">{c.name}</span>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Button asChild variant="ghost">
                <Link href="/search">View all categories →</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Trust signals */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Why LocalExpert?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="font-semibold">Verified providers</p>
              <p className="text-sm text-muted-foreground">
                Every professional completes a profile review before appearing in search results.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="font-semibold">Honest reviews</p>
              <p className="text-sm text-muted-foreground">
                Reviews are only submitted after a job is completed — no fake ratings.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="font-semibold">Fast responses</p>
              <p className="text-sm text-muted-foreground">
                Send a quote request in seconds. Most providers respond within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LocalExpert. All rights reserved.
      </footer>
    </div>
  )
}

const CATEGORY_EMOJI: Record<string, string> = {
  'plumbing':        '🔧',
  'electrical':      '⚡',
  'cleaning':        '✨',
  'catering':        '🍽️',
  'carpentry':       '🪚',
  'painting':        '🖌️',
  'gardening':       '🌿',
  'moving-removals': '🚛',
  'beauty-wellness': '💆',
  'photography':     '📷',
  'tutoring':        '📚',
  'it-tech-support': '💻',
}
