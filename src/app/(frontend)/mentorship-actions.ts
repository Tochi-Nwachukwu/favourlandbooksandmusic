'use server'

import {
  DISCOVERY_OPTIONS,
  MENTORSHIP_REASONS,
  tierForReasons,
} from '@/collections/MentorshipApplications'
import { getPayloadClient } from '@/lib/payload'

export type ApplicationState = { ok: boolean; error?: string; tier?: 1 | 2 | 3 }

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim().slice(0, 500)

export async function submitMentorshipApplication(
  _prev: ApplicationState,
  form: FormData,
): Promise<ApplicationState> {
  // honeypot: real people never see or fill this field
  if (str(form, 'website')) return { ok: true, tier: 3 }

  const reasons = form.getAll('reasons').map(String).filter((r) => MENTORSHIP_REASONS.includes(r))
  const data = {
    firstName: str(form, 'firstName'),
    lastName: str(form, 'lastName'),
    email: str(form, 'email').toLowerCase(),
    phone: str(form, 'phone'),
    gender: (['Male', 'Female'].includes(str(form, 'gender')) ? str(form, 'gender') : undefined) as
      | 'Male'
      | 'Female'
      | undefined,
    address: str(form, 'address'),
    city: str(form, 'city'),
    zip: str(form, 'zip'),
    country: str(form, 'country'),
    birthday: str(form, 'birthday'),
    reasons: reasons as any,
    discoveredVia: (DISCOVERY_OPTIONS.includes(str(form, 'discoveredVia'))
      ? str(form, 'discoveredVia')
      : undefined) as any,
    companions: str(form, 'companions'),
  }

  if (!data.firstName || !data.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { ok: false, error: 'Please enter your first name, last name and a valid email.' }
  }
  if (![1, 3, 5].includes(reasons.length)) {
    return { ok: false, error: 'Please tick exactly 1, 3 or 5 reasons for signing up.' }
  }

  const tier = tierForReasons(reasons.length)
  const payload = await getPayloadClient()
  await payload.create({
    collection: 'mentorship-applications',
    overrideAccess: true,
    data: { ...data, suggestedTier: String(tier) as '1' | '2' | '3', status: 'new' },
  })
  if (process.env.SHOP_NOTIFY_EMAIL) {
    await payload
      .sendEmail({
        to: process.env.SHOP_NOTIFY_EMAIL,
        subject: `New mentorship application – ${data.firstName} ${data.lastName} (Tier ${tier})`,
        text: `${data.firstName} ${data.lastName} <${data.email}> applied.\nReasons: ${reasons.join('; ')}\nSee the admin panel for details.`,
      })
      .catch(() => {})
  }
  return { ok: true, tier }
}
