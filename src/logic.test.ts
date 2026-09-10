import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maskPlate, carState, drivenKm, last7Days, tyreLevels } from './logic.ts'

test('maskPlate', () => {
  assert.equal(maskPlate('B 1234 PGB'), 'B •••• PGB')
  assert.equal(maskPlate('B 1234 PGB', false), 'B 1234 PGB')
  assert.equal(maskPlate('ABC'), 'ABC')
})

test('carState', () => {
  assert.equal(carState('charging', 0, false), 'charging')
  assert.equal(carState('idle', 42, false), 'driving')
  assert.equal(carState('idle', 0, true), 'driving')
  assert.equal(carState(undefined, 0, false), 'parked')
})

test('drivenKm / last7Days', () => {
  const now = new Date(2026, 5, 27, 10, 0, 0) // Sat 27 Jun 2026
  const d = (offset: number) => new Date(2026, 5, 27 - offset).getTime()
  const rows = [
    { start: d(0), change: 12 },
    { start: d(1), change: 30 },
    { start: d(6), change: 5 },
    { start: d(7), change: 99 }, // outside the 7-day window
    { start: d(0), change: -3 }, // bogus, ignored
  ]
  assert.deepEqual(drivenKm(rows, now), { today: 12, week: 47, month: 146 })
  assert.deepEqual(last7Days(rows, now), [5, 0, 0, 0, 0, 30, 12])
})

test('tyreLevels', () => {
  // all equal -> all ok
  assert.deepEqual(tyreLevels([40, 40, 40, 40]), ['ok', 'ok', 'ok', 'ok'])
  // one well below the mean -> low, others stay ok
  assert.deepEqual(tyreLevels([40, 40, 30, 40]), ['ok', 'ok', 'low', 'ok'])
  // missing readings are 'none' and do not drag the average down
  assert.deepEqual(tyreLevels([40, 40, null, 0]), ['ok', 'ok', 'none', 'none'])
  // nothing reporting at all
  assert.deepEqual(tyreLevels([null, null, null, null]), ['none', 'none', 'none', 'none'])
})
