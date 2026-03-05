'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MoveRight, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ['trusted', 'vetted', 'local', 'verified', 'expert'],
    []
  )

  const router = useRouter()
  const [q, setQ]           = useState('')
  const [city, setCity]     = useState('')
  const [geoState, setGeo]  = useState<'idle' | 'loading' | 'ok'>('idle')
  const [lat, setLat]       = useState('')
  const [lng, setLng]       = useState('')
  const inputRef            = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1))
    }, 2000)
    return () => clearTimeout(id)
  }, [titleNumber, titles])

  function useMyLocation() {
    if (!navigator.geolocation) return
    setGeo('loading')
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
        setGeo('ok')
      },
      () => setGeo('idle')
    )
  }

  function search() {
    const p = new URLSearchParams()
    if (q.trim())    p.set('q', q.trim())
    if (city.trim()) p.set('city', city.trim())
    if (lat && lng)  { p.set('lat', lat); p.set('lng', lng); p.set('radius', '10') }
    router.push(`/search?${p.toString()}`)
  }

  return (
    <section className="bg-slate-50 py-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-8 py-4">
          <h1 className="text-5xl sm:text-6xl max-w-2xl tracking-tighter text-center font-bold">
            <span className="text-foreground">Find a</span>
            <span className="relative flex w-full justify-center overflow-hidden text-center pb-3 pt-1">
              &nbsp;
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute text-primary font-bold"
                  initial={{ opacity: 0, y: -100 }}
                  transition={{ type: 'spring', stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
            <span className="text-foreground">professional near you</span>
          </h1>

          <p className="text-lg text-muted-foreground text-center max-w-xl">
            Connect with verified handymen, caterers, cleaners, and more — all in your area.
          </p>

          {/* Inline search */}
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-border shadow-md p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="What do you need? e.g. boiler repair"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                className="pl-9 border-0 shadow-none focus-visible:ring-0 bg-transparent"
              />
            </div>
            <div className="h-px sm:h-auto sm:w-px bg-border" />
            <div className="flex gap-2 flex-1 sm:flex-none sm:w-48 items-center">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
              <Input
                placeholder="City or postcode"
                value={city}
                onChange={(e) => { setCity(e.target.value); setLat(''); setLng(''); setGeo('idle') }}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent p-0 flex-1"
              />
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoState === 'loading'}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                title="Use my location"
              >
                {geoState === 'loading'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <MapPin className={`h-4 w-4 ${geoState === 'ok' ? 'text-primary' : ''}`} />
                }
              </button>
            </div>
            <Button onClick={search} size="default" className="shrink-0 w-full sm:w-auto">
              Search
            </Button>
          </div>

          <div className="flex gap-3">
            <Button asChild size="sm" variant="ghost" className="text-muted-foreground">
              <Link href="/signup?role=provider">
                List your services <MoveRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
