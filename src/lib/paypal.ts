/**
 * Minimal PayPal Orders v2 client (server only).
 * Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_ENV=sandbox|live.
 */
const base = () =>
  process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

export const paypalConfigured = () =>
  Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)

async function accessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64')
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`)
  return (await res.json()).access_token
}

async function call<T>(path: string, body: unknown, requestId?: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`PayPal ${path} failed: ${res.status} ${JSON.stringify(json)}`)
  return json as T
}

type Money = { currency_code: string; value: string }

export type PayPalOrder = {
  id: string
  status: string
  payer?: { email_address?: string }
  purchase_units: {
    reference_id?: string
    payments?: { captures?: { id: string; status: string; amount: Money }[] }
  }[]
}

export const createPayPalOrder = (body: Record<string, unknown>, requestId: string) =>
  call<PayPalOrder>('/v2/checkout/orders', body, requestId)

export const capturePayPalOrder = (paypalOrderId: string) =>
  call<PayPalOrder>(`/v2/checkout/orders/${paypalOrderId}/capture`, {}, `capture-${paypalOrderId}`)
