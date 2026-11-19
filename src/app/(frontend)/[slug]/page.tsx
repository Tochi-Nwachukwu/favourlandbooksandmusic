import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DISCOVERY_OPTIONS, MENTORSHIP_REASONS } from '@/collections/MentorshipApplications'
import { MentorshipForm } from '@/components/MentorshipForm'
import { RichText } from '@/components/RichText'
import { formatGBP, getPayloadClient } from '@/lib/payload'

export const revalidate = 60

async function getPage(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug)
  return page ? { title: page.title } : {}
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  const isMentorship = slug === 'mentorship' || slug.startsWith('mentorship-tier-')
  const payload = await getPayloadClient()
  const tiers = isMentorship
    ? (
        await payload.find({
          collection: 'products',
          where: { 'categories.slug': { equals: 'mentorship' }, published: { equals: true } },
          sort: 'sortOrder',
          depth: 0,
          limit: 10,
        })
      ).docs
    : []
  const tierLinks = Object.fromEntries(
    tiers.map((t) => [t.slug?.match(/tier-(\d)/)?.[1] ?? '', `/product/${t.slug}`]),
  )
  const thisTier = slug.match(/^mentorship-tier-(\d)$/)?.[1]
  const settings = slug === 'contact-us' ? await payload.findGlobal({ slug: 'site-settings' }) : null

  return (
    <article className="container section narrow">
      <header className="page-head">
        {page.tagline && <p className="eyebrow">{page.tagline}</p>}
        <h1>{page.title}</h1>
      </header>

      <RichText data={page.content} />

      {thisTier && tierLinks[thisTier] && (
        <p>
          <Link href={tierLinks[thisTier]} className="btn btn-primary btn-lg">
            Register for Tier {thisTier}
          </Link>
        </p>
      )}

      {settings && (
        <div className="contact-cards">
          {settings.socialLinks?.map((s) => (
            <a key={s.id} href={s.url} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      )}

      {isMentorship && tiers.length > 0 && (
        <section className="section">
          <h2>Mentorship packages</h2>
          <div className="tier-grid">
            {tiers.map((t) => {
              const n = t.slug?.match(/tier-(\d)/)?.[1]
              return (
                <div key={t.id} className={n === thisTier ? 'tier-card current' : 'tier-card'}>
                  <p className="eyebrow">Tier {n}</p>
                  <p className="tier-price">{formatGBP(t.price)}</p>
                  <p className="muted">{t.title.match(/\(([^)]+)\)/)?.[1]}</p>
                  <Link href={`/mentorship-tier-${n}`} className="arrow-link">
                    Package details →
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {slug === 'mentorship' && (
        <section className="section" id="apply">
          <h2>To enrol, kindly fill in this form</h2>
          <MentorshipForm reasons={MENTORSHIP_REASONS} discovery={DISCOVERY_OPTIONS} tierLinks={tierLinks} />
        </section>
      )}
    </article>
  )
}
