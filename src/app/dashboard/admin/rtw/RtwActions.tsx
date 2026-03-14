'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyRtw, rejectRtw } from '../actions'

export function RtwActionButtons({ rtwId }: { rtwId: string }) {
  const [mode, setMode] = useState<'idle' | 'verify' | 'reject'>('idle')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  if (mode === 'verify') {
    return (
      <form action={async () => { await verifyRtw(rtwId, expiresAt || null) }} className="space-y-3 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div className="space-y-2">
          <Label htmlFor="expires">RTW Expiry Date (leave blank if indefinite)</Label>
          <Input id="expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Confirm Verify</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
        </div>
      </form>
    )
  }

  if (mode === 'reject') {
    return (
      <form action={async () => { await rejectRtw(rtwId, notes) }} className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="space-y-2">
          <Label htmlFor="notes">Rejection Reason *</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Share code invalid or expired" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="destructive">Confirm Reject</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => setMode('verify')}>Verify</Button>
      <Button size="sm" variant="outline" onClick={() => setMode('reject')}>Reject</Button>
      <Button size="sm" variant="ghost" asChild>
        <a href="https://www.gov.uk/view-right-to-work" target="_blank" rel="noopener noreferrer">
          Check gov.uk →
        </a>
      </Button>
    </div>
  )
}
