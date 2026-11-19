import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

export const MENTORSHIP_REASONS = [
  'Need guidance',
  'Want to grow spiritually',
  'Want self-improvement',
  'Want marital counsel',
  'Want to become an effective leader',
  'Want to develop leadership skills',
  'Want to develop new skills or improve current skills',
  'Want to become a writer or published Author',
  'Want help with post-publishing e.g. Book Launch, etc.',
  'Want to write Christian songs',
  'Want to become a Christian recording Artist',
  'Want to become an effective mentor',
]

export const DISCOVERY_OPTIONS = [
  'Instagram',
  'Facebook',
  'Online Advert',
  'Friend / Family',
  'Church',
  'Amazon',
  'YouTube',
]

/** 1 reason → Tier 3, 3 reasons → Tier 2, 5 reasons → Tier 1 (as on the old site). */
export const tierForReasons = (count: number): 1 | 2 | 3 => (count >= 5 ? 1 : count >= 3 ? 2 : 3)

export const MentorshipApplications: CollectionConfig = {
  slug: 'mentorship-applications',
  admin: {
    group: 'Mentorship',
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'suggestedTier', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    // Created by the website form through a server action, never through the public API
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        {
          name: 'gender',
          type: 'select',
          options: ['Male', 'Female'],
        },
      ],
    },
    { name: 'address', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'city', type: 'text' },
        { name: 'zip', type: 'text' },
        { name: 'country', type: 'text' },
        { name: 'birthday', type: 'text' },
      ],
    },
    {
      name: 'reasons',
      type: 'select',
      hasMany: true,
      options: MENTORSHIP_REASONS,
    },
    { name: 'discoveredVia', label: 'How they found us', type: 'select', options: DISCOVERY_OPTIONS },
    { name: 'companions', label: 'Family / friends joining', type: 'textarea' },
    {
      name: 'suggestedTier',
      type: 'select',
      options: [
        { label: 'Tier 1', value: '1' },
        { label: 'Tier 2', value: '2' },
        { label: 'Tier 3', value: '3' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Enrolled', value: 'enrolled' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
