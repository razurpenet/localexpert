import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Star, Clock, Globe, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuoteRequestForm } from '@/components/provider/QuoteRequestForm'
import { cn } from '@/lib/utils'

interface ProviderPageProps {
  params: Promise<{ id: string }>
}

export default async function ProviderProfilePage({ params }: ProviderPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user to determine if quote form should show
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const [
    { data: profile },
    { data: services },
    { data: portfolio },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, provider_details(*)')
      .eq('id', id)
      .eq('role', 'provider')
      .single(),
    supabase
      .from('services')
      .select('*, categories(name)')
      .eq('provider_id', id)
      .eq('is_active', true)
      .order('created_at'),
    supabase
      .from('portfolio_items')
      .select('*')
      .eq('provider_id', id)
      .order('created_at', { ascending: false })
      .limit(9),
    supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('provider_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!profile) notFound()

  const details = profile.provider_details as {
    business_name: string
    is_available: boolean
    years_exp: number | null
    website_url: string | null
    avg_rating: number
    review_count: number
  } | null

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-border p-6 flex flex-col sm:flex-row gap-6">
          <Image
            src={profile.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=e2e8f0&color=475569&size=96`}
            alt={profile.full_name}
            width={96}
            height={96}
            className="rounded-full object-cover shrink-0"
          />

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{details?.business_name ?? profile.full_name}</h1>
                <span className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                  details?.is_available
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', details?.is_available ? 'bg-emerald-500' : 'bg-slate-400')} />
                  {details?.is_available ? 'Available now' : 'Unavailable'}
                </span>
              </div>
              <p className="text-muted-foreground">{profile.full_name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {profile.city}
                </span>
              )}
              {details?.years_exp && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {details.years_exp} years experience
                </span>
              )}
              {details?.avg_rating ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <strong className="text-foreground">{Number(details.avg_rating).toFixed(1)}</strong>
                  <span>({details.review_count} reviews)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-muted-foreground" /> No reviews yet
                </span>
              )}
              {details?.website_url && (
                <a href={details.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Services */}
        {services && services.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{s.title}</p>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {(s.categories as { name: string } | null)?.name}
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  {s.price_from && (
                    <p className="text-sm font-medium text-primary">
                      From £{s.price_from}{s.price_type === 'hourly' ? '/hr' : ''}
                    </p>
                  )}
                  {s.price_type === 'quote' && (
                    <p className="text-sm font-medium text-primary">Price on request</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {portfolio && portfolio.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolio.map((item) => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-slate-100">
                  <Image
                    src={item.image_url}
                    alt={item.caption ?? 'Portfolio photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Reviews</h2>
            <div className="space-y-3">
              {reviews.map((r) => {
                const reviewer = r.profiles as { full_name: string; avatar_url: string | null } | null
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn('h-4 w-4', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                    <p className="text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      {reviewer?.full_name ?? 'Verified customer'}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Quote Request */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request a quote</CardTitle>
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-muted-foreground">Sign in to contact this provider</p>
                <Button asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            ) : currentProfile?.role === 'provider' ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Switch to a customer account to send quote requests.
              </p>
            ) : (
              <QuoteRequestForm
                providerId={id}
                services={(services ?? []).map((s) => ({ id: s.id, title: s.title }))}
              />
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
