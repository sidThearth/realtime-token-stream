import { TokenService } from './TokenService';
import { DexScreenerClient } from '../clients/DexScreenerClient';
import { JupiterClient } from '../clients/JupiterClient';
import { CacheService } from './CacheService';

// Mock dependencies
jest.mock('../clients/DexScreenerClient');
jest.mock('../clients/JupiterClient');
jest.mock('./CacheService');

describe('TokenService', () => {
    let tokenService: TokenService;
    let mockDexClient: jest.Mocked<DexScreenerClient>;
    let mockJupClient: jest.Mocked<JupiterClient>;
    let mockCache: jest.Mocked<CacheService>;

    beforeEach(() => {
        mockDexClient = new DexScreenerClient() as jest.Mocked<DexScreenerClient>;
        mockJupClient = new JupiterClient() as jest.Mocked<JupiterClient>;

        // Mock CacheService instance
        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        } as any;

        (DexScreenerClient as jest.Mock).mockImplementation(() => mockDexClient);
        (JupiterClient as jest.Mock).mockImplementation(() => mockJupClient);
        (CacheService.getInstance as jest.Mock).mockReturnValue(mockCache);

        tokenService = new TokenService();
    });

    it('should return cached results if available', async () => {
        const mockTokens = [{ tokenAddress: '123', name: 'Test' }];
        mockCache.get.mockResolvedValue(mockTokens as any);

        const result = await tokenService.searchTokens('SOL');

        expect(result).toEqual(mockTokens);
        expect(mockDexClient.searchTokens).not.toHaveBeenCalled();
    });

    it('should fetch and merge data if cache miss', async () => {
        mockCache.get.mockResolvedValue(null);

        const dexTokens = [{
            tokenAddress: 'addr1', name: 'Token1', source: 'dexscreener', liquidity: 1000
        }];
        const jupTokens = [{
            tokenAddress: 'addr1', name: 'Token1', source: 'jupiter', liquidity: 0
        }];

        mockDexClient.searchTokens.mockResolvedValue(dexTokens as any);
        mockJupClient.searchTokens.mockResolvedValue(jupTokens as any);

        const result = await tokenService.searchTokens('SOL');

        expect(result).toHaveLength(1);
        expect(result[0].source).toBe('dexscreener'); // Should prefer DexScreener
        expect(mockCache.set).toHaveBeenCalled();
    });
});
