import { maskPlate, carState, drivenKm, last7Days, tyreLevels, fmtDuration, type StatRow } from './logic.ts'

// ponytail: no INSIGHTS section from the reference dashboard — the integration exposes no cost
// entities, so it would be invented data. Add it when those entities exist.

const TYRES = ['fl', 'fr', 'rl', 'rr'] as const

// Instrument-cluster look, shared with the project site's hero readout. Base colours come from the
// HA theme; graphite and the electric accent are only fallbacks. Override with `--carlinko-accent`.
const ACCENT_DARK = '#3ddfc4'
const ACCENT_LIGHT = '#0d7d70'
const PENDING_MS = 6000 // backend refreshes ~5s after a command
const STATS_MS = 5 * 60 * 1000

type Dict = Record<string, string>

const EN: Dict = {
  range: 'Range', state: 'State', parked: 'Parked', driving: 'Driving', charging: 'Charging',
  lock: 'Lock', unlock: 'Unlock', ac: 'A/C', find: 'Find car', vent: 'Vent windows', stop: 'Stop charging',
  today: 'Driven today', week: 'Week', month: 'Month', efficiency: 'Efficiency',
  used: 'Used today', left: 'Energy left', updated: 'Updated', live: 'live', ago: 'ago', hr: 'hr', min: 'min',
  power: 'Charging power', remaining: 'Time left', battery: 'battery',
  tyres: 'Tyres', fl: 'Front left', fr: 'Front right', rl: 'Rear left', rr: 'Rear right',
  ac_temp: 'A/C set to', mask: 'Show or hide plate', refresh: 'Refresh',
}
const TH: Dict = {
  range: 'ระยะทาง', state: 'สถานะ', parked: 'จอดอยู่', driving: 'กำลังขับ', charging: 'กำลังชาร์จ',
  lock: 'ล็อก', unlock: 'ปลดล็อก', ac: 'แอร์', find: 'ค้นหารถ', vent: 'แง้มกระจก', stop: 'หยุดชาร์จ',
  today: 'ขับวันนี้', week: 'สัปดาห์', month: 'เดือน', efficiency: 'ประสิทธิภาพ',
  used: 'ใช้ไปวันนี้', left: 'พลังงานคงเหลือ', updated: 'อัปเดต', live: 'ออนไลน์', ago: 'ที่แล้ว', hr: 'ชม.', min: 'นาที',
  power: 'กำลังไฟชาร์จ', remaining: 'ชาร์จเสร็จใน', battery: 'แบตเตอรี่',
  tyres: 'ยาง', fl: 'ซ้ายหน้า', fr: 'ขวาหน้า', rl: 'ซ้ายหลัง', rr: 'ขวาหลัง',
  ac_temp: 'แอร์ตั้งไว้', mask: 'แสดงหรือซ่อนทะเบียน', refresh: 'รีเฟรช',
}

const CSS = `
:host {
  display: block;
  --cl-bg: var(--ha-card-background, var(--card-background-color, #1f2125));
  --cl-text: var(--primary-text-color, #eceef1);
  --cl-muted: var(--secondary-text-color, #a9aeb6);
  --cl-line: var(--divider-color, rgba(127, 127, 127, .28));
  --cl-strong: color-mix(in srgb, var(--cl-muted) 55%, transparent);
  --cl-mono: ui-monospace, 'IBM Plex Mono', 'SF Mono', Menlo, Consolas, monospace;
}
.card {
  position: relative; background: var(--cl-bg); color: var(--cl-text);
  border: 1px solid var(--cl-line); border-radius: 2px;
  padding: 16px; box-sizing: border-box;
  font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
  font-variant-numeric: tabular-nums; line-height: 1.45;
}
.c { position: absolute; width: 10px; height: 10px; border: 0 solid var(--cl-strong); }
.tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
.tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
.bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
.br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }
.row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.model, .label { font-size: 12px; color: var(--cl-muted); }
.name { font: 600 22px/1.2 var(--cl-mono); letter-spacing: .02em; margin-top: 2px; }
.btns { display: flex; gap: 6px; }
.iconbtn {
  width: 34px; height: 34px; border-radius: 2px; border: 1px solid var(--cl-line);
  background: none; color: var(--cl-muted); cursor: pointer; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.iconbtn:hover { color: var(--cl-text); border-color: var(--cl-strong); }
.iconbtn svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
button:focus-visible { outline: 2px solid var(--cl-accent); outline-offset: 2px; }
.live { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 12px; color: var(--cl-muted); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cl-accent); }
section { border-top: 1px solid var(--cl-line); padding: 14px 0; }
.num { font: 500 22px/1.15 var(--cl-mono); }
.unit { font: 400 12px var(--cl-mono); color: var(--cl-muted); margin-left: 4px; font-style: normal; }
.carimg { display: block; margin: 0 auto; max-width: 100%; max-height: 180px; object-fit: contain; }
.hero { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 18px; align-items: center; }
.dial { position: relative; width: 128px; height: 128px; }
.dial svg { display: block; width: 100%; height: 100%; }
.ticks line { stroke: var(--cl-strong); stroke-width: 1; }
.ticks line.major { stroke: var(--cl-muted); stroke-width: 1.5; }
.dial circle { fill: none; stroke-width: 6; }
.track { stroke: var(--cl-line); }
.fill { stroke: var(--cl-accent); }
.flow { stroke: var(--cl-text); opacity: 0; }
.ringval { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.ringval .num { font-size: 30px; }
.ringval .label { font-size: 11px; }
.reads > div + div { border-top: 1px solid var(--cl-line); margin-top: 8px; padding-top: 8px; }
.reads .label { line-height: 1.3; }
.num.dur { font-family: inherit; font-size: 18px; }
.stv { font-size: 16px; font-weight: 600; margin-top: 2px; }
.stv.charging, .num.charging { color: var(--cl-accent); }
.bar { padding-top: 14px; }
.segs { display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; height: 9px; }
.segs i { background: var(--cl-line); }
.segs i.lit { background: var(--cl-accent); }
.segs i.next { background: color-mix(in srgb, var(--cl-accent) 40%, var(--cl-line)); }
.scale { display: flex; justify-content: space-between; margin-top: 4px; font: 11px var(--cl-mono); color: var(--cl-muted); }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
  min-height: 36px; padding: 0 14px; border-radius: 2px; font: 600 13px var(--paper-font-body1_-_font-family, system-ui, sans-serif);
  cursor: pointer; background: none; color: var(--cl-text); border: 1px solid var(--cl-strong);
}
.pill:hover { border-color: var(--cl-text); }
.pill[disabled] { opacity: .5; cursor: progress; }
.pill.on { background: var(--cl-text); border-color: var(--cl-text); color: var(--cl-bg); }
.three { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; align-items: end; }
.three .r { text-align: right; }
.three .r .num { font-size: 18px; }
.sub { font: 11px var(--cl-mono); color: var(--cl-muted); margin-top: 2px; }
.bars { display: flex; align-items: flex-end; gap: 4px; height: 48px; margin-top: 14px; border-bottom: 1px solid var(--cl-line); }
.bars i { flex: 1; background: var(--cl-strong); min-height: 2px; }
.bars i:last-child { background: var(--cl-text); }
.bars i.zero { opacity: .35; }
.tgrid { display: grid; grid-template-columns: minmax(0, 1fr) 46px minmax(0, 1fr); grid-template-rows: auto auto; gap: 12px 14px; align-items: center; margin-top: 12px; }
.car { grid-column: 2; grid-row: 1 / 3; width: 100%; fill: none; stroke: var(--cl-strong); stroke-width: 1.5; }
.tyre { display: grid; gap: 1px; }
.tyre .num { font-size: 18px; }
.tyre .t { font: 12px var(--cl-mono); color: var(--cl-muted); }
.tyre.fl, .tyre.rl { grid-column: 1; text-align: right; }
.tyre.fr, .tyre.rr { grid-column: 3; }
.tyre.fl, .tyre.fr { grid-row: 1; }
.tyre.rl, .tyre.rr { grid-row: 2; }
.tyre.warn .num { color: var(--warning-color, #ffa600); }
.tyre.low .num { color: var(--error-color, #db4437); }
.tyre.warn .label::after, .tyre.low .label::after { content: ''; display: inline-block; width: 6px; height: 6px; margin: 0 0 1px 6px; background: var(--warning-color, #ffa600); }
.tyre.low .label::after { background: var(--error-color, #db4437); }
.tyre.none { opacity: .45; }
footer { padding-top: 12px; border-top: 1px solid var(--cl-line); text-align: center; font: 11px var(--cl-mono); color: var(--cl-muted); }
@media (prefers-reduced-motion: no-preference) {
  .dot { animation: pulse 2.4s ease-in-out 4; }
  .charging-anim .flow { animation: flow 3.2s cubic-bezier(.16, 1, .3, 1) 3; }
  .charging-anim .segs i.next { animation: pulse 1.6s ease-in-out 6; }
  @keyframes pulse { 50% { opacity: .35; } }
  @keyframes flow {
    0% { stroke-dashoffset: 0; opacity: 0; } 15% { opacity: .8; } 85% { opacity: .8; }
    100% { stroke-dashoffset: calc(-1 * var(--len) + 10px); opacity: 0; }
  }
}
`

const ICONS = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
}

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
    const R = 50
    const circ = 2 * Math.PI * R
    const arc = (circ * pct) / 100
    const ticks = Array.from({ length: 40 }, (_, i) => i * 9)
      .map((a) => `<line x1="70" y1="${a % 90 ? 4 : 2}" x2="70" y2="9" transform="rotate(${a} 70 70)"${a % 90 ? '' : ' class="major"'}></line>`)
      .join('')
    const lit = Math.floor(pct / 5)
    const segs = Array.from({ length: 20 }, (_, i) => `<i class="${i < lit ? 'lit' : i === lit && charging ? 'next' : ''}"></i>`).join('')
    const accent = `var(--carlinko-accent, ${this._hass.themes?.darkMode === false ? ACCENT_LIGHT : ACCENT_DARK})`

    const lockState = st('door_lock')?.state
    const pills: string[] = []
    if (map.door_lock) pills.push(this._pill('lock', lockState === 'locked' ? t.unlock : t.lock, lockState === 'locked'))
    if (map.climate) pills.push(this._pill('climate', t.ac, on('climate')))
    if (map.find_car) pills.push(this._pill('find_car', t.find, false))
    if (map.vent_windows) pills.push(this._pill('vent_windows', t.vent, false))
    if (charging && map.stop_charging) pills.push(this._pill('stop_charging', t.stop, false))

    const acTemp = num(st('ac_temp'))
    const acUnit = st('ac_temp')?.attributes?.unit_of_measurement ?? '°C'

    const tyrePress = TYRES.map((k) => num(st(`tyre_${k}_pressure`)))
    const tyreLvl = tyreLevels(tyrePress)
    const tyreUnit = st('tyre_fl_pressure')?.attributes?.unit_of_measurement ?? ''
    const tyreCells = TYRES.map((k, i) => {
      const temp = num(st(`tyre_${k}_temp`))
      const tUnit = st(`tyre_${k}_temp`)?.attributes?.unit_of_measurement ?? '°C'
      return `<div class="tyre ${k} ${tyreLvl[i]}">
        <div class="label">${t[k]}</div>
        <div><span class="num">${fmt(tyrePress[i], 2)}</span><span class="unit">${esc(String(tyreUnit))}</span></div>
        ${temp === null ? '' : `<div class="t">${fmt(temp, 1)} ${esc(String(tUnit))}</div>`}
      </div>`
    })
    const hasTyres = tyrePress.some((v) => v !== null)

    const driven = this._stats
    const maxBar = Math.max(1, ...this._bars)
    const usedToday = driven && consumption !== null ? (driven.today * consumption) / 100 : null
    const energyLeft = battery === null ? null : (battery * batteryKwh) / 100

    const html = `
<style>${CSS}</style>
<div class="card${charging ? ' charging-anim' : ''}" style="--cl-accent:${accent}">
  <span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>
  <div class="row">
    <div>
      <div class="model">${esc(model)}</div>
      <div class="name">${esc(name)}</div>
    </div>
    <div class="btns">
      <button class="iconbtn" data-act="mask" title="${t.mask}" aria-label="${t.mask}" aria-pressed="${this._masked}">${this._masked ? ICONS.eyeOff : ICONS.eye}</button>
      <button class="iconbtn" data-act="refresh" title="${t.refresh}" aria-label="${t.refresh}">${ICONS.refresh}</button>
    </div>
  </div>
  <div class="live"><span class="dot"></span>${t.live} &middot; ${ago === null ? '—' : ago + 'm'} ${t.ago}</div>

  ${picture ? `<section style="border:0"><img class="carimg" src="${esc(String(picture))}" alt="${esc(model)}"></section>` : ''}

  <section>
    <div class="hero">
      <div class="dial">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <g class="ticks">${ticks}</g>
          <g transform="rotate(-90 70 70)">
            <circle class="track" cx="70" cy="70" r="${R}"></circle>
            <circle class="fill" cx="70" cy="70" r="${R}" stroke-dasharray="${arc.toFixed(1)} ${circ.toFixed(1)}"></circle>
            <circle class="flow" cx="70" cy="70" r="${R}" stroke-dasharray="10 ${circ.toFixed(1)}" style="--len:${arc.toFixed(1)}px"></circle>
          </g>
        </svg>
        <div class="ringval"><span><span class="num">${fmt(battery)}</span><i class="unit">%</i></span><span class="label">${t.battery}</span></div>
      </div>
      <div class="reads">
        <div>
          <div class="label">${t.range}</div>
          <div><span class="num">${fmt(range)}</span><span class="unit">${esc(String(distUnit))}</span></div>
        </div>
        <div>
          <div class="label">${t.state}</div>
          <div class="stv ${state}">${t[state]}</div>
        </div>
        ${charging && kw !== null
          ? `<div><div class="label">${t.power}</div><div><span class="num charging">${fmt(kw, 1)}</span><span class="unit">kW</span></div></div>`
          : ''}
        ${charging && mins !== null
          ? `<div><div class="label">${t.remaining}</div><div class="num dur">${fmtDuration(mins, t.hr, t.min)}</div></div>`
          : ''}
      </div>
    </div>
    <div class="bar" aria-hidden="true">
      <div class="segs">${segs}</div>
      <div class="scale"><span>0</span><span>50</span><span>100</span></div>
    </div>
  </section>

  ${pills.length ? `<section class="pills">${pills.join('')}</section>` : ''}

  ${acTemp === null
    ? ''
    : `<section>
    <div class="label">${t.ac_temp}</div>
    <div><span class="num">${fmt(acTemp)}</span><span class="unit">${esc(String(acUnit))}</span></div>
  </section>`}

  ${driven
    ? `<section>
    <div class="three">
      <div>
        <div class="label">${t.today}</div>
        <div><span class="num">${fmt(driven.today)}</span><span class="unit">${esc(String(odoUnit))}</span></div>
      </div>
      <div class="r"><div class="label">${t.week}</div><div class="num">${fmt(driven.week)}</div></div>
      <div class="r"><div class="label">${t.month}</div><div class="num">${fmt(driven.month)}</div></div>
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
        <div class="num">${fmt(consumption, 1)}</div>
        <div class="sub">kWh / 100 km</div>
      </div>
      <div class="r"><div class="label">${t.used}</div><div><span class="num">${fmt(usedToday, 1)}</span><span class="unit">kWh</span></div></div>
      <div class="r"><div class="label">${t.left}</div><div><span class="num">${fmt(energyLeft, 1)}</span><span class="unit">kWh</span></div></div>
    </div>
  </section>

  ${hasTyres
    ? `<section>
    <div class="label">${t.tyres}</div>
    <div class="tgrid">
      <svg class="car" viewBox="0 0 60 120" aria-hidden="true"><rect x="8" y="4" width="44" height="112" rx="18"></rect><path d="M14 34 Q30 26 46 34 M14 88 Q30 95 46 88"></path></svg>
      ${tyreCells.join('')}
    </div>
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
