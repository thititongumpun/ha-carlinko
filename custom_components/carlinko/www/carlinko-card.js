function Q(a, t = !0) {
  return !t || a.length <= 4 ? a : a.slice(0, 1) + a.slice(1, -3).replace(/\S/g, "•") + a.slice(-3);
}
function X(a, t, e) {
  return a === "charging" ? "charging" : t > 0 || e ? "driving" : "parked";
}
const I = 864e5, w = (a) => new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
function Z(a, t = /* @__PURE__ */ new Date()) {
  const e = w(t), i = e - 6 * I, s = new Date(t.getFullYear(), t.getMonth(), 1).getTime();
  let o = 0, r = 0, n = 0;
  for (const l of a) {
    const c = Number(l.change);
    !Number.isFinite(c) || c < 0 || (l.start >= e && (o += c), l.start >= i && (r += c), l.start >= s && (n += c));
  }
  return { today: o, week: r, month: n };
}
function tt(a, t = /* @__PURE__ */ new Date()) {
  const e = w(t), i = [0, 0, 0, 0, 0, 0, 0];
  for (const s of a) {
    const o = Number(s.change);
    if (!Number.isFinite(o) || o < 0) continue;
    const r = 6 - Math.round((e - w(new Date(s.start))) / I);
    r >= 0 && r < 7 && (i[r] += o);
  }
  return i;
}
const m = "#1f6f4a", et = 6e3, Y = 300 * 1e3, st = {
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
  min_left: "min left"
}, it = {
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
  min_left: "นาที"
}, at = `
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
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--carlinko-accent, ${m}); margin-right: 6px; }
section { border-top: 1px solid var(--divider-color, #e6e6e6); padding: 18px 0; }
.label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--secondary-text-color, #777); }
.big { font-size: 32px; font-weight: 700; line-height: 1.1; }
.unit { font-size: 13px; font-weight: 500; color: var(--secondary-text-color, #777); margin-left: 3px; }
.carimg { display: block; margin: 0 auto; max-width: 100%; max-height: 200px; object-fit: contain; }
.hero { display: flex; align-items: center; gap: 22px; }
.ring { flex: 0 0 auto; position: relative; }
.ring span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
.hero .stat + .stat { margin-top: 14px; }
.statev { font-size: 17px; color: var(--carlinko-accent, ${m}); font-weight: 600; margin-top: 2px; }
.sub { font-size: 12px; color: var(--secondary-text-color, #777); margin-top: 2px; }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
  border: none; border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
  background: var(--divider-color, #eceff1); color: var(--primary-text-color, #111);
}
.pill[disabled] { opacity: .5; cursor: progress; }
.pill.on { background: var(--carlinko-accent, ${m}); color: #fff; }
.three { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.three .r { text-align: right; }
.three .r .big { font-size: 20px; }
.bars { display: flex; align-items: flex-end; gap: 8px; height: 56px; margin-top: 14px; }
.bars i { flex: 1; background: var(--carlinko-accent, ${m}); border-radius: 4px; min-height: 3px; }
.bars i.zero { opacity: .18; }
footer { padding-top: 14px; border-top: 1px solid var(--divider-color, #e6e6e6); text-align: center;
  font-size: 12px; color: var(--secondary-text-color, #777); }
`, u = (a) => {
  const t = Number(a == null ? void 0 : a.state);
  return a && Number.isFinite(t) ? t : null;
}, d = (a, t = 0) => a === null ? "—" : a.toFixed(t), p = (a) => a.replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]);
class nt extends HTMLElement {
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
    this._timer = setInterval(() => this._fetchStats(!0), Y), this._hass && this._safeRender();
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
    var s, o, r;
    const t = ((s = this._hass) == null ? void 0 : s.entities) || {};
    let e = this._config.device_id;
    const i = {};
    if (!e) {
      for (const n of Object.values(t))
        if ((n == null ? void 0 : n.platform) === "carlinko" && n.translation_key === "battery") {
          e = n.device_id;
          break;
        }
    }
    if (e)
      for (const n of Object.values(t))
        (n == null ? void 0 : n.platform) === "carlinko" && n.device_id === e && n.translation_key && (i[n.translation_key] = n.entity_id);
    return { device: e ? (r = (o = this._hass) == null ? void 0 : o.devices) == null ? void 0 : r[e] : void 0, map: i };
  }
  _render() {
    var N, j, A, E, L, R, W, P, U;
    if (!this._hass) return;
    const t = String(this._hass.language || "en").startsWith("th") ? it : st, { device: e, map: i } = this._resolve(), s = (h) => {
      const _ = i[h], k = _ ? this._hass.states[_] : void 0;
      return k && k.state !== "unavailable" && k.state !== "unknown" ? k : void 0;
    }, o = (h) => {
      var _;
      return ((_ = s(h)) == null ? void 0 : _.state) === "on";
    };
    this._maybeFetchStats(i.odometer);
    const r = u(s("battery")), n = u(s("range")), l = u(s("speed")) ?? 0, c = X((N = s("charge_state")) == null ? void 0 : N.state, l, o("hv_active")), v = c === "charging", $ = u(s("charge_power")), S = u(s("charge_remaining")), x = u(s("consumption")), B = Number(this._config.battery_kwh) || 61, H = ((A = (j = s("range")) == null ? void 0 : j.attributes) == null ? void 0 : A.unit_of_measurement) ?? "km", O = i.odometer && ((L = (E = this._hass.states[i.odometer]) == null ? void 0 : E.attributes) == null ? void 0 : L.unit_of_measurement) || "km", D = (e == null ? void 0 : e.name_by_user) || (e == null ? void 0 : e.name), q = D ? Q(String(D), this._masked) : "—", C = [e == null ? void 0 : e.manufacturer, e == null ? void 0 : e.model].filter(Boolean).join(" ") || "CarLinko", b = i.battery ? (R = this._hass.states[i.battery]) == null ? void 0 : R.last_updated : void 0, M = b ? Math.max(0, Math.round((Date.now() - new Date(b).getTime()) / 6e4)) : null, z = i.vehicle ? (P = (W = this._hass.states[i.vehicle]) == null ? void 0 : W.attributes) == null ? void 0 : P.entity_picture : void 0, K = r === null ? 0 : Math.max(0, Math.min(100, r)), F = 2 * Math.PI * 34, T = (U = s("door_lock")) == null ? void 0 : U.state, g = [];
    i.door_lock && g.push(this._pill("lock", T === "locked" ? t.unlock : t.lock, T === "locked")), i.climate && g.push(this._pill("climate", t.ac, o("climate"))), i.find_car && g.push(this._pill("find_car", t.find, !1)), i.vent_windows && g.push(this._pill("vent_windows", t.vent, !1)), v && i.stop_charging && g.push(this._pill("stop_charging", t.stop, !1));
    const f = this._stats, V = Math.max(1, ...this._bars), G = f && x !== null ? f.today * x / 100 : null, J = r === null ? null : r * B / 100, y = `
<style>${at}</style>
<div class="card">
  <div class="row">
    <div>
      <div class="model">${p(C)}</div>
      <div class="name">${p(q)}</div>
    </div>
    <div>
      <button class="iconbtn" data-act="mask" title="mask">${this._masked ? "&#128584;" : "&#128065;"}</button>
      <button class="iconbtn" data-act="refresh" title="refresh">&#8635;</button>
    </div>
  </div>
  <div class="live"><span class="dot"></span>${t.live} &middot; ${M === null ? "—" : M + "m"} ago</div>

  ${z ? `<section style="border:0"><img class="carimg" src="${p(String(z))}" alt="${p(C)}"></section>` : ""}

  <section class="hero">
    <div class="ring">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="34" fill="none" stroke="var(--divider-color,#e6e6e6)" stroke-width="6"></circle>
        <circle cx="42" cy="42" r="34" fill="none" stroke="var(--carlinko-accent, ${m})" stroke-width="6"
          stroke-linecap="round" transform="rotate(-90 42 42)"
          stroke-dasharray="${F.toFixed(1)}" stroke-dashoffset="${(F * (1 - K / 100)).toFixed(1)}"></circle>
      </svg>
      <span>${d(r)}<i class="unit">%</i></span>
    </div>
    <div>
      <div class="stat">
        <div class="label">${t.range}</div>
        <div class="big">${d(n)}<span class="unit">${p(String(H))}</span></div>
      </div>
      <div class="stat">
        <div class="label">${t.state}</div>
        <div class="statev">${t[c]}</div>
        ${v && ($ !== null || S !== null) ? `<div class="sub">${d($, 1)} kW &middot; ${d(S)} ${t.min_left}</div>` : ""}
      </div>
    </div>
  </section>

  ${g.length ? `<section class="pills">${g.join("")}</section>` : ""}

  ${f ? `<section>
    <div class="three">
      <div>
        <div class="label">${t.today}</div>
        <div class="big">${d(f.today)}<span class="unit">${p(String(O))}</span></div>
      </div>
      <div class="r"><div class="label">${t.week}</div><div class="big">${d(f.week)}</div></div>
      <div class="r"><div class="label">${t.month}</div><div class="big">${d(f.month)}</div></div>
    </div>
    <div class="bars">${this._bars.map((h) => `<i class="${h ? "" : "zero"}" style="height:${Math.max(4, h / V * 100)}%"></i>`).join("")}</div>
  </section>` : ""}

  <section>
    <div class="three">
      <div>
        <div class="label">${t.efficiency}</div>
        <div class="big">${d(x, 1)}</div>
        <div class="sub">kWh / 100 km</div>
      </div>
      <div class="r"><div class="label">${t.used}</div><div class="big">${d(G, 1)}<span class="unit">kWh</span></div></div>
      <div class="r"><div class="label">${t.left}</div><div class="big">${d(J, 1)}<span class="unit">kWh</span></div></div>
    </div>
  </section>

  <footer>${t.updated} ${b ? p(new Date(b).toLocaleString()) : "—"}</footer>
</div>`;
    y !== this._html && (this._html = y, this._root.innerHTML = y, this._root.querySelectorAll("[data-act]").forEach(
      (h) => h.addEventListener("click", () => this._act(h.dataset.act, i))
    ));
  }
  _pill(t, e, i) {
    const s = this._pending.has(t);
    return `<button class="pill${i ? " on" : ""}" data-act="${t}"${s ? " disabled" : ""}>${s ? "…" : p(e)}</button>`;
  }
  _act(t, e) {
    var o;
    if (t === "mask")
      return this._masked = !this._masked, this._html = "", this._safeRender();
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
    }, et));
  }
  _call(t, e, i) {
    i && Promise.resolve(this._hass.callService(t, e, { entity_id: i })).catch(
      (s) => console.error("carlinko-card: service failed", s)
    );
  }
  _maybeFetchStats(t) {
    var i;
    if (!t) return;
    const e = ((i = this._hass.states[t]) == null ? void 0 : i.state) ?? "";
    (e !== this._odo || Date.now() - this._statsAt > Y) && (this._odo = e, this._fetchStats());
  }
  _fetchStats(t = !1) {
    var n;
    const { map: e } = this._resolve(), i = e.odometer;
    if (!i || !((n = this._hass) != null && n.callWS) || !t && Date.now() - this._statsAt < 5e3) return;
    this._statsAt = Date.now();
    const s = /* @__PURE__ */ new Date(), o = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime(), r = Math.min(o - 6 * 864e5, new Date(s.getFullYear(), s.getMonth(), 1).getTime());
    Promise.resolve(
      this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: new Date(r).toISOString(),
        statistic_ids: [i],
        period: "day",
        types: ["change"]
      })
    ).then((l) => {
      const c = ((l == null ? void 0 : l[i]) || []).map((v) => ({ start: +new Date(v.start), change: v.change }));
      this._stats = Z(c, s), this._bars = tt(c, s), this._html = "", this._safeRender();
    }).catch(() => {
      this._stats = null, this._bars = [], this._html = "", this._safeRender();
    });
  }
}
customElements.define("carlinko-card", nt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "carlinko-card",
  name: "CarLinko Card",
  description: "Vehicle dashboard for the CarLinko integration"
});
