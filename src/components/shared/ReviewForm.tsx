'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { submitReview } from '@/app/dashboard/customer/reviews/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  requestId: string
  providerId: string
  onSuccess: () => void
}

export function ReviewForm({ requestId, providerId, onSuccess }: ReviewFormProps) {
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!rating) return setError('Please select a star rating.')
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.set('rating', String(rating))
    fd.set('body', body)

    const result = await submitReview(requestId, providerId, fd)
    if (result?.error) { setError(result.error); setLoading(false); return }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      {/* Star picker */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star className={cn(
              'h-6 w-6 transition-colors',
              n <= (hovered || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            )} />
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Tell others about your experience (optional)…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  )
}
