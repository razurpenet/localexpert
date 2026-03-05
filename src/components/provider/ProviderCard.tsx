import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ProviderCardData {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  provider_details: {
    business_name: string
    is_available: boolean
    avg_rating: number
    review_count: number
  } | null
  primary_category?: string | null
}

export function ProviderCard({ provider }: { provider: ProviderCardData }) {
  const details = provider.provider_details

  return (
    <Link
      href={`/providers/${provider.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        <div className="relative shrink-0">
          <Image
            src={provider.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.full_name)}&background=e2e8f0&color=475569&size=56`}
            alt={provider.full_name}
            width={56}
            height={56}
            className="rounded-full object-cover"
          />
          <span
            aria-label={details?.is_available ? 'Available' : 'Unavailable'}
            className={cn(
              'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-white',
              details?.is_available ? 'bg-emerald-500' : 'bg-slate-300'
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {details?.business_name ?? provider.full_name}
          </p>
          <p className="truncate text-sm text-muted-foreground">{provider.full_name}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        {provider.primary_category && (
          <Badge variant="secondary" className="text-xs">{provider.primary_category}</Badge>
        )}
        {provider.city && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {provider.city}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border px-5 py-3">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">
            {details?.avg_rating ? Number(details.avg_rating).toFixed(1) : '—'}
          </span>
          <span className="text-xs text-muted-foreground">
            ({details?.review_count ?? 0} {details?.review_count === 1 ? 'review' : 'reviews'})
          </span>
        </div>
        <span className={cn(
          'text-xs font-medium',
          details?.is_available ? 'text-emerald-600' : 'text-muted-foreground'
        )}>
          {details?.is_available ? 'Available now' : 'Unavailable'}
        </span>
      </div>
    </Link>
  )
}
