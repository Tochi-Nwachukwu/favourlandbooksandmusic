import { Alex_Brush, Poppins } from 'next/font/google'
import Link from 'next/link'
import React from 'react'

import { CartCount, CartProvider } from '@/components/cart'
import { CookieNotice, CtaBand, MobileMenuCloser } from '@/components/SiteChrome'
import { getPayloadClient } from '@/lib/payload'
import './styles.css'

const sans = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})
const script = Alex_Brush({ subsets: ['latin'], weight: '400', variable: '--font-script' })

export const metadata = {
  title: {
    default: "Favour Land Christian Books and Music – Explore the wonderful riches of God's word",
    template: '%s – Favour Land Christian Books and Music',
  },
  description:
    "Anointed Christian books, ebooks, praise and worship music, and the Glory & Wisdom Mentorship programme by Apostle (Rev.) Ifeoma Fiiriter.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
}

type NavItem = { href: string; label: string; external?: boolean; children?: NavItem[] }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayloadClient()
  const [settings, footerPages, categories] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.find({
      collection: 'pages',
      where: { showInFooter: { equals: true }, published: { equals: true } },
      depth: 0,
      limit: 20,
      sort: 'sortOrder',
      select: { title: true, slug: true },
    }),
    payload.find({
      collection: 'categories',
      where: { slug: { not_equals: 'mentorship' } },
      sort: 'sortOrder',
      depth: 0,
      limit: 20,
      select: { title: true, slug: true },
    }),
  ])

  const nav: NavItem[] = [
    { href: '/', label: 'Welcome' },
    {
      href: '/about-us',
      label: 'About us',
      children: [
        { href: '/testimonies', label: 'Testimonies' },
        { href: '/terms-and-conditions', label: 'FLP Terms and Conditions' },
      ],
    },
    {
      href: '/shop',
      label: 'Online Store',
      children: categories.docs.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.title })),
    },
    {
      href: '/mentorship',
      label: 'Mentorship',
      children: [1, 2, 3].map((n) => ({ href: `/mentorship-tier-${n}`, label: `Mentorship – Tier ${n}` })),
    },
    { href: '/contact-us', label: 'Contact us' },
    { href: 'https://www.rormi.org.uk/', label: 'RORMI', external: true },
  ]

  const navLink = (n: NavItem) =>
    n.external ? (
      <a href={n.href} target="_blank" rel="noopener noreferrer">
        {n.label}
      </a>
    ) : (
      <Link href={n.href}>{n.label}</Link>
    )

  return (
    <html lang="en-GB" className={`${sans.variable} ${script.variable}`}>
      <body>
        <CartProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="brand">
                Favour Land Christian Books and Music
              </Link>
              <input type="checkbox" id="nav-toggle" className="nav-toggle" aria-label="Open menu" />
              <label htmlFor="nav-toggle" className="nav-burger" aria-hidden>
                <span />
              </label>
              <nav className="main-nav" aria-label="Main">
                <ul className="menu">
                  {nav.map((n) => (
                    <li key={n.href} className={n.children?.length ? 'has-sub' : undefined}>
                      {navLink(n)}
                      {!!n.children?.length && (
                        <ul className="sub-menu">
                          {n.children.map((c) => (
                            <li key={c.href}>{navLink(c)}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="header-actions">
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
          <MobileMenuCloser />

          <main id="main">{children}</main>

          <CtaBand text={settings.mentorshipCta || 'Join the Glory and Wisdom Mentorship Programme today!'} />

          <footer className="site-footer">
            <div className="container">
              <ul className="footer-links">
                {footerPages.docs.map((p) => (
                  <li key={p.id}>
                    <Link href={`/${p.slug}`}>{p.title}</Link>
                  </li>
                ))}
              </ul>
              <p className="footer-meta">
                {settings.phone && <a href={`tel:${settings.phone.replace(/\s+/g, '')}`}>{settings.phone}</a>}
                {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
                {settings.socialLinks?.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
              </p>
              <p className="footer-bottom">
                © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
              </p>
            </div>
          </footer>
          <CookieNotice />
        </CartProvider>
      </body>
    </html>
  )
}
