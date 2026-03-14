'use client'

import Link from 'next/link'
import { LogOut, User, Search, MapPin, Settings, Shield } from 'lucide-react'
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
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary">
            <MapPin className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Hand<span className="text-primary">by</span>
          </span>
        </Link>
        <Link href="/search" className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-4 w-4" /> Browse
        </Link>
        {user.role === 'admin' && (
          <Link href="/dashboard/admin" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            <Shield className="h-4 w-4" /> Admin
          </Link>
        )}

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

          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm" asChild>
              <span><Settings className="h-4 w-4 mr-1" />Settings</span>
            </Button>
          </Link>
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
