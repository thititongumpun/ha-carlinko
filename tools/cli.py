#!/usr/bin/env python3
"""Poke the CarLinko API from a shell. Never prints the password.

    CARLINKO_ACCOUNT=... CARLINKO_PASSWORD=... python3 tools/cli.py status
"""

from __future__ import annotations

import argparse
import asyncio
import os
import socket
import sys
from pathlib import Path

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from custom_components.carlinko.api import CarlinkoApi, CarlinkoError  # noqa: E402
from custom_components.carlinko.const import DEFAULT_REGION  # noqa: E402


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
            elif args.cmd == "locate":
                print(f"  {await api.locate(sn)}")
            elif args.cmd == "send":
                await api.remote_control(vid, sn, args.opcode)
                print(f"  sent {args.opcode}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    sub.add_parser("locate")
    send = sub.add_parser("send")
    send.add_argument("opcode")
    args = parser.parse_args()
    try:
        return asyncio.run(run(args))
    except CarlinkoError as err:
        print(f"error: {err} (code={err.code})", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
