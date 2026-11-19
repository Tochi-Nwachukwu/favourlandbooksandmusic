import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin, slugFromTitle } from '../access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'showInFooter', 'published'],
  },
  defaultSort: 'sortOrder',
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'tagline',
      type: 'text',
      admin: { description: 'Small heading shown above the title, e.g. "ROOTED IN GOD’S WORD".' },
    },
    { name: 'content', type: 'richText' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      required: true,
      admin: { position: 'sidebar', description: 'Web address, e.g. "about-us" → /about-us' },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'showInFooter',
      label: 'Link in footer',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
