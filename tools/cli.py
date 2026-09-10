#!/usr/bin/env python3
"""Poke the CarLinko API from a shell. Never prints the password.

    CARLINKO_ACCOUNT=... CARLINKO_PASSWORD=... python3 tools/cli.py status
"""

from __future__ import annotations

import argparse
import json
import asyncio
import os
import socket
import sys
from datetime import datetime

import aiohttp

# Register the integration dir as a standalone top-level "carlinko" package
# before anything imports it, so importing api.py never runs the real
# custom_components.carlinko.__init__ (which pulls in homeassistant).
import importlib.util
from importlib.machinery import ModuleSpec
from pathlib import Path
_p = importlib.util.module_from_spec(ModuleSpec("carlinko", None, is_package=True))
_p.__path__ = [str(Path(__file__).resolve().parents[1] / "custom_components" / "carlinko")]
sys.modules["carlinko"] = _p

from carlinko.api import CarlinkoApi, CarlinkoError  # noqa: E402
from carlinko.const import DEFAULT_REGION  # noqa: E402


async def run(args: argparse.Namespace) -> int:
    account = os.environ.get("CARLINKO_ACCOUNT")
    password = os.environ.get("CARLINKO_PASSWORD")
    if not account or not password:
        print("set CARLINKO_ACCOUNT and CARLINKO_PASSWORD", file=sys.stderr)
        return 2
    region = os.environ.get("CARLINKO_REGION", DEFAULT_REGION)

    # IPv6 to this host is reported broken; pin to IPv4.
    connector = aiohttp.TCPConnector(family=socket.AF_INET)
    async with aiohttp.ClientSession(connector=connector) as session:
        api = CarlinkoApi(session, account, password, region)
        await api.login()
        vehicles = await api.get_vehicles()
        if not vehicles:
            print("no vehicles on this account")
            return 1

        for v in vehicles:
            vid = v.get("vehicleId")
            sn = v.get("deviceId")
            print(f"vehicleId={vid} vin={v.get('vin')} deviceId={sn} model={v.get('model')}")

            if args.cmd == "status":
                state = await api.get_state(vid)
                raw = state.pop("raw", None)
                for k, val in state.items():
                    print(f"  {k}: {val}")
                print(f"  raw: {raw}")
            elif args.cmd == "maintain":
                records = await api.get_maintain(vid)
                if not records:
                    print("  no maintenance records on this vehicle")
                for r in records:
                    print(f"  {json.dumps(r, ensure_ascii=False)}")
                if records and records[0].get("maintainId"):
                    details = await api.get_maintain_details(records[0]["maintainId"])
                    print(f"  details(newest): {json.dumps(details, ensure_ascii=False)}")
            elif args.cmd == "locate":
                print(f"  {await api.locate(sn)}")
            elif args.cmd == "send":
                await api.remote_control(vid, sn, args.opcode)
                print(f"  sent {args.opcode}")
            elif args.cmd == "log":
                await log_blobs(api, vehicles, args)
    return 0


async def log_blobs(api: CarlinkoApi, vehicles: list, args: argparse.Namespace) -> None:
    """Append `timestamp<TAB>vehicleId<TAB>raw` for every change, until Ctrl-C.

    Logs in once and keeps polling on one session: CarLinko allows a single
    session per account, so a cron job that re-logs-in each run would fight the
    phone app for it.

    Only changed blobs are written — a parked car repeats the same bytes for
    hours and those rows say nothing.
    """
    path = Path(args.out)
    seen: dict[str, str] = {}
    print(f"logging to {path} every {args.every}s, Ctrl-C to stop")
    while True:
        for v in vehicles:
            vid = v.get("vehicleId")
            try:
                raw = (await api.get_state(vid)).get("raw") or ""
            except CarlinkoError as err:
                print(f"  {vid}: {err}", file=sys.stderr)
                continue
            if raw and raw != seen.get(str(vid)):
                seen[str(vid)] = raw
                stamp = datetime.now().isoformat(timespec="seconds")
                with path.open("a") as fh:
                    fh.write(f"{stamp}\t{vid}\t{raw}\n")
                print(f"  {stamp} {vid} changed")
        await asyncio.sleep(args.every)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    sub.add_parser("locate")
    sub.add_parser("maintain")
    send = sub.add_parser("send")
    send.add_argument("opcode")
    log = sub.add_parser("log", help="poll and append changed telemetry blobs to a file")
    log.add_argument("--out", default="blobs.tsv")
    log.add_argument("--every", type=int, default=60, help="seconds between polls (default 60)")
    args = parser.parse_args()
    try:
        return asyncio.run(run(args))
    except CarlinkoError as err:
        print(f"error: {err} (code={err.code})", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
