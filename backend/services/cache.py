"""In-memory cache – simulates Amazon ElastiCache (Redis).

Keeps recent ticks and the latest normalised prices."""

from __future__ import annotations

from collections import deque
from typing import Any

from .event_bus import event_bus

MAX_TICKS = 100

_recent_ticks: deque[dict[str, Any]] = deque(maxlen=MAX_TICKS)
_normalized_prices: dict[str, dict[str, Any]] = {}


def get_recent_ticks() -> list[dict[str, Any]]:
    return list(_recent_ticks)


def get_normalized_prices() -> dict[str, dict[str, Any]]:
    return dict(_normalized_prices)


async def _on_tick(tick: dict[str, Any]) -> None:
    _recent_ticks.append(tick)


async def _on_aggregated(normalized: dict[str, Any]) -> None:
    _normalized_prices[normalized["contract"]] = normalized


_unsubs: list[Any] = []


def start_cache() -> None:
    _unsubs.append(event_bus.subscribe("exchange:tick", _on_tick))
    _unsubs.append(event_bus.subscribe("aggregated:price", _on_aggregated))


def stop_cache() -> None:
    for u in _unsubs:
        u()
    _unsubs.clear()
