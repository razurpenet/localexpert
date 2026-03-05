import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { addService, deleteService } from './actions'
import SubmitButton from '@/components/shared/SubmitButton'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from('services')
      .select('*, categories(name)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My Services</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add the services you offer. Customers will use these to find and contact you.
        </p>
      </div>

      {/* Add service form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a service</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addService} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="title">Service title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Boiler repair and installation"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select name="category_id" required>
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_type">Pricing type</Label>
                <Select name="price_type">
                  <SelectTrigger id="price_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed price</SelectItem>
                    <SelectItem value="hourly">Per hour</SelectItem>
                    <SelectItem value="quote">Quote only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_from">Starting price (£)</Label>
              <Input
                id="price_from"
                name="price_from"
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what's included in this service…"
                rows={3}
              />
            </div>

            <SubmitButton>Add service</SubmitButton>
          </form>
        </CardContent>
      </Card>

      {/* Existing services */}
      {services && services.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Your services ({services.length})
          </h2>
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between rounded-xl border border-border bg-white p-4"
            >
              <div className="space-y-1">
                <p className="font-medium">{s.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {(s.categories as { name: string } | null)?.name}
                  </Badge>
                  {s.price_from && (
                    <span className="text-sm text-muted-foreground">
                      From £{s.price_from}
                      {s.price_type === 'hourly' ? '/hr' : ''}
                    </span>
                  )}
                  {s.price_type === 'quote' && (
                    <span className="text-sm text-muted-foreground">Quote only</span>
                  )}
                </div>
                {s.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                )}
              </div>

              <form action={deleteService.bind(null, s.id)}>
                <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-8">
          No services yet — add your first one above.
        </p>
      )}
    </div>
  )
}
