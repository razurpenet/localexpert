'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'handby_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if no decision recorded yet
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-2xl mx-auto bg-white border border-border rounded-2xl shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-muted-foreground">
          We use essential cookies to keep you signed in and remember your preferences.{' '}
          <Link href="/cookies" className="text-primary hover:underline">
            Cookie policy
          </Link>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
