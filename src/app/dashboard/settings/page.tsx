'use client'

import { useState } from 'react'
import { deleteAccount } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)

  const canDelete = confirm === 'DELETE'

  async function handleDelete() {
    if (!canDelete) return
    setLoading(true)
    await deleteAccount()
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences.</p>
      </div>

      {/* Legal links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <a href="/privacy" className="block text-primary hover:underline">Privacy Policy</a>
          <a href="/terms" className="block text-primary hover:underline">Terms of Service</a>
          <a href="/cookies" className="block text-primary hover:underline">Cookie Policy</a>
        </CardContent>
      </Card>

      {/* Data rights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data rights (GDPR)</CardTitle>
          <CardDescription>
            Under UK GDPR you have the right to access or erase your personal data.
            To request a copy of your data, email{' '}
            <a href="mailto:privacy@handby.uk" className="text-primary hover:underline">
              privacy@handby.uk
            </a>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Delete account */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Delete account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!open ? (
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
              onClick={() => setOpen(true)}
            >
              I want to delete my account
            </Button>
          ) : (
            <div className="space-y-4 rounded-lg border border-destructive/30 bg-red-50 p-4">
              <p className="text-sm text-destructive font-medium">
                This will permanently delete your profile, services, reviews, and all activity.
              </p>
              <div className="space-y-2">
                <p className="text-sm">Type <strong>DELETE</strong> to confirm:</p>
                <Input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={!canDelete || loading}
                  onClick={handleDelete}
                >
                  {loading ? 'Deleting…' : 'Delete my account'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setOpen(false); setConfirm('') }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
