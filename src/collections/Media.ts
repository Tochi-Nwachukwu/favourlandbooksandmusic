import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      label: 'Description (for screen readers)',
      type: 'text',
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 300, position: 'centre' },
      { name: 'card', width: 600 },
      { name: 'large', width: 1200 },
    ],
    adminThumbnail: 'thumbnail',
  },
}
