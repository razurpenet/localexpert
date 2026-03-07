'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  userId: string
  currentUrl: string | null
  fullName: string
}

export function AvatarUpload({ userId, currentUrl, fullName }: AvatarUploadProps) {
  const supabase   = createClient()
  const inputRef   = useRef<HTMLInputElement>(null)
  const [url,      setUrl]    = useState(currentUrl)
  const [status,   setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [errorMsg, setError]  = useState<string | null>(null)

  const displayUrl = url
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=e2e8f0&color=475569&size=128`

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setStatus('uploading')
    setError(null)

    const ext  = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    // Upload to Supabase Storage (bucket: avatars)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      setStatus('error')
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Save to profiles
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (dbError) {
      setError(dbError.message)
      setStatus('error')
      return
    }

    setUrl(publicUrl)
    setStatus('done')
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        className="relative group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Change profile photo"
      >
        <Image
          src={displayUrl}
          alt={fullName}
          width={96}
          height={96}
          className="rounded-full object-cover ring-2 ring-border"
        />
        {/* Overlay on hover */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {status === 'uploading'
            ? <Loader2 className="h-5 w-5 text-white animate-spin" />
            : <Camera className="h-5 w-5 text-white" />
          }
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="text-center space-y-0.5">
        {status === 'done' && (
          <p className="text-xs text-emerald-600 font-medium">Photo updated</p>
        )}
        {status === 'uploading' && (
          <p className="text-xs text-muted-foreground">Uploading…</p>
        )}
        {errorMsg && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Click photo to change · Max 5 MB
        </p>
      </div>
    </div>
  )
}
