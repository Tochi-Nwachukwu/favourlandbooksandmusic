import Link from 'next/link'
import type { Where } from 'payload'

import { HERO_IMAGES, PageHero } from '@/components/PageHero'
import { ProductGrid } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Online Store' }

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
    <>
      <PageHero tagline="Explore our rich resources" image={HERO_IMAGES.store} />

      <div className="container section shop-wrap">
        <header className="page-head">
          <h1 className="script-title">Online Store</h1>
          {active?.description && <p className="lead center">{active.description}</p>}
        </header>

        <div className="shop-toolbar">
          <nav className="pill-nav" aria-label="Categories">
            <Link href="/shop" className={!active ? 'pill active' : 'pill'} aria-current={!active ? 'page' : undefined}>
              All
            </Link>
            {categories.docs.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={active?.id === c.id ? 'pill active' : 'pill'}
                aria-current={active?.id === c.id ? 'page' : undefined}
              >
                {c.title}
              </Link>
            ))}
          </nav>
          <form className="search" action="/shop" role="search">
            {active && <input type="hidden" name="category" value={active.slug ?? ''} />}
            <input type="search" name="q" placeholder="Search titles…" defaultValue={q} aria-label="Search titles" />
            <button type="submit" className="btn btn-dark">
              Search
            </button>
          </form>
        </div>

        {q?.trim() && (
          <p className="muted">
            {result.totalDocs} result{result.totalDocs === 1 ? '' : 's'} for “{q.trim()}”
            {active ? ` in ${active.title}` : ''} · <Link href={href({ q: undefined, page: undefined })}>Clear search</Link>
          </p>
        )}

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
    </>
  )
}
