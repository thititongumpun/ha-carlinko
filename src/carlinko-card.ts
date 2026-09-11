import { maskPlate, carState, drivenKm, last7Days, tyreLevels, type StatRow } from './logic.ts'

// ponytail: no INSIGHTS section from the reference dashboard — the integration exposes no cost
// entities, so it would be invented data. Add it when those entities exist.

const TYRES = ['fl', 'fr', 'rl', 'rr'] as const

const DEFAULT_ACCENT = '#1f6f4a'
const PENDING_MS = 6000 // backend refreshes ~5s after a command
const STATS_MS = 5 * 60 * 1000

type Dict = Record<string, string>

const EN: Dict = {
  range: 'Range', state: 'State', parked: 'Parked', driving: 'Driving', charging: 'Charging',
  lock: 'Lock', unlock: 'Unlock', ac: 'A/C', find: 'Find car', vent: 'Vent windows', stop: 'Stop charging',
  today: 'Driven today', week: 'Week', month: 'Month', efficiency: 'Efficiency',
  used: 'Used today', left: 'Energy left', updated: 'Updated', live: 'live', min_left: 'min left',
  tyres: 'Tyres', fl: 'Front left', fr: 'Front right', rl: 'Rear left', rr: 'Rear right',
  ac_temp: 'A/C set to',
}
const TH: Dict = {
  range: 'ระยะทาง', state: 'สถานะ', parked: 'จอดอยู่', driving: 'กำลังขับ', charging: 'กำลังชาร์จ',
  lock: 'ล็อก', unlock: 'ปลดล็อก', ac: 'แอร์', find: 'ค้นหารถ', vent: 'แง้มกระจก', stop: 'หยุดชาร์จ',
  today: 'ขับวันนี้', week: 'สัปดาห์', month: 'เดือน', efficiency: 'ประสิทธิภาพ',
  used: 'ใช้ไปวันนี้', left: 'พลังงานคงเหลือ', updated: 'อัปเดต', live: 'ออนไลน์', min_left: 'นาที',
  tyres: 'ยาง', fl: 'ซ้ายหน้า', fr: 'ขวาหน้า', rl: 'ซ้ายหลัง', rr: 'ขวาหลัง',
  ac_temp: 'แอร์ตั้งไว้',
}

const CSS = `
:host { display: block; }
.card {
  background: var(--card-background-color, #fff);
  color: var(--primary-text-color, #111);
  border-radius: var(--ha-card-border-radius, 12px);
  padding: 16px; box-sizing: border-box;
  font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
}
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.model { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--secondary-text-color, #777); }
.name { font-size: 26px; font-weight: 700; letter-spacing: .04em; margin-top: 4px; }
.iconbtn {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color, #e0e0e0);
  background: none; color: var(--secondary-text-color, #777); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; font-size: 15px; line-height: 1;
}
.live { margin-top: 8px; text-align: right; font-size: 12px; color: var(--secondary-text-color, #777); }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--carlinko-accent, ${DEFAULT_ACCENT}); margin-right: 6px; }
section { border-top: 1px solid var(--divider-color, #e6e6e6); padding: 18px 0; }
.label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--secondary-text-color, #777); }
.big { font-size: 32px; font-weight: 700; line-height: 1.1; }
.unit { font-size: 13px; font-weight: 500; color: var(--secondary-text-color, #777); margin-left: 3px; }
.carimg { display: block; margin: 0 auto; max-width: 100%; max-height: 200px; object-fit: contain; }
.hero { display: flex; align-items: center; gap: 22px; }
.ring { flex: 0 0 auto; position: relative; }
.ring span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
.hero .stat + .stat { margin-top: 14px; }
.statev { font-size: 17px; color: var(--carlinko-accent, ${DEFAULT_ACCENT}); font-weight: 600; margin-top: 2px; }
.sub { font-size: 12px; color: var(--secondary-text-color, #777); margin-top: 2px; }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
  border: none; border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
  background: var(--divider-color, #eceff1); color: var(--primary-text-color, #111);
}
.pill[disabled] { opacity: .5; cursor: progress; }
.pill.on { background: var(--carlinko-accent, ${DEFAULT_ACCENT}); color: #fff; }
.three { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.three .r { text-align: right; }
.three .r .big { font-size: 20px; }
.bars { display: flex; align-items: flex-end; gap: 8px; height: 56px; margin-top: 14px; }
.bars i { flex: 1; background: var(--carlinko-accent, ${DEFAULT_ACCENT}); border-radius: 4px; min-height: 3px; }
.bars i.zero { opacity: .18; }
.tyres { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
.tyre {
  border: 1px solid var(--divider-color, #e6e6e6); border-radius: 10px; padding: 10px 12px;
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
}
.tyre .label { font-size: 10px; white-space: nowrap; }
.tyre .v { font-size: 18px; font-weight: 700; }
.tyre .t { font-size: 12px; color: var(--secondary-text-color, #777); white-space: nowrap; }
.tyre.low { border-color: var(--error-color, #db4437); }
.tyre.low .v { color: var(--error-color, #db4437); }
.tyre.warn { border-color: var(--warning-color, #ffa600); }
.tyre.warn .v { color: var(--warning-color, #ffa600); }
.tyre.none { opacity: .45; }
footer { padding-top: 14px; border-top: 1px solid var(--divider-color, #e6e6e6); text-align: center;
  font-size: 12px; color: var(--secondary-text-color, #777); }
`

const num = (s: any): number | null => {
  const n = Number(s?.state)
  return s && Number.isFinite(n) ? n : null
}
const fmt = (n: number | null, d = 0): string => (n === null ? '—' : n.toFixed(d))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

class CarlinkoCard extends HTMLElement {
  private _hass: any
  private _config: Record<string, any> = {}
  private _root = this.attachShadow({ mode: 'open' })
  private _html = ''
  private _masked = true
  private _pending = new Set<string>()
  private _stats: { today: number; week: number; month: number } | null = null
  private _bars: number[] = []
  private _statsAt = 0
  private _odo = ''
  private _timer: any

  setConfig(config: Record<string, any>) {
    this._config = config || {}
    this._masked = this._config.mask_plate !== false
    this._html = ''
    if (this._hass) this._safeRender()
  }

  set hass(hass: any) {
    this._hass = hass
    this._safeRender()
  }

  connectedCallback() {
    this._timer = setInterval(() => this._fetchStats(true), STATS_MS)
    if (this._hass) this._safeRender()
  }

  disconnectedCallback() {
    clearInterval(this._timer)
  }

  getCardSize() {
    return 12
  }

  private _safeRender() {
    try {
      this._render()
    } catch (err) {
      console.error('carlinko-card:', err)
    }
  }

  /** entity registry -> { device, translation_key: entity_id } for the chosen car. */
  private _resolve() {
    const entities: Record<string, any> = this._hass?.entities || {}
    let deviceId: string | undefined = this._config.device_id
    const map: Dict = {}
    if (!deviceId) {
      for (const e of Object.values(entities)) {
        if (e?.platform === 'carlinko' && e.translation_key === 'battery') {
          deviceId = e.device_id
          break
        }
      }
    }
    if (deviceId) {
      for (const e of Object.values(entities)) {
        if (e?.platform === 'carlinko' && e.device_id === deviceId && e.translation_key) map[e.translation_key] = e.entity_id
      }
    }
    return { device: deviceId ? this._hass?.devices?.[deviceId] : undefined, map }
  }

  private _render() {
    if (!this._hass) return
    const t: Dict = String(this._hass.language || 'en').startsWith('th') ? TH : EN
    const { device, map } = this._resolve()
    const st = (key: string) => {
      const id = map[key]
      const s = id ? this._hass.states[id] : undefined
      return s && s.state !== 'unavailable' && s.state !== 'unknown' ? s : undefined
    }
    const on = (key: string) => st(key)?.state === 'on'

    this._maybeFetchStats(map.odometer)

    const battery = num(st('battery'))
    const range = num(st('range'))
    const speed = num(st('speed')) ?? 0
    const state = carState(st('charge_state')?.state, speed, on('hv_active'))
    const charging = state === 'charging'
    const kw = num(st('charge_power'))
    const mins = num(st('charge_remaining'))
    const consumption = num(st('consumption'))
    const batteryKwh = Number(this._config.battery_kwh) || 61
    const distUnit = st('range')?.attributes?.unit_of_measurement ?? 'km'
    const odoUnit = (map.odometer && this._hass.states[map.odometer]?.attributes?.unit_of_measurement) || 'km'

    const deviceName = device?.name_by_user || device?.name
    const name = deviceName ? maskPlate(String(deviceName), this._masked) : '—'
    const model = (device?.model && device?.manufacturer && device.model.toUpperCase().startsWith(device.manufacturer.toUpperCase()) ? device.model : [device?.manufacturer, device?.model].filter(Boolean).join(' ')) || 'CarLinko'
    const battStamp = map.battery ? this._hass.states[map.battery]?.last_updated : undefined
    const ago = battStamp ? Math.max(0, Math.round((Date.now() - new Date(battStamp).getTime()) / 60000)) : null
    const picture = map.vehicle ? this._hass.states[map.vehicle]?.attributes?.entity_picture : undefined

    const pct = battery === null ? 0 : Math.max(0, Math.min(100, battery))
    const circ = 2 * Math.PI * 34

    const lockState = st('door_lock')?.state
    const pills: string[] = []
    if (map.door_lock) pills.push(this._pill('lock', lockState === 'locked' ? t.unlock : t.lock, lockState === 'locked'))
    if (map.climate) pills.push(this._pill('climate', t.ac, on('climate')))
    if (map.find_car) pills.push(this._pill('find_car', t.find, false))
    if (map.vent_windows) pills.push(this._pill('vent_windows', t.vent, false))
    if (charging && map.stop_charging) pills.push(this._pill('stop_charging', t.stop, false))

    const acTemp = num(st('ac_temp'))
    const acUnit = st('ac_temp')?.attributes?.unit_of_measurement ?? '\u00b0C'

    const tyrePress = TYRES.map((k) => num(st(`tyre_${k}_pressure`)))
    const tyreLvl = tyreLevels(tyrePress)
    const tyreUnit = st('tyre_fl_pressure')?.attributes?.unit_of_measurement ?? ''
    const tyreCells = TYRES.map((k, i) => {
      const temp = num(st(`tyre_${k}_temp`))
      const tUnit = st(`tyre_${k}_temp`)?.attributes?.unit_of_measurement ?? '°C'
      return `<div class="tyre ${tyreLvl[i]}">
        <div>
          <div class="label">${t[k]}</div>
          <div class="v">${fmt(tyrePress[i], 2)}<span class="unit">${esc(String(tyreUnit))}</span></div>
        </div>
        ${temp === null ? '' : `<div class="t">${fmt(temp, 1)}${esc(String(tUnit))}</div>`}
      </div>`
    })
    const hasTyres = tyrePress.some((v) => v !== null)

    const driven = this._stats
    const maxBar = Math.max(1, ...this._bars)
    const usedToday = driven && consumption !== null ? (driven.today * consumption) / 100 : null
    const energyLeft = battery === null ? null : (battery * batteryKwh) / 100

    const html = `
<style>${CSS}</style>
<div class="card">
  <div class="row">
    <div>
      <div class="model">${esc(model)}</div>
      <div class="name">${esc(name)}</div>
    </div>
    <div>
      <button class="iconbtn" data-act="mask" title="mask">${this._masked ? '&#128584;' : '&#128065;'}</button>
      <button class="iconbtn" data-act="refresh" title="refresh">&#8635;</button>
    </div>
  </div>
  <div class="live"><span class="dot"></span>${t.live} &middot; ${ago === null ? '—' : ago + 'm'} ago</div>

  ${picture ? `<section style="border:0"><img class="carimg" src="${esc(String(picture))}" alt="${esc(model)}"></section>` : ''}

  <section class="hero">
    <div class="ring">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="34" fill="none" stroke="var(--divider-color,#e6e6e6)" stroke-width="6"></circle>
        <circle cx="42" cy="42" r="34" fill="none" stroke="var(--carlinko-accent, ${DEFAULT_ACCENT})" stroke-width="6"
          stroke-linecap="round" transform="rotate(-90 42 42)"
          stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - pct / 100)).toFixed(1)}"></circle>
      </svg>
      <span>${fmt(battery)}<i class="unit">%</i></span>
    </div>
    <div>
      <div class="stat">
        <div class="label">${t.range}</div>
        <div class="big">${fmt(range)}<span class="unit">${esc(String(distUnit))}</span></div>
      </div>
      <div class="stat">
        <div class="label">${t.state}</div>
        <div class="statev">${t[state]}</div>
        ${charging && (kw !== null || mins !== null)
          ? `<div class="sub">${fmt(kw, 1)} kW &middot; ${fmt(mins)} ${t.min_left}</div>`
          : ''}
      </div>
    </div>
  </section>

  ${pills.length ? `<section class="pills">${pills.join('')}</section>` : ''}

  ${acTemp === null
    ? ''
    : `<section>
    <div class="label">${t.ac_temp}</div>
    <div class="big">${fmt(acTemp)}<span class="unit">${esc(String(acUnit))}</span></div>
  </section>`}

  ${driven
    ? `<section>
    <div class="three">
      <div>
        <div class="label">${t.today}</div>
        <div class="big">${fmt(driven.today)}<span class="unit">${esc(String(odoUnit))}</span></div>
      </div>
      <div class="r"><div class="label">${t.week}</div><div class="big">${fmt(driven.week)}</div></div>
      <div class="r"><div class="label">${t.month}</div><div class="big">${fmt(driven.month)}</div></div>
    </div>
    <div class="bars">${this._bars
      .map((v) => `<i class="${v ? '' : 'zero'}" style="height:${Math.max(4, (v / maxBar) * 100)}%"></i>`)
      .join('')}</div>
  </section>`
    : ''}

  <section>
    <div class="three">
      <div>
        <div class="label">${t.efficiency}</div>
        <div class="big">${fmt(consumption, 1)}</div>
        <div class="sub">kWh / 100 km</div>
      </div>
      <div class="r"><div class="label">${t.used}</div><div class="big">${fmt(usedToday, 1)}<span class="unit">kWh</span></div></div>
      <div class="r"><div class="label">${t.left}</div><div class="big">${fmt(energyLeft, 1)}<span class="unit">kWh</span></div></div>
    </div>
  </section>

  ${hasTyres
    ? `<section>
    <div class="label">${t.tyres}</div>
    <div class="tyres">${tyreCells.join('')}</div>
  </section>`
    : ''}

  <footer>${t.updated} ${battStamp ? esc(new Date(battStamp).toLocaleString()) : '—'}</footer>
</div>`

    if (html === this._html) return
    this._html = html
    this._root.innerHTML = html
    this._root.querySelectorAll<HTMLElement>('[data-act]').forEach((el) =>
      el.addEventListener('click', () => this._act(el.dataset.act as string, map)),
    )
  }

  private _pill(key: string, label: string, active: boolean) {
    const busy = this._pending.has(key)
    return `<button class="pill${active ? ' on' : ''}" data-act="${key}"${busy ? ' disabled' : ''}>${busy ? '…' : esc(label)}</button>`
  }

  private _act(act: string, map: Dict) {
    if (act === 'mask') {
      this._masked = !this._masked
      this._html = ''
      return this._safeRender()
    }
    if (act === 'refresh') {
      this._call('homeassistant', 'update_entity', map.battery)
      this._fetchStats(true)
      return
    }
    const calls: Record<string, [string, string, string]> = {
      lock: ['lock', this._hass.states[map.door_lock]?.state === 'locked' ? 'unlock' : 'lock', map.door_lock],
      climate: ['switch', 'toggle', map.climate],
      find_car: ['button', 'press', map.find_car],
      vent_windows: ['button', 'press', map.vent_windows],
      stop_charging: ['button', 'press', map.stop_charging],
    }
    const call = calls[act]
    if (!call || !call[2]) return
    this._call(call[0], call[1], call[2])
    this._pending.add(act)
    this._html = ''
    this._safeRender()
    setTimeout(() => {
      this._pending.delete(act)
      this._html = ''
      this._safeRender()
    }, PENDING_MS)
  }

  private _call(domain: string, service: string, entityId?: string) {
    if (!entityId) return
    Promise.resolve(this._hass.callService(domain, service, { entity_id: entityId })).catch((e: unknown) =>
      console.error('carlinko-card: service failed', e),
    )
  }

  private _maybeFetchStats(odometerId?: string) {
    if (!odometerId) return
    const cur = this._hass.states[odometerId]?.state ?? ''
    if (cur !== this._odo || Date.now() - this._statsAt > STATS_MS) {
      this._odo = cur
      this._fetchStats()
    }
  }

  private _fetchStats(force = false) {
    const { map } = this._resolve()
    const id = map.odometer
    if (!id || !this._hass?.callWS) return
    if (!force && Date.now() - this._statsAt < 5000) return
    this._statsAt = Date.now()
    const now = new Date()
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const start = Math.min(today0 - 6 * 86400000, new Date(now.getFullYear(), now.getMonth(), 1).getTime())
    Promise.resolve(
      this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: new Date(start).toISOString(),
        statistic_ids: [id],
        period: 'day',
        types: ['change'],
      }),
    )
      .then((res: any) => {
        const rows: StatRow[] = (res?.[id] || []).map((r: any) => ({ start: +new Date(r.start), change: r.change }))
        this._stats = drivenKm(rows, now)
        this._bars = last7Days(rows, now)
        this._html = ''
        this._safeRender()
      })
      .catch(() => {
        // recorder disabled or statistics unavailable — hide the section instead of breaking the card.
        this._stats = null
        this._bars = []
        this._html = ''
        this._safeRender()
      })
  }
}

customElements.define('carlinko-card', CarlinkoCard)
;(window as any).customCards = (window as any).customCards || []
;(window as any).customCards.push({
  type: 'carlinko-card',
  name: 'CarLinko Card',
  description: 'Vehicle dashboard for the CarLinko integration',
})
