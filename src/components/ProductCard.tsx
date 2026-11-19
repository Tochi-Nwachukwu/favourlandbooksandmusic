import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { coverOf, formatGBP, imageUrl } from '@/lib/payload'

export function ProductCard({ product }: { product: Product }) {
  const cover = coverOf(product)
  const src = imageUrl(cover, 'card')
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price

  return (
    <Link href={`/product/${product.slug}`} className="product-card">
      <div className="product-card-image">
        {src ? (
          <Image
            src={src}
            alt={cover?.alt || product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          />
        ) : (
          <span className="placeholder">{product.title}</span>
        )}
        {product.format === 'digital' && <span className="badge">Ebook</span>}
        {onSale && <span className="badge badge-sale">Sale</span>}
      </div>
      <div className="product-card-body">
        <h3>{product.title}</h3>
        <p className="price">
          {formatGBP(product.price)}
          {onSale && <s>{formatGBP(product.compareAtPrice!)}</s>}
        </p>
      </div>
    </Link>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
