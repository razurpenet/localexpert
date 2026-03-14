'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyCredential, rejectCredential } from '../actions'

export function CredentialActionButtons({ credId }: { credId: string }) {
  const [mode, setMode] = useState<'idle' | 'verify' | 'reject'>('idle')
  const [notes, setNotes] = useState('')

  if (mode === 'verify') {
    return (
      <form action={async () => { await verifyCredential(credId, notes) }} className="space-y-3 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Gas Safe ID confirmed" />
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
      <form action={async () => { await rejectCredential(credId, notes) }} className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="space-y-2">
          <Label htmlFor="notes">Rejection Reason *</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Document expired or unreadable" required />
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
    </div>
  )
}
