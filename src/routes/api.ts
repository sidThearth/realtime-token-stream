import { Router } from 'express';
import { TokenService } from '../services/TokenService';
import logger from '../utils/logger';
import { toSnakeCase } from '../utils/formatter';

const router = Router();
const tokenService = new TokenService();

router.get('/tokens', async (req, res) => {
    try {
        const { query, sort, limit, cursor } = req.query;

        const result = await tokenService.getTokens({
            query: query as string,
            sort: sort as any,
            limit: limit ? parseInt(limit as string) : undefined,
            cursor: cursor as string
        });

        const formattedTokens = result.tokens.map(toSnakeCase);

        res.json({
            tokens: formattedTokens,
            nextCursor: result.nextCursor
        });
    } catch (error) {
        logger.error('Error in /tokens endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
