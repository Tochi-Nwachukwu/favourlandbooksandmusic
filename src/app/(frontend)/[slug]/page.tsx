import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DISCOVERY_OPTIONS, MENTORSHIP_REASONS } from '@/collections/MentorshipApplications'
import { MentorshipForm } from '@/components/MentorshipForm'
import { HERO_IMAGES, PageHero } from '@/components/PageHero'
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

/** Photo shown beside the text on the main pages (same pairing as the live site). */
const SIDE_IMAGES: Record<string, { src: string; alt: string }> = {
  'about-us': { src: '/images/apostle-ifeoma-2.jpg', alt: 'Apostle (Rev.) Ifeoma Fiiriter' },
  'contact-us': { src: '/images/apostle-ifeoma-2.jpg', alt: 'Apostle (Rev.) Ifeoma Fiiriter' },
  mentorship: { src: '/images/mentorship.png', alt: 'Apostle (Rev.) Ifeoma Fiiriter, Glory & Wisdom mentor' },
}

/** Legal / policy pages get a shorter banner so the text is reachable straight away. */
const POLICY_PAGES = ['terms-and-conditions', 'privacy-policy', 'cookie-policy', 'postage-and-delivery']

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}
  const tier = slug.match(/^mentorship-tier-(\d)$/)?.[1]
  return { title: tier ? `Mentorship – Tier ${tier}` : page.title }
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
  const side = SIDE_IMAGES[slug]
  const isPolicy = POLICY_PAGES.includes(slug)

  return (
    <>
      <PageHero
        tagline={page.tagline}
        image={isMentorship ? HERO_IMAGES.store : HERO_IMAGES.about}
        tint={isMentorship ? 'blue' : undefined}
        compact={isPolicy}
      />

      <article className="container section">
        <h1 className={isPolicy || isMentorship ? 'script-title script-title-sm' : 'script-title'}>{page.title}</h1>

        <div className={side ? 'content-split' : 'content-split no-aside'}>
          <div>
            <RichText data={page.content} />

            {thisTier && tierLinks[thisTier] && (
              <p className="button-row">
                <Link href={tierLinks[thisTier]} className="btn btn-primary btn-lg btn-arrow">
                  Register for Tier {thisTier}
                </Link>
              </p>
            )}

            {slug === 'mentorship' && (
              <p className="button-row">
                <Link href="/testimonies" className="btn btn-primary btn-lg btn-arrow">
                  Testimonies from past mentees
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
          </div>

          {side && (
            <div className={slug === 'mentorship' ? 'side-image contain' : 'side-image'}>
              <Image src={side.src} alt={side.alt} fill sizes="360px" />
            </div>
          )}
        </div>

        {slug === 'mentorship' && (
          <section className="section narrow" id="apply">
            <h2 className="violet-heading form-title">To enrol kindly fill this form</h2>
            <MentorshipForm reasons={MENTORSHIP_REASONS} discovery={DISCOVERY_OPTIONS} tierLinks={tierLinks} />
          </section>
        )}

        {isMentorship && tiers.length > 0 && (
          <section className="section" aria-labelledby="packages-heading">
            <h2 id="packages-heading" className="violet-heading">
              {thisTier ? 'View other Mentorship Packages' : 'Available Mentorship Packages'}
            </h2>
            <div className="tier-grid">
              {tiers.map((t) => {
                const n = t.slug?.match(/tier-(\d)/)?.[1]
                const period = t.title.match(/\(([^)]+)\)/)?.[1]
                return (
                  <div key={t.id} className={n === thisTier ? 'tier-card current' : 'tier-card'}>
                    <p className="tier-word">Tier</p>
                    <p className="tier-number">{n}</p>
                    <p className="tier-word">Package</p>
                    <p className="tier-price">
                      {formatGBP(t.price)} {period}
                    </p>
                    <Link
                      href={`/mentorship-tier-${n}`}
                      className="btn btn-primary btn-arrow"
                      aria-label={`View Tier ${n} package`}
                    >
                      View package
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
