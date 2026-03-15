"""Aggregation service – consumes exchange ticks, normalises and computes
average / best / latest price.  Simulates AWS Lambda aggregation."""

from __future__ import annotations

import time
from typing import Any

from .event_bus import event_bus

_latest_by_exchange: dict[str, dict[str, dict[str, Any]]] = {}


async def _on_tick(tick: dict[str, Any]) -> None:
    contract = tick["contract"]
    exchange = tick["exchange"]

    if contract not in _latest_by_exchange:
        _latest_by_exchange[contract] = {}
    _latest_by_exchange[contract][exchange] = tick

    await _normalize(contract)


async def _normalize(contract: str) -> None:
    entries = list(_latest_by_exchange.get(contract, {}).values())
    if not entries:
        return

    prices = [e["price"] for e in entries]
    avg = sum(prices) / len(prices)
    latest = max(entries, key=lambda e: e["timestamp"])

    exchange_prices: dict[str, float] = {e["exchange"]: e["price"] for e in entries}

    normalized = {
        "contract": contract,
        "averagePrice": round(avg, 2),
        "bestBid": round(min(prices), 2),
        "bestAsk": round(max(prices), 2),
        "latestPrice": latest["price"],
        "latestExchange": latest["exchange"],
        "timestamp": int(time.time() * 1000),
        "exchangePrices": exchange_prices,
    }
    await event_bus.publish("aggregated:price", normalized)


_unsub = None


def start_aggregator() -> None:
    global _unsub
    _unsub = event_bus.subscribe("exchange:tick", _on_tick)


def stop_aggregator() -> None:
    global _unsub
    if _unsub:
        _unsub()
        _unsub = None
