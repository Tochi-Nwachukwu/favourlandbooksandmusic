import Image from 'next/image'
import Link from 'next/link'

import { ProductGrid } from '@/components/ProductCard'
import { RichText } from '@/components/RichText'
import { coverOf, getPayloadClient, imageUrl } from '@/lib/payload'

export const revalidate = 60

export default async function HomePage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 1 })

  const featured = await payload.find({
    collection: 'products',
    where: { featured: { equals: true }, published: { equals: true } },
    limit: 8,
    depth: 1,
  })
  const latest = featured.docs.length
    ? featured
    : await payload.find({
        collection: 'products',
        where: { published: { equals: true }, format: { not_equals: 'service' } },
        sort: 'sortOrder',
        limit: 8,
        depth: 1,
      })

  const shelves = await Promise.all(
    [
      { slug: 'books', title: 'Books', blurb: 'Paperbacks posted from Manchester' },
      { slug: 'ebooks', title: 'Ebooks', blurb: 'Read instantly on any device' },
      { slug: 'songs', title: 'Songs of Glory', blurb: 'Praise & worship albums' },
    ].map(async (shelf) => {
      const { docs } = await payload.find({
        collection: 'products',
        where: { 'categories.slug': { equals: shelf.slug }, published: { equals: true } },
        sort: 'sortOrder',
        limit: 3,
        depth: 1,
      })
      return { ...shelf, covers: docs.map((d) => imageUrl(coverOf(d), 'thumbnail')).filter(Boolean) }
    }),
  )

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">{settings.heroTagline}</p>
            <h1>{settings.heroTitle}</h1>
            <RichText data={settings.intro} className="lead" />
            <div className="hero-actions">
              <Link href="/shop" className="btn btn-gold btn-lg">
                View books &amp; publications
              </Link>
              <Link href="/mentorship" className="btn btn-outline-light btn-lg">
                Glory &amp; Wisdom Mentorship
              </Link>
            </div>
          </div>
          <div className="hero-books" aria-hidden>
            {latest.docs.slice(0, 3).map((p, i) => {
              const src = imageUrl(coverOf(p), 'card')
              return src ? (
                <div key={p.id} className={`hero-book hero-book-${i}`}>
                  <Image src={src} alt="" fill sizes="220px" priority={i === 0} />
                </div>
              ) : null
            })}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="shelf-grid">
          {shelves.map((s) => (
            <Link key={s.slug} href={`/shop?category=${s.slug}`} className="shelf-card">
              <div className="shelf-covers">
                {s.covers.map((src, i) => (
                  <img key={i} src={src} alt="" loading="lazy" />
                ))}
              </div>
              <h2>{s.title}</h2>
              <p className="muted">{s.blurb}</p>
              <span className="arrow-link">Browse →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>{featured.docs.length ? 'Featured' : 'New & noteworthy'}</h2>
          <Link href="/shop" className="arrow-link">
            See everything →
          </Link>
        </div>
        <ProductGrid products={latest.docs} />
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <div>
            <p className="eyebrow">Glory &amp; Wisdom Mentorship</p>
            <h2>{settings.mentorshipCta}</h2>
            <p>
              A Holy Spirit-led programme with Apostle Ifeoma to help you avoid life’s pitfalls and walk in
              dominion.
            </p>
          </div>
          <div className="cta-actions">
            <Link href="/mentorship" className="btn btn-gold btn-lg">
              Join now
            </Link>
            <Link href="/testimonies" className="btn btn-outline-light btn-lg">
              Read testimonies
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
