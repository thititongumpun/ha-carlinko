function pt(a, t = !0) {
  return !t || a.length <= 4 ? a : a.slice(0, 1) + a.slice(1, -3).replace(/\S/g, "•") + a.slice(-3);
}
function ft(a, t, e) {
  return a === "charging" ? "charging" : t > 0 || e ? "driving" : "parked";
}
const Q = 864e5, $ = (a) => new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
function ut(a, t = /* @__PURE__ */ new Date()) {
  const e = $(t), s = e - 6 * Q, i = new Date(t.getFullYear(), t.getMonth(), 1).getTime();
  let n = 0, o = 0, r = 0;
  for (const p of a) {
    const d = Number(p.change);
    !Number.isFinite(d) || d < 0 || (p.start >= e && (n += d), p.start >= s && (o += d), p.start >= i && (r += d));
  }
  return { today: n, week: o, month: r };
}
function gt(a, t = /* @__PURE__ */ new Date()) {
  const e = $(t), s = [0, 0, 0, 0, 0, 0, 0];
  for (const i of a) {
    const n = Number(i.change);
    if (!Number.isFinite(n) || n < 0) continue;
    const o = 6 - Math.round((e - $(new Date(i.start))) / Q);
    o >= 0 && o < 7 && (s[o] += n);
  }
  return s;
}
function vt(a, t, e) {
  if (a === null || !Number.isFinite(a) || a < 0) return "—";
  const s = Math.floor(a / 60), i = Math.round(a % 60);
  return s ? i ? `${s} ${t} ${i} ${e}` : `${s} ${t}` : `${i} ${e}`;
}
function _t(a) {
  const t = a.filter((s) => s !== null && s > 0);
  if (!t.length) return a.map(() => "none");
  const e = t.reduce((s, i) => s + i, 0) / t.length;
  return a.map(
    (s) => s === null || s <= 0 ? "none" : s < e * 0.9 ? "low" : s < e * 0.95 ? "warn" : "ok"
  );
}
const G = ["fl", "fr", "rl", "rr"], b = "#1f6f4a", mt = 6e3, J = 300 * 1e3, bt = {
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
  hr: "hr",
  min: "min",
  left_pre: "",
  left_post: " left",
  tyres: "Tyres",
  fl: "Front left",
  fr: "Front right",
  rl: "Rear left",
  rr: "Rear right",
  ac_temp: "A/C set to"
}, yt = {
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
  hr: "ชม.",
  min: "นาที",
  left_pre: "เหลือ ",
  left_post: "",
  tyres: "ยาง",
  fl: "ซ้ายหน้า",
  fr: "ขวาหน้า",
  rl: "ซ้ายหลัง",
  rr: "ขวาหลัง",
  ac_temp: "แอร์ตั้งไว้"
}, xt = `
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
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--carlinko-accent, ${b}); margin-right: 6px; }
section { border-top: 1px solid var(--divider-color, #e6e6e6); padding: 18px 0; }
.label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--secondary-text-color, #777); }
.big { font-size: 32px; font-weight: 700; line-height: 1.1; }
.unit { font-size: 13px; font-weight: 500; color: var(--secondary-text-color, #777); margin-left: 3px; }
.carimg { display: block; margin: 0 auto; max-width: 100%; max-height: 200px; object-fit: contain; }
.hero { display: flex; align-items: center; gap: 22px; }
.ring { flex: 0 0 auto; position: relative; }
.ring span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
.hero .stat + .stat { margin-top: 14px; }
.statev { font-size: 17px; color: var(--carlinko-accent, ${b}); font-weight: 600; margin-top: 2px; }
.sub { font-size: 12px; color: var(--secondary-text-color, #777); margin-top: 2px; }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
  border: none; border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
  background: var(--divider-color, #eceff1); color: var(--primary-text-color, #111);
}
.pill[disabled] { opacity: .5; cursor: progress; }
.pill.on { background: var(--carlinko-accent, ${b}); color: #fff; }
.three { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.three .r { text-align: right; }
.three .r .big { font-size: 20px; }
.bars { display: flex; align-items: flex-end; gap: 8px; height: 56px; margin-top: 14px; }
.bars i { flex: 1; background: var(--carlinko-accent, ${b}); border-radius: 4px; min-height: 3px; }
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
`, f = (a) => {
  const t = Number(a == null ? void 0 : a.state);
  return a && Number.isFinite(t) ? t : null;
}, l = (a, t = 0) => a === null ? "—" : a.toFixed(t), h = (a) => a.replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]);
class kt extends HTMLElement {
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
    this._timer = setInterval(() => this._fetchStats(!0), J), this._hass && this._safeRender();
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
    var i, n, o;
    const t = ((i = this._hass) == null ? void 0 : i.entities) || {};
    let e = this._config.device_id;
    const s = {};
    if (!e) {
      for (const r of Object.values(t))
        if ((r == null ? void 0 : r.platform) === "carlinko" && r.translation_key === "battery") {
          e = r.device_id;
          break;
        }
    }
    if (e)
      for (const r of Object.values(t))
        (r == null ? void 0 : r.platform) === "carlinko" && r.device_id === e && r.translation_key && (s[r.translation_key] = r.entity_id);
    return { device: e ? (o = (n = this._hass) == null ? void 0 : n.devices) == null ? void 0 : o[e] : void 0, map: s };
  }
  _render() {
    var j, L, A, E, U, W, P, Y, I, B, H, O, q;
    if (!this._hass) return;
    const t = String(this._hass.language || "en").startsWith("th") ? yt : bt, { device: e, map: s } = this._resolve(), i = (c) => {
      const u = s[c], v = u ? this._hass.states[u] : void 0;
      return v && v.state !== "unavailable" && v.state !== "unknown" ? v : void 0;
    }, n = (c) => {
      var u;
      return ((u = i(c)) == null ? void 0 : u.state) === "on";
    };
    this._maybeFetchStats(s.odometer);
    const o = f(i("battery")), r = f(i("range")), p = f(i("speed")) ?? 0, d = ft((j = i("charge_state")) == null ? void 0 : j.state, p, n("hv_active")), m = d === "charging", S = f(i("charge_power")), D = f(i("charge_remaining")), x = f(i("consumption")), X = Number(this._config.battery_kwh) || 61, Z = ((A = (L = i("range")) == null ? void 0 : L.attributes) == null ? void 0 : A.unit_of_measurement) ?? "km", tt = s.odometer && ((U = (E = this._hass.states[s.odometer]) == null ? void 0 : E.attributes) == null ? void 0 : U.unit_of_measurement) || "km", C = (e == null ? void 0 : e.name_by_user) || (e == null ? void 0 : e.name), et = C ? pt(String(C), this._masked) : "—", z = (e != null && e.model && (e != null && e.manufacturer) && e.model.toUpperCase().startsWith(e.manufacturer.toUpperCase()) ? e.model : [e == null ? void 0 : e.manufacturer, e == null ? void 0 : e.model].filter(Boolean).join(" ")) || "CarLinko", y = s.battery ? (W = this._hass.states[s.battery]) == null ? void 0 : W.last_updated : void 0, M = y ? Math.max(0, Math.round((Date.now() - new Date(y).getTime()) / 6e4)) : null, T = s.vehicle ? (Y = (P = this._hass.states[s.vehicle]) == null ? void 0 : P.attributes) == null ? void 0 : Y.entity_picture : void 0, st = o === null ? 0 : Math.max(0, Math.min(100, o)), F = 2 * Math.PI * 34, N = (I = i("door_lock")) == null ? void 0 : I.state, g = [];
    s.door_lock && g.push(this._pill("lock", N === "locked" ? t.unlock : t.lock, N === "locked")), s.climate && g.push(this._pill("climate", t.ac, n("climate"))), s.find_car && g.push(this._pill("find_car", t.find, !1)), s.vent_windows && g.push(this._pill("vent_windows", t.vent, !1)), m && s.stop_charging && g.push(this._pill("stop_charging", t.stop, !1));
    const R = f(i("ac_temp")), it = ((H = (B = i("ac_temp")) == null ? void 0 : B.attributes) == null ? void 0 : H.unit_of_measurement) ?? "°C", k = G.map((c) => f(i(`tyre_${c}_pressure`))), at = _t(k), rt = ((q = (O = i("tyre_fl_pressure")) == null ? void 0 : O.attributes) == null ? void 0 : q.unit_of_measurement) ?? "", nt = G.map((c, u) => {
      var K, V;
      const v = f(i(`tyre_${c}_temp`)), ht = ((V = (K = i(`tyre_${c}_temp`)) == null ? void 0 : K.attributes) == null ? void 0 : V.unit_of_measurement) ?? "°C";
      return `<div class="tyre ${at[u]}">
        <div>
          <div class="label">${t[c]}</div>
          <div class="v">${l(k[u], 2)}<span class="unit">${h(String(rt))}</span></div>
        </div>
        ${v === null ? "" : `<div class="t">${l(v, 1)}${h(String(ht))}</div>`}
      </div>`;
    }), ot = k.some((c) => c !== null), _ = this._stats, ct = Math.max(1, ...this._bars), lt = _ && x !== null ? _.today * x / 100 : null, dt = o === null ? null : o * X / 100, w = `
<style>${xt}</style>
<div class="card">
  <div class="row">
    <div>
      <div class="model">${h(z)}</div>
      <div class="name">${h(et)}</div>
    </div>
    <div>
      <button class="iconbtn" data-act="mask" title="mask">${this._masked ? "&#128584;" : "&#128065;"}</button>
      <button class="iconbtn" data-act="refresh" title="refresh">&#8635;</button>
    </div>
  </div>
  <div class="live"><span class="dot"></span>${t.live} &middot; ${M === null ? "—" : M + "m"} ago</div>

  ${T ? `<section style="border:0"><img class="carimg" src="${h(String(T))}" alt="${h(z)}"></section>` : ""}

  <section class="hero">
    <div class="ring">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="34" fill="none" stroke="var(--divider-color,#e6e6e6)" stroke-width="6"></circle>
        <circle cx="42" cy="42" r="34" fill="none" stroke="var(--carlinko-accent, ${b})" stroke-width="6"
          stroke-linecap="round" transform="rotate(-90 42 42)"
          stroke-dasharray="${F.toFixed(1)}" stroke-dashoffset="${(F * (1 - st / 100)).toFixed(1)}"></circle>
      </svg>
      <span>${l(o)}<i class="unit">%</i></span>
    </div>
    <div>
      <div class="stat">
        <div class="label">${t.range}</div>
        <div class="big">${l(r)}<span class="unit">${h(String(Z))}</span></div>
      </div>
      <div class="stat">
        <div class="label">${t.state}</div>
        <div class="statev">${t[d]}</div>
        ${m && (S !== null || D !== null) ? `<div class="sub">${l(S, 1)} kW &middot; ${t.left_pre}${vt(D, t.hr, t.min)}${t.left_post}</div>` : ""}
      </div>
    </div>
  </section>

  ${g.length ? `<section class="pills">${g.join("")}</section>` : ""}

  ${R === null ? "" : `<section>
    <div class="label">${t.ac_temp}</div>
    <div class="big">${l(R)}<span class="unit">${h(String(it))}</span></div>
  </section>`}

  ${_ ? `<section>
    <div class="three">
      <div>
        <div class="label">${t.today}</div>
        <div class="big">${l(_.today)}<span class="unit">${h(String(tt))}</span></div>
      </div>
      <div class="r"><div class="label">${t.week}</div><div class="big">${l(_.week)}</div></div>
      <div class="r"><div class="label">${t.month}</div><div class="big">${l(_.month)}</div></div>
    </div>
    <div class="bars">${this._bars.map((c) => `<i class="${c ? "" : "zero"}" style="height:${Math.max(4, c / ct * 100)}%"></i>`).join("")}</div>
  </section>` : ""}

  <section>
    <div class="three">
      <div>
        <div class="label">${t.efficiency}</div>
        <div class="big">${l(x, 1)}</div>
        <div class="sub">kWh / 100 km</div>
      </div>
      <div class="r"><div class="label">${t.used}</div><div class="big">${l(lt, 1)}<span class="unit">kWh</span></div></div>
      <div class="r"><div class="label">${t.left}</div><div class="big">${l(dt, 1)}<span class="unit">kWh</span></div></div>
    </div>
  </section>

  ${ot ? `<section>
    <div class="label">${t.tyres}</div>
    <div class="tyres">${nt.join("")}</div>
  </section>` : ""}

  <footer>${t.updated} ${y ? h(new Date(y).toLocaleString()) : "—"}</footer>
</div>`;
    w !== this._html && (this._html = w, this._root.innerHTML = w, this._root.querySelectorAll("[data-act]").forEach(
      (c) => c.addEventListener("click", () => this._act(c.dataset.act, s))
    ));
  }
  _pill(t, e, s) {
    const i = this._pending.has(t);
    return `<button class="pill${s ? " on" : ""}" data-act="${t}"${i ? " disabled" : ""}>${i ? "…" : h(e)}</button>`;
  }
  _act(t, e) {
    var n;
    if (t === "mask")
      return this._masked = !this._masked, this._html = "", this._safeRender();
    if (t === "refresh") {
      this._call("homeassistant", "update_entity", e.battery), this._fetchStats(!0);
      return;
    }
    const i = {
      lock: ["lock", ((n = this._hass.states[e.door_lock]) == null ? void 0 : n.state) === "locked" ? "unlock" : "lock", e.door_lock],
      climate: ["switch", "toggle", e.climate],
      find_car: ["button", "press", e.find_car],
      vent_windows: ["button", "press", e.vent_windows],
      stop_charging: ["button", "press", e.stop_charging]
    }[t];
    !i || !i[2] || (this._call(i[0], i[1], i[2]), this._pending.add(t), this._html = "", this._safeRender(), setTimeout(() => {
      this._pending.delete(t), this._html = "", this._safeRender();
    }, mt));
  }
  _call(t, e, s) {
    s && Promise.resolve(this._hass.callService(t, e, { entity_id: s })).catch(
      (i) => console.error("carlinko-card: service failed", i)
    );
  }
  _maybeFetchStats(t) {
    var s;
    if (!t) return;
    const e = ((s = this._hass.states[t]) == null ? void 0 : s.state) ?? "";
    (e !== this._odo || Date.now() - this._statsAt > J) && (this._odo = e, this._fetchStats());
  }
  _fetchStats(t = !1) {
    var r;
    const { map: e } = this._resolve(), s = e.odometer;
    if (!s || !((r = this._hass) != null && r.callWS) || !t && Date.now() - this._statsAt < 5e3) return;
    this._statsAt = Date.now();
    const i = /* @__PURE__ */ new Date(), n = new Date(i.getFullYear(), i.getMonth(), i.getDate()).getTime(), o = Math.min(n - 6 * 864e5, new Date(i.getFullYear(), i.getMonth(), 1).getTime());
    Promise.resolve(
      this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: new Date(o).toISOString(),
        statistic_ids: [s],
        period: "day",
        types: ["change"]
      })
    ).then((p) => {
      const d = ((p == null ? void 0 : p[s]) || []).map((m) => ({ start: +new Date(m.start), change: m.change }));
      this._stats = ut(d, i), this._bars = gt(d, i), this._html = "", this._safeRender();
    }).catch(() => {
      this._stats = null, this._bars = [], this._html = "", this._safeRender();
    });
  }
}
customElements.define("carlinko-card", kt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "carlinko-card",
  name: "CarLinko Card",
  description: "Vehicle dashboard for the CarLinko integration"
});
