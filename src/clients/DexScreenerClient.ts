import axios from 'axios';
import logger from '../utils/logger';
import { TokenData, DexScreenerResponse } from '../types';

export class DexScreenerClient {
    private baseUrl = 'https://api.dexscreener.com/latest/dex';
    private lastRequestTime = 0;
    private minRequestInterval = 200; // 5 requests/sec limit (conservative)

    async getToken(tokenAddress: string): Promise<TokenData | null> {
        return this.fetchWithBackoff(async () => {
            await this.rateLimit();
            const response = await axios.get<DexScreenerResponse>(`${this.baseUrl}/tokens/${tokenAddress}`);
            const pairs = response.data.pairs;

            if (!pairs || pairs.length === 0) return null;

            // Get the most liquid pair
            const bestPair = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];

            return {
                tokenAddress: bestPair.baseToken.address,
                name: bestPair.baseToken.name,
                symbol: bestPair.baseToken.symbol,
                priceSol: parseFloat(bestPair.priceNative),
                marketCap: bestPair.fdv,
                volume24h: bestPair.volume.h24,
                liquidity: bestPair.liquidity.usd,
                priceChange1h: bestPair.priceChange.h1,
                priceChange24h: bestPair.priceChange.h24,
                transactionCount: (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0),
                source: 'dexscreener',
                lastUpdated: Date.now(),
            };
        });
    }

    private async fetchWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T | null> {
        try {
            return await fn();
        } catch (error) {
            if (retries === 0) {
                logger.error(`DexScreener API request failed after retries:`, error);
                return null;
            }
            logger.warn(`DexScreener API request failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.fetchWithBackoff(fn, retries - 1, delay * 2);
        }
    }

    async searchTokens(query: string): Promise<TokenData[]> {
        const result = await this.fetchWithBackoff(async () => {
            await this.rateLimit();
            const response = await axios.get<DexScreenerResponse>(`${this.baseUrl}/search?q=${query}`);
            const pairs = response.data.pairs || [];

            // Deduplicate by token address, keeping the most liquid pair
            const tokenMap = new Map<string, TokenData>();

            for (const pair of pairs) {
                try {
                    // Safe access to nested properties
                    const liquidity = pair.liquidity?.usd || 0;
                    const currentLiquidity = tokenMap.get(pair.baseToken.address)?.liquidity || 0;

                    if (!tokenMap.has(pair.baseToken.address) || liquidity > currentLiquidity) {
                        tokenMap.set(pair.baseToken.address, {
                            tokenAddress: pair.baseToken.address,
                            name: pair.baseToken.name,
                            symbol: pair.baseToken.symbol,
                            priceSol: parseFloat(pair.priceNative || '0'),
                            marketCap: pair.fdv || 0,
                            volume24h: pair.volume?.h24 || 0,
                            liquidity: liquidity,
                            priceChange1h: pair.priceChange?.h1 || 0,
                            priceChange24h: pair.priceChange?.h24 || 0,
                            transactionCount: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
                            source: 'dexscreener',
                            lastUpdated: Date.now(),
                        });
                    }
                } catch (err) {
                    logger.warn(`Error processing pair ${pair.pairAddress}:`, err);
                }
            }

            const results = Array.from(tokenMap.values());
            logger.info(`DexScreener found ${results.length} tokens for query "${query}"`);
            return results;
        });

        return result || [];
    }

    private async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise((resolve) => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }
}
