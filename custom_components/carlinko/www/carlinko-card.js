function _t(i, t = !0) {
  return !t || i.length <= 4 ? i : i.slice(0, 1) + i.slice(1, -3).replace(/\S/g, "•") + i.slice(-3);
}
function xt(i, t, e) {
  return i === "charging" ? "charging" : t > 0 || e ? "driving" : "parked";
}
const st = 864e5, M = (i) => new Date(i.getFullYear(), i.getMonth(), i.getDate()).getTime();
function yt(i, t = /* @__PURE__ */ new Date()) {
  const e = M(t), s = e - 6 * st, a = new Date(t.getFullYear(), t.getMonth(), 1).getTime();
  let o = 0, l = 0, n = 0;
  for (const g of i) {
    const d = Number(g.change);
    !Number.isFinite(d) || d < 0 || (g.start >= e && (o += d), g.start >= s && (l += d), g.start >= a && (n += d));
  }
  return { today: o, week: l, month: n };
}
function kt(i, t = /* @__PURE__ */ new Date()) {
  const e = M(t), s = [0, 0, 0, 0, 0, 0, 0];
  for (const a of i) {
    const o = Number(a.change);
    if (!Number.isFinite(o) || o < 0) continue;
    const l = 6 - Math.round((e - M(new Date(a.start))) / st);
    l >= 0 && l < 7 && (s[l] += o);
  }
  return s;
}
function wt(i, t, e) {
  if (i === null || !Number.isFinite(i) || i < 0) return "—";
  const s = Math.floor(i / 60), a = Math.round(i % 60);
  return s ? a ? `${s} ${t} ${a} ${e}` : `${s} ${t}` : `${a} ${e}`;
}
function $t(i) {
  const t = i.filter((s) => s !== null && s > 0);
  if (!t.length) return i.map(() => "none");
  const e = t.reduce((s, a) => s + a, 0) / t.length;
  return i.map(
    (s) => s === null || s <= 0 ? "none" : s < e * 0.9 ? "low" : s < e * 0.95 ? "warn" : "ok"
  );
}
const tt = ["fl", "fr", "rl", "rr"], St = "#3ddfc4", Mt = "#0d7d70", Ct = 6e3, et = 300 * 1e3, Dt = {
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
  mask: "Show or hide plate",
  refresh: "Refresh"
}, Tt = {
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
  mask: "แสดงหรือซ่อนทะเบียน",
  refresh: "รีเฟรช"
}, Ft = `
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
`, S = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>'
}, u = (i) => {
  const t = Number(i == null ? void 0 : i.state);
  return i && Number.isFinite(t) ? t : null;
}, p = (i, t = 0) => i === null ? "—" : i.toFixed(t), h = (i) => i.replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]);
class Rt extends HTMLElement {
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
    this._timer = setInterval(() => this._fetchStats(!0), et), this._hass && this._safeRender();
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
    var a, o, l;
    const t = ((a = this._hass) == null ? void 0 : a.entities) || {};
    let e = this._config.device_id;
    const s = {};
    if (!e) {
      for (const n of Object.values(t))
        if ((n == null ? void 0 : n.platform) === "carlinko" && n.translation_key === "battery") {
          e = n.device_id;
          break;
        }
    }
    if (e)
      for (const n of Object.values(t))
        (n == null ? void 0 : n.platform) === "carlinko" && n.device_id === e && n.translation_key && (s[n.translation_key] = n.entity_id);
    return { device: e ? (l = (o = this._hass) == null ? void 0 : o.devices) == null ? void 0 : l[e] : void 0, map: s };
  }
  _render() {
    var U, W, B, P, I, O, Y, H, K, q, G, Q, V, J;
    if (!this._hass) return;
    const t = String(this._hass.language || "en").startsWith("th") ? Tt : Dt, { device: e, map: s } = this._resolve(), a = (r) => {
      const c = s[r], f = c ? this._hass.states[c] : void 0;
      return f && f.state !== "unavailable" && f.state !== "unknown" ? f : void 0;
    }, o = (r) => {
      var c;
      return ((c = a(r)) == null ? void 0 : c.state) === "on";
    };
    this._maybeFetchStats(s.odometer);
    const l = u(a("battery")), n = u(a("range")), g = u(a("speed")) ?? 0, d = xt((U = a("charge_state")) == null ? void 0 : U.state, g, o("hv_active")), m = d === "charging", C = u(a("charge_power")), D = u(a("charge_remaining")), y = u(a("consumption")), at = Number(this._config.battery_kwh) || 61, it = ((B = (W = a("range")) == null ? void 0 : W.attributes) == null ? void 0 : B.unit_of_measurement) ?? "km", rt = s.odometer && ((I = (P = this._hass.states[s.odometer]) == null ? void 0 : P.attributes) == null ? void 0 : I.unit_of_measurement) || "km", T = (e == null ? void 0 : e.name_by_user) || (e == null ? void 0 : e.name), nt = T ? _t(String(T), this._masked) : "—", F = (e != null && e.model && (e != null && e.manufacturer) && e.model.toUpperCase().startsWith(e.manufacturer.toUpperCase()) ? e.model : [e == null ? void 0 : e.manufacturer, e == null ? void 0 : e.model].filter(Boolean).join(" ")) || "CarLinko", _ = s.battery ? (O = this._hass.states[s.battery]) == null ? void 0 : O.last_updated : void 0, R = _ ? Math.max(0, Math.round((Date.now() - new Date(_).getTime()) / 6e4)) : null, j = s.vehicle ? (H = (Y = this._hass.states[s.vehicle]) == null ? void 0 : Y.attributes) == null ? void 0 : H.entity_picture : void 0, A = l === null ? 0 : Math.max(0, Math.min(100, l)), x = 50, k = 2 * Math.PI * x, N = k * A / 100, ot = Array.from({ length: 40 }, (r, c) => c * 9).map((r) => `<line x1="70" y1="${r % 90 ? 4 : 2}" x2="70" y2="9" transform="rotate(${r} 70 70)"${r % 90 ? "" : ' class="major"'}></line>`).join(""), z = Math.floor(A / 5), lt = Array.from({ length: 20 }, (r, c) => `<i class="${c < z ? "lit" : c === z && m ? "next" : ""}"></i>`).join(""), ct = `var(--carlinko-accent, ${((K = this._hass.themes) == null ? void 0 : K.darkMode) === !1 ? Mt : St})`, L = (q = a("door_lock")) == null ? void 0 : q.state, v = [];
    s.door_lock && v.push(this._pill("lock", L === "locked" ? t.unlock : t.lock, L === "locked")), s.climate && v.push(this._pill("climate", t.ac, o("climate"))), s.find_car && v.push(this._pill("find_car", t.find, !1)), s.vent_windows && v.push(this._pill("vent_windows", t.vent, !1)), m && s.stop_charging && v.push(this._pill("stop_charging", t.stop, !1));
    const E = u(a("ac_temp")), dt = ((Q = (G = a("ac_temp")) == null ? void 0 : G.attributes) == null ? void 0 : Q.unit_of_measurement) ?? "°C", w = tt.map((r) => u(a(`tyre_${r}_pressure`))), pt = $t(w), ht = ((J = (V = a("tyre_fl_pressure")) == null ? void 0 : V.attributes) == null ? void 0 : J.unit_of_measurement) ?? "", gt = tt.map((r, c) => {
      var X, Z;
      const f = u(a(`tyre_${r}_temp`)), bt = ((Z = (X = a(`tyre_${r}_temp`)) == null ? void 0 : X.attributes) == null ? void 0 : Z.unit_of_measurement) ?? "°C";
      return `<div class="tyre ${r} ${pt[c]}">
        <div class="label">${t[r]}</div>
        <div><span class="num">${p(w[c], 2)}</span><span class="unit">${h(String(ht))}</span></div>
        ${f === null ? "" : `<div class="t">${p(f, 1)} ${h(String(bt))}</div>`}
      </div>`;
    }), ut = w.some((r) => r !== null), b = this._stats, mt = Math.max(1, ...this._bars), vt = b && y !== null ? b.today * y / 100 : null, ft = l === null ? null : l * at / 100, $ = `
<style>${Ft}</style>
<div class="card${m ? " charging-anim" : ""}" style="--cl-accent:${ct}">
  <span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>
  <div class="row">
    <div>
      <div class="model">${h(F)}</div>
      <div class="name">${h(nt)}</div>
    </div>
    <div class="btns">
      <button class="iconbtn" data-act="mask" title="${t.mask}" aria-label="${t.mask}" aria-pressed="${this._masked}">${this._masked ? S.eyeOff : S.eye}</button>
      <button class="iconbtn" data-act="refresh" title="${t.refresh}" aria-label="${t.refresh}">${S.refresh}</button>
    </div>
  </div>
  <div class="live"><span class="dot"></span>${t.live} &middot; ${R === null ? "—" : R + "m"} ${t.ago}</div>

  ${j ? `<section style="border:0"><img class="carimg" src="${h(String(j))}" alt="${h(F)}"></section>` : ""}

  <section>
    <div class="hero">
      <div class="dial">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <g class="ticks">${ot}</g>
          <g transform="rotate(-90 70 70)">
            <circle class="track" cx="70" cy="70" r="${x}"></circle>
            <circle class="fill" cx="70" cy="70" r="${x}" stroke-dasharray="${N.toFixed(1)} ${k.toFixed(1)}"></circle>
            <circle class="flow" cx="70" cy="70" r="${x}" stroke-dasharray="10 ${k.toFixed(1)}" style="--len:${N.toFixed(1)}px"></circle>
          </g>
        </svg>
        <div class="ringval"><span><span class="num">${p(l)}</span><i class="unit">%</i></span><span class="label">${t.battery}</span></div>
      </div>
      <div class="reads">
        <div>
          <div class="label">${t.range}</div>
          <div><span class="num">${p(n)}</span><span class="unit">${h(String(it))}</span></div>
        </div>
        <div>
          <div class="label">${t.state}</div>
          <div class="stv ${d}">${t[d]}</div>
        </div>
        ${m && C !== null ? `<div><div class="label">${t.power}</div><div><span class="num charging">${p(C, 1)}</span><span class="unit">kW</span></div></div>` : ""}
        ${m && D !== null ? `<div><div class="label">${t.remaining}</div><div class="num dur">${wt(D, t.hr, t.min)}</div></div>` : ""}
      </div>
    </div>
    <div class="bar" aria-hidden="true">
      <div class="segs">${lt}</div>
      <div class="scale"><span>0</span><span>50</span><span>100</span></div>
    </div>
  </section>

  ${v.length ? `<section class="pills">${v.join("")}</section>` : ""}

  ${E === null ? "" : `<section>
    <div class="label">${t.ac_temp}</div>
    <div><span class="num">${p(E)}</span><span class="unit">${h(String(dt))}</span></div>
  </section>`}

  ${b ? `<section>
    <div class="three">
      <div>
        <div class="label">${t.today}</div>
        <div><span class="num">${p(b.today)}</span><span class="unit">${h(String(rt))}</span></div>
      </div>
      <div class="r"><div class="label">${t.week}</div><div class="num">${p(b.week)}</div></div>
      <div class="r"><div class="label">${t.month}</div><div class="num">${p(b.month)}</div></div>
    </div>
    <div class="bars">${this._bars.map((r) => `<i class="${r ? "" : "zero"}" style="height:${Math.max(4, r / mt * 100)}%"></i>`).join("")}</div>
  </section>` : ""}

  <section>
    <div class="three">
      <div>
        <div class="label">${t.efficiency}</div>
        <div class="num">${p(y, 1)}</div>
        <div class="sub">kWh / 100 km</div>
      </div>
      <div class="r"><div class="label">${t.used}</div><div><span class="num">${p(vt, 1)}</span><span class="unit">kWh</span></div></div>
      <div class="r"><div class="label">${t.left}</div><div><span class="num">${p(ft, 1)}</span><span class="unit">kWh</span></div></div>
    </div>
  </section>

  ${ut ? `<section>
    <div class="label">${t.tyres}</div>
    <div class="tgrid">
      <svg class="car" viewBox="0 0 60 120" aria-hidden="true"><rect x="8" y="4" width="44" height="112" rx="18"></rect><path d="M14 34 Q30 26 46 34 M14 88 Q30 95 46 88"></path></svg>
      ${gt.join("")}
    </div>
  </section>` : ""}

  <footer>${t.updated} ${_ ? h(new Date(_).toLocaleString()) : "—"}</footer>
</div>`;
    $ !== this._html && (this._html = $, this._root.innerHTML = $, this._root.querySelectorAll("[data-act]").forEach(
      (r) => r.addEventListener("click", () => this._act(r.dataset.act, s))
    ));
  }
  _pill(t, e, s) {
    const a = this._pending.has(t);
    return `<button class="pill${s ? " on" : ""}" data-act="${t}"${a ? " disabled" : ""}>${a ? "…" : h(e)}</button>`;
  }
  _act(t, e) {
    var o;
    if (t === "mask")
      return this._masked = !this._masked, this._html = "", this._safeRender();
    if (t === "refresh") {
      this._call("homeassistant", "update_entity", e.battery), this._fetchStats(!0);
      return;
    }
    const a = {
      lock: ["lock", ((o = this._hass.states[e.door_lock]) == null ? void 0 : o.state) === "locked" ? "unlock" : "lock", e.door_lock],
      climate: ["switch", "toggle", e.climate],
      find_car: ["button", "press", e.find_car],
      vent_windows: ["button", "press", e.vent_windows],
      stop_charging: ["button", "press", e.stop_charging]
    }[t];
    !a || !a[2] || (this._call(a[0], a[1], a[2]), this._pending.add(t), this._html = "", this._safeRender(), setTimeout(() => {
      this._pending.delete(t), this._html = "", this._safeRender();
    }, Ct));
  }
  _call(t, e, s) {
    s && Promise.resolve(this._hass.callService(t, e, { entity_id: s })).catch(
      (a) => console.error("carlinko-card: service failed", a)
    );
  }
  _maybeFetchStats(t) {
    var s;
    if (!t) return;
    const e = ((s = this._hass.states[t]) == null ? void 0 : s.state) ?? "";
    (e !== this._odo || Date.now() - this._statsAt > et) && (this._odo = e, this._fetchStats());
  }
  _fetchStats(t = !1) {
    var n;
    const { map: e } = this._resolve(), s = e.odometer;
    if (!s || !((n = this._hass) != null && n.callWS) || !t && Date.now() - this._statsAt < 5e3) return;
    this._statsAt = Date.now();
    const a = /* @__PURE__ */ new Date(), o = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime(), l = Math.min(o - 6 * 864e5, new Date(a.getFullYear(), a.getMonth(), 1).getTime());
    Promise.resolve(
      this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: new Date(l).toISOString(),
        statistic_ids: [s],
        period: "day",
        types: ["change"]
      })
    ).then((g) => {
      const d = ((g == null ? void 0 : g[s]) || []).map((m) => ({ start: +new Date(m.start), change: m.change }));
      this._stats = yt(d, a), this._bars = kt(d, a), this._html = "", this._safeRender();
    }).catch(() => {
      this._stats = null, this._bars = [], this._html = "", this._safeRender();
    });
  }
}
customElements.define("carlinko-card", Rt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "carlinko-card",
  name: "CarLinko Card",
  description: "Vehicle dashboard for the CarLinko integration"
});
