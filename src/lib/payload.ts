import { getPayload } from 'payload'

import config from '@payload-config'
import type { Media, Product } from '@/payload-types'

export const getPayloadClient = () => getPayload({ config })

export const formatGBP = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)

/** Work in whole pence on the server so totals never pick up floating point errors. */
export const toPence = (pounds: number) => Math.round(pounds * 100)
export const fromPence = (pence: number) => (pence / 100).toFixed(2)

export const coverOf = (product: Product): Media | undefined => {
  const first = product.images?.[0]
  return first && typeof first === 'object' ? first : undefined
}

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '')

/** Same-site media URLs are returned relative, so images work whichever host/port serves the site. */
export const imageUrl = (media: Media | undefined, size: 'thumbnail' | 'card' | 'large' = 'card') => {
  const url = media?.sizes?.[size]?.url || media?.url || undefined
  return url && SITE_ORIGIN && url.startsWith(`${SITE_ORIGIN}/`) ? url.slice(SITE_ORIGIN.length) : url
}

export const FORMAT_LABEL: Record<Product['format'], string> = {
  physical: 'Posted from the UK',
  digital: 'Instant download',
  service: 'Mentorship package',
}
