import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatGBP, getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Your order', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const [{ number }, { t }] = await Promise.all([params, searchParams])
  if (!t) notFound()

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: number }, accessToken: { equals: t } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const order = docs[0]
  if (!order) notFound()

  const paid = ['paid', 'dispatched', 'completed'].includes(order.status)
  const downloads = order.items.filter((i) => i.format === 'digital')

  return (
    <div className="container section narrow">
      <header className="page-head">
        <p className="eyebrow">Order {order.orderNumber}</p>
        <h1>{paid ? 'Thank you for your order!' : 'Order not yet paid'}</h1>
        <p className="lead">
          {paid
            ? `A receipt has been sent to ${order.customer.email}. God bless you, ${order.customer.name.split(' ')[0]}.`
            : 'We have not received payment for this order.'}
        </p>
      </header>

      {paid && downloads.length > 0 && (
        <section className="summary-card">
          <h2 className="summary-title">Your downloads</h2>
          <ul className="download-list">
            {downloads.map((i) => (
              <li key={i.id}>
                <span>{i.title}</span>
                <a className="btn btn-primary btn-small" href={`/download/${order.accessToken}/${i.product}`}>
                  Download
                </a>
              </li>
            ))}
          </ul>
          <p className="muted small">Bookmark this page – you can come back to download again.</p>
        </section>
      )}

      <section className="summary-card">
        <h2 className="summary-title">Summary</h2>
        <ul className="summary-items">
          {order.items.map((i) => (
            <li key={i.id}>
              <span>
                {i.title}
                {i.quantity > 1 ? ` × ${i.quantity}` : ''}
              </span>
              <span>{formatGBP(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.shippingCost ? (
          <div className="summary-row">
            <span>Postage – {order.shippingMethod}</span>
            <span>{formatGBP(order.shippingCost)}</span>
          </div>
        ) : null}
        <div className="summary-row total">
          <span>Total paid</span>
          <strong>{formatGBP(order.total)}</strong>
        </div>
        {order.shippingAddress?.line1 && (
          <p className="muted small pre">
            Posting to: {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress.city}{' '}
            {order.shippingAddress.postcode}, {order.shippingAddress.country}
          </p>
        )}
        {order.trackingNumber && <p>Tracking number: {order.trackingNumber}</p>}
      </section>

      <Link href="/shop" className="btn btn-ghost">
        Continue shopping
      </Link>
    </div>
  )
}
