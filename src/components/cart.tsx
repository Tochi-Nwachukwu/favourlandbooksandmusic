'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: number
  slug: string
  title: string
  price: number
  image?: string
  format: 'physical' | 'digital' | 'service'
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  ready: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (id: number, quantity: number) => void
  remove: (id: number) => void
  clear: () => void
}

const STORAGE_KEY = 'favourland-cart'
const CartContext = createContext<CartContextValue | null>(null)

const maxQuantity = (format: CartItem['format']) => (format === 'physical' ? 20 : 1)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {
      // storage unavailable (private mode) – the cart just won't persist
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, ready])

  const add = useCallback<CartContextValue['add']>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, maxQuantity(item.format)) }
            : i,
        )
      }
      return [...prev, { ...item, quantity: Math.min(quantity, maxQuantity(item.format)) }]
    })
  }, [])

  const setQuantity = useCallback((id: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, maxQuantity(i.format)) } : i))
        .filter((i) => i.quantity > 0),
    )
  }, [])

  const remove = useCallback((id: number) => setItems((prev) => prev.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export const gbp = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)

export function CartCount() {
  const { count, ready } = useCart()
  if (!ready || !count) return null
  return <span className="cart-count">{count}</span>
}

export function AddToCartButton({
  product,
  disabled,
}: {
  product: Omit<CartItem, 'quantity'>
  disabled?: boolean
}) {
  const { add, items } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.id === product.id)
  const atMax = inCart && inCart.quantity >= maxQuantity(product.format)

  return (
    <div className="add-to-cart">
      <button
        className="btn btn-primary btn-lg"
        disabled={disabled || Boolean(atMax)}
        onClick={() => {
          add(product)
          setAdded(true)
          setTimeout(() => setAdded(false), 2000)
        }}
      >
        {disabled ? 'Out of stock' : atMax ? 'In your basket' : added ? 'Added ✓' : 'Add to basket'}
      </button>
      {inCart && (
        <a className="btn btn-ghost btn-lg" href="/cart">
          View basket
        </a>
      )}
    </div>
  )
}
