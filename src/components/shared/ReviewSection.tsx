'use client'

import { useState } from 'react'
import { ReviewForm } from './ReviewForm'

export function ReviewSection({ requestId, providerId }: { requestId: string; providerId: string }) {
  const [open, setOpen]       = useState(false)
  const [done, setDone]       = useState(false)

  if (done) return <p className="text-xs text-emerald-600 font-medium">✓ Review submitted</p>

  return (
    <div className="border-t border-border pt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Leave a review →
        </button>
      ) : (
        <ReviewForm
          requestId={requestId}
          providerId={providerId}
          onSuccess={() => { setOpen(false); setDone(true) }}
        />
      )}
    </div>
  )
}
