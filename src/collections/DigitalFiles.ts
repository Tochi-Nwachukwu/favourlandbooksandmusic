import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

/**
 * Ebook PDFs, MP3 albums, etc. These are private: customers only reach them through
 * the /download route, which checks they have a paid order containing the product.
 */
export const DigitalFiles: CollectionConfig = {
  slug: 'digital-files',
  labels: { singular: 'Download File', plural: 'Download Files' },
  admin: {
    group: 'Shop',
    description: 'Ebook and music files customers receive after paying. These are never public.',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [{ name: 'label', type: 'text' }],
  upload: {
    staticDir: 'private-files',
  },
}
