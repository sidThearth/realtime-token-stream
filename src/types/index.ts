export interface TokenData {
    tokenAddress: string;
    name: string;
    symbol: string;
    priceSol: number;
    marketCap: number;
    volume24h: number;
    liquidity: number;
    priceChange1h: number;
    priceChange24h: number;
    transactionCount: number;
    source: 'dexscreener' | 'jupiter' | 'aggregated';
    lastUpdated: number;
}

export interface DexScreenerResponse {
    pairs: {
        pairAddress: string;
        baseToken: {
            address: string;
            name: string;
            symbol: string;
        };
        priceNative: string;
        priceUsd: string;
        liquidity: {
            usd: number;
        };
        volume: {
            h24: number;
        };
        priceChange: {
            h1: number;
            h24: number;
        };
        txns: {
            h24: {
                buys: number;
                sells: number;
            };
        };
        fdv: number;
    }[];
}
