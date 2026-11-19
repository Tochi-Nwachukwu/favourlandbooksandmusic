import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Content' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home page',
          fields: [
            { name: 'heroTagline', type: 'text', defaultValue: 'FAITH GROWS BY HEARING' },
            { name: 'heroTitle', type: 'text', defaultValue: 'Welcome' },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            { name: 'intro', type: 'richText' },
            {
              name: 'mentorshipCta',
              label: 'Mentorship banner text',
              type: 'text',
              defaultValue: 'Join the Glory and Wisdom Mentorship Programme today!',
            },
          ],
        },
        {
          label: 'Contact & footer',
          fields: [
            { name: 'siteName', type: 'text', defaultValue: 'Favour Land Christian Books and Music' },
            { name: 'companyName', type: 'text', defaultValue: 'Favour Land Ltd' },
            { name: 'email', type: 'email' },
            { name: 'phone', type: 'text' },
            { name: 'address', type: 'textarea' },
            {
              name: 'socialLinks',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'url', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping',
          fields: [
            {
              name: 'shippingMethods',
              type: 'array',
              admin: {
                description:
                  'Postage options offered at checkout for physical items. Digital-only orders never pay postage.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'price', label: 'Price (£)', type: 'number', required: true, min: 0 },
                    {
                      name: 'region',
                      type: 'select',
                      required: true,
                      defaultValue: 'uk',
                      options: [
                        { label: 'United Kingdom', value: 'uk' },
                        { label: 'Outside the UK', value: 'international' },
                      ],
                    },
                    { name: 'enabled', type: 'checkbox', defaultValue: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
