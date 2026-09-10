# CarLinko Lovelace card

A single-column, mobile-first vehicle card for the CarLinko integration. Built from
`src/carlinko-card.ts` into `custom_components/carlinko/www/carlinko-card.js` (plain custom
element, no runtime dependencies).

## Add the resource

The integration registers the static path `/carlinko`, so the built file is served at
`/carlinko/carlinko-card.js`.

Settings → Dashboards → ⋮ → **Resources** → **Add resource**

- URL: `/carlinko/carlinko-card.js`
- Type: **JavaScript module**

Then reload the browser (Ctrl+Shift+R).

### Cache busting

Browsers cache Lovelace resources aggressively. After updating the integration, edit the
resource URL to include the version, e.g. `/carlinko/carlinko-card.js?v=0.0.5`, and reload.

## YAML example

```yaml
type: custom:carlinko-card
device_id: 1a2b3c4d5e6f7890abcdef1234567890   # optional
battery_kwh: 61
mask_plate: true
```

In a sections dashboard the card goes inside a section's `cards:` list:

```yaml
views:
  - type: sections
    sections:
      - type: grid
        cards:
          - type: heading
            heading: My Omoda
          - type: custom:carlinko-card
            battery_kwh: 61
```

Minimal version (auto-picks the first CarLinko car):

```yaml
type: custom:carlinko-card
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | — | `custom:carlinko-card` (required) |
| `device_id` | string | first CarLinko device | Device registry id of the car to show |
| `battery_kwh` | number | `61` | Usable pack size, used for "energy left" |
| `mask_plate` | bool | `true` | Mask the plate (`B •••• PGB`)CARLINKO_ACCOUNT=… CARLINKO_PASSWORD=… CARLINKO_REGION=sea python3 tools/cli.py maintain; the eye button toggles it live |

To change the accent colour, set the CSS variable in your theme: `carlinko-accent: "#1f6f4a"`.

## What it shows

Model/plate header with mask + refresh buttons, the vehicle image, battery ring with range and
state (Parked / Driving / Charging, plus kW and minutes left while charging), quick actions
(lock/unlock, A/C, find car, vent windows, stop charging), driven today/week/month with a 7-day
bar chart, and efficiency figures. Labels follow `hass.language` (Thai or English).

Anything missing or unavailable shows `—`; the driven/bar section hides itself if the recorder
statistics call fails (recorder disabled). Tyre and cost/insight sections from the stock app are
not included — the integration exposes no data for them.
