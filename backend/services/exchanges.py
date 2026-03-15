"""Mock exchange feeds – simulates EEX, ICE, and Nasdaq price ticks."""

from __future__ import annotations

import asyncio
import random
import time
from dataclasses import dataclass, asdict
from typing import Any

from .event_bus import event_bus

CONTRACTS = ["Base-2026-Q1", "Peak-2026-Q2", "Base-2026-Cal"]


@dataclass
class ExchangeConfig:
    name: str
    base_prices: dict[str, float]
    volatility: float
    min_interval: float  # seconds
    max_interval: float


EXCHANGE_CONFIGS: list[ExchangeConfig] = [
    ExchangeConfig(
        name="EEX",
        base_prices={"Base-2026-Q1": 72.5, "Peak-2026-Q2": 89.3, "Base-2026-Cal": 68.1},
        volatility=0.8,
        min_interval=1.0,
        max_interval=3.0,
    ),
    ExchangeConfig(
        name="ICE",
        base_prices={"Base-2026-Q1": 72.8, "Peak-2026-Q2": 89.1, "Base-2026-Cal": 68.4},
        volatility=1.0,
        min_interval=1.0,
        max_interval=2.5,
    ),
    ExchangeConfig(
        name="Nasdaq",
        base_prices={"Base-2026-Q1": 72.3, "Peak-2026-Q2": 89.5, "Base-2026-Cal": 67.9},
        volatility=0.6,
        min_interval=1.5,
        max_interval=3.0,
    ),
]


def _generate_tick(config: ExchangeConfig, current_prices: dict[str, float]) -> dict[str, Any]:
    contract = random.choice(CONTRACTS)
    current = current_prices.get(contract, config.base_prices[contract])
    change = (random.random() - 0.5) * 2 * config.volatility
    new_price = max(10.0, current + change)
    current_prices[contract] = new_price

    return {
        "exchange": config.name,
        "contract": contract,
        "price": round(new_price, 2),
        "volume": random.randint(50, 549),
        "timestamp": int(time.time() * 1000),
    }


_tasks: list[asyncio.Task[None]] = []


async def _run_exchange(config: ExchangeConfig) -> None:
    current_prices: dict[str, float] = dict(config.base_prices)
    while True:
        tick = _generate_tick(config, current_prices)
        await event_bus.publish("exchange:tick", tick)
        await event_bus.publish(f"exchange:{config.name}", tick)
        delay = config.min_interval + random.random() * (config.max_interval - config.min_interval)
        await asyncio.sleep(delay)


def start_all_exchanges() -> None:
    for cfg in EXCHANGE_CONFIGS:
        task = asyncio.create_task(_run_exchange(cfg))
        _tasks.append(task)


def stop_all_exchanges() -> None:
    for task in _tasks:
        task.cancel()
    _tasks.clear()
