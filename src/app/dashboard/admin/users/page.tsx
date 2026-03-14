import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Shield, Star, MapPin } from 'lucide-react'
import { UserActionButtons } from './UserActions'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const params = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select('*, provider_details(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (params.role) {
    query = query.eq('role', params.role)
  }
  if (params.q) {
    query = query.ilike('full_name', `%${params.q}%`)
  }

  const { data: rawUsers } = await query

  // Fetch emails from auth.users
  const userEmailMap = new Map<string, string>()
  for (const u of rawUsers ?? []) {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(u.id)
    if (authUser?.email) userEmailMap.set(u.id, authUser.email)
  }

  const users = (rawUsers ?? []).map((u) => ({ ...u, email: userEmailMap.get(u.id) ?? null }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all platform users.
        </p>
      </div>

      {/* Search & filter */}
      <form className="flex gap-2">
        <input
          name="q"
          type="text"
          placeholder="Search by name or email..."
          defaultValue={params.q ?? ''}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select name="role" defaultValue={params.role ?? ''} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="provider">Providers</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
        <button type="submit" className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90">
          Search
        </button>
      </form>

      {/* Results */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Results ({users?.length ?? 0})
        </h2>
        {users?.map((user) => {
          const details = user.provider_details as any
          const isSuspended = Boolean(user.suspended_at)
          return (
            <div key={user.id} className={`bg-white rounded-xl border p-4 space-y-2 ${isSuspended ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.full_name ?? 'No name'}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      user.role === 'provider' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{user.role}</span>
                    {isSuspended && <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Suspended</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {user.city}{user.postcode ? `, ${user.postcode}` : ''}</p>}
                </div>
                <div className="text-right space-y-1">
                  {details && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {details.avg_rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" /> {details.avg_rating}</span>}
                      <span>{details.review_count ?? 0} reviews</span>
                      <span>{details.completion_count ?? 0} jobs</span>
                      {details.rtw_verified && <Shield className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Joined: {new Date(user.created_at).toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {isSuspended && user.suspended_reason && (
                <p className="text-xs text-red-600">Reason: {user.suspended_reason}</p>
              )}

              <UserActionButtons userId={user.id} isSuspended={isSuspended} />
            </div>
          )
        })}
      </section>
    </div>
  )
}
