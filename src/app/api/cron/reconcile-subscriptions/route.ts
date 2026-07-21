import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabaseClient, findAuthUserByEmail } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

// Safety-net cron. Stripe webhooks are best-effort — a dropped delivery, a
// timeout, or a handler error can silently leave a paid subscriber inactive.
// This job treats Stripe as the source of truth and reconciles the DB against
// it every run: it activates any active Stripe subscription missing/stale in
// the DB, and revokes DB rows whose own Stripe subscription went inactive.
// It never touches users who have no Stripe subscription row (e.g. other
// payment sources), so it can only heal Stripe drift, not cause new drift.

export const maxDuration = 60

const ADMIN_EMAIL =
  process.env.ADMIN_ALERT_EMAIL || 'dcardinesiii@gmail.com'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

// Statuses that should grant membership access.
const ACTIVE_STATUSES = new Set(['active', 'trialing'])

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'canceled': return 'cancelled'
    case 'paused': return 'paused'
    case 'past_due': return 'past_due'
    case 'unpaid': return 'expired'
    case 'incomplete': return 'incomplete'
    case 'incomplete_expired': return 'expired'
    case 'trialing': return 'trialing'
    case 'active': return 'active'
    default: return status
  }
}

interface SubWithPeriods extends Stripe.Subscription {
  current_period_start?: number
  current_period_end?: number
}

function toISO(unix?: number | null): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  const supabase = createAdminSupabaseClient()

  const changes: string[] = []
  const errors: string[] = []
  let stripeCount = 0

  try {
    // 1. Pull every Stripe subscription (all statuses, auto-paginated).
    const allSubs = await stripe.subscriptions
      .list({ status: 'all', limit: 100 })
      .autoPagingToArray({ limit: 10000 })
    stripeCount = allSubs.length

    for (const raw of allSubs) {
      const sub = raw as SubWithPeriods
      try {
        // Resolve the owning user: verified metadata id, else by customer email.
        let userId: string | null = null
        const metaUserId = sub.metadata?.user_id
        if (metaUserId) {
          const { data: byId } = await supabase.auth.admin.getUserById(metaUserId)
          if (byId?.user) userId = byId.user.id
        }

        if (!userId) {
          const customer = await stripe.customers.retrieve(sub.customer as string)
          const email =
            !customer.deleted && 'email' in customer ? customer.email : null
          if (email) {
            const existing = await findAuthUserByEmail(supabase, email)
            if (existing) {
              userId = existing.id
            } else if (ACTIVE_STATUSES.has(sub.status)) {
              // Active payer with no account yet — create one so access works.
              const { data: created, error: createErr } =
                await supabase.auth.admin.createUser({
                  email: email.toLowerCase(),
                  email_confirm: true,
                })
              if (createErr || !created.user) {
                errors.push(`create user ${email}: ${createErr?.message}`)
                continue
              }
              userId = created.user.id
              changes.push(`created user ${email} for ${sub.id}`)
            }
          }
        }

        if (!userId) continue // inactive + unknown user — nothing to do

        const status = mapStripeStatus(sub.status)
        const isActive = ACTIVE_STATUSES.has(sub.status)

        // Compare against current DB row for this user.
        const { data: dbRow } = await supabase
          .from('subscriptions')
          .select('stripe_subscription_id, status')
          .eq('user_id', userId)
          .maybeSingle()

        // Only reconcile from the newest Stripe sub. If the DB already tracks a
        // different (newer) subscription id, skip stale older ones.
        if (
          dbRow?.stripe_subscription_id &&
          dbRow.stripe_subscription_id !== sub.id &&
          !isActive
        ) {
          continue
        }

        const needsWrite =
          !dbRow ||
          dbRow.stripe_subscription_id !== sub.id ||
          dbRow.status !== status

        if (needsWrite) {
          const { error: upErr } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                stripe_subscription_id: sub.id,
                stripe_customer_id: sub.customer as string,
                plan: sub.metadata?.plan || 'monthly',
                status,
                current_period_start: toISO(sub.current_period_start),
                current_period_end: toISO(sub.current_period_end),
                cancel_at_period_end: sub.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            )
          if (upErr) {
            errors.push(`upsert sub ${sub.id}: ${upErr.message}`)
            continue
          }
          changes.push(`sub ${sub.id} -> ${status} (user ${userId})`)
        }

        // Keep the profile flag in sync with reality.
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_subscribed')
          .eq('id', userId)
          .maybeSingle()

        if (profile && profile.is_subscribed !== isActive) {
          await supabase
            .from('profiles')
            .update({ is_subscribed: isActive })
            .eq('id', userId)
          changes.push(`profile ${userId} is_subscribed -> ${isActive}`)
        }
      } catch (e) {
        errors.push(`sub ${sub.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // 2. Alert on any change or error so failures are never silent again.
    if (changes.length > 0 || errors.length > 0) {
      const summary = [
        `Subscription reconcile run`,
        `Stripe subscriptions scanned: ${stripeCount}`,
        `Changes applied: ${changes.length}`,
        `Errors: ${errors.length}`,
        ``,
        ...(changes.length ? ['CHANGES:', ...changes] : []),
        ...(errors.length ? ['', 'ERRORS:', ...errors] : []),
      ].join('\n')

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[RemoteDesigners] Sub reconcile: ${changes.length} fixed, ${errors.length} errors`,
        text: summary,
        html: `<pre style="font-family:monospace;font-size:13px">${summary
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</pre>`,
      }).catch(err => console.error('reconcile alert email failed:', err))
    }

    return NextResponse.json({
      ok: true,
      scanned: stripeCount,
      changes,
      errors,
    })
  } catch (error) {
    console.error('Reconcile failed:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
