"""Offline checks for signing and blob decoding. No HA, no network."""

import base64
import hashlib
import hmac
import json

import pytest

from carlinko.api import CarlinkoError, parse_blob, sign

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
    assert s["charge_remain_min"] is None  # 0x3FF sentinel
    assert s["charge_power_kw"] is None  # idle
    assert len(s) == 19


def test_parse_blob_short_is_lenient():
    s = parse_blob("7700")
    assert s["battery_pct"] is None
    assert len(s) == 19


def test_parse_blob_rejects_non_hex():
    with pytest.raises(CarlinkoError):
        parse_blob("zzzz")
