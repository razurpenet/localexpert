'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function PortfolioUpload({ userId }: { userId: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return setError('Please select an image first.')

    if (file.size > 5 * 1024 * 1024) return setError('Image must be under 5 MB.')
    if (!file.type.startsWith('image/')) return setError('Only image files are allowed.')

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio')
      .getPublicUrl(path)

    const { error: dbError } = await supabase.from('portfolio_items').insert({
      provider_id: userId,
      image_url: publicUrl,
      caption: caption || null,
    })

    if (dbError) {
      setError(dbError.message)
      setUploading(false)
      return
    }

    // Reset
    setPreview(null)
    setCaption('')
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50 p-8 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Click to select a photo</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — max 5 MB</p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview && (
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              placeholder="e.g. Kitchen renovation completed in 2 days"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!preview || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading…' : 'Upload photo'}
        </Button>
      </CardContent>
    </Card>
  )
}
