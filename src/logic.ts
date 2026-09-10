// Pure helpers for the CarLinko card — kept here so node --test can exercise them.

/** "B 1234 PGB" -> "B •••• PGB": keep the first char and the last 3, dot out the rest. */
export function maskPlate(name: string, mask = true): string {
  if (!mask || name.length <= 4) return name
  return name.slice(0, 1) + name.slice(1, -3).replace(/\S/g, '•') + name.slice(-3)
}

export type CarState = 'charging' | 'driving' | 'parked'

export function carState(chargeState: string | undefined, speed: number, hvActive: boolean): CarState {
  if (chargeState === 'charging') return 'charging'
  if (speed > 0 || hvActive) return 'driving'
  return 'parked'
}

export interface StatRow {
  start: number // ms epoch, start of the statistics period
  change?: number | null
}

const DAY = 86400000

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Sums recorder `change` rows into today / last-7-days / month-to-date kilometres. */
export function drivenKm(rows: StatRow[], now: Date = new Date()) {
  const today0 = midnight(now)
  const week0 = today0 - 6 * DAY
  const month0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let today = 0
  let week = 0
  let month = 0
  for (const r of rows) {
    const c = Number(r.change)
    if (!Number.isFinite(c) || c < 0) continue // odometer resets / bogus rows
    if (r.start >= today0) today += c
    if (r.start >= week0) week += c
    if (r.start >= month0) month += c
  }
  return { today, week, month }
}

/** Last 7 daily totals, oldest first, for the bar chart. */
export function last7Days(rows: StatRow[], now: Date = new Date()): number[] {
  const today0 = midnight(now)
  const out = [0, 0, 0, 0, 0, 0, 0]
  for (const r of rows) {
    const c = Number(r.change)
    if (!Number.isFinite(c) || c < 0) continue
    const i = 6 - Math.round((today0 - midnight(new Date(r.start))) / DAY)
    if (i >= 0 && i < 7) out[i] += c
  }
  return out
}

export type TyreLevel = 'ok' | 'warn' | 'low' | 'none'

/**
 * Rates each tyre against the average of the ones that are reporting.
 *
 * Relative, not absolute, so it needs no per-car target and works whatever
 * unit the entities are displayed in. A tyre reading 0/null is 'none'.
 */
export function tyreLevels(values: (number | null)[]): TyreLevel[] {
  const live = values.filter((v): v is number => v !== null && v > 0)
  if (!live.length) return values.map(() => 'none')
  const avg = live.reduce((a, b) => a + b, 0) / live.length
  return values.map((v) =>
    v === null || v <= 0 ? 'none' : v < avg * 0.9 ? 'low' : v < avg * 0.95 ? 'warn' : 'ok',
  )
}
