import { NextResponse } from 'next/server'

import { orderEmailHtml } from '@/lib/checkout'
import { getPayloadClient } from '@/lib/payload'
import { capturePayPalOrder } from '@/lib/paypal'

export async function POST(request: Request) {
  const payload = await getPayloadClient()
  const { paypalOrderId } = (await request.json().catch(() => ({}))) as { paypalOrderId?: string }
  if (!paypalOrderId) return NextResponse.json({ error: 'Missing order.' }, { status: 400 })

  const { docs } = await payload.find({
    collection: 'orders',
    where: { 'paypal.orderId': { equals: paypalOrderId } },
    limit: 1,
    overrideAccess: true,
  })
  const order = docs[0]
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const done = () =>
    NextResponse.json({ redirect: `/order/${order.orderNumber}?t=${order.accessToken}` })
  if (order.status !== 'pending') return done()

  try {
    const result = await capturePayPalOrder(paypalOrderId)
    const capture = result.purchase_units[0]?.payments?.captures?.[0]
    const amountOk =
      capture?.amount.currency_code === 'GBP' &&
      Math.round(Number(capture.amount.value) * 100) === Math.round(order.total * 100)

    if (result.status !== 'COMPLETED' || capture?.status !== 'COMPLETED' || !amountOk) {
      payload.logger.error({ msg: 'PayPal capture not completed', paypalOrderId, result })
      return NextResponse.json(
        { error: 'Your payment was not completed. You have not been charged.' },
        { status: 402 },
      )
    }

    const nothingToPost = order.items.every((i) => i.format === 'digital')
    const paid = await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: {
        status: nothingToPost ? 'completed' : 'paid',
        paypal: {
          orderId: paypalOrderId,
          captureId: capture.id,
          payerEmail: result.payer?.email_address,
        },
      },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || new URL(request.url).origin
    const html = orderEmailHtml(paid, siteUrl)
    await Promise.allSettled([
      payload.sendEmail({ to: paid.customer.email, subject: `Your order ${paid.orderNumber}`, html }),
      process.env.SHOP_NOTIFY_EMAIL &&
        payload.sendEmail({
          to: process.env.SHOP_NOTIFY_EMAIL,
          subject: `New order ${paid.orderNumber} – ${paid.customer.name}`,
          html,
        }),
    ])

    return done()
  } catch (err) {
    payload.logger.error(err)
    return NextResponse.json(
      { error: 'Something went wrong confirming your payment. Please contact us before trying again.' },
      { status: 500 },
    )
  }
}
