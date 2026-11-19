'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

import { gbp, useCart } from './cart'

export type ShippingOption = { id: string; label: string; price: number; region: 'uk' | 'international' }

const COUNTRY_CODES =
  'GB IE US CA NG GH KE ZA UG ZW ZM TZ CM RW SL LR GM BW NA MW ET AU NZ ES FR DE NL BE IT PT CH AT SE NO DK FI PL CZ RO HU GR MT CY MX AR CO PE CL VE EC BO UY PY GT HN SV NI CR PA DO CU PR JM TT BB IN PK BD LK SG MY PH ID CN HK JP KR AE SA QA KW BH OM IL EG MA TN BR'.split(
    ' ',
  )

export function CheckoutForm({
  shippingOptions,
  paypalClientId,
}: {
  shippingOptions: ShippingOption[]
  paypalClientId?: string
}) {
  const { items, ready, subtotal, clear } = useCart()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    country: 'GB',
    shippingId: '',
  })
  // PayPal's callbacks are created once, so they read the latest form through a ref
  const formRef = useRef(form)
  formRef.current = form

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(['en'], { type: 'region' })
    return COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) =>
      a.code === 'GB' ? -1 : b.code === 'GB' ? 1 : a.name.localeCompare(b.name),
    )
  }, [])

  const needsShipping = items.some((i) => i.format === 'physical')
  const region = form.country === 'GB' ? 'uk' : 'international'
  const options = shippingOptions.filter((o) => o.region === region)
  const selected = options.find((o) => o.id === form.shippingId) ?? options[0]
  const postage = needsShipping ? (selected?.price ?? 0) : 0
  const cannotShip = needsShipping && !selected

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const f = formRef.current
    if (!f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      return 'Please enter your name and a valid email address.'
    }
    if (needsShipping && (!f.line1.trim() || !f.city.trim() || !f.postcode.trim())) {
      return 'Please enter your full postal address.'
    }
    return null
  }

  if (!ready) return <p className="muted">Loading…</p>
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

  return (
    <div className="cart-layout">
      <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>Your details</legend>
          <div className="field-grid">
            <label>
              Full name
              <input required autoComplete="name" value={form.name} onChange={set('name')} />
            </label>
            <label>
              Email
              <input required type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            </label>
            <label>
              Phone <span className="muted">(optional)</span>
              <input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            </label>
          </div>
          <p className="muted small">
            We send your receipt{items.some((i) => i.format === 'digital') ? ' and download links' : ''} to this email.
          </p>
        </fieldset>

        {needsShipping && (
          <fieldset>
            <legend>Delivery address</legend>
            <div className="field-grid">
              <label className="span-2">
                Address line 1
                <input required autoComplete="address-line1" value={form.line1} onChange={set('line1')} />
              </label>
              <label className="span-2">
                Address line 2 <span className="muted">(optional)</span>
                <input autoComplete="address-line2" value={form.line2} onChange={set('line2')} />
              </label>
              <label>
                Town / City
                <input required autoComplete="address-level2" value={form.city} onChange={set('city')} />
              </label>
              <label>
                Postcode
                <input required autoComplete="postal-code" value={form.postcode} onChange={set('postcode')} />
              </label>
              <label className="span-2">
                Country
                <select autoComplete="country" value={form.country} onChange={set('country')}>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {options.length > 0 ? (
              <div className="radio-list">
                {options.map((o) => (
                  <label key={o.id} className="radio-card">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selected?.id === o.id}
                      onChange={() => setForm((f) => ({ ...f, shippingId: o.id }))}
                    />
                    <span>{o.label}</span>
                    <strong>{gbp(o.price)}</strong>
                  </label>
                ))}
              </div>
            ) : (
              <p className="notice">
                Sorry, we can’t take online orders for posting outside the UK yet. Please{' '}
                <Link href="/contact-us">contact us</Link> and we’ll arrange delivery. Ebooks can still be bought
                from anywhere.
              </p>
            )}
          </fieldset>
        )}
      </form>

      <aside className="summary-card">
        <h2 className="summary-title">Order summary</h2>
        <ul className="summary-items">
          {items.map((i) => (
            <li key={i.id}>
              <span>
                {i.title}
                {i.quantity > 1 ? ` × ${i.quantity}` : ''}
              </span>
              <span>{gbp(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{gbp(subtotal)}</span>
        </div>
        {needsShipping && (
          <div className="summary-row">
            <span>Postage</span>
            <span>{selected ? gbp(postage) : '—'}</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Total</span>
          <strong>{gbp(subtotal + postage)}</strong>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!paypalClientId ? (
          <p className="notice">Online payment is not switched on yet (PayPal keys missing).</p>
        ) : cannotShip ? null : (
          <div className={paying ? 'paypal-wrap busy' : 'paypal-wrap'}>
            <PayPalScriptProvider
              options={{ clientId: paypalClientId, currency: 'GBP', intent: 'capture', components: 'buttons' }}
            >
              <PayPalButtons
                style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                forceReRender={[subtotal + postage]}
                onClick={(_data, actions) => {
                  const problem = validate()
                  setError(problem)
                  return problem ? actions.reject() : actions.resolve()
                }}
                createOrder={async () => {
                  const f = formRef.current
                  const res = await fetch('/checkout/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
                      customer: { name: f.name, email: f.email, phone: f.phone },
                      address: needsShipping
                        ? { line1: f.line1, line2: f.line2, city: f.city, postcode: f.postcode, country: f.country }
                        : undefined,
                      shippingId: needsShipping ? (f.shippingId || selected?.id) : undefined,
                    }),
                  })
                  const json = await res.json()
                  if (!res.ok) {
                    setError(json.error)
                    throw new Error(json.error)
                  }
                  return json.id
                }}
                onApprove={async (data) => {
                  setPaying(true)
                  const res = await fetch('/checkout/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paypalOrderId: data.orderID }),
                  })
                  const json = await res.json()
                  if (!res.ok) {
                    setPaying(false)
                    setError(json.error)
                    return
                  }
                  clear()
                  router.push(json.redirect)
                }}
                onError={() => setError((e) => e ?? 'PayPal could not complete the payment. Please try again.')}
              />
            </PayPalScriptProvider>
            <p className="muted small center">Pay securely with PayPal or a debit / credit card.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
