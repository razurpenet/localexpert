'use client'

import { useState } from 'react'
import { submitQuoteRequest } from '@/app/providers/[id]/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CheckCircle } from 'lucide-react'

interface Service {
  id: string
  title: string
}

interface QuoteRequestFormProps {
  providerId: string
  services: Service[]
}

export function QuoteRequestForm({ providerId, services }: QuoteRequestFormProps) {
  const [serviceId, setServiceId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('message', message)
    if (serviceId) formData.set('service_id', serviceId)

    const result = await submitQuoteRequest(providerId, formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="font-semibold text-lg">Request sent!</p>
        <p className="text-sm text-muted-foreground">
          The provider will be in touch. You can track your request in your dashboard.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {services.length > 0 && (
        <div className="space-y-2">
          <Label>Service you need (optional)</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a service…" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Describe your job *</Label>
        <Textarea
          id="message"
          placeholder="Tell the provider what you need, when you need it, and any other relevant details…"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending…' : 'Send quote request'}
      </Button>
    </form>
  )
}
