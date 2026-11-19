import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, slugFromTitle } from '../access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    group: 'Shop',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'sortOrder'],
  },
  defaultSort: 'sortOrder',
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Used in the web address. Filled automatically.' },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    { name: 'description', type: 'textarea' },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first in the shop menu.' },
    },
  ],
}
