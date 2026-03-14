'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { suspendUser, unsuspendUser } from '../actions'

export function UserActionButtons({ userId, isSuspended }: { userId: string; isSuspended: boolean }) {
  const [showSuspend, setShowSuspend] = useState(false)
  const [reason, setReason] = useState('')

  if (isSuspended) {
    return (
      <form action={async () => { await unsuspendUser(userId) }}>
        <Button type="submit" size="sm" variant="outline">Unsuspend</Button>
      </form>
    )
  }

  if (showSuspend) {
    return (
      <form action={async () => { await suspendUser(userId, reason) }} className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="space-y-2">
          <Label htmlFor="reason">Suspension Reason *</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fraudulent activity" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="destructive">Confirm Suspend</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowSuspend(false)}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setShowSuspend(true)}>
      Suspend
    </Button>
  )
}
