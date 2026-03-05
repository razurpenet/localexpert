import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Shield, Star, Zap } from 'lucide-react'
import { AnimatedHero } from '@/components/home/AnimatedHero'
import { AnimatedTestimonials, type Testimonial } from '@/components/shared/AnimatedTestimonials'
import PublicNavbar from '@/components/shared/PublicNavbar'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .order('name')
    .limit(8)

  // Fetch top-rated reviews with body text for the testimonials section
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select('body, rating, profiles(full_name, avatar_url, city)')
    .not('body', 'is', null)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(6)

  const testimonials: Testimonial[] = (rawReviews ?? [])
    .filter((r) => r.body && r.body.trim().length > 10)
    .map((r) => {
      const reviewer = r.profiles as unknown as { full_name: string; avatar_url: string | null; city: string | null } | null
      const name = reviewer?.full_name ?? 'Verified Customer'
      return {
        quote: r.body as string,
        name,
        designation: reviewer?.city ? `Customer in ${reviewer.city}` : 'Verified Customer',
        src: reviewer?.avatar_url
          ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e2e8f0&color=475569&size=500`,
      }
    })

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Animated Hero */}
      <AnimatedHero />

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

      {/* Animated Testimonials — shown only when real reviews exist */}
      {testimonials.length >= 2 && (
        <section className="bg-slate-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">What customers say</h2>
            <p className="text-center text-muted-foreground text-sm mb-4">
              Real reviews from verified customers
            </p>
            <AnimatedTestimonials testimonials={testimonials} autoplay />
          </div>
        </section>
      )}

      {/* Trust signals */}
      <section id="how-it-works" className="bg-slate-50 py-16 px-4">
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
  // Original 12
  'plumbing':           '🔧',
  'electrical':         '⚡',
  'cleaning':           '✨',
  'catering':           '🍽️',
  'carpentry':          '🪚',
  'painting':           '🖌️',
  'gardening':          '🌿',
  'moving-removals':    '🚛',
  'beauty-wellness':    '💆',
  'photography':        '📷',
  'tutoring':           '📚',
  'it-tech-support':    '💻',
  // New 12 — data-backed additions (March 2026)
  'locksmith':          '🔒',
  'roofing':            '🏠',
  'appliance-repair':   '🔌',
  'mobile-mechanic':    '🚗',
  'pet-care':           '🐾',
  'home-care':          '🏥',
  'childcare':          '👶',
  'personal-training':  '💪',
  'pest-control':       '🐀',
  'solar-ev':           '☀️',
  'event-planning':     '🎉',
  'driving-instruction':'🚦',
}
