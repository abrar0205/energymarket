# ⚡ Energy Market Demo

A real-time energy trading dashboard with a **Python (FastAPI) backend** and a **React + TypeScript + Vite** frontend. The backend simulates an AWS-style event-driven architecture using in-process Python services; the frontend connects via WebSocket and REST.

When deployed to **GitHub Pages** (static hosting), the frontend automatically falls back to an in-browser simulator so the dashboard remains fully interactive without the backend.

## Live Demo

Once GitHub Pages is enabled, the site is available at:

```
https://YOUR_GITHUB_USERNAME.github.io/energymarket/
```

## Features

- **Mock Exchange Feeds** — EEX, ICE, and Nasdaq emit realistic price ticks every 1–3 seconds (Python `asyncio` tasks)
- **Event Bus** — Async pub/sub system simulating Amazon EventBridge (Python)
- **Aggregation Service** — Normalizes contracts and computes average / best / latest prices (Python, simulates AWS Lambda)
- **Recent Cache** — In-memory Python cache (simulates Amazon ElastiCache / Redis)
- **Historical Storage** — Rolling price history kept in memory (Python, simulates Amazon S3)
- **API Layer** — FastAPI REST endpoints + WebSocket stream (simulates API Gateway)
- **Dashboard** — Live ticker cards, exchange-wise feeds, aggregated market table, price history chart, and system status panel (React)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Python Backend (FastAPI)                           │
│                                                     │
│  Exchange Feeds ──► Event Bus ──► Aggregator        │
│       (asyncio)      (pub/sub)     (Lambda)         │
│                         │                           │
│                    ┌────┴────┐                      │
│                    ▼         ▼                      │
│               Cache      Historical Store           │
│              (Redis)        (S3)                     │
│                    │         │                      │
│                    └────┬────┘                      │
│                         ▼                           │
│              REST API + WebSocket                   │
│              (API Gateway)                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  React Frontend (Vite)                              │
│  Ticker · Chart · Table · Feeds · Status            │
└─────────────────────────────────────────────────────┘
```

| Python Module | AWS Equivalent |
|---|---|
| `backend/services/exchanges.py` | External APIs → EventBridge |
| `backend/services/event_bus.py` | Amazon EventBridge |
| `backend/services/aggregator.py` | AWS Lambda |
| `backend/services/cache.py` | Amazon ElastiCache (Redis) |
| `backend/services/historical_store.py` | Amazon S3 |
| `backend/main.py` (REST + WS) | API Gateway + WebSocket |

## Getting Started

### Prerequisites

- [Python](https://www.python.org/) 3.10+ and pip
- [Node.js](https://nodejs.org/) 18+ and npm

### 1. Start the Python Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs at **http://localhost:8000**. API docs are available at http://localhost:8000/docs.

### 2. Start the React Frontend

```bash
npm install
npm run dev
```

Open **http://localhost:5173/energymarket/** in your browser. The Vite dev server proxies `/api` and `/ws` requests to the Python backend.

### Build Frontend for Production

```bash
npm run build
npm run preview
```

Set the `VITE_API_URL` and `VITE_WS_URL` environment variables to point the frontend at your deployed backend:

```bash
VITE_API_URL=https://your-backend.example.com VITE_WS_URL=wss://your-backend.example.com/ws npm run build
```

## Deploying to GitHub Pages (Frontend)

The included GitHub Actions workflow automatically builds and deploys the **frontend** to GitHub Pages on every push to `main`. The site works fully standalone — if the Python backend is not reachable, the dashboard uses an in-browser price simulator.

### Steps to enable

1. **Push your code** to the `main` branch of your GitHub repository.

2. **Enable GitHub Pages** in your repository settings:
   - Go to **Settings → Pages**
   - Under **Build and deployment → Source**, select **GitHub Actions**

3. **Verify the workflow** runs:
   - Go to the **Actions** tab
   - The "Deploy to GitHub Pages" workflow should run automatically on push to `main`

4. **Access your site** at:
   ```
   https://YOUR_GITHUB_USERNAME.github.io/energymarket/
   ```

### How it works

- **Vite base path** is set to `/energymarket/` in `vite.config.ts` to match the repository name.
- The **GitHub Actions workflow** (`.github/workflows/deploy.yml`) installs dependencies, builds the frontend, and deploys it using `actions/deploy-pages@v4`.
- On GitHub Pages, the frontend detects that the Python backend is unreachable and seamlessly switches to an **in-browser simulator** that generates realistic price data.
- If you have a deployed backend, set `VITE_API_URL` / `VITE_WS_URL` as repository secrets or workflow env vars to connect to it at build time.

### Customizing the Repository Name

If your repository has a different name, update the `base` property in `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',
})
```

Also update the favicon path in `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/your-repo-name/favicon.svg" />
```

## Deploying the Python Backend

The Python backend can be deployed to any platform that supports Python/ASGI:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Popular options: **Railway**, **Render**, **Fly.io**, **AWS EC2/ECS**, or any VPS.

## Tech Stack

### Backend
- [Python](https://www.python.org/) 3.10+
- [FastAPI](https://fastapi.tiangolo.com/) — REST + WebSocket
- [Uvicorn](https://www.uvicorn.org/) — ASGI server

### Frontend
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5.9
- [Vite](https://vite.dev/) 8
- [Recharts](https://recharts.org/) for price history charts

## License

MIT