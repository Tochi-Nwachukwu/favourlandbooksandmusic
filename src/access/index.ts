import type { Access, FieldHook } from 'payload'

export const anyone: Access = () => true

export const isAdmin: Access = ({ req: { user } }) => Boolean(user)

/** Public visitors only see products/pages that are switched on; logged-in staff see everything. */
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (user) return true
  return { published: { equals: true } }
}

export const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Fill the slug from the title when it is left empty. */
export const slugFromTitle: FieldHook = ({ value, data }) => {
  if (typeof value === 'string' && value.trim()) return slugify(value)
  if (data?.title) return slugify(String(data.title))
  return value
}
