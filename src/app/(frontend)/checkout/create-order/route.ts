import { NextResponse } from 'next/server'

import {
  CheckoutError,
  isValidEmail,
  newAccessToken,
  newOrderNumber,
  paypalOrderBody,
  priceCart,
  type CheckoutInput,
} from '@/lib/checkout'
import { getPayloadClient } from '@/lib/payload'
import { createPayPalOrder, paypalConfigured } from '@/lib/paypal'

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'Online payment is not set up yet.' }, { status: 503 })
  }
  const payload = await getPayloadClient()
  let input: CheckoutInput
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  try {
    const name = input.customer?.name?.trim()
    const email = input.customer?.email?.trim().toLowerCase()
    if (!name || !email || !isValidEmail(email)) {
      throw new CheckoutError('Please enter your name and a valid email address.')
    }
    const priced = await priceCart(payload, input)
    const orderNumber = newOrderNumber()

    const order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        orderNumber,
        status: 'pending',
        customer: { name, email, phone: input.customer.phone?.trim() },
        shippingAddress: priced.needsShipping ? input.address : undefined,
        items: priced.items.map((i) => ({
          product: i.product.id,
          title: i.product.title,
          format: i.product.format,
          unitPrice: i.unitPence / 100,
          quantity: i.quantity,
        })),
        subtotal: priced.subtotalPence / 100,
        shippingCost: (priced.shipping?.pence ?? 0) / 100,
        shippingMethod: priced.shipping?.label,
        total: priced.totalPence / 100,
        currency: 'GBP',
        accessToken: newAccessToken(),
      },
    })

    const paypalOrder = await createPayPalOrder(
      paypalOrderBody(orderNumber, priced, { ...input, customer: { ...input.customer, name } }),
      orderNumber,
    )
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: { paypal: { orderId: paypalOrder.id } },
    })

    return NextResponse.json({ id: paypalOrder.id })
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    payload.logger.error(err)
    return NextResponse.json(
      { error: 'We could not start the payment. Please try again.' },
      { status: 500 },
    )
  }
}
