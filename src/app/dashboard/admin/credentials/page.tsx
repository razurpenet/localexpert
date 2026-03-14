import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Award, ExternalLink } from 'lucide-react'
import { CredentialActionButtons } from './CredentialActions'

const TYPE_LABELS: Record<string, string> = {
  certification:  'Certification',
  insurance:      'Insurance',
  license:        'License',
  other:          'Other',
}

export default async function AdminCredentialsPage() {
  const admin = createAdminClient()

  // Fetch credentials, then batch-fetch provider profiles separately
  // (avoids FK join issues if the constraint name doesn't match)
  const { data: rawCreds } = await admin
    .from('credentials')
    .select('*')
    .order('created_at', { ascending: false })

  const providerIds = [...new Set((rawCreds ?? []).map((c) => c.provider_id).filter(Boolean))]
  const { data: profiles } = providerIds.length
    ? await admin.from('profiles').select('id, full_name, city').in('id', providerIds)
    : { data: [] as any[] }

  // Fetch emails from auth.users (email isn't stored in profiles)
  const emailMap = new Map<string, string>()
  for (const pid of providerIds) {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(pid)
    if (authUser?.email) emailMap.set(pid, authUser.email)
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, { ...p, email: emailMap.get(p.id) ?? null }]))
  const credentials = (rawCreds ?? []).map((c) => ({
    ...c,
    profiles: profileMap.get(c.provider_id) ?? null,
  }))

  const pending  = credentials?.filter((c) => !c.verified && !c.reviewed_at) ?? []
  const verified = credentials?.filter((c) => c.verified)                    ?? []
  const rejected = credentials?.filter((c) => !c.verified && c.reviewed_at)  ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          Credential Verification
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review provider certificates, licenses, and insurance documents.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No pending credentials. All reviewed!</p>
        )}
        {pending.map((cred) => {
          const provider = cred.profiles as any
          return (
            <Card key={cred.id} className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{provider?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{provider?.email}</p>
                    {provider?.city && <p className="text-xs text-muted-foreground">{provider.city}</p>}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">Pending</span>
                </div>

                <div className="bg-white rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{TYPE_LABELS[cred.type] ?? cred.type}</p>
                    </div>
                    {cred.label && (
                      <div>
                        <p className="text-xs text-muted-foreground">Label</p>
                        <p className="font-medium">{cred.label}</p>
                      </div>
                    )}
                    {cred.expires_at && (
                      <div>
                        <p className="text-xs text-muted-foreground">Expiry</p>
                        <p className="font-medium">{new Date(cred.expires_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="font-medium">{new Date(cred.created_at).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  {cred.type === 'insurance' && (cred.insurer_name || cred.coverage_amount) && (
                    <div className="flex items-center gap-6 pt-2 border-t">
                      {cred.insurer_name && <div><p className="text-xs text-muted-foreground">Insurer</p><p className="font-medium">{cred.insurer_name}</p></div>}
                      {cred.coverage_amount && <div><p className="text-xs text-muted-foreground">Coverage</p><p className="font-medium">£{Number(cred.coverage_amount).toLocaleString()}</p></div>}
                    </div>
                  )}
                  {cred.document_url && (
                    <a href={cred.document_url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                      <ExternalLink className="h-3.5 w-3.5" /> View Document
                    </a>
                  )}
                </div>

                <CredentialActionButtons credId={cred.id} />
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Verified ({verified.length})
        </h2>
        {verified.map((cred) => {
          const provider = cred.profiles as any
          return (
            <div key={cred.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-sm">{provider?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[cred.type] ?? cred.type}{cred.label ? ` — ${cred.label}` : ''}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
            </div>
          )
        })}
      </section>

      {rejected.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Rejected ({rejected.length})
          </h2>
          {rejected.map((cred) => {
            const provider = cred.profiles as any
            return (
              <div key={cred.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{provider?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[cred.type] ?? cred.type}</p>
                  {cred.reviewer_notes && <p className="text-xs text-red-600">Reason: {cred.reviewer_notes}</p>}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Rejected</span>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
