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

### Buttons
- Stop charging
- Vent windows

### Cover
- Windows (open / close)

### Device Tracker
- Vehicle location

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

### Switches
- Air conditioning

## Important Caveats

**CarLinko allows only one active session per account.** Logging in from Home Assistant will sign out the phone app and vice versa.

The integration forces IPv4 (AF_INET) for all connections because the CarLinko API misbehaves over IPv6 on some ISPs.

**Polling:** Vehicle data is polled every 60 seconds; location is updated every 15 minutes.

**A/C and window vent:** the A/C on/off and window vent opcodes are a static decode pending live confirmation (window open/close are runtime-confirmed on a Jaecoo J5).

## Testing

Test your setup from the command line:

```bash
# Check vehicle status
CARLINKO_ACCOUNT=your_email CARLINKO_PASSWORD=your_password CARLINKO_REGION=sea python3 tools/cli.py status

# Lock the vehicle (opcode 740100)
python3 tools/cli.py send 740100

# Run integration tests
python3 -m pytest tests -q
```

## Credits

- **API Reverse Engineering:**
  - [GodrezJr2/j5-ev-dashboard](https://github.com/GodrezJr2/j5-ev-dashboard)
  - [elad-bar/ha-carlinko](https://github.com/elad-bar/ha-carlinko)
