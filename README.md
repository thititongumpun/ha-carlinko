# CarLinko Home Assistant Integration

CarLinko cloud integration for Home Assistant that adds support for Omoda, Jaecoo, and Chery electric vehicles using your existing CarLinko mobile app account.

## Installation

### Via HACS (Recommended)
1. Add this repository as a custom repository in HACS:
   - Open HACS → Integrations → ⋯ menu → Custom repositories
   - Add `https://github.com/thititongumpun/ha-carlinko` as an Integration

2. Install the integration and restart Home Assistant

### Manual
1. Copy `custom_components/carlinko` to your Home Assistant `config/custom_components/carlinko`
2. Restart Home Assistant

### Lovelace card
The integration ships a Lovelace card for showing a vehicle at a glance; add the resource `/carlinko/carlinko-card.js?v=0.0.6` (type **JavaScript module**) in Settings → Dashboards → Resources. See [docs/card.md](docs/card.md).

## Configuration

1. Go to Settings → Devices & Services
2. Click "Add integration" and select "CarLinko"
3. Enter:
   - **Account:** Email or phone number registered with CarLinko
   - **Password:** Your CarLinko password
   - **Region:** Your region (default: `sea`)

## Supported Regions

| Code  | Region                              |
|-------|-------------------------------------|
| `sea` | Thailand, Malaysia, Indonesia       |
| `ap`  | Asia-Pacific                        |
| `emea`| Europe, Middle East, Africa         |
| `me`  | Middle East                         |
| `naf` | North Africa                        |
| `saf` | South Africa                        |
| `sam` | South America                       |
| `uzb` | Uzbekistan                          |
| `vn`  | Vietnam                             |

## Entities

### Binary Sensors
- Air conditioning status
- Charging status
- Door open
- High-voltage system active
- Cable connected (plugged in)
- Tailgate open
- Online (car reachable by the cloud)

### Buttons
- Stop charging
- Vent windows
- Find car (flash / horn)

### Cover
- Windows (open / close)
- Tailgate (open / close)
- Sunroof (open / close / tilt) — disable if your car has no opening sunroof

### Device Tracker
- Vehicle location

### Image
- Vehicle image (from CarLinko CDN)

### Lock
- Door lock

### Sensors
- Battery level (%)
- Charging mode (AC, DC fast, Not connected)
- Charging power (kW)
- Charging time remaining
- Charging status (Idle, Charging, Complete, Stopped, Canceled, Overheated)
- Odometer (km)
- Range (km)
- Speed (km/h)
- 12V battery voltage (V)
- A/C target temperature
- Energy consumption (kWh/100 km)
- Rated range (WLTC)
- Distance until service (km)
- Days until service
- Next service (Overdue / By distance / By date / Not set)

### Numbers (config)
- Last service odometer (km)
- Service interval (km)
- Service interval (days)

### Date (config)
- Last service date

### Switches
- Air conditioning

## Service reminder

CarLinko dealers rarely log service visits, so the integration tracks them for you.
On the vehicle's device page set **Last service odometer** and **Last service date** after each visit.
Intervals default to 20,000 km / 365 days and are editable per vehicle; the service sensors update immediately.

## Important Caveats

**CarLinko allows only one active session per account.** Logging in from Home Assistant will sign out the phone app and vice versa.

The integration forces IPv4 (AF_INET) for all connections because the CarLinko API misbehaves over IPv6 on some ISPs.

**Polling:** Vehicle data is polled every 60 seconds; location is updated every 15 minutes. When CarLinko returns no street address (e.g. Thailand), the tracker's `address` attribute is filled from OpenStreetMap Nominatim, only when the car has moved.

**A/C and window vent:** the A/C on/off, window vent, find-car, and sunroof opcodes are a static decode pending live confirmation (window open/close are runtime-confirmed on a Jaecoo J5).

## Testing

Test your setup from the command line:

```bash
# Check vehicle status
CARLINKO_ACCOUNT=your_email CARLINKO_PASSWORD=your_password CARLINKO_REGION=sea python3 tools/cli.py status

# Lock the vehicle (opcode 740100)
python3 tools/cli.py send 740100

# Dealer service records (empty if your dealer does not log them in CarLinko)
python3 tools/cli.py maintain

# Run integration tests
python3 -m pytest tests -q
```

## Credits

- **API Reverse Engineering:**
  - [GodrezJr2/j5-ev-dashboard](https://github.com/GodrezJr2/j5-ev-dashboard)
  - [elad-bar/ha-carlinko](https://github.com/elad-bar/ha-carlinko)
