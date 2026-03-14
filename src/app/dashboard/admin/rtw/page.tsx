import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Clock } from 'lucide-react'
import { RtwActionButtons } from './RtwActions'

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-slate-100 text-slate-600',
}

export default async function AdminRtwPage() {
  const admin = createAdminClient()

  const { data: rawChecks } = await admin
    .from('rtw_checks')
    .select('*')
    .order('created_at', { ascending: false })

  const rtwProviderIds = [...new Set((rawChecks ?? []).map((c) => c.provider_id).filter(Boolean))]
  const { data: rtwProfiles } = rtwProviderIds.length
    ? await admin.from('profiles').select('id, full_name, city, postcode').in('id', rtwProviderIds)
    : { data: [] as any[] }

  const rtwEmailMap = new Map<string, string>()
  for (const pid of rtwProviderIds) {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(pid)
    if (authUser?.email) rtwEmailMap.set(pid, authUser.email)
  }

  const rtwProfileMap = new Map((rtwProfiles ?? []).map((p) => [p.id, { ...p, email: rtwEmailMap.get(p.id) ?? null }]))
  const checks = (rawChecks ?? []).map((c) => ({
    ...c,
    profiles: rtwProfileMap.get(c.provider_id) ?? null,
  }))

  const pending  = checks.filter((c) => c.status === 'pending')
  const reviewed = checks.filter((c) => c.status !== 'pending')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Right to Work Verification
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review provider RTW share codes against gov.uk/view-right-to-work
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No pending RTW checks. All clear!</p>
        )}
        {pending.map((check) => {
          const provider = check.profiles as any
          return (
            <Card key={check.id} className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{provider?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{provider?.email}</p>
                    {provider?.city && <p className="text-xs text-muted-foreground">{provider.city}{provider.postcode ? `, ${provider.postcode}` : ''}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[check.status]}`}>
                    {check.status}
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Share Code</p>
                      <p className="font-mono font-bold text-lg tracking-widest">{check.share_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{new Date(check.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Submitted: {new Date(check.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <RtwActionButtons rtwId={check.id} />
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Reviewed ({reviewed.length})
        </h2>
        {reviewed.map((check) => {
          const provider = check.profiles as any
          return (
            <div key={check.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-sm">{provider?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">Code: {check.share_code}</p>
                {check.reviewer_notes && <p className="text-xs text-muted-foreground">Notes: {check.reviewer_notes}</p>}
              </div>
              <div className="text-right space-y-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[check.status]}`}>
                  {check.status}
                </span>
                {check.expires_at && (
                  <p className="text-xs text-muted-foreground">Expires: {new Date(check.expires_at).toLocaleDateString('en-GB')}</p>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
