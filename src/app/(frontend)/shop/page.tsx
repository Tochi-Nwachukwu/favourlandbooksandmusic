import Link from 'next/link'
import type { Where } from 'payload'

import { ProductGrid } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Shop' }

const PER_PAGE = 24

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const { category, q, page } = await searchParams
  const payload = await getPayloadClient()

  const categories = await payload.find({ collection: 'categories', sort: 'sortOrder', depth: 0, limit: 50 })
  const active = categories.docs.find((c) => c.slug === category)

  const where: Where = { published: { equals: true } }
  if (active) where['categories.slug'] = { equals: active.slug }
  if (q?.trim()) where.title = { like: q.trim() }

  const result = await payload.find({
    collection: 'products',
    where,
    sort: 'sortOrder',
    limit: PER_PAGE,
    page: Math.max(1, Number(page) || 1),
    depth: 1,
  })

  const href = (params: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries({ category, q, ...params })) if (v) sp.set(k, String(v))
    return `/shop${sp.size ? `?${sp}` : ''}`
  }

  return (
    <div className="container section">
      <header className="page-head">
        <p className="eyebrow">Online store</p>
        <h1>{active ? active.title : 'All books & music'}</h1>
        {active?.description && <p className="lead">{active.description}</p>}
      </header>

      <div className="shop-toolbar">
        <nav className="pill-nav" aria-label="Categories">
          <Link href="/shop" className={!active ? 'pill active' : 'pill'}>
            All
          </Link>
          {categories.docs.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={active?.id === c.id ? 'pill active' : 'pill'}
            >
              {c.title}
            </Link>
          ))}
        </nav>
        <form className="search" action="/shop">
          {active && <input type="hidden" name="category" value={active.slug ?? ''} />}
          <input type="search" name="q" placeholder="Search titles…" defaultValue={q} aria-label="Search" />
        </form>
      </div>

      {result.docs.length ? (
        <ProductGrid products={result.docs} />
      ) : (
        <p className="empty-state">No products found.</p>
      )}

      {result.totalPages > 1 && (
        <nav className="pagination" aria-label="Pages">
          {result.hasPrevPage && <Link href={href({ page: result.prevPage! })}>← Previous</Link>}
          <span>
            Page {result.page} of {result.totalPages}
          </span>
          {result.hasNextPage && <Link href={href({ page: result.nextPage! })}>Next →</Link>}
        </nav>
      )}
    </div>
  )
}
