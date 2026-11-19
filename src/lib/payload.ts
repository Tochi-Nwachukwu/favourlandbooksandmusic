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

export const imageUrl = (media: Media | undefined, size: 'thumbnail' | 'card' | 'large' = 'card') =>
  media?.sizes?.[size]?.url || media?.url || undefined

export const FORMAT_LABEL: Record<Product['format'], string> = {
  physical: 'Posted from the UK',
  digital: 'Instant download',
  service: 'Mentorship package',
}
