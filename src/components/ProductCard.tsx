import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { QuickAddButton } from '@/components/cart'
import { coverOf, formatGBP, imageUrl } from '@/lib/payload'

export function ProductCard({ product }: { product: Product }) {
  const cover = coverOf(product)
  const src = imageUrl(cover, 'card')
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price
  const href = `/product/${product.slug}`

  return (
    <article className="product-card">
      <Link href={href} className="product-card-image" tabIndex={-1} aria-hidden>
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 320px"
          />
        ) : (
          <span className="placeholder">{product.title}</span>
        )}
        {product.format === 'digital' && <span className="badge">Ebook</span>}
        {onSale && <span className="badge badge-sale">Sale!</span>}
      </Link>
      <div className="product-card-body">
        <h3>
          <Link href={href}>{product.title}</Link>
        </h3>
        <p className="price">
          {formatGBP(product.price)}
          {onSale && (
            <s>
              <span className="sr-only">was </span>
              {formatGBP(product.compareAtPrice!)}
            </s>
          )}
        </p>
        <QuickAddButton
          disabled={!product.inStock}
          product={{
            id: product.id,
            slug: product.slug!,
            title: product.title,
            price: product.price,
            format: product.format,
            image: imageUrl(cover, 'thumbnail'),
          }}
        />
      </div>
    </article>
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
