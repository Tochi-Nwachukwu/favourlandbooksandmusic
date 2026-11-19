import { Cormorant_Garamond, Inter } from 'next/font/google'
import Link from 'next/link'
import React from 'react'

import { CartCount, CartProvider } from '@/components/cart'
import { getPayloadClient } from '@/lib/payload'
import './styles.css'

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-serif',
})
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  title: {
    default: 'Favour Land Christian Books and Music',
    template: '%s – Favour Land Christian Books and Music',
  },
  description:
    "Anointed Christian books, ebooks, praise and worship music, and the Glory & Wisdom Mentorship programme by Apostle (Rev.) Ifeoma Fiiriter.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
}

const NAV = [
  { href: '/shop?category=books', label: 'Books' },
  { href: '/shop?category=ebooks', label: 'Ebooks' },
  { href: '/shop?category=songs', label: 'Music' },
  { href: '/mentorship', label: 'Mentorship' },
  { href: '/testimonies', label: 'Testimonies' },
  { href: '/about-us', label: 'About' },
  { href: '/contact-us', label: 'Contact' },
]

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayloadClient()
  const [settings, footerPages] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.find({
      collection: 'pages',
      where: { showInFooter: { equals: true }, published: { equals: true } },
      depth: 0,
      limit: 20,
      select: { title: true, slug: true },
    }),
  ])

  return (
    <html lang="en-GB" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <CartProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="brand">
                <span className="brand-mark" aria-hidden>
                  FL
                </span>
                <span className="brand-text">
                  <strong>Favour Land</strong>
                  <small>Christian Books &amp; Music</small>
                </span>
              </Link>
              <input type="checkbox" id="nav-toggle" className="nav-toggle" aria-label="Open menu" />
              <label htmlFor="nav-toggle" className="nav-burger" aria-hidden>
                <span />
              </label>
              <nav className="main-nav" aria-label="Main">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href}>
                    {n.label}
                  </Link>
                ))}
              </nav>
              <div className="header-actions">
                <Link href="/shop" className="btn btn-small btn-ghost hide-sm">
                  Shop
                </Link>
                <Link href="/cart" className="cart-link" aria-label="Basket">
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                    <path
                      d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="20" r="1.4" fill="currentColor" />
                    <circle cx="18" cy="20" r="1.4" fill="currentColor" />
                  </svg>
                  <CartCount />
                </Link>
              </div>
            </div>
          </header>

          <main id="main">{children}</main>

          <footer className="site-footer">
            <div className="container footer-grid">
              <div>
                <p className="footer-brand">{settings.siteName}</p>
                <p className="muted">
                  The online home of {settings.companyName}. Anointed books, music and Spirit-filled mentorship to
                  build your faith.
                </p>
              </div>
              <div>
                <h4>Contact</h4>
                {settings.phone && <p>{settings.phone}</p>}
                {settings.email && (
                  <p>
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  </p>
                )}
                {settings.address && <p className="muted pre">{settings.address}</p>}
              </div>
              <div>
                <h4>Information</h4>
                <ul className="plain">
                  {footerPages.docs.map((p) => (
                    <li key={p.id}>
                      <Link href={`/${p.slug}`}>{p.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Follow us</h4>
                <ul className="plain">
                  {settings.socialLinks?.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="container footer-bottom">
              © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
