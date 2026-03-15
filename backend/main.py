"""Energy Market Demo – Python FastAPI backend.

Provides REST endpoints and a WebSocket stream for the React dashboard.
Simulates AWS architecture (EventBridge, Lambda, ElastiCache, S3, API Gateway)
using in-process Python services.
"""

from __future__ import annotations

import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from services.event_bus import event_bus
from services.exchanges import start_all_exchanges, stop_all_exchanges
from services.aggregator import start_aggregator, stop_aggregator
from services.cache import start_cache, stop_cache, get_normalized_prices
from services.historical_store import (
    start_historical_store,
    stop_historical_store,
    get_history,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.add(ws)
        logger.info("WebSocket client connected (%d total)", len(self._connections))

    def disconnect(self, ws: WebSocket) -> None:
        self._connections.discard(ws)
        logger.info("WebSocket client disconnected (%d total)", len(self._connections))

    async def broadcast(self, message: dict[str, Any]) -> None:
        payload = json.dumps(message)
        closed: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(payload)
            except Exception:
                closed.append(ws)
        for ws in closed:
            self._connections.discard(ws)


manager = ConnectionManager()

# ---------------------------------------------------------------------------
# Event bus → WebSocket bridge
# ---------------------------------------------------------------------------

_tick_count: dict[str, int] = {"EEX": 0, "ICE": 0, "Nasdaq": 0}
_agg_count = 0


async def _forward_tick(tick: dict[str, Any]) -> None:
    global _tick_count
    exchange = tick.get("exchange", "")
    if exchange in _tick_count:
        _tick_count[exchange] += 1
    await manager.broadcast({"type": "exchange_tick", "data": tick})


async def _forward_aggregated(normalized: dict[str, Any]) -> None:
    global _agg_count
    _agg_count += 1
    await manager.broadcast({"type": "aggregated_price", "data": normalized})


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    # Start all backend services
    start_cache()
    start_historical_store()
    start_aggregator()
    start_all_exchanges()

    # Bridge events to WebSocket clients
    unsub_tick = event_bus.subscribe("exchange:tick", _forward_tick)
    unsub_agg = event_bus.subscribe("aggregated:price", _forward_aggregated)

    logger.info("All backend services started")
    yield

    # Shutdown
    unsub_tick()
    unsub_agg()
    stop_all_exchanges()
    stop_aggregator()
    stop_cache()
    stop_historical_store()
    logger.info("All backend services stopped")


app = FastAPI(title="Energy Market Demo API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# REST endpoints (simulate API Gateway)
# ---------------------------------------------------------------------------

@app.get("/api/historical")
async def historical_prices(contract: str | None = Query(default=None)) -> list[dict[str, Any]]:
    """Return historical aggregated prices, optionally filtered by contract."""
    return get_history(contract)


@app.get("/api/prices")
async def latest_prices() -> dict[str, dict[str, Any]]:
    """Return the latest normalised prices per contract."""
    return get_normalized_prices()


@app.get("/api/status")
async def system_status() -> dict[str, Any]:
    """Return the current system component statuses."""
    total_ticks = sum(_tick_count.values())
    return {
        "tickCounts": dict(_tick_count),
        "totalTicks": total_ticks,
        "aggCount": _agg_count,
        "components": [
            {"name": "EEX Exchange Feed", "status": "healthy" if _tick_count["EEX"] > 0 else "offline",
             "description": "Simulated EEX power exchange", "awsEquivalent": "External API → EventBridge"},
            {"name": "ICE Exchange Feed", "status": "healthy" if _tick_count["ICE"] > 0 else "offline",
             "description": "Simulated ICE futures exchange", "awsEquivalent": "External API → EventBridge"},
            {"name": "Nasdaq Exchange Feed", "status": "healthy" if _tick_count["Nasdaq"] > 0 else "offline",
             "description": "Simulated Nasdaq commodities", "awsEquivalent": "External API → EventBridge"},
            {"name": "Event Bus", "status": "healthy",
             "description": "Internal pub/sub message broker", "awsEquivalent": "Amazon EventBridge"},
            {"name": "Aggregation Service", "status": "healthy",
             "description": "Price normalization & computation", "awsEquivalent": "AWS Lambda"},
            {"name": "Recent Cache", "status": "healthy",
             "description": "In-memory Python cache", "awsEquivalent": "Amazon ElastiCache (Redis)"},
            {"name": "Historical Store", "status": "healthy",
             "description": "Rolling price history", "awsEquivalent": "Amazon S3"},
            {"name": "API Layer", "status": "healthy",
             "description": "FastAPI REST + WebSocket", "awsEquivalent": "API Gateway + WebSocket"},
        ],
    }


# ---------------------------------------------------------------------------
# WebSocket endpoint (simulate API Gateway WebSocket)
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        while True:
            # Wait for client messages (keeps connection alive).
            # The browser client doesn't send messages; this will block
            # until the client disconnects.
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(ws)
