import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/cart'
import { ProductGrid } from '@/components/ProductCard'
import { RichText } from '@/components/RichText'
import type { Category, Media } from '@/payload-types'
import { coverOf, FORMAT_LABEL, formatGBP, getPayloadClient, imageUrl } from '@/lib/payload'

export const revalidate = 60

async function getProduct(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 1,
  })
  return docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug)
  if (!product) return {}
  const image = imageUrl(coverOf(product), 'large')
  return {
    title: product.title,
    description: product.excerpt || undefined,
    openGraph: image ? { images: [image] } : undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()

  const payload = await getPayloadClient()
  const categories = (product.categories ?? []).filter((c): c is Category => typeof c === 'object')
  const images = (product.images ?? []).filter((m): m is Media => typeof m === 'object')
  const cover = images[0]
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price

  const related = categories[0]
    ? await payload.find({
        collection: 'products',
        where: {
          'categories.slug': { equals: categories[0].slug },
          id: { not_equals: product.id },
          published: { equals: true },
        },
        sort: 'sortOrder',
        limit: 4,
        depth: 1,
      })
    : null

  return (
    <div className="container section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        {categories[0] && (
          <>
            {' / '}
            <Link href={`/shop?category=${categories[0].slug}`}>{categories[0].title}</Link>
          </>
        )}
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          {cover ? (
            <div className="product-main-image">
              <Image
                src={imageUrl(cover, 'large')!}
                alt={cover.alt || product.title}
                fill
                priority
                sizes="(max-width: 860px) 100vw, 480px"
              />
            </div>
          ) : (
            <div className="product-main-image placeholder">{product.title}</div>
          )}
          {images.length > 1 && (
            <div className="thumb-row">
              {images.slice(1).map((m) => (
                <img key={m.id} src={imageUrl(m, 'thumbnail')} alt={m.alt || ''} />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="eyebrow">{FORMAT_LABEL[product.format]}</p>
          <h1>{product.title}</h1>
          <p className="price price-lg">
            {formatGBP(product.price)}
            {onSale && <s>{formatGBP(product.compareAtPrice!)}</s>}
          </p>
          {product.excerpt && <p className="lead">{product.excerpt}</p>}

          <AddToCartButton
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

          <ul className="assurances">
            {product.format === 'digital' && <li>Download link emailed straight after payment</li>}
            {product.format === 'physical' && <li>UK delivery within 7 working days · Royal Mail Signed For</li>}
            {product.format === 'service' && <li>We’ll email you within 3 working days to arrange your first meeting</li>}
            <li>Secure payment with PayPal or card</li>
          </ul>

          <RichText data={product.description} />
        </div>
      </div>

      {related && related.docs.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>You may also like</h2>
          </div>
          <ProductGrid products={related.docs} />
        </section>
      )}
    </div>
  )
}
