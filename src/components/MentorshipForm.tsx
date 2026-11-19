'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import {
  submitMentorshipApplication,
  type ApplicationState,
} from '@/app/(frontend)/mentorship-actions'

export function MentorshipForm({
  reasons,
  discovery,
  tierLinks,
}: {
  reasons: string[]
  discovery: string[]
  tierLinks: Record<string, string>
}) {
  const [state, action, pending] = useActionState<ApplicationState, FormData>(
    submitMentorshipApplication,
    { ok: false },
  )
  const [ticked, setTicked] = useState(0)

  if (state.ok && state.tier) {
    return (
      <div className="success-card">
        <h3>Thank you – your application has been received.</h3>
        <p>
          Based on the reasons you selected, the <strong>Tier {state.tier}</strong> package is for you. Please
          complete your registration by paying for the package below.
        </p>
        <Link className="btn btn-primary btn-lg" href={tierLinks[state.tier] ?? '/shop?category=mentorship'}>
          Continue to Tier {state.tier} package
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="mentorship-form">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
      <div className="field-grid">
        <label>
          First name *
          <input name="firstName" required autoComplete="given-name" />
        </label>
        <label>
          Last name *
          <input name="lastName" required autoComplete="family-name" />
        </label>
        <label>
          Email address *
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Phone number
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Gender
          <select name="gender" defaultValue="">
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
        <label>
          Birthday
          <input name="birthday" type="date" />
        </label>
        <label className="span-2">
          Address
          <input name="address" autoComplete="street-address" />
        </label>
        <label>
          City
          <input name="city" autoComplete="address-level2" />
        </label>
        <label>
          Postcode / Zip
          <input name="zip" autoComplete="postal-code" />
        </label>
        <label className="span-2">
          Country
          <input name="country" autoComplete="country-name" />
        </label>
      </div>

      <fieldset>
        <legend>
          What are your reasons for signing up? Tick 1, 3 or 5 most relevant to you *{' '}
          <span className={[1, 3, 5].includes(ticked) ? 'pill ok' : 'pill'}>{ticked} ticked</span>
        </legend>
        <div className="checkbox-grid">
          {reasons.map((r) => (
            <label key={r} className="check">
              <input
                type="checkbox"
                name="reasons"
                value={r}
                onChange={(e) => setTicked((n) => n + (e.target.checked ? 1 : -1))}
              />
              {r}
            </label>
          ))}
        </div>
        <p className="muted small">1 reason → Tier 3 · 3 reasons → Tier 2 · 5 reasons → Tier 1</p>
      </fieldset>

      <div className="field-grid">
        <label>
          How did you discover Glory and Wisdom Mentorship?
          <select name="discoveredVia" defaultValue="">
            <option value="">—</option>
            {discovery.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="span-2">
          If you wish to complete this programme with family members or friends, please write their names and
          your relationship
          <textarea name="companions" rows={3} />
        </label>
      </div>

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  )
}
