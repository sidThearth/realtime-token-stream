import { TokenData } from '../types';

export function toSnakeCase(token: TokenData) {
    return {
        token_address: token.tokenAddress,
        token_name: token.name,
        token_ticker: token.symbol,
        price_sol: token.priceSol,
        market_cap_sol: token.marketCap,
        volume_sol: token.volume24h,
        liquidity_sol: token.liquidity,
        transaction_count: token.transactionCount,
        price_1hr_change: token.priceChange1h,
        protocol: token.source,
        last_updated: token.lastUpdated
    };
}
