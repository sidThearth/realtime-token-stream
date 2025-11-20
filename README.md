# Real-time Data Aggregation Service

A backend service that aggregates real-time meme coin data from DexScreener and Jupiter APIs, providing a unified API and WebSocket updates.

## Features

- **Data Aggregation**: Fetches and merges token data from multiple DEX sources.
- **Real-time Updates**: WebSocket support for live price/volume updates.
- **Caching**: Redis-based caching to reduce API calls and handle rate limits.
- **Filtering & Sorting**: API supports filtering by time periods and sorting by various metrics.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis
- **HTTP Client**: Axios

## Setup

1.  **Prerequisites**:
    - Node.js (v16+)
    - Redis (running on default port 6379)

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start Server**:
    ```bash
    npm run dev
    ```

## API Endpoints

### `GET /api/tokens`

Fetch aggregated token data.

**Query Parameters**:
- `query`: Search term (e.g., "SOL", "PEPE")
- `sort`: Sort field (`volume`, `price`)
- `limit`: Number of results (default: all)

**Example**:
```bash
curl "http://localhost:3000/api/tokens?query=SOL&sort=volume&limit=5"
```

### WebSocket

Connect to `ws://localhost:3000`.
Listen for `priceUpdate` events.

# Real-time Data Aggregation Service

A backend service that aggregates real-time meme coin data from DexScreener and Jupiter APIs, providing a unified API and WebSocket updates.

## Features

- **Data Aggregation**: Fetches and merges token data from multiple DEX sources.
- **Real-time Updates**: WebSocket support for live price/volume updates.
- **Caching**: Redis-based caching to reduce API calls and handle rate limits.
- **Filtering & Sorting**: API supports filtering by time periods and sorting by various metrics.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis
- **HTTP Client**: Axios

## Setup

1.  **Prerequisites**:
    - Node.js (v16+)
    - Redis (running on default port 6379)

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start Server**:
    ```bash
    npm run dev
    ```

## API Endpoints

### `GET /api/tokens`

Fetch aggregated token data.

**Query Parameters**:
- `query`: Search term (e.g., "SOL", "PEPE")
- `sort`: Sort field (`volume`, `price`)
- `limit`: Number of results (default: all)

**Example**:
```bash
curl "http://localhost:3000/api/tokens?query=SOL&sort=volume&limit=5"
```

### WebSocket

Connect to `ws://localhost:3000`.
Listen for `priceUpdate` events.

## Architecture

- **TokenService**: Core logic for fetching, merging, and caching data.
- **UpdateScheduler**: Background job that polls for updates on active tokens and broadcasts changes.
- **DexScreenerClient / JupiterClient**: API wrappers with rate limiting.

## License

MIT

## Design Decisions

### 1. Architecture & Scalability
- **Centralized Polling**: Instead of every client polling the API (which hits rate limits), the server polls once every 5 seconds and broadcasts updates to all connected clients via WebSockets. This scales to thousands of users with constant API load.
- **Hybrid Data Fetching**: 
    - **REST API** (`/api/tokens`) is used for the initial page load (fast, cached).
    - **WebSockets** are used *only* for price updates (efficient, low latency).

### 2. Caching Strategy
- **Redis First**: All search results are cached in Redis for 60 seconds.
- **In-Memory Fallback**: If Redis fails, the system automatically switches to an in-memory `Map` cache, ensuring high availability and preventing crashes.
- **Smart Invalidation**: The background updater bypasses the cache to ensure it always broadcasts the freshest data.

### 3. Data Aggregation
- **Multi-Source**: Aggregates data from **DexScreener** (primary for price/liquidity) and **Jupiter** (secondary for discovery).
- **Deduplication**: Tokens are merged by address, prioritizing DexScreener data when available.

## Deployment

### Prerequisites
- Node.js v18+
- Redis (optional, but recommended for production)

### Deploy to Render/Railway
1.  **Fork/Clone** this repo.
2.  **Connect** your repo to Render/Railway.
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  **Environment Variables**:
    - `PORT`: `3000` (or provided by host)
    - `REDIS_URL`: `redis://...` (optional)

### Public URL
[https://realtime-token-stream-production.up.railway.app](https://realtime-token-stream-production.up.railway.app)
