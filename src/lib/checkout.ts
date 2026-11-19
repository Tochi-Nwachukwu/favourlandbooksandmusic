import crypto from 'crypto'
import type { Payload } from 'payload'

import type { Order, Product, SiteSetting } from '@/payload-types'
import { formatGBP, fromPence, toPence } from './payload'

export type CartLine = { id: number; quantity: number }

export type CheckoutInput = {
  items: CartLine[]
  customer: { name: string; email: string; phone?: string }
  address?: { line1: string; line2?: string; city: string; postcode: string; country: string }
  shippingId?: string
}

export class CheckoutError extends Error {}

export const shippingOptionsFor = (settings: SiteSetting, country: string) =>
  (settings.shippingMethods ?? []).filter(
    (m) => m.enabled && m.region === (country === 'GB' ? 'uk' : 'international'),
  )

/**
 * Re-prices the cart from the database. Prices sent by the browser are never trusted.
 */
export async function priceCart(payload: Payload, input: CheckoutInput) {
  const lines = (input.items ?? []).filter(
    (l) => Number.isInteger(l.id) && Number.isInteger(l.quantity) && l.quantity > 0,
  )
  if (!lines.length) throw new CheckoutError('Your basket is empty.')

  const { docs } = await payload.find({
    collection: 'products',
    where: { id: { in: lines.map((l) => l.id) }, published: { equals: true } },
    limit: lines.length,
    depth: 0,
    overrideAccess: true,
  })
  const byId = new Map<number, Product>(docs.map((p) => [p.id, p]))

  const items = lines.map((line) => {
    const product = byId.get(line.id)
    if (!product) throw new CheckoutError('An item in your basket is no longer available.')
    if (!product.inStock) throw new CheckoutError(`"${product.title}" is out of stock.`)
    // one copy of a download or a mentorship package is all anyone needs
    const quantity = product.format === 'physical' ? Math.min(line.quantity, 20) : 1
    return { product, quantity, unitPence: toPence(product.price) }
  })

  const subtotalPence = items.reduce((sum, i) => sum + i.unitPence * i.quantity, 0)
  const needsShipping = items.some((i) => i.product.format === 'physical')

  let shipping: { label: string; pence: number } | undefined
  if (needsShipping) {
    const a = input.address
    if (!a?.line1 || !a.city || !a.postcode || !a.country) {
      throw new CheckoutError('Please enter your full postal address.')
    }
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    const option = shippingOptionsFor(settings, a.country).find((m) => m.id === input.shippingId)
    if (!option) {
      throw new CheckoutError(
        a.country === 'GB'
          ? 'Please choose a postage option.'
          : 'Sorry, we cannot post physical items to that country online yet. Please contact us to arrange delivery.',
      )
    }
    shipping = { label: option.label, pence: toPence(option.price) }
  }

  return {
    items,
    needsShipping,
    shipping,
    subtotalPence,
    totalPence: subtotalPence + (shipping?.pence ?? 0),
  }
}

export const newOrderNumber = () => {
  const d = new Date()
  const ymd = `${d.getFullYear() % 100}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `FL-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

export const newAccessToken = () => crypto.randomBytes(24).toString('hex')

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

/** Build the PayPal Orders v2 request body for a priced cart. */
export function paypalOrderBody(
  orderNumber: string,
  priced: Awaited<ReturnType<typeof priceCart>>,
  input: CheckoutInput,
) {
  const a = input.address
  return {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderNumber,
        invoice_id: orderNumber,
        description: `Favour Land order ${orderNumber}`,
        amount: {
          currency_code: 'GBP',
          value: fromPence(priced.totalPence),
          breakdown: {
            item_total: { currency_code: 'GBP', value: fromPence(priced.subtotalPence) },
            shipping: { currency_code: 'GBP', value: fromPence(priced.shipping?.pence ?? 0) },
          },
        },
        items: priced.items.map((i) => ({
          name: i.product.title.slice(0, 127),
          quantity: String(i.quantity),
          unit_amount: { currency_code: 'GBP', value: fromPence(i.unitPence) },
          category: i.product.format === 'digital' ? 'DIGITAL_GOODS' : 'PHYSICAL_GOODS',
        })),
        ...(priced.needsShipping && a
          ? {
              shipping: {
                name: { full_name: input.customer.name.slice(0, 300) },
                address: {
                  address_line_1: a.line1,
                  address_line_2: a.line2 || undefined,
                  admin_area_2: a.city,
                  postal_code: a.postcode,
                  country_code: a.country,
                },
              },
            }
          : {}),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Favour Land Books & Music',
          shipping_preference: priced.needsShipping ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      },
    },
  }
}

export function orderEmailHtml(order: Order, siteUrl: string) {
  const link = `${siteUrl}/order/${order.orderNumber}?t=${order.accessToken}`
  const rows = order.items
    .map((i) => `<tr><td>${i.title} × ${i.quantity}</td><td align="right">${formatGBP(i.unitPrice * i.quantity)}</td></tr>`)
    .join('')
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#1f2a37">
  <h2 style="color:#123a5c">Thank you for your order, ${order.customer.name.split(' ')[0]}!</h2>
  <p>Order <strong>${order.orderNumber}</strong></p>
  <table width="100%" cellpadding="6" style="border-collapse:collapse">${rows}
  ${order.shippingCost ? `<tr><td>Postage (${order.shippingMethod})</td><td align="right">${formatGBP(order.shippingCost)}</td></tr>` : ''}
  <tr><td><strong>Total</strong></td><td align="right"><strong>${formatGBP(order.total)}</strong></td></tr></table>
  <p><a href="${link}" style="display:inline-block;background:#123a5c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">View your order${order.items.some((i) => i.format === 'digital') ? ' & downloads' : ''}</a></p>
  <p>God bless you,<br>Favour Land Christian Books and Music</p></div>`
}
