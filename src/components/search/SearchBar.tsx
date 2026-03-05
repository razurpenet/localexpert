'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, X, MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Category {
  id: number
  name: string
  slug: string
}

const RADIUS_OPTIONS = [
  { label: '5 miles',  value: '5'  },
  { label: '10 miles', value: '10' },
  { label: '25 miles', value: '25' },
  { label: '50 miles', value: '50' },
]

const SORT_OPTIONS = [
  { label: 'Highest rated', value: 'rating'   },
  { label: 'Most reviews',  value: 'reviews'  },
  { label: 'Nearest first', value: 'distance' },
]

export function SearchBar({
  categories,
  sort: initialSort,
  available: initialAvailable,
}: {
  categories: Category[]
  sort?: string
  available?: boolean
}) {
  const router = useRouter()
  const params = useSearchParams()

  const [q,         setQ]         = useState(params.get('q')        ?? '')
  const [city,      setCity]      = useState(params.get('city')     ?? '')
  const [category,  setCategory]  = useState(params.get('category') ?? '')
  const [lat,       setLat]       = useState(params.get('lat')      ?? '')
  const [lng,       setLng]       = useState(params.get('lng')      ?? '')
  const [radius,    setRadius]    = useState(params.get('radius')   ?? '10')
  const [sort,      setSort]      = useState(initialSort             ?? 'rating')
  const [available, setAvailable] = useState(initialAvailable        ?? false)
  const [geoState,  setGeoState]  = useState<'idle' | 'loading' | 'ok'>('idle')

  const hasLocation = Boolean(lat && lng)

  const apply = useCallback(() => {
    const p = new URLSearchParams()
    if (q.trim())    p.set('q',        q.trim())
    if (city.trim()) p.set('city',     city.trim())
    if (category)    p.set('category', category)
    if (lat && lng) {
      p.set('lat',    lat)
      p.set('lng',    lng)
      p.set('radius', radius)
    }
    if (sort && sort !== 'rating') p.set('sort', sort)
    if (available) p.set('available', 'true')
    router.push(`/search?${p.toString()}`)
  }, [q, city, category, lat, lng, radius, sort, available, router])

  function clear() {
    setQ(''); setCity(''); setCategory('')
    setLat(''); setLng(''); setGeoState('idle')
    setSort('rating'); setAvailable(false)
    router.push('/search')
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setLat(String(latitude))
        setLng(String(longitude))
        try {
          const res  = await fetch(
            `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`
          )
          const json = await res.json()
          if (json.status === 200 && json.result?.[0]) {
            setCity(json.result[0].admin_district ?? json.result[0].postcode ?? '')
          }
        } catch { /* city stays blank, coords still set */ }
        setGeoState('ok')
        setSort('distance')
      },
      () => setGeoState('idle')
    )
  }

  const hasFilters = q || city || category || hasLocation || available || sort !== 'rating'

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
      {/* Row 1: keyword + city + geo button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services, e.g. boiler repair…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="City or town"
          value={city}
          onChange={(e) => { setCity(e.target.value); setLat(''); setLng(''); setGeoState('idle') }}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          className="w-40"
        />
        <Button
          type="button"
          variant={hasLocation ? 'default' : 'outline'}
          size="icon"
          onClick={useMyLocation}
          disabled={geoState === 'loading'}
          title="Use my location"
          className="shrink-0"
        >
          {geoState === 'loading'
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <MapPin className="h-4 w-4" />
          }
        </Button>
      </div>

      {/* Row 2: category + radius + sort + available now + search + clear */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="flex-1 min-w-[140px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasLocation && (
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.filter((o) => o.value !== 'distance' || hasLocation).map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => setAvailable((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors shrink-0 ${
            available
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          Available now
        </button>

        <Button onClick={apply} className="shrink-0">Search</Button>

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clear} title="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {hasLocation && (
        <p className="text-xs text-primary flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Showing providers within {radius} miles of your location
        </p>
      )}
    </div>
  )
}
