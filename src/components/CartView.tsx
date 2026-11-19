'use client'

import Link from 'next/link'

import { gbp, useCart } from './cart'

export function CartView() {
  const { items, ready, subtotal, setQuantity, remove } = useCart()

  if (!ready) return <p className="muted">Loading your basket…</p>

  if (!items.length) {
    return (
      <div className="empty-state">
        <p>Your basket is empty.</p>
        <Link className="btn btn-primary" href="/shop">
          Browse the shop
        </Link>
      </div>
    )
  }

  const hasPhysical = items.some((i) => i.format === 'physical')

  return (
    <div className="cart-layout">
      <ul className="cart-lines">
        {items.map((item) => (
          <li key={item.id} className="cart-line">
            <Link href={`/product/${item.slug}`} className="cart-thumb">
              {item.image ? <img src={item.image} alt="" /> : null}
            </Link>
            <div className="cart-line-info">
              <Link href={`/product/${item.slug}`} className="cart-line-title">
                {item.title}
              </Link>
              <span className="muted small">
                {item.format === 'digital'
                  ? 'Ebook – download after payment'
                  : item.format === 'service'
                    ? 'Mentorship package'
                    : 'Posted to you'}
              </span>
              <div className="cart-line-actions">
                {item.format === 'physical' ? (
                  <label className="qty">
                    <span className="sr-only">Quantity</span>
                    <button aria-label="Decrease" onClick={() => setQuantity(item.id, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button aria-label="Increase" onClick={() => setQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </label>
                ) : null}
                <button className="link-button" onClick={() => remove(item.id)}>
                  Remove
                </button>
              </div>
            </div>
            <div className="cart-line-price">{gbp(item.price * item.quantity)}</div>
          </li>
        ))}
      </ul>
      <aside className="summary-card">
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{gbp(subtotal)}</strong>
        </div>
        <p className="muted small">
          {hasPhysical ? 'Postage is calculated at checkout.' : 'No postage – everything is delivered online.'}
        </p>
        <Link className="btn btn-primary btn-lg btn-block" href="/checkout">
          Checkout
        </Link>
        <Link className="btn btn-ghost btn-block" href="/shop">
          Continue shopping
        </Link>
      </aside>
    </div>
  )
}
