'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/** Closes the mobile menu (a CSS checkbox toggle) whenever the route changes. */
export function MobileMenuCloser() {
  const pathname = usePathname()
  useEffect(() => {
    const toggle = document.getElementById('nav-toggle') as HTMLInputElement | null
    if (toggle) toggle.checked = false
  }, [pathname])
  return null
}

/** Mentorship band shown above the footer; hidden on the cart and checkout steps. */
export function CtaBand({ text }: { text: string }) {
  const pathname = usePathname()
  if (/^\/(cart|checkout|order)/.test(pathname)) return null
  const href = pathname === '/mentorship' ? '#apply' : '/mentorship'
  return (
    <section className="cta-band" aria-label="Mentorship">
      <div className="container cta-inner">
        <h2>{text}</h2>
        <Link href={href} className="btn btn-primary btn-lg btn-arrow">
          Join now
        </Link>
      </div>
    </section>
  )
}

const COOKIE_KEY = 'favourland-cookie-notice'

export function CookieNotice() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      setShow(localStorage.getItem(COOKIE_KEY) !== 'ok')
    } catch {
      setShow(true)
    }
  }, [])
  if (!show) return null
  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <div className="container">
        <p>We use cookies to ensure that we give you the best experience on our website.</p>
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => {
            try {
              localStorage.setItem(COOKIE_KEY, 'ok')
            } catch {}
            setShow(false)
          }}
        >
          Ok
        </button>
        <Link href="/privacy-policy">Privacy policy</Link>
      </div>
    </div>
  )
}
