"""Lightweight internal event bus – simulates Amazon EventBridge."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Any, Callable, Awaitable

logger = logging.getLogger(__name__)

Listener = Callable[[Any], Awaitable[None]]


class EventBus:
    """Async pub/sub message broker."""

    def __init__(self) -> None:
        self._listeners: dict[str, set[Listener]] = defaultdict(set)

    def subscribe(self, event: str, callback: Listener) -> Callable[[], None]:
        self._listeners[event].add(callback)

        def unsubscribe() -> None:
            self._listeners[event].discard(callback)

        return unsubscribe

    async def publish(self, event: str, data: Any) -> None:
        for cb in list(self._listeners.get(event, [])):
            try:
                await cb(data)
            except Exception:
                logger.exception("EventBus error on %r", event)


event_bus = EventBus()


async def wait_for_event(event: str, timeout: float = 10.0) -> Any:
    """Block until the next occurrence of *event* (useful for testing)."""
    future: asyncio.Future[Any] = asyncio.get_event_loop().create_future()

    def _unsub() -> None:
        pass

    async def _cb(data: Any) -> None:
        if not future.done():
            future.set_result(data)
        _unsub()

    _unsub = event_bus.subscribe(event, _cb)
    try:
        return await asyncio.wait_for(future, timeout)
    finally:
        _unsub()
