import Image from 'next/image'

/** Full-height photo banner with a large uppercase tagline, as used across the live site. */
export function PageHero({
  tagline,
  image,
  tint,
  compact,
}: {
  tagline?: string | null
  image: string
  tint?: 'blue'
  compact?: boolean
}) {
  const className = ['page-hero', compact && 'page-hero-compact', tint === 'blue' && 'page-hero-blue']
    .filter(Boolean)
    .join(' ')
  return (
    <section className={className}>
      <Image src={image} alt="" fill priority sizes="100vw" className="page-hero-media" />
      <div className="page-hero-inner">
        {tagline && (
          <p className="hero-tagline" role="doc-subtitle">
            {tagline}
          </p>
        )}
      </div>
    </section>
  )
}

export const HERO_IMAGES = {
  home: '/images/hero-home.jpg',
  about: '/images/hero-about.jpg',
  store: '/images/hero-store.jpg',
}
