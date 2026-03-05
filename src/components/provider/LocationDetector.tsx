'use client'

import { useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LocationDetectorProps {
  defaultPostcode?: string
  defaultLat?: number | null
  defaultLng?: number | null
}

export function LocationDetector({ defaultPostcode, defaultLat, defaultLng }: LocationDetectorProps) {
  const [postcode, setPostcode] = useState(defaultPostcode ?? '')
  const [lat, setLat]          = useState<number | null>(defaultLat ?? null)
  const [lng, setLng]          = useState<number | null>(defaultLng ?? null)
  const [status, setStatus]    = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [error, setError]      = useState<string | null>(null)
  const postcodeRef            = useRef<HTMLInputElement>(null)

  async function geocodePostcode(pc: string) {
    const clean = pc.trim().toUpperCase().replace(/\s+/g, '')
    if (!clean) return
    setStatus('loading')
    setError(null)
    try {
      const res  = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`)
      const json = await res.json()
      if (json.status === 200) {
        setLat(json.result.latitude)
        setLng(json.result.longitude)
        setPostcode(json.result.postcode)
        setStatus('ok')
      } else {
        setError('Postcode not found — please check and try again.')
        setStatus('error')
      }
    } catch {
      setError('Could not look up postcode. Check your connection.')
      setStatus('error')
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setStatus('loading')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res  = await fetch(
            `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`
          )
          const json = await res.json()
          if (json.status === 200 && json.result?.[0]) {
            const r = json.result[0]
            setLat(r.latitude)
            setLng(r.longitude)
            setPostcode(r.postcode)
            setStatus('ok')
          } else {
            // Keep coords even if reverse geocode fails
            setLat(latitude)
            setLng(longitude)
            setStatus('ok')
          }
        } catch {
          setLat(latitude)
          setLng(longitude)
          setStatus('ok')
        }
      },
      () => {
        setError('Location access denied. Enter your postcode manually.')
        setStatus('error')
      }
    )
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="postcode">Service area postcode</Label>
      <div className="flex gap-2">
        <Input
          ref={postcodeRef}
          id="postcode"
          name="postcode"
          placeholder="e.g. SW1A 1AA"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          onBlur={() => postcode.trim() && geocodePostcode(postcode)}
          className="uppercase"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={detectLocation}
          disabled={status === 'loading'}
          title="Detect my location"
        >
          {status === 'loading'
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <MapPin className="h-4 w-4" />
          }
        </Button>
      </div>

      {/* Hidden fields carry the geocoded values into the server action */}
      <input type="hidden" name="lat" value={lat ?? ''} />
      <input type="hidden" name="lng" value={lng ?? ''} />

      {status === 'ok' && lat && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Location set — customers near {postcode} will find you first
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
