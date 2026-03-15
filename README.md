# ⚡ Energy Market Demo

A real-time energy trading dashboard built with **React + TypeScript + Vite**. This fully static app simulates an AWS-style architecture using frontend-only components — no backend required.

## Live Demo

**https://YOUR_GITHUB_USERNAME.github.io/energy-market-demo/**

## Features

- **Mock Exchange Feeds** — EEX, ICE, and Nasdaq emit realistic price ticks every 1–3 seconds
- **Event Bus** — Custom pub/sub system simulating Amazon EventBridge
- **Aggregation Service** — Normalizes contracts and computes average / best / latest prices (simulates AWS Lambda)
- **Recent Cache** — In-memory store with localStorage persistence (simulates Amazon ElastiCache / Redis)
- **Historical Storage** — Rolling price history persisted to localStorage (simulates Amazon S3)
- **API Simulation** — `getHistoricalPrices()` and `subscribeToRealtimePrices()` frontend service functions (simulates API Gateway + WebSocket)
- **Dashboard** — Live ticker cards, exchange-wise feeds, aggregated market table, price history chart, and system status panel

## Architecture

| Frontend Module | AWS Equivalent |
|---|---|
| Mock exchange feeds | External APIs → EventBridge |
| Custom event bus | Amazon EventBridge |
| Aggregation service | AWS Lambda |
| In-memory + localStorage cache | Amazon ElastiCache (Redis) |
| localStorage history store | Amazon S3 |
| Service functions (API layer) | API Gateway + WebSocket/HTTP |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173/energy-market-demo/ in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Deploying to GitHub Pages

### Steps

1. **Push your code** to the `main` branch of your GitHub repository.

2. **Enable GitHub Pages** in your repository settings:
   - Go to **Settings → Pages**
   - Under **Source**, select **GitHub Actions**

3. **Verify the workflow** runs:
   - Go to **Actions** tab
   - The "Deploy to GitHub Pages" workflow should run automatically on push to `main`

4. **Access your site** at:
   ```
   https://YOUR_GITHUB_USERNAME.github.io/energy-market-demo/
   ```

### Configuration Details

- **Vite base path** is set to `/energy-market-demo/` in `vite.config.ts` to ensure all asset paths resolve correctly on the GitHub Pages subpath.
- The **GitHub Actions workflow** (`.github/workflows/deploy.yml`) builds the app and deploys it using the official `actions/deploy-pages` action.
- The app is **fully static** — no server or backend is required.

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

## Tech Stack

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5.9
- [Vite](https://vite.dev/) 8
- [Recharts](https://recharts.org/) for price history charts

## License

MIT