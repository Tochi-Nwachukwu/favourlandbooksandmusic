import { CartView } from '@/components/CartView'

export const metadata = { title: 'Your basket' }

export default function CartPage() {
  return (
    <div className="container section">
      <header className="page-head">
        <h1>Your basket</h1>
      </header>
      <CartView />
    </div>
  )
}
