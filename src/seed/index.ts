/**
 * Imports the content downloaded from the old WordPress / WooCommerce site.
 *
 *   pnpm seed            # wipes shop + page content and re-imports everything
 *
 * Reads ../data (products JSON, images, curated pages) produced by the scripts in ../scripts.
 * Orders, mentorship applications, users and download files are never touched.
 */
import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { getPayload } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

import config from '@payload-config'

const DATA = path.resolve(process.cwd(), '../data')

type WooProduct = {
  id: number
  name: string
  slug: string
  description: string
  short_description: string
  prices: { price: string; regular_price: string; currency_minor_unit: number }
  categories: { id: number; slug: string }[]
  images: { src: string; alt: string; name: string }[]
  is_in_stock: boolean
}
type WooCategory = { id: number; name: string; slug: string; parent: number }
type CuratedPage = {
  slug: string
  title: string
  tagline: string | null
  html: string
  order: number
}

const readJSON = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

const decode = (s: string) =>
  new JSDOM(`<!doctype html><body>${s}`).window.document.body.textContent?.trim() ?? s

const CATEGORY_TITLES: Record<string, { title: string; sortOrder: number }> = {
  books: { title: 'Books', sortOrder: 1 },
  ebooks: { title: 'Ebooks', sortOrder: 2 },
  songs: { title: 'Songs & Music', sortOrder: 3 },
  spanish: { title: 'Spanish (Español)', sortOrder: 4 },
  souvenirs: { title: 'Souvenirs', sortOrder: 5 },
  mentorship: { title: 'Mentorship', sortOrder: 6 },
}

const MENTORSHIP_TIERS = [
  { tier: 1, price: 850, period: 'per year', slug: 'mentorship-tier-1' },
  { tier: 2, price: 650, period: 'per 6 months', slug: 'mentorship-tier-2' },
  { tier: 3, price: 500, period: 'per 3 months', slug: 'mentorship-tier-3' },
]

async function run() {
  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const toRichText = (rawHtml: string) => {
    // inline <img>/<iframe> would become upload nodes pointing at nothing; covers are imported separately
    const html = rawHtml.replace(/<(img|iframe|video|audio|source)\b[^>]*>(<\/\1>)?/gi, '').trim()
    return html ? (convertHTMLToLexical({ editorConfig, html, JSDOM }) as any) : undefined
  }

  // ---- wipe previously imported content -------------------------------------------------
  for (const collection of ['products', 'categories', 'pages', 'media'] as const) {
    const { totalDocs } = await payload
      .delete({
        collection,
        where: { id: { exists: true } },
        overrideAccess: true,
        // remote databases (Neon) kill transactions left open during slow Blob uploads
        disableTransaction: true,
      })
      .then((r) => ({ totalDocs: r.docs.length }))
    payload.logger.info(`cleared ${totalDocs} ${collection}`)
  }

  // ---- categories ----------------------------------------------------------------------
  const wooCategories = readJSON<WooCategory[]>('raw/categories.json').filter(
    (c) => c.slug !== 'uncategorized',
  )
  const categoryIdBySlug: Record<string, number> = {}
  const createCategory = async (slug: string, parent?: number) => {
    const meta = CATEGORY_TITLES[slug] ?? { title: slug, sortOrder: 99 }
    const doc = await payload.create({
      collection: 'categories',
      data: { title: meta.title, slug, sortOrder: meta.sortOrder, parent },
      overrideAccess: true,
      // remote databases (Neon) kill transactions left open during slow Blob uploads
      disableTransaction: true,
    })
    categoryIdBySlug[slug] = doc.id
  }
  for (const c of wooCategories.filter((c) => c.parent === 0)) await createCategory(c.slug)
  for (const c of wooCategories.filter((c) => c.parent !== 0)) {
    const parentSlug = wooCategories.find((p) => p.id === c.parent)?.slug
    await createCategory(c.slug, parentSlug ? categoryIdBySlug[parentSlug] : undefined)
  }
  await createCategory('mentorship')
  payload.logger.info(`created ${Object.keys(categoryIdBySlug).length} categories`)

  // ---- images ----------------------------------------------------------------------------
  const mediaIdBySrc: Record<string, number> = {}
  const uploadImage = async (src: string, alt: string) => {
    if (mediaIdBySrc[src]) return mediaIdBySrc[src]
    // same naming as the download step: wp-content/uploads/2022/05/x.png → 2022-05-x.png
    const fileName = src.replace(/^.*\/uploads\//, '').replace(/\//g, '-')
    const filePath = path.join(DATA, 'images', fileName)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      const res = await fetch(src)
      if (!res.ok) {
        payload.logger.warn(`image missing, skipped: ${src}`)
        return undefined
      }
      fs.writeFileSync(filePath, Buffer.from(await res.arrayBuffer()))
    }
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      filePath,
      overrideAccess: true,
      // remote databases (Neon) kill transactions left open during slow Blob uploads
      disableTransaction: true,
    })
    mediaIdBySrc[src] = doc.id
    return doc.id
  }

  // ---- products -------------------------------------------------------------------------
  const products = [
    ...readJSON<WooProduct[]>('raw/products-1.json'),
    ...readJSON<WooProduct[]>('raw/products-2.json'),
  ]
  let i = 0
  for (const p of products) {
    i++
    const title = decode(p.name)
    const catSlugs = p.categories.map((c) => c.slug).filter((s) => categoryIdBySlug[s])
    const isDigital =
      catSlugs.includes('ebooks') && !catSlugs.includes('books')
        ? true
        : /e-?book|libro electr/i.test(title)
    const unit = 10 ** p.prices.currency_minor_unit
    const price = Number(p.prices.price) / unit
    const regular = Number(p.prices.regular_price) / unit

    const images: number[] = []
    for (const img of p.images) {
      const id = await uploadImage(img.src, img.alt || title)
      if (id) images.push(id)
    }

    await payload
      .create({
        collection: 'products',
        data: {
          title,
          slug: p.slug,
          price,
          compareAtPrice: regular > price ? regular : undefined,
          format: isDigital ? 'digital' : 'physical',
          images,
          excerpt: p.short_description ? decode(p.short_description) : undefined,
          description: toRichText(p.description),
          categories: catSlugs.map((s) => categoryIdBySlug[s]),
          inStock: p.is_in_stock,
          published: true,
          wooId: p.id,
          sortOrder: -p.id, // newest WooCommerce products first
        },
        overrideAccess: true,
        // remote databases (Neon) kill transactions left open during slow Blob uploads
        disableTransaction: true,
      })
      .catch((err) => {
        payload.logger.error(`product ${p.id} ${p.slug}: ${JSON.stringify(err?.data?.errors)}`)
        throw err
      })
    if (i % 20 === 0) payload.logger.info(`imported ${i}/${products.length} products`)
  }
  payload.logger.info(
    `imported ${products.length} products, ${Object.keys(mediaIdBySrc).length} images`,
  )

  // ---- content pages ---------------------------------------------------------------------
  const pages = readJSON<CuratedPage[]>('pages.json')
  const footerSlugs = [
    'terms-and-conditions',
    'privacy-policy',
    'cookie-policy',
    'postage-and-delivery',
  ]
  for (const page of pages) {
    await payload.create({
      collection: 'pages',
      data: {
        title: page.title,
        slug: page.slug,
        tagline: page.tagline ?? undefined,
        content: toRichText(page.html),
        published: true,
        showInFooter: footerSlugs.includes(page.slug),
        sortOrder: page.order,
      },
      overrideAccess: true,
      // remote databases (Neon) kill transactions left open during slow Blob uploads
      disableTransaction: true,
    })
  }
  payload.logger.info(`imported ${pages.length} pages`)

  // ---- mentorship packages as buyable products ---------------------------------------------
  for (const t of MENTORSHIP_TIERS) {
    const page = pages.find((p) => p.slug === t.slug)
    await payload.create({
      collection: 'products',
      data: {
        title: `Glory & Wisdom Mentorship – Tier ${t.tier} (${t.period})`,
        slug: `glory-and-wisdom-mentorship-tier-${t.tier}`,
        price: t.price,
        format: 'service',
        excerpt: `Tier ${t.tier} package – £${t.price} ${t.period}. The registration fee is non-refundable.`,
        description: page ? toRichText(page.html) : undefined,
        categories: [categoryIdBySlug.mentorship],
        published: true,
        sortOrder: t.tier,
      },
      overrideAccess: true,
      // remote databases (Neon) kill transactions left open during slow Blob uploads
      disableTransaction: true,
    })
  }

  // ---- site settings ---------------------------------------------------------------------
  const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      heroTagline: 'FAITH GROWS BY HEARING',
      heroTitle: 'Welcome',
      intro: toRichText(
        `<p>Welcome to Favour Land Christian Books and Music, the online home of Favour Land Ltd.</p>
<p>Build your faith and spirit, and change your life and circumstances through anointed Christian books, newsletters, inspirational and uplifting praise and worship, and Spirit-filled mentorship. Here is an opportunity for you to obtain Apostle (Rev.) Ifeoma Fiiriter’s anointed life-changing books and music, and access our prime Holy Spirit-led Mentorship programme designed for you. You will also find other great resources, products and services we offer.</p>
<p>Shop our online Christian bookstore containing inspirational Christian books and music designed to meet various needs in your life. The testimonials page contains just a few testimonies from people who were greatly blessed by our ministry products.</p>`,
      ),
      mentorshipCta: 'Join the Glory and Wisdom Mentorship Programme today!',
      siteName: 'Favour Land Christian Books and Music',
      companyName: 'Favour Land Ltd',
      email: 'support@favourbooksandmusic.com',
      phone: '+44 161 273 6597',
      address: 'Favour Land Ltd\n5 Keswick Close\nArdwick\nManchester M13 0DD\nUnited Kingdom',
      socialLinks: [
        { label: 'Facebook', url: 'https://www.facebook.com/favourbooksandmusic/' },
        { label: 'YouTube', url: 'https://www.youtube.com/channel/UCAeFTeSrSuLYdHWm9MLNcbw' },
        { label: 'Instagram', url: 'https://www.instagram.com/FavourlandLTD/' },
      ],
      // Rates copied from the live WooCommerce store. It had no rates for outside the UK.
      shippingMethods: settings.shippingMethods?.length
        ? settings.shippingMethods
        : [
            { label: 'Royal Mail 1st Class Signed For', price: 5, region: 'uk', enabled: true },
            { label: 'Royal Mail 2nd Class Signed For', price: 4, region: 'uk', enabled: true },
            { label: 'International Tracked', price: 15, region: 'international', enabled: false },
          ],
    },
  })

  payload.logger.info('seed complete')
  process.exit(0)
}

// `payload run` exits as soon as this module finishes loading, so the work must be awaited here
await run().catch((err) => {
  console.error(err)
  process.exit(1)
})
