import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin, slugFromTitle } from '../access'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    group: 'Shop',
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'format', 'categories', 'published'],
    listSearchableFields: ['title', 'slug'],
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
      type: 'row',
      fields: [
        {
          name: 'price',
          label: 'Price (£)',
          type: 'number',
          required: true,
          min: 0,
          admin: { step: 0.01, width: '33%' },
        },
        {
          name: 'compareAtPrice',
          label: 'Was price (£)',
          type: 'number',
          min: 0,
          admin: {
            step: 0.01,
            width: '33%',
            description: 'Optional. Shown crossed out when it is higher than the price.',
          },
        },
        {
          name: 'format',
          type: 'select',
          required: true,
          defaultValue: 'physical',
          options: [
            { label: 'Physical (posted)', value: 'physical' },
            { label: 'Digital download', value: 'digital' },
            { label: 'Service (e.g. mentorship)', value: 'service' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'The first image is the cover shown in the shop.' },
    },
    {
      name: 'excerpt',
      label: 'Short summary',
      type: 'textarea',
      admin: { description: 'One or two sentences shown under the title.' },
    },
    { name: 'description', type: 'richText' },
    {
      name: 'digitalFile',
      label: 'Download file',
      type: 'upload',
      relationTo: 'digital-files',
      admin: {
        condition: (data) => data?.format === 'digital',
        description: 'The ebook / music file the customer receives after paying.',
      },
    },
    {
      name: 'published',
      label: 'Show in shop',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'inStock',
      label: 'In stock',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      label: 'Feature on home page',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Used in the web address. Filled automatically.' },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
    {
      name: 'wooId',
      label: 'Old WooCommerce ID',
      type: 'number',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
