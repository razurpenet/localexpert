'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, X } from 'lucide-react'
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

export function SearchBar({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const params = useSearchParams()

  const [q, setQ] = useState(params.get('q') ?? '')
  const [city, setCity] = useState(params.get('city') ?? '')
  const [category, setCategory] = useState(params.get('category') ?? '')

  const apply = useCallback(() => {
    const p = new URLSearchParams()
    if (q.trim())    p.set('q', q.trim())
    if (city.trim()) p.set('city', city.trim())
    if (category)    p.set('category', category)
    router.push(`/search?${p.toString()}`)
  }, [q, city, category, router])

  function clear() {
    setQ('')
    setCity('')
    setCategory('')
    router.push('/search')
  }

  const hasFilters = q || city || category

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3">
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
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          className="w-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={apply} className="shrink-0">Search</Button>

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clear} title="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
