import Image from 'next/image'
import Link from 'next/link'

import { HERO_IMAGES, PageHero } from '@/components/PageHero'
import { ProductGrid } from '@/components/ProductCard'
import { RichText } from '@/components/RichText'
import type { Media } from '@/payload-types'
import { getPayloadClient, imageUrl } from '@/lib/payload'

export const revalidate = 60

export default async function HomePage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 1 })

  const featured = await payload.find({
    collection: 'products',
    where: { featured: { equals: true }, published: { equals: true } },
    limit: 6,
    depth: 1,
  })
  const latest = featured.docs.length
    ? featured
    : await payload.find({
        collection: 'products',
        where: { published: { equals: true }, format: { not_equals: 'service' } },
        sort: 'sortOrder',
        limit: 6,
        depth: 1,
      })

  const categories = await payload.find({
    collection: 'categories',
    where: { slug: { not_equals: 'mentorship' } },
    sort: 'sortOrder',
    depth: 0,
    limit: 20,
  })

  const heroImage =
    (typeof settings.heroImage === 'object' && imageUrl(settings.heroImage as Media, 'large')) || HERO_IMAGES.home

  return (
    <>
      <PageHero tagline={settings.heroTagline} image={heroImage} />

      <section className="container section">
        <h1 className="script-title">{settings.heroTitle || 'Welcome'}</h1>
        <div className="content-split">
          <div>
            <RichText data={settings.intro} />
            <div className="button-row">
              <Link href="/shop" className="btn btn-primary btn-lg btn-arrow">
                View books and publications
              </Link>
              <Link href="/mentorship" className="btn btn-primary btn-lg btn-arrow">
                Glory and Wisdom Mentorship
              </Link>
            </div>
          </div>
          <div className="side-image">
            <Image
              src="/images/apostle-ifeoma.jpeg"
              alt="Apostle (Rev.) Ifeoma Fiiriter"
              fill
              sizes="(max-width: 860px) 360px, 360px"
            />
          </div>
        </div>
      </section>

      <section className="container section shop-wrap" aria-labelledby="store-heading">
        <h2 id="store-heading" className="script-title script-title-sm">
          Online Store
        </h2>
        <nav className="tile-grid" aria-label="Store categories">
          {categories.docs.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="tile">
              {c.title}
            </Link>
          ))}
        </nav>
      </section>

      <section className="container shop-wrap">
        <div className="section-head">
          <h2>{featured.docs.length ? 'Featured' : 'New & noteworthy'}</h2>
          <Link href="/shop" className="arrow-link">
            See everything →
          </Link>
        </div>
        <ProductGrid products={latest.docs} />
      </section>
    </>
  )
}
