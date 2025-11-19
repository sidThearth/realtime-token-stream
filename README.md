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
