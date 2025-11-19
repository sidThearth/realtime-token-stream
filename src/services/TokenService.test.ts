import { TokenService } from './TokenService';
import { DexScreenerClient } from '../clients/DexScreenerClient';
import { JupiterClient } from '../clients/JupiterClient';
import { CacheService } from './CacheService';
import { TokenData } from '../types';

// Mock dependencies
jest.mock('../clients/DexScreenerClient');
jest.mock('../clients/JupiterClient');
jest.mock('./CacheService');

describe('TokenService', () => {
    let tokenService: TokenService;
    let mockDexScreener: jest.Mocked<DexScreenerClient>;
    let mockJupiter: jest.Mocked<JupiterClient>;
    let mockCache: jest.Mocked<CacheService>;

    const mockToken: TokenData = {
        tokenAddress: 'addr1',
        tokenName: 'Test Token',
        tokenTicker: 'TEST',
        priceSol: 1.5,
        liquiditySol: 1000,
        volumeSol: 5000,
        transactionCount: 100,
        protocol: 'dexscreener',
        lastUpdated: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockDexScreener = new DexScreenerClient() as any;
        mockJupiter = new JupiterClient() as any;
        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
        } as any;

        (CacheService.getInstance as jest.Mock).mockReturnValue(mockCache);

        // Re-instantiate to inject mocks
        tokenService = new TokenService();
        (tokenService as any).dexScreener = mockDexScreener;
        (tokenService as any).jupiter = mockJupiter;
        (tokenService as any).cache = mockCache;
    });

    describe('searchTokens', () => {
        it('should return cached data if available', async () => {
            mockCache.get.mockResolvedValue([mockToken]);
            const result = await tokenService.searchTokens('TEST');
            expect(result).toEqual([mockToken]);
            expect(mockDexScreener.searchTokens).not.toHaveBeenCalled();
        });

        it('should fetch from APIs if cache is empty', async () => {
            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockResolvedValue([mockToken]);
            mockJupiter.searchTokens.mockResolvedValue([]);

            const result = await tokenService.searchTokens('TEST');
            expect(result).toHaveLength(1);
            expect(result[0].tokenAddress).toBe('addr1');
            expect(mockCache.set).toHaveBeenCalled();
        });

        it('should prioritize DexScreener data over Jupiter', async () => {
            const dexToken = { ...mockToken, priceSol: 1.5, protocol: 'dexscreener' };
            const jupToken = { ...mockToken, priceSol: 1.0, protocol: 'jupiter' }; // Lower price, should be ignored

            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockResolvedValue([dexToken]);
            mockJupiter.searchTokens.mockResolvedValue([jupToken]);

            const result = await tokenService.searchTokens('TEST');
            expect(result).toHaveLength(1);
            expect(result[0].priceSol).toBe(1.5); // DexScreener price
            expect(result[0].protocol).toBe('dexscreener');
        });

        it('should include Jupiter-only tokens', async () => {
            const jupToken = { ...mockToken, tokenAddress: 'addr2', protocol: 'jupiter' };

            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockResolvedValue([mockToken]);
            mockJupiter.searchTokens.mockResolvedValue([jupToken]);

            const result = await tokenService.searchTokens('TEST');
            expect(result).toHaveLength(2);
            expect(result.find(t => t.tokenAddress === 'addr2')).toBeDefined();
        });

        it('should handle DexScreener failure gracefully', async () => {
            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockRejectedValue(new Error('API Error'));
            mockJupiter.searchTokens.mockResolvedValue([mockToken]);

            await expect(tokenService.searchTokens('TEST')).rejects.toThrow();
        });

        it('should deduplicate tokens by address', async () => {
            const duplicateToken = { ...mockToken };
            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockResolvedValue([mockToken]);
            mockJupiter.searchTokens.mockResolvedValue([duplicateToken]);

            const result = await tokenService.searchTokens('TEST');
            expect(result).toHaveLength(1);
        });

        it('should skip cache if skipCache is true', async () => {
            mockDexScreener.searchTokens.mockResolvedValue([mockToken]);
            mockJupiter.searchTokens.mockResolvedValue([]);

            await tokenService.searchTokens('TEST', true);
            expect(mockCache.get).not.toHaveBeenCalled();
            expect(mockDexScreener.searchTokens).toHaveBeenCalled();
        });

        it('should handle empty results from both APIs', async () => {
            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockResolvedValue([]);
            mockJupiter.searchTokens.mockResolvedValue([]);

            const result = await tokenService.searchTokens('EMPTY');
            expect(result).toEqual([]);
        });

        it('should cache merged results', async () => {
            mockCache.get.mockResolvedValue(null);
            mockDexScreener.searchTokens.mockResolvedValue([mockToken]);
            mockJupiter.searchTokens.mockResolvedValue([]);

            await tokenService.searchTokens('TEST');
            expect(mockCache.set).toHaveBeenCalledWith(
                expect.stringContaining('tokens:search:TEST'),
                expect.any(Array),
                60
            );
        });
    });
});
