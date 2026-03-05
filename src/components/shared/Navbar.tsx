'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/(auth)/actions'

interface NavbarProps {
  user: {
    email: string
    full_name?: string | null
    avatar_url?: string | null
    role?: string | null
  }
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          LocalExpert
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user.full_name ?? user.email}</span>
            {user.role && (
              <span className="capitalize rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                {user.role}
              </span>
            )}
          </div>

          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
