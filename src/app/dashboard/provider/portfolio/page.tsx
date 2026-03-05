import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortfolioUpload from '@/components/provider/PortfolioUpload'
import PortfolioGrid from '@/components/provider/PortfolioGrid'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload photos of your work. Customers trust providers with a strong portfolio.
        </p>
      </div>

      <PortfolioUpload userId={user.id} />

      <PortfolioGrid items={items ?? []} />
    </div>
  )
}
