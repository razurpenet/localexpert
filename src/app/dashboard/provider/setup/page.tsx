import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveProviderDetails } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SubmitButton from '@/components/shared/SubmitButton'
import { LocationDetector } from '@/components/provider/LocationDetector'
import { AvatarUpload } from '@/components/provider/AvatarUpload'

export default async function ProviderSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Pre-fill if details already exist
  const { data: existing } = await supabase
    .from('provider_details')
    .select('*')
    .eq('id', user.id)
    .single()

  // Pre-fill location + avatar from profiles
  const { data: profileLoc } = await supabase
    .from('profiles')
    .select('postcode, lat, lng, avatar_url, full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {existing ? 'Edit your profile' : 'Set up your provider profile'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          This is what customers will see when they find you.
        </p>
      </div>

      {/* Profile photo — uploaded separately, outside the main form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile photo</CardTitle>
          <CardDescription>A clear photo helps customers trust you</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AvatarUpload
            userId={user.id}
            currentUrl={profileLoc?.avatar_url ?? null}
            fullName={profileLoc?.full_name ?? user.email ?? ''}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business details</CardTitle>
          <CardDescription>Tell clients about your business</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveProviderDetails} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="business_name">Business name *</Label>
              <Input
                id="business_name"
                name="business_name"
                placeholder="e.g. Smith Plumbing Services"
                defaultValue={existing?.business_name ?? ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_exp">Years of experience</Label>
              <Input
                id="years_exp"
                name="years_exp"
                type="number"
                min={0}
                max={60}
                placeholder="e.g. 5"
                defaultValue={existing?.years_exp ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website (optional)</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://yourwebsite.com"
                defaultValue={existing?.website_url ?? ''}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Available for new work</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customers can see when you&apos;re open to enquiries
                </p>
              </div>
              <Switch
                name="is_available"
                defaultChecked={existing?.is_available ?? true}
              />
            </div>

            <LocationDetector
              defaultPostcode={profileLoc?.postcode ?? undefined}
              defaultLat={profileLoc?.lat ?? null}
              defaultLng={profileLoc?.lng ?? null}
            />

            <SubmitButton>
              {existing ? 'Save changes' : 'Complete setup'}
            </SubmitButton>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
