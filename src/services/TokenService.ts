import { DexScreenerClient } from '../clients/DexScreenerClient';
import { JupiterClient } from '../clients/JupiterClient';
import { CacheService } from './CacheService';
import { TokenData } from '../types';
import logger from '../utils/logger';

export class TokenService {
    private dexScreener: DexScreenerClient;
    private jupiter: JupiterClient;
    private cache: CacheService;
    private readonly CACHE_KEY_PREFIX = 'tokens:';
    private readonly SEARCH_CACHE_TTL = 60; // 1 minute

    constructor() {
        this.dexScreener = new DexScreenerClient();
        this.jupiter = new JupiterClient();
        this.cache = CacheService.getInstance();
    }

    async searchTokens(query: string, skipCache: boolean = false): Promise<TokenData[]> {
        const cacheKey = `${this.CACHE_KEY_PREFIX}search:${query}`;

        if (!skipCache) {
            const cached = await this.cache.get<TokenData[]>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Fetch from both sources in parallel
        const [dexTokens, jupTokens] = await Promise.all([
            this.dexScreener.searchTokens(query),
            this.jupiter.searchTokens(query),
        ]);

        // Merge and deduplicate
        const merged = this.mergeTokens(dexTokens, jupTokens);

        // Cache the result
        await this.cache.set(cacheKey, merged, this.SEARCH_CACHE_TTL);

        return merged;
    }

    private mergeTokens(sourceA: TokenData[], sourceB: TokenData[]): TokenData[] {
        const map = new Map<string, TokenData>();

        // Prioritize DexScreener data as it has price/liquidity
        for (const token of sourceA) {
            map.set(token.tokenAddress, token);
        }

        for (const token of sourceB) {
            if (!map.has(token.tokenAddress)) {
                map.set(token.tokenAddress, token);
            } else {
                // Optional: Enrich existing data if Jupiter has something DexScreener doesn't
                // For now, we stick to DexScreener as primary for price
            }
        }

        return Array.from(map.values());
    }

    async getTokens(params: {
        query?: string;
        sort?: 'volume' | 'price' | 'marketCap' | 'change1h' | 'change24h';
        limit?: number;
        cursor?: string;
    } = {}): Promise<{ tokens: TokenData[]; nextCursor?: string }> {
        const { query, sort = 'volume', limit = 20, cursor } = params;

        let tokens: TokenData[];

        // 1. Fetch Data
        if (query) {
            tokens = await this.searchTokens(query);
        } else {
            tokens = await this.searchTokens('SOL'); // Default list
        }

        // 2. Sort
        tokens.sort((a, b) => {
            switch (sort) {
                case 'price': return b.priceSol - a.priceSol;
                case 'marketCap': return b.marketCap - a.marketCap;
                case 'change1h': return b.priceChange1h - a.priceChange1h;
                case 'change24h': return b.priceChange24h - a.priceChange24h;
                case 'volume':
                default: return b.volume24h - a.volume24h;
            }
        });

        // 3. Paginate (Cursor-based)
        let startIndex = 0;
        if (cursor) {
            try {
                const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
                startIndex = parseInt(decoded, 10);
            } catch (e) {
                logger.warn('Invalid cursor format');
            }
        }

        const paginatedTokens = tokens.slice(startIndex, startIndex + limit);

        // Generate next cursor
        let nextCursor: string | undefined;
        if (startIndex + limit < tokens.length) {
            nextCursor = Buffer.from((startIndex + limit).toString()).toString('base64');
        }

        return { tokens: paginatedTokens, nextCursor };
    }
}
