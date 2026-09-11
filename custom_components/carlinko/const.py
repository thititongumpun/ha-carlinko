"""Constants for the CarLinko integration.

HA-free on purpose: imported by ``api.py``, the tests and ``tools/cli.py``.
``PLATFORMS`` lives in ``__init__.py`` because it needs ``homeassistant.const``.
"""

from __future__ import annotations

DOMAIN = "carlinko"

SIGN_KEY = b"mYj3fzMpn77bir66"  # app-global key from the CarLinko APK, not a user secret (see README credits)
API_HOST = "https://cqr-api-{region}.hzhjcl.com"
REGIONS = ["sea", "ap", "emea", "me", "naf", "saf", "sam", "uzb", "vn"]
DEFAULT_REGION = "sea"
API_VERSION = "1.12.0"
USER_AGENT = "Dart/3.10 (dart:io)"

STALE_TOKEN_CODES = {"9997", "40001", "40003", "401", "1001", "1002"}
CODE_OK = "0000"

SCAN_INTERVAL = 60  # seconds
LOCATE_EVERY = 15  # every Nth refresh

OP_LOCK = "740100"
OP_UNLOCK = "740200"
OP_AC_ON = "741001"
OP_AC_OFF = "741000"
OP_STOP_CHARGING = "742701"
OP_WINDOWS_CLOSE = "740500"
OP_WINDOWS_OPEN = "740600"
OP_WINDOWS_VENT = "740E00"
OP_FIND_CAR = "740400"
OP_TRUNK_OPEN = "740300"
OP_TRUNK_CLOSE = "740A00"
OP_SUNROOF_CLOSE = "740F00"
OP_SUNROOF_OPEN = "740F01"
OP_SUNROOF_TILT = "740F02"
OP_DEFOG_ON = "741201"
OP_DEFOG_OFF = "741200"
OP_QUICK_COOL = "742001"
# Seat comfort: opcode prefix + level 00-03.
OP_SEAT = {
    "seat_vent_l": "741A",
    "seat_vent_r": "741B",
    "seat_vent_lr": "741C",
    "seat_vent_rr": "741E",
}

# Seat heating and quick-heat are decoded but deliberately not exposed: this is a
# Thailand-first integration and nobody here wants them. Drop these into OP_SEAT
# and add a quick_heat button back if a cold-climate user asks.
OP_SEAT_HEAT_UNUSED = {
    "seat_heat_l": "7415",
    "seat_heat_r": "7416",
    "seat_heat_lr": "7417",
    "seat_heat_rr": "7419",
}
OP_QUICK_HEAT_UNUSED = "741F01"

OP_INIT = "77"

CONF_ACCOUNT = "account"
CONF_TOKEN = "token"
