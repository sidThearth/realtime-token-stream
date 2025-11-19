import axios from 'axios';
import logger from '../utils/logger';
import { TokenData } from '../types';

interface JupiterToken {
    address: string;
    name: string;
    symbol: string;
    // Jupiter lite API might return limited data, we might need to enrich it or use it as a secondary source
    // For this task, we'll assume we can get price from it or use it for discovery
}

export class JupiterClient {
    private baseUrl = 'https://lite-api.jup.ag/tokens/v2';

    async searchTokens(query: string): Promise<TokenData[]> {
        try {
            const response = await axios.get<{ tokens: JupiterToken[] }>(`${this.baseUrl}/search?query=${query}`);
            const tokens = response.data.tokens || [];

            // Jupiter Lite API mainly gives address/name/symbol.
            // We might not get price/volume directly here without another call.
            // For the purpose of this aggregation task, we will map what we can
            // and potentially mark them as needing price enrichment.

            return tokens.map(t => ({
                tokenAddress: t.address,
                name: t.name,
                symbol: t.symbol,
                priceSol: 0, // Placeholder
                marketCap: 0,
                volume24h: 0,
                liquidity: 0,
                priceChange1h: 0,
                priceChange24h: 0,
                transactionCount: 0,
                source: 'jupiter',
                lastUpdated: Date.now(),
            }));
        } catch (error) {
            logger.error(`Jupiter API search error for ${query}:`, error);
            return [];
        }
    }
}
