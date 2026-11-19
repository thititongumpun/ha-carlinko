function wt(i, t = !0) {
  return !t || i.length <= 4 ? i : i.slice(0, 1) + i.slice(1, -3).replace(/\S/g, "•") + i.slice(-3);
}
function $t(i, t, e) {
  return i === "charging" ? "charging" : t > 0 || e ? "driving" : "parked";
}
const nt = 864e5, F = (i) => new Date(i.getFullYear(), i.getMonth(), i.getDate()).getTime();
function St(i, t = /* @__PURE__ */ new Date()) {
  const e = F(t), a = e - 6 * nt, s = new Date(t.getFullYear(), t.getMonth(), 1).getTime();
  let o = 0, l = 0, n = 0;
  for (const p of i) {
    const h = Number(p.change);
    !Number.isFinite(h) || h < 0 || (p.start >= e && (o += h), p.start >= a && (l += h), p.start >= s && (n += h));
  }
  return { today: o, week: l, month: n };
}
function Mt(i, t = /* @__PURE__ */ new Date()) {
  const e = F(t), a = [0, 0, 0, 0, 0, 0, 0];
  for (const s of i) {
    const o = Number(s.change);
    if (!Number.isFinite(o) || o < 0) continue;
    const l = 6 - Math.round((e - F(new Date(s.start))) / nt);
    l >= 0 && l < 7 && (a[l] += o);
  }
  return a;
}
function Ct(i, t, e) {
  if (i === null || !Number.isFinite(i) || i < 0) return "—";
  const a = Math.floor(i / 60), s = Math.round(i % 60);
  return a ? s ? `${a} ${t} ${s} ${e}` : `${a} ${t}` : `${s} ${e}`;
}
function Dt(i) {
  const t = i.filter((a) => a !== null && a > 0);
  if (!t.length) return i.map(() => "none");
  const e = t.reduce((a, s) => a + s, 0) / t.length;
  return i.map(
    (a) => a === null || a <= 0 ? "none" : a < e * 0.9 ? "low" : a < e * 0.95 ? "warn" : "ok"
  );
}
const it = ["fl", "fr", "rl", "rr"], Ft = "#3ddfc4", Tt = "#0d7d70", Nt = 6e3, rt = 300 * 1e3, zt = {
  range: "Range",
  state: "State",
  parked: "Parked",
  driving: "Driving",
  charging: "Charging",
  lock: "Lock",
  unlock: "Unlock",
  ac: "A/C",
  find: "Find car",
  vent: "Vent windows",
  stop: "Stop charging",
  today: "Driven today",
  week: "Week",
  month: "Month",
  efficiency: "Efficiency",
  used: "Used today",
  left: "Energy left",
  updated: "Updated",
  live: "live",
  ago: "ago",
  hr: "hr",
  min: "min",
  power: "Charging power",
  remaining: "Time left",
  battery: "battery",
  tyres: "Tyres",
  fl: "Front left",
  fr: "Front right",
  rl: "Rear left",
  rr: "Rear right",
  ac_temp: "A/C set to",
  nav: "Navigate to the car",
  locate: "Show where the car is",
  mask: "Show or hide plate",
  refresh: "Refresh"
}, Et = {
  range: "ระยะทาง",
  state: "สถานะ",
  parked: "จอดอยู่",
  driving: "กำลังขับ",
  charging: "กำลังชาร์จ",
  lock: "ล็อก",
  unlock: "ปลดล็อก",
  ac: "แอร์",
  find: "ค้นหารถ",
  vent: "แง้มกระจก",
  stop: "หยุดชาร์จ",
  today: "ขับวันนี้",
  week: "สัปดาห์",
  month: "เดือน",
  efficiency: "ประสิทธิภาพ",
  used: "ใช้ไปวันนี้",
  left: "พลังงานคงเหลือ",
  updated: "อัปเดต",
  live: "ออนไลน์",
  ago: "ที่แล้ว",
  hr: "ชม.",
  min: "นาที",
  power: "กำลังไฟชาร์จ",
  remaining: "ชาร์จเสร็จใน",
  battery: "แบตเตอรี่",
  tyres: "ยาง",
  fl: "ซ้ายหน้า",
  fr: "ขวาหน้า",
  rl: "ซ้ายหลัง",
  rr: "ขวาหลัง",
  ac_temp: "แอร์ตั้งไว้",
  nav: "นำทางไปที่รถ",
  locate: "ดูตำแหน่งรถ",
  mask: "แสดงหรือซ่อนทะเบียน",
  refresh: "รีเฟรช"
}, Rt = `
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
.carbtn { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
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
a.pill { display: inline-flex; align-items: center; text-decoration: none; }
.pill:hover { border-color: var(--cl-text); }
.pill[disabled] { opacity: .5; cursor: progress; }
/* card bg can be translucent in some themes, so the label uses the solid page colour */
.pill.on { background: var(--cl-text); border-color: var(--cl-text); color: var(--primary-background-color, #111418); }
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
`, D = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>'
}, u = (i) => {
  const t = Number(i == null ? void 0 : i.state);
  return i && Number.isFinite(t) ? t : null;
}, g = (i, t = 0) => i === null ? "—" : i.toFixed(t), d = (i) => i.replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]);
class jt extends HTMLElement {
  constructor() {
    super(...arguments), this._config = {}, this._root = this.attachShadow({ mode: "open" }), this._html = "", this._masked = !0, this._pending = /* @__PURE__ */ new Set(), this._stats = null, this._bars = [], this._statsAt = 0, this._odo = "";
  }
  setConfig(t) {
    this._config = t || {}, this._masked = this._config.mask_plate !== !1, this._html = "", this._hass && this._safeRender();
  }
  set hass(t) {
    this._hass = t, this._safeRender();
  }
  connectedCallback() {
    this._timer = setInterval(() => this._fetchStats(!0), rt), this._hass && this._safeRender();
  }
  disconnectedCallback() {
    clearInterval(this._timer);
  }
  getCardSize() {
    return 12;
  }
  _safeRender() {
    try {
      this._render();
    } catch (t) {
      console.error("carlinko-card:", t);
    }
  }
  /** entity registry -> { device, translation_key: entity_id } for the chosen car. */
  _resolve() {
    var s, o, l;
    const t = ((s = this._hass) == null ? void 0 : s.entities) || {};
    let e = this._config.device_id;
    const a = {};
    if (!e) {
      for (const n of Object.values(t))
        if ((n == null ? void 0 : n.platform) === "carlinko" && n.translation_key === "battery") {
          e = n.device_id;
          break;
        }
    }
    if (e)
      for (const n of Object.values(t))
        (n == null ? void 0 : n.platform) === "carlinko" && n.device_id === e && n.translation_key && (a[n.translation_key] = n.entity_id);
    return { device: e ? (l = (o = this._hass) == null ? void 0 : o.devices) == null ? void 0 : l[e] : void 0, map: a };
  }
  _render() {
    var P, I, O, Y, H, q, G, K, Q, V, J, X, Z, tt, et;
    if (!this._hass) return;
    const t = String(this._hass.language || "en").startsWith("th") ? Et : zt, { device: e, map: a } = this._resolve(), s = (r) => {
      const c = a[r], f = c ? this._hass.states[c] : void 0;
      return f && f.state !== "unavailable" && f.state !== "unknown" ? f : void 0;
    }, o = (r) => {
      var c;
      return ((c = s(r)) == null ? void 0 : c.state) === "on";
    };
    this._maybeFetchStats(a.odometer);
    const l = u(s("battery")), n = u(s("range")), p = u(s("speed")) ?? 0, h = $t((P = s("charge_state")) == null ? void 0 : P.state, p, o("hv_active")), m = h === "charging", T = u(s("charge_power")), N = u(s("charge_remaining")), k = u(s("consumption")), ot = Number(this._config.battery_kwh) || 61, lt = ((O = (I = s("range")) == null ? void 0 : I.attributes) == null ? void 0 : O.unit_of_measurement) ?? "km", ct = a.odometer && ((H = (Y = this._hass.states[a.odometer]) == null ? void 0 : Y.attributes) == null ? void 0 : H.unit_of_measurement) || "km", z = (e == null ? void 0 : e.name_by_user) || (e == null ? void 0 : e.name), dt = z ? wt(String(z), this._masked) : "—", E = (e != null && e.model && (e != null && e.manufacturer) && e.model.toUpperCase().startsWith(e.manufacturer.toUpperCase()) ? e.model : [e == null ? void 0 : e.manufacturer, e == null ? void 0 : e.model].filter(Boolean).join(" ")) || "CarLinko", x = a.battery ? (q = this._hass.states[a.battery]) == null ? void 0 : q.last_updated : void 0, R = x ? Math.max(0, Math.round((Date.now() - new Date(x).getTime()) / 6e4)) : null, w = a.vehicle ? (K = (G = this._hass.states[a.vehicle]) == null ? void 0 : G.attributes) == null ? void 0 : K.entity_picture : void 0, j = l === null ? 0 : Math.max(0, Math.min(100, l)), y = 50, $ = 2 * Math.PI * y, A = $ * j / 100, pt = Array.from({ length: 40 }, (r, c) => c * 9).map((r) => `<line x1="70" y1="${r % 90 ? 4 : 2}" x2="70" y2="9" transform="rotate(${r} 70 70)"${r % 90 ? "" : ' class="major"'}></line>`).join(""), L = Math.floor(j / 5), ht = Array.from({ length: 20 }, (r, c) => `<i class="${c < L ? "lit" : c === L && m ? "next" : ""}"></i>`).join(""), gt = `var(--carlinko-accent, ${((Q = this._hass.themes) == null ? void 0 : Q.darkMode) === !1 ? Tt : Ft})`, U = (V = s("door_lock")) == null ? void 0 : V.state, v = [];
    a.door_lock && v.push(this._pill("lock", U === "locked" ? t.unlock : t.lock, U === "locked")), a.climate && v.push(this._pill("climate", t.ac, o("climate"))), a.find_car && v.push(this._pill("find_car", t.find, !1)), a.vent_windows && v.push(this._pill("vent_windows", t.vent, !1)), m && a.stop_charging && v.push(this._pill("stop_charging", t.stop, !1));
    const _ = (J = s("location")) == null ? void 0 : J.attributes, S = _ && Number.isFinite(_.latitude) && Number.isFinite(_.longitude) ? `${_.latitude},${_.longitude}` : "", W = S ? [
      ["Google Maps", `https://www.google.com/maps/dir/?api=1&destination=${S}`],
      ["Waze", `https://waze.com/ul?ll=${S}&navigate=yes`]
    ].map(([r, c]) => `<a class="pill" href="${d(c)}" target="_blank" rel="noopener">${r}</a>`).join("") : "", B = u(s("ac_temp")), ut = ((Z = (X = s("ac_temp")) == null ? void 0 : X.attributes) == null ? void 0 : Z.unit_of_measurement) ?? "°C", M = it.map((r) => u(s(`tyre_${r}_pressure`))), mt = Dt(M), vt = ((et = (tt = s("tyre_fl_pressure")) == null ? void 0 : tt.attributes) == null ? void 0 : et.unit_of_measurement) ?? "", ft = it.map((r, c) => {
      var at, st;
      const f = u(s(`tyre_${r}_temp`)), kt = ((st = (at = s(`tyre_${r}_temp`)) == null ? void 0 : at.attributes) == null ? void 0 : st.unit_of_measurement) ?? "°C";
      return `<div class="tyre ${r} ${mt[c]}">
        <div class="label">${t[r]}</div>
        <div><span class="num">${g(M[c], 2)}</span><span class="unit">${d(String(vt))}</span></div>
        ${f === null ? "" : `<div class="t">${g(f, 1)} ${d(String(kt))}</div>`}
      </div>`;
    }), bt = M.some((r) => r !== null), b = this._stats, _t = Math.max(1, ...this._bars), xt = b && k !== null ? b.today * k / 100 : null, yt = l === null ? null : l * ot / 100, C = `
<style>${Rt}</style>
<div class="card${m ? " charging-anim" : ""}" style="--cl-accent:${gt}">
  <span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>
  <div class="row">
    <div>
      <div class="model">${d(E)}</div>
      <div class="name">${d(dt)}</div>
    </div>
    <div class="btns">
      <button class="iconbtn" data-act="mask" title="${t.mask}" aria-label="${t.mask}" aria-pressed="${this._masked}">${this._masked ? D.eyeOff : D.eye}</button>
      <button class="iconbtn" data-act="refresh" title="${t.refresh}" aria-label="${t.refresh}">${D.refresh}</button>
    </div>
  </div>
  <div class="live"><span class="dot"></span>${t.live} &middot; ${R === null ? "—" : R + "m"} ${t.ago}</div>

  ${w ? `<section style="border:0">${a.location ? `<button class="carbtn" data-act="locate" title="${t.locate}" aria-label="${t.locate}"><img class="carimg" src="${d(String(w))}" alt=""></button>` : `<img class="carimg" src="${d(String(w))}" alt="${d(E)}">`}</section>` : ""}

  <section>
    <div class="hero">
      <div class="dial">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <g class="ticks">${pt}</g>
          <g transform="rotate(-90 70 70)">
            <circle class="track" cx="70" cy="70" r="${y}"></circle>
            <circle class="fill" cx="70" cy="70" r="${y}" stroke-dasharray="${A.toFixed(1)} ${$.toFixed(1)}"></circle>
            <circle class="flow" cx="70" cy="70" r="${y}" stroke-dasharray="10 ${$.toFixed(1)}" style="--len:${A.toFixed(1)}px"></circle>
          </g>
        </svg>
        <div class="ringval"><span><span class="num">${g(l)}</span><i class="unit">%</i></span><span class="label">${t.battery}</span></div>
      </div>
      <div class="reads">
        <div>
          <div class="label">${t.range}</div>
          <div><span class="num">${g(n)}</span><span class="unit">${d(String(lt))}</span></div>
        </div>
        <div>
          <div class="label">${t.state}</div>
          <div class="stv ${h}">${t[h]}</div>
        </div>
        ${m && T !== null ? `<div><div class="label">${t.power}</div><div><span class="num charging">${g(T, 1)}</span><span class="unit">kW</span></div></div>` : ""}
        ${m && N !== null ? `<div><div class="label">${t.remaining}</div><div class="num dur">${Ct(N, t.hr, t.min)}</div></div>` : ""}
      </div>
    </div>
    <div class="bar" aria-hidden="true">
      <div class="segs">${ht}</div>
      <div class="scale"><span>0</span><span>50</span><span>100</span></div>
    </div>
  </section>

  ${v.length ? `<section class="pills">${v.join("")}</section>` : ""}

  ${W ? `<section><div class="label">${t.nav}</div><div class="pills" style="margin-top:8px">${W}</div></section>` : ""}

  ${B === null ? "" : `<section>
    <div class="label">${t.ac_temp}</div>
    <div><span class="num">${g(B)}</span><span class="unit">${d(String(ut))}</span></div>
  </section>`}

  ${b ? `<section>
    <div class="three">
      <div>
        <div class="label">${t.today}</div>
        <div><span class="num">${g(b.today)}</span><span class="unit">${d(String(ct))}</span></div>
      </div>
      <div class="r"><div class="label">${t.week}</div><div class="num">${g(b.week)}</div></div>
      <div class="r"><div class="label">${t.month}</div><div class="num">${g(b.month)}</div></div>
    </div>
    <div class="bars">${this._bars.map((r) => `<i class="${r ? "" : "zero"}" style="height:${Math.max(4, r / _t * 100)}%"></i>`).join("")}</div>
  </section>` : ""}

  <section>
    <div class="three">
      <div>
        <div class="label">${t.efficiency}</div>
        <div class="num">${g(k, 1)}</div>
        <div class="sub">kWh / 100 km</div>
      </div>
      <div class="r"><div class="label">${t.used}</div><div><span class="num">${g(xt, 1)}</span><span class="unit">kWh</span></div></div>
      <div class="r"><div class="label">${t.left}</div><div><span class="num">${g(yt, 1)}</span><span class="unit">kWh</span></div></div>
    </div>
  </section>

  ${bt ? `<section>
    <div class="label">${t.tyres}</div>
    <div class="tgrid">
      <svg class="car" viewBox="0 0 60 120" aria-hidden="true"><rect x="8" y="4" width="44" height="112" rx="18"></rect><path d="M14 34 Q30 26 46 34 M14 88 Q30 95 46 88"></path></svg>
      ${ft.join("")}
    </div>
  </section>` : ""}

  <footer>${t.updated} ${x ? d(new Date(x).toLocaleString()) : "—"}</footer>
</div>`;
    C !== this._html && (this._html = C, this._root.innerHTML = C, this._root.querySelectorAll("[data-act]").forEach(
      (r) => r.addEventListener("click", () => this._act(r.dataset.act, a))
    ));
  }
  _pill(t, e, a) {
    const s = this._pending.has(t);
    return `<button class="pill${a ? " on" : ""}" data-act="${t}"${s ? " disabled" : ""}>${s ? "…" : d(e)}</button>`;
  }
  _act(t, e) {
    var o;
    if (t === "mask")
      return this._masked = !this._masked, this._html = "", this._safeRender();
    if (t === "locate") return void this._openMap(e.location);
    if (t === "refresh") {
      this._call("homeassistant", "update_entity", e.battery), this._fetchStats(!0);
      return;
    }
    const s = {
      lock: ["lock", ((o = this._hass.states[e.door_lock]) == null ? void 0 : o.state) === "locked" ? "unlock" : "lock", e.door_lock],
      climate: ["switch", "toggle", e.climate],
      find_car: ["button", "press", e.find_car],
      vent_windows: ["button", "press", e.vent_windows],
      stop_charging: ["button", "press", e.stop_charging]
    }[t];
    !s || !s[2] || (this._call(s[0], s[1], s[2]), this._pending.add(t), this._html = "", this._safeRender(), setTimeout(() => {
      this._pending.delete(t), this._html = "", this._safeRender();
    }, Nt));
  }
  /** Map pop-up. Mounted under <home-assistant>: inside the card a modal <dialog> lands off-centre (transformed
   *  ancestor), and in document.body the map card never gets HA's i18n context, so it renders nothing. */
  async _openMap(t) {
    var l, n;
    if (!t) return;
    const e = await ((l = window.loadCardHelpers) == null ? void 0 : l.call(window));
    if (!e) return;
    const a = document.createElement("dialog");
    a.style.cssText = "position:fixed;inset:0;margin:auto;width:min(720px,94vw);padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--primary-background-color,#111);--ha-card-background:var(--primary-background-color,#111)";
    const s = e.createCardElement({ type: "map", entities: [t], default_zoom: 16, aspect_ratio: "4:3", theme_mode: "auto" });
    s.style.display = "block", await customElements.whenDefined(s.localName), s.hass = this._hass, a.className = "carlinko-map";
    const o = document.createElement("style");
    o.textContent = "dialog.carlinko-map::backdrop{background:rgba(0,0,0,.6)}", a.append(o, s), a.addEventListener("click", (p) => p.target === a && a.close()), a.addEventListener("close", () => a.remove()), (((n = document.querySelector("home-assistant")) == null ? void 0 : n.shadowRoot) ?? document.body).appendChild(a), a.showModal();
  }
  _call(t, e, a) {
    a && Promise.resolve(this._hass.callService(t, e, { entity_id: a })).catch(
      (s) => console.error("carlinko-card: service failed", s)
    );
  }
  _maybeFetchStats(t) {
    var a;
    if (!t) return;
    const e = ((a = this._hass.states[t]) == null ? void 0 : a.state) ?? "";
    (e !== this._odo || Date.now() - this._statsAt > rt) && (this._odo = e, this._fetchStats());
  }
  _fetchStats(t = !1) {
    var n;
    const { map: e } = this._resolve(), a = e.odometer;
    if (!a || !((n = this._hass) != null && n.callWS) || !t && Date.now() - this._statsAt < 5e3) return;
    this._statsAt = Date.now();
    const s = /* @__PURE__ */ new Date(), o = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime(), l = Math.min(o - 6 * 864e5, new Date(s.getFullYear(), s.getMonth(), 1).getTime());
    Promise.resolve(
      this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: new Date(l).toISOString(),
        statistic_ids: [a],
        period: "day",
        types: ["change"]
      })
    ).then((p) => {
      const h = ((p == null ? void 0 : p[a]) || []).map((m) => ({ start: +new Date(m.start), change: m.change }));
      this._stats = St(h, s), this._bars = Mt(h, s), this._html = "", this._safeRender();
    }).catch(() => {
      this._stats = null, this._bars = [], this._html = "", this._safeRender();
    });
  }
}
customElements.define("carlinko-card", jt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "carlinko-card",
  name: "CarLinko Card",
  description: "Vehicle dashboard for the CarLinko integration"
});
