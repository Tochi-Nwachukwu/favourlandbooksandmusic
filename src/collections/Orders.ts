import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

/**
 * Orders are only ever created by the checkout routes (server side, after PayPal
 * confirms payment), so nobody can create one through the API.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Shop',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'customer.name', 'total', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customer.email', 'customer.name'],
  },
  defaultSort: '-createdAt',
  access: {
    read: isAdmin,
    create: () => false,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'orderNumber', type: 'text', required: true, unique: true, admin: { readOnly: true } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Awaiting payment', value: 'pending' },
            { label: 'Paid – to dispatch', value: 'paid' },
            { label: 'Dispatched', value: 'dispatched' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Refunded', value: 'refunded' },
          ],
        },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'email', type: 'email', required: true },
            { name: 'phone', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      admin: { condition: (data) => Boolean(data?.shippingAddress?.line1) },
      fields: [
        { name: 'line1', label: 'Address line 1', type: 'text' },
        { name: 'line2', label: 'Address line 2', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'postcode', type: 'text' },
            { name: 'country', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products' },
            { name: 'title', type: 'text', required: true },
            { name: 'format', type: 'text' },
            { name: 'unitPrice', type: 'number', required: true },
            { name: 'quantity', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'shippingCost', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'total', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'currency', type: 'text', defaultValue: 'GBP', admin: { readOnly: true } },
      ],
    },
    { name: 'shippingMethod', type: 'text', admin: { readOnly: true } },
    {
      name: 'trackingNumber',
      type: 'text',
      admin: { description: 'Royal Mail tracking number once posted.' },
    },
    { name: 'notes', label: 'Internal notes', type: 'textarea' },
    {
      name: 'paypal',
      type: 'group',
      admin: { position: 'sidebar', readOnly: true },
      fields: [
        { name: 'orderId', type: 'text', index: true },
        { name: 'captureId', type: 'text' },
        { name: 'payerEmail', type: 'text' },
      ],
    },
    {
      name: 'accessToken',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
  ],
}
