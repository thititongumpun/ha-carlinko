"""Offline checks for signing and blob decoding. No HA, no network."""

import base64
import hashlib
import hmac
import json
import re
from pathlib import Path

import pytest

from carlinko.api import CarlinkoError, caps, charge_target, control_verdict, encrypt_control, parse_blob, sign

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
    assert len(s) == 40


def test_parse_blob_short_is_lenient():
    s = parse_blob("7700")
    assert s["battery_pct"] is None
    assert len(s) == 40


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


# HA picks the cover open/close button icons from device_class alone
# (frontend src/common/entity/cover_icon.ts): awning/door/gate/curtain get the
# horizontal pair, everything else gets up/down. Keep each cover on the side
# that matches how it actually moves.
HORIZONTAL_ARROW_CLASSES = {"awning", "door", "gate", "curtain"}


def test_cover_device_classes_match_their_motion():
    source = Path("custom_components/carlinko/cover.py").read_text()
    found = dict(
        re.findall(
            r'_attr_translation_key = "(\w+)"(?:\s*#[^\n]*\n)*\s*'
            r"_attr_device_class = CoverDeviceClass\.(\w+)",
            source,
        )
    )
    assert found == {"windows": "WINDOW", "trunk": "SHUTTER", "sunroof": "CURTAIN"}
    # Windows roll down and the tailgate lifts: both want up/down arrows.
    assert found["windows"].lower() not in HORIZONTAL_ARROW_CLASSES
    assert found["trunk"].lower() not in HORIZONTAL_ARROW_CLASSES
    # The sunroof panel slides rearward: horizontal arrows.
    assert found["sunroof"].lower() in HORIZONTAL_ARROW_CLASSES


def test_encrypt_control_matches_app_captures():
    # plaintext<->ciphertext pairs captured from app 1.14.10 (GodrezJr2/openlinko)
    vin, uid = "MF7HD27B8TJ014064", "88504"
    for op, cap in [
        ("741001", "665b860f36237770bc9e20d41399792a5cfd304f234dbd081a007dc9cef3b81634465e4e5d2e470785"),
        ("741000", "66d605e8d5dfef0987565af8d5caf3d921d37a1d6be606fcb6400a930baa03acbf56180cf760cf2f26"),
    ]:
        assert encrypt_control(op, vin, uid, rand=bytes.fromhex(cap)[1:9]) == cap


def test_control_verdict():
    assert control_verdict("740100", "SN123__7404") == (False, "car control system error (0x04), command frame rejected")
    assert control_verdict("740100", "SN123__74010000") == (True, None)
    assert control_verdict("741001", "SN123__74100196")[1] == "key detected inside the car"
    assert "not authorised" in control_verdict("740100", "SN123__74010044")[1]
    assert control_verdict("740100", "SN123__740100AB") == (False, "car refused (code 0xAB)")
    assert control_verdict("740100", "") == (True, None)  # no verdict to judge


def _patch(blob: str, at: int, hex_bytes: str) -> str:
    b = bytearray.fromhex(blob)
    b[at : at + len(hex_bytes) // 2] = bytes.fromhex(hex_bytes)
    return b.hex()


def test_tpms_scale_comes_from_the_model_config():
    assert caps({})["tpms_scale"] == 1.375  # no formula: C5-confirmed fallback
    assert caps({"vehicleControlConfig": json.dumps({"appKpaFormula": "data * 1.779"})})["tpms_scale"] == 1.779
    assert caps({"vehicleControlConfig": json.dumps({"appKpaFormula": "eval(1)"})})["tpms_scale"] == 1.375
    for model in ("TIGGO 8 CSH", "Tiggo 7 PHEV", "TIGGO 8 PRO PHEV"):
        assert caps({"model": model, "vehicleControlConfig": json.dumps({"appKpaFormula": "data * 1.373"})})["tpms_scale"] == 1.779, model
    assert caps({"model": "OMODA C5 EV"})["tpms_scale"] == 1.375
    # Issue #3, Tiggo 8 CSH: raw 151 read 30 psi at 1.375; the app showed 39.
    s = parse_blob(_patch(LIVE, 44, "97"), 1.779)
    assert round(s["tyre_fl_pressure"] * 0.145038) == 39


def test_parse_blob_phev_fuel():
    # elad-bar Tiggo 8 PHEV capture: tank 58 %, 0.8 L/100 km, fuel range 652 km.
    blob = _patch(_patch(_patch(LIVE, 21, "3A"), 53, "08"), 70, "028C")
    s = parse_blob(blob)
    assert (s["fuel_pct"], s["fuel_consumption"], s["fuel_range"]) == (58, 0.8, 652)
    assert parse_blob(SAMPLE)["fuel_pct"] == 0  # BEV
    assert caps({"vehicleControlConfig": json.dumps({"fuelConsumption": True})})["phev"] is True
    assert caps({"vehicleControlConfig": C5_CONFIG})["phev"] is False
