"""Offline checks for signing and blob decoding. No HA, no network."""

import base64
import hashlib
import hmac
import json

import pytest

from carlinko.api import CarlinkoError, caps, charge_target, parse_blob, sign

# Sample from api-map.md: J5 EV parked/asleep, 73 bytes.
SAMPLE = (
    "77000000000200000000FF7F056800600000000372000101B80201003100F8B8"
    "000000000000000000000000FFFFFFFFFFFFFFFF00000071000003FF00000000"
    "000000FF00E000F802"
)


def _reference_sign(params, ts):
    """Independent re-implementation of the francoisj1 algorithm."""
    payload = {k: "" if v is None else str(v) for k, v in {**params, "timestamp": ts}.items()}
    ordered = {k: payload[k] for k in sorted(payload)}
    message = json.dumps(ordered, separators=(",", ":"), ensure_ascii=False).encode()
    return base64.b64encode(
        hmac.new(b"mYj3fzMpn77bir66", message, hashlib.sha256).digest()
    ).decode()


def test_sign_normalises_none_and_ints():
    ts = "1700000000000"
    assert sign({"a": None}, ts) == sign({"a": ""}, ts)
    assert sign({"a": 1}, ts) == sign({"a": "1"}, ts)


def test_sign_ignores_key_order():
    ts = "1700000000000"
    assert sign({"a": 1, "b": 2}, ts) == sign({"b": 2, "a": 1}, ts)


def test_sign_matches_reference():
    ts = "1700000000000"
    params = {"a": None, "b": 1}
    assert sign(params, ts) == _reference_sign(params, ts)


def test_parse_blob_sample():
    s = parse_blob(SAMPLE)
    assert s["hv_state"] == 2
    assert s["doors"] == 0
    assert s["unlocked"] == 0
    assert s["ac_on"] is True  # b23 == 1, nonzero means on
    assert s["charge_remain_min"] is None  # 0x3FF sentinel
    assert s["charge_power_kw"] is None  # idle
    assert s["tyre_fl_pressure"] is None  # 0xFF = no TPMS reading
    assert len(s) == 37


def test_parse_blob_short_is_lenient():
    s = parse_blob("7700")
    assert s["battery_pct"] is None
    assert len(s) == 37


def test_parse_blob_comfort_bytes():
    s = parse_blob(SAMPLE)
    assert s["seat_heat_l"] == 0  # b32
    assert s["seat_vent_rr"] == 0  # b41
    assert s["windshield_heat"] is False  # b64
    assert s["steer_heat"] is False  # b65
    assert parse_blob("7700")["seat_heat_l"] is None


def test_caps_defaults_to_nothing_supported():
    """No config, or a broken one, must hide the optional entities."""
    for row in ({}, {"vehicleControlConfig": "not json"}, {"vehicleControlConfig": 7}):
        c = caps(row)
        assert c["sunroof"] is False
        assert c["seat_heat_l"] == 0


def test_caps_reads_the_json_string_and_seat_levels():
    c = caps(
        {
            "vehicleControlConfig": json.dumps(
                {
                    "Lock": True,
                    "Sunroof": False,
                    "A/C": {
                        "Switch": True,
                        "DriverHeater": True,
                        "LeftHeaterList": [True, True, False],
                        "RearVent": True,  # flag with no list means three levels
                    },
                }
            )
        }
    )
    assert c["lock"] is True
    assert c["sunroof"] is False
    assert c["ac"] is True
    assert c["seat_heat_l"] == 2  # only L1 and L2 enabled
    assert c["seat_vent_l"] == 0  # DriverVent absent
    assert c["seat_vent_lr"] == c["seat_vent_rr"] == 3  # rear pair shares the flag


def test_parse_blob_rejects_non_hex():
    with pytest.raises(CarlinkoError):
        parse_blob("zzzz")


# Live blob: A/C off, all four tyres reading 40 psi in the app.
LIVE = (
    "77000000000000000000FF7F058300000000005262000101290201004B014129"
    "000000000000000000000000C7C9C7C96D6D6B6B000000880000000000000000"
    "000000000141000002"
)


def test_parse_blob_tyres():
    s = parse_blob(LIVE)
    # 199/201 raw * 1.375 kPa = 39.7/40.1 psi, both shown as 40 in the app.
    assert s["tyre_fl_pressure"] == 273.6
    assert s["tyre_fr_pressure"] == 276.4
    assert s["tyre_rl_pressure"] == 273.6
    assert s["tyre_rr_pressure"] == 276.4
    assert s["tyre_fl_temp"] == 29.5  # app shows 30
    assert s["tyre_rr_temp"] == 28.5  # app shows 29
    assert s["ac_on"] is True  # b23 == 1, nonzero means on


def test_charge_target_infers_the_soc_limit():
    # 82 %, 2.8 kW, 218 min on a car set to 100 %: 10.2 kWh to go over a 55 kWh pack.
    charging = {"charge_state": 1, "battery_pct": 82, "charge_power_kw": 2.8, "charge_remain_min": 218}
    assert charge_target(charging, 55) == 100.5
    assert charge_target({**charging, "charge_state": 2}, 55) is None
    assert charge_target({**charging, "charge_remain_min": None}, 55) is None
    assert charge_target({**charging, "charge_power_kw": 0}, 55) is None
    assert charge_target(parse_blob(SAMPLE), 55) is None  # idle blob, real key shape


# Trimmed from a live OMODA C5 EV (2026-09-11). Keeps the gating honest: this car
# has seat ventilation but no seat heating, and reports PowerLiftgate not Trunk.
C5_CONFIG = json.dumps(
    {
        "Lock": True,
        "Search": True,
        "ChargingManagement": True,
        "PowerLiftgate": True,
        "Trunk": False,
        "WindowsOpen": True,
        "WindowsClose": True,
        "WindowsVent": True,
        "Sunroof": True,
        "SunroofTilting": True,
        "Engine": False,
        "FrontWindshieldHeater": False,
        "SteeringWheelHeater": False,
        "A/C": {
            "Switch": True,
            "RapidCool": True,
            "RapidHeat": True,
            "Defogging": True,
            "AirPurification": False,
            "DriverHeater": False,
            "LeftHeaterList": [False, False, False],
            "AssistantHeater": False,
            "RightHeaterList": [False, False, False],
            "DriverVent": True,
            "LeftVentList": [True, True, True],
            "AssistantVent": True,
            "RightVentList": [True, True, True],
            "RearHeater": False,
            "RearVent": False,
        },
    }
)


def test_caps_omoda_c5():
    c = caps({"vehicleControlConfig": C5_CONFIG})
    # Everything the integration already created must survive the gating.
    for key in ("lock", "find", "charging", "windows_open", "sunroof", "ac"):
        assert c[key] is True, key
    assert c["liftgate"] is True  # PowerLiftgate, even though Trunk is false
    assert c["quick_cool"] is c["quick_heat"] is c["defog"] is True
    # Not fitted on this car - these entities must not be created.
    assert c["purify"] is c["windshield_heat"] is c["steer_heat"] is False
    assert c["seat_vent_l"] == c["seat_vent_r"] == 3
    assert all(c[k] == 0 for k in ("seat_heat_l", "seat_heat_r", "seat_vent_lr", "seat_vent_rr"))
