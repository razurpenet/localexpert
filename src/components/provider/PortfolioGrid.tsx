'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { deletePortfolioItem } from '@/app/dashboard/provider/portfolio/actions'

interface PortfolioItem {
  id: string
  image_url: string
  caption: string | null
  provider_id: string
}

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-10">
        No photos yet — upload your first one above.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Your photos ({items.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => {
          // Extract the storage path from the public URL for deletion
          const storagePath = item.image_url.split('/portfolio/')[1]

          return (
            <div key={item.id} className="group relative rounded-xl overflow-hidden border border-border bg-slate-100 aspect-square">
              <Image
                src={item.image_url}
                alt={item.caption ?? 'Portfolio photo'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                {item.caption && (
                  <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                )}
                <form action={deletePortfolioItem.bind(null, item.id, storagePath)} className="self-end">
                  <button
                    type="submit"
                    className="rounded-full bg-red-500/90 p-1.5 text-white hover:bg-red-600 transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
