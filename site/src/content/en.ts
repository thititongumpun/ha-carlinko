// English copy. Every fact here comes from README.md; th.ts mirrors this shape.
// Strings may contain trusted inline HTML (<code>, <strong>, <a>) and are rendered with set:html.
const issues = 'https://github.com/thititongumpun/ha-carlinko/issues';

export default {
  lang: 'en',
  title: 'ha-carlinko · CarLinko cars in Home Assistant',
  description:
    'Unofficial Home Assistant integration for Omoda, Jaecoo and Chery cars managed by the CarLinko app: battery, charging, tyres, door lock, A/C and remote controls.',
  skip: 'Skip to content',
  navLabel: 'Sections',
  nav: [
    ['compat', 'Compatibility'],
    ['features', 'Features'],
    ['automations', 'Automations'],
    ['install', 'Install'],
    ['configure', 'Configure'],
    ['card', 'Card'],
    ['entities', 'Entities'],
    ['help', 'Caveats'],
  ],
  toggle: { label: 'ไทย', lang: 'th', title: 'อ่านเป็นภาษาไทย' },
  copy: 'Copy',
  copied: 'Copied',

  hero: {
    title: 'Your CarLinko car, as Home Assistant entities.',
    lede:
      'Battery, charging, tyres, door lock, A/C and remote controls for <strong>Omoda</strong>, <strong>Jaecoo</strong> and <strong>Chery</strong> cars managed by the CarLinko app. Sign in with your CarLinko account; the car shows up as a normal device with a ready-made Lovelace card.',
    primary: 'Install from Marketplace',
    secondary: 'View on GitHub',
    facts: ['Home Assistant 2025.1+', 'No extra Python dependencies', 'English and Thai'],
    unofficial: 'Unofficial. Not made, endorsed or supported by CarLinko, Chery, Omoda or Jaecoo.',
  },
  hud: {
    caption: 'Demo values. The entity IDs are the ones the integration creates.',
    demo: 'demo',
    charging: 'Charging',
    battery: 'battery',
    range: 'range',
    power: 'charging power',
    remaining: 'time remaining',
    locked: 'Locked',
    lock: 'door lock',
    tyres: 'tyres',
    fl: 'FL', fr: 'FR', rl: 'RL', rr: 'RR',
  },

  compat: {
    title: 'Will it work with my car?',
    intro:
      'If your car is managed through the CarLinko app, it is worth trying. The integration talks to the app’s account API, not to any one model, so it supports whatever CarLinko supports: cars sold as Omoda, Jaecoo or Chery across Thailand, Malaysia, Indonesia, Vietnam, UAE, Uzbekistan, South Africa and elsewhere.',
    head: ['Car', 'Status', 'What that means'],
    rows: [
      ['Omoda C5 EV (Thailand)', 'Verified', 'Developed and tested against daily. Everything the README describes is confirmed on this car.'],
      ['Jaecoo J5', 'Partly confirmed', 'Lock/unlock, windows, tailgate and stop-charging confirmed by an upstream contributor.'],
      ['Other Chery, Omoda and Jaecoo models on CarLinko', 'Expected', 'Untested. Reports welcome.'],
    ],
    caveat:
      'On another model, expect the core telemetry to work and some decoded fields to be wrong or missing. The 73-byte telemetry blob is reverse-engineered and roughly a third of it is still unidentified, so model-specific fields (A/C temperature, tyre pressure on cars with indirect TPMS) may read nonsense or stay unknown.',
    ask: `Tried it on another car? <a href="${issues}">Open an issue</a> with the model and what did or did not work, including “it just worked”. That is the only way this list grows.`,
  },

  features: {
    title: 'What you get',
    intro: 'Everything the CarLinko app shows, as entities you can chart, automate and put on a dashboard.',
    items: [
      ['Telemetry', 'Every 60 s: battery %, range, odometer, speed, 12 V battery, consumption, WLTC range.'],
      ['Charging', 'Status, AC/DC mode, power, time remaining, plugged-in and charging flags, plus an estimated charge target.'],
      ['Tyres', 'Pressure and temperature for all four corners, decoded from the telemetry blob. No extra request.'],
      ['Body', 'Door lock, each of the four doors, tailgate, windows, sunroof, A/C, high-voltage (car on) state, cloud online.'],
      ['Controls', 'Lock / unlock, A/C on / off and temperature, defog, quick cool, seat ventilation, windows open / close / vent, tailgate, sunroof, find car, stop charging.'],
      ['Only what your car has', 'The account API publishes a per-model capability list and every optional entity is gated on it: no sunroof cover on a car without a sunroof.'],
      ['Location', 'GPS device tracker every 15 min with a street address (OpenStreetMap fallback). Works even if your app build has no map screen.'],
      ['Service reminder', 'Set last service odometer and date on the device page; get km and days until service, and an overdue state.'],
      ['Sessions', 'Token persisted across restarts (CarLinko allows one session per account), automatic re-login, re-auth flow.'],
      ['Vehicle image', 'The CDN render of your exact car, as an <code>image</code> entity.'],
    ],
    shots: [
      ['charging.png', 1402, 919, 'A Home Assistant dashboard in Thai with the CarLinko card, door, A/C and window controls, and a 24-hour battery and charging power chart.', 'Thai dashboard while charging: card, controls and a 24-hour battery chart.'],
      ['12vandspeed.png', 542, 470, 'History charts of 12 V battery voltage and speed.', '12 V battery and speed history.'],
    ],
  },

  automations: {
    title: 'Automations',
    intro:
      'The car is just entities, so anything Home Assistant can do with a sensor works here. Replace <code>CAR</code> with your car’s entity prefix (the device is named after its licence plate) and <code>YOUR_PHONE</code> with your notify target.',
    items: [
      ['Service reminder', 'From the README', 'Fires a month ahead, at 1,000 km to go, and again when overdue. Set <strong>Last service odometer</strong> and <strong>Last service date</strong> on the device page first; intervals default to 20,000 km / 365 days.', 'serviceReminder'],
      ['Charging finished', 'Example', 'Notifies when charging stops while the cable is still connected, with battery and range.', 'chargeDone'],
      ['Left unlocked', 'Example', 'Notifies if the car has been unlocked for ten minutes with the high-voltage system off.', 'leftUnlocked'],
    ],
  },

  install: {
    title: 'Install',
    hacs: 'Marketplace (Home Assistant 2026.11+)',
    hacsSteps: [
      'Open <strong>Settings → Marketplace → Add from link</strong>. Custom repositories ask for a one-time GitHub sign-in.',
      'Enter this repository:',
      'Open <strong>CarLinko</strong> and select <strong>Install</strong>. The setup flow opens straight away, no restart.',
    ],
    hacsLegacy: 'On Home Assistant before 2026.11, use HACS instead: <strong>Integrations → ⋮ → Custom repositories</strong>, same URL, category <strong>Integration</strong>, then restart.',
    manual: 'Manual',
    manualSteps: [
      'Copy <code>custom_components/carlinko</code> from the repository into <code>config/custom_components/</code>.',
      'Restart Home Assistant.',
    ],
  },

  configure: {
    title: 'Configure',
    intro: 'Go to <strong>Settings → Devices &amp; services → Add integration → CarLinko</strong>. Each vehicle on the account becomes a device named after its licence plate.',
    head: ['Field', 'Value'],
    fields: [
      ['Account', 'E-mail or phone registered in the CarLinko app'],
      ['Password', 'Your CarLinko password'],
      ['Region', '<code>sea</code> for Thailand / Malaysia / Indonesia (default)'],
    ],
    regionsLabel: 'Other regions',
    regions: ['ap', 'emea', 'me', 'naf', 'saf', 'sam', 'uzb', 'vn'],
    accountTitle: 'Owner account or shared account',
    accountIntro:
      'CarLinko allows <strong>one session per account</strong>. If Home Assistant uses your own account, it and your phone app keep signing each other out. A shared account avoids that, with one catch since the November 2026 T-Box firmware: <strong>the car keeps its own list of accounts allowed to send commands</strong>, and an older share may not be on it. Commands from such an account fail with <em>No operation permission</em> while all status still works.',
    accountStepsTitle: 'Getting a shared account onto the car’s list (worked on an Omoda C5 EV):',
    accountSteps: [
      '<strong>Sign in to the CarLinko app once with the shared account</strong>, open the car, wait a few minutes, then try a control from Home Assistant.',
      '<strong>Still refused?</strong> In the owner’s app, remove the shared account from the car and share the car with it again while the car is awake and online. Accept the share in the shared account’s app, wait a few minutes, and try again.',
    ],
    accountOutro:
      'It is not yet known which of these is the real trigger; on the author’s car it worked after doing both. If it still says <em>No operation permission</em>, use the owner account and accept the sign-outs.',
    reconfTitle: 'Switching accounts',
    reconf:
      '<strong>Settings → Devices &amp; services → CarLinko → ⋮ → Reconfigure</strong> (v0.0.18+) and sign in with the other account. Entities, history and dashboards are kept.',
  },

  card: {
    title: 'Lovelace card',
    intro:
      '<code>custom:carlinko-card</code> shows the car image, battery ring, range, state, quick actions, distance driven today / week / month, efficiency and a tyre grid.',
    steps: [
      'Add the resource once: <strong>Settings → Dashboards → ⋮ → Resources</strong>, type <strong>JavaScript module</strong>:',
      'Then add the card:',
    ],
    more:
      'Options, a sections-view example and a full Thai dashboard (Mushroom + ApexCharts) are in <a href="https://github.com/thititongumpun/ha-carlinko/blob/main/docs/card.md">docs/card.md</a> and <a href="https://github.com/thititongumpun/ha-carlinko/blob/main/docs/dashboard-th.yaml">docs/dashboard-th.yaml</a>.',
    shots: [
      ['card.png', 800, 2105, 'The carlinko-card: car image, 75 % battery ring, 320 km range, Parked, quick action buttons, distance driven, efficiency and four tyre readings.', 'The card in light mode.'],
      ['dashboard.png', 860, 2600, 'The full Thai dashboard example with charging, controls and history charts.', 'The Thai dashboard example.'],
    ],
  },

  entities: {
    title: 'Entities',
    intro: 'Optional entities only appear when your car’s capability list says it has the feature.',
    head: ['Platform', 'Entities'],
    rows: [
      ['Sensor', 'battery, range, odometer, speed, 12 V battery voltage, energy consumption, rated range (WLTC), charging power, charging time remaining, charging status, charging mode, charge target (estimated), A/C target temperature, distance until service, days until service, next service, tyre pressure ×4, tyre temperature ×4'],
      ['Binary sensor', 'charging, cable connected, door open (any), driver / passenger / rear-left / rear-right door, tailgate open, air conditioning, high-voltage system (car on), online'],
      ['Lock', 'door lock'],
      ['Switch', 'air conditioning, defog'],
      ['Number', 'A/C temperature (15–31 °C, cars that report <code>SetTemperature</code>), service settings'],
      ['Select', 'seat ventilation, per seat (off / level 1–3)'],
      ['Cover', 'windows, tailgate, sunroof (open / close / tilt)'],
      ['Button', 'find car, vent windows, quick cool, stop charging'],
      ['Device tracker', 'location (+ <code>address</code> attribute)'],
      ['Image', 'vehicle image'],
      ['Number (config)', 'last service odometer, service interval km, service interval days, charge estimate calibration'],
      ['Date (config)', 'last service date'],
    ],
    tyres:
      'Tyre pressure is stored in kPa (<code>raw × 1.375</code>, about 0.2 psi per count); set the unit to psi per entity if you prefer. The card rates each tyre against the average of the reporting corners: amber below 95 %, red below 90 %.',
  },

  help: {
    title: 'Caveats',
    caveats: [
      '<strong>One session per account.</strong> Signing in from Home Assistant can sign the phone app out and vice versa. The token is stored, so restarts don’t re-login. A shared account avoids this.',
      '<strong>Static-decode commands.</strong> A/C on/off, defog, quick cool, seat vent, find car and sunroof opcodes come from the app’s decompiled code and are not yet confirmed on every car. Lock/unlock, windows, tailgate and stop-charging are runtime-confirmed (Omoda C5 EV, Jaecoo J5).',
      '<strong>A/C temperature</strong> is runtime-confirmed on the Omoda C5 EV. The Jaecoo J5 and Tiggo 7 encode it differently, so there the slider is likely refused or shows the wrong value.',
      '<strong>Tyre pressure</strong> needs direct TPMS. Cars with indirect TPMS report no data and the entities stay unknown.',
      '<strong>Seat ventilation and quick cool</strong> are gated on the capability list, but the reported seat level may be wrong on an Omoda C5. The command side should work.',
      '<strong>No heating entities.</strong> Seat, windshield and steering-wheel heat are decoded but not exposed; this is a Thailand-first integration. Open an issue if you are somewhere cold.',
      '<strong>T-Box firmware 2.3.1_051A01R+ (Nov 2026)</strong> rejects plain commands. Since v0.0.18 they are AES-encrypted like the app does, falling back to plain for older firmware.',
      'The API is forced to IPv4 because it misbehaves over IPv6 on some ISPs.',
    ],
    troubleTitle: 'Troubleshooting',
    trouble: [
      'A command the car refuses fails in Home Assistant with the car’s reason (e.g. <em>key detected inside the car</em>, <em>no operation permission</em>) instead of silently doing nothing.',
      '<strong>“No operation permission” (reply ends in <code>44</code>)</strong> means the car’s T-Box does not trust the account Home Assistant uses. Re-share the car to add it; see <a href="#account">Owner account or shared account</a>.',
      'For detail, use <strong>Settings → Devices &amp; services → CarLinko → ⋮ → Enable debug logging</strong>, press the control, then <strong>Disable debug logging</strong> to download the log. Or in <code>configuration.yaml</code>:',
    ],
    logNote:
      'Each command logs a line like <code>control 740100 (encrypted) -&gt; 74010000</code>; result <code>00</code> means done. Logs never contain your password or VIN; review them before posting anyway.',
  },

  footer: {
    disclaimer:
      '<strong>Unofficial and unaffiliated.</strong> This project is not made, endorsed or supported by CarLinko, Chery, Omoda or Jaecoo. It talks to a reverse-engineered private API; an app update can break it at any time. Use at your own risk.',
    credits:
      'API reverse engineering by <a href="https://github.com/GodrezJr2/j5-ev-dashboard">GodrezJr2/j5-ev-dashboard</a> and <a href="https://github.com/elad-bar/ha-carlinko">elad-bar/ha-carlinko</a>. Command encryption scheme from <a href="https://github.com/GodrezJr2/openlinko">openlinko</a>. Vehicle renders are served from CarLinko’s own CDN.',
    links: [
      ['Source', 'https://github.com/thititongumpun/ha-carlinko'],
      ['Releases', 'https://github.com/thititongumpun/ha-carlinko/releases'],
      ['Issues', issues],
    ],
  },
};
