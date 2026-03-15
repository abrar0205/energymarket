"""Historical price storage – simulates Amazon S3.

Keeps a rolling window of aggregated price points in memory."""

from __future__ import annotations

from collections import deque
from typing import Any

from .event_bus import event_bus

MAX_POINTS = 500

_history: deque[dict[str, Any]] = deque(maxlen=MAX_POINTS)


def get_history(contract: str | None = None) -> list[dict[str, Any]]:
    if contract:
        return [p for p in _history if p["contract"] == contract]
    return list(_history)


async def _on_aggregated(normalized: dict[str, Any]) -> None:
    _history.append(
        {
            "timestamp": normalized["timestamp"],
            "price": normalized["averagePrice"],
            "contract": normalized["contract"],
        }
    )


_unsub = None


def start_historical_store() -> None:
    global _unsub
    _unsub = event_bus.subscribe("aggregated:price", _on_aggregated)


def stop_historical_store() -> None:
    global _unsub
    if _unsub:
        _unsub()
        _unsub = None
