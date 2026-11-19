import { CheckoutForm, type ShippingOption } from '@/components/CheckoutForm'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Checkout' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const shippingOptions: ShippingOption[] = (settings.shippingMethods ?? [])
    .filter((m) => m.enabled && m.id)
    .map((m) => ({ id: m.id!, label: m.label, price: m.price, region: m.region }))

  return (
    <div className="container section">
      <header className="page-head">
        <h1>Checkout</h1>
      </header>
      <CheckoutForm
        shippingOptions={shippingOptions}
        paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || undefined}
      />
    </div>
  )
}
