    private readonly UPDATE_INTERVAL = 5000; // 5 seconds

constructor() {
    this.tokenService = new TokenService();
    // Add a dummy token to ensure polling starts immediately for the demo
    this.activeTokens.add('DEMO_MODE');
}

start() {
    if (this.intervalId) return;

    logger.info('Starting UpdateScheduler...');
    this.intervalId = setInterval(() => this.pollUpdates(), this.UPDATE_INTERVAL);
}

stop() {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
}

// In a real app, we'd track what users are actually looking at.
// For this demo, we'll just track a fixed set of "popular" tokens or recently searched ones.
addTokenToTrack(tokenAddress: string) {
    this.activeTokens.add(tokenAddress);
}

    private async pollUpdates() {
    if (this.activeTokens.size === 0) return;

    try {
        const io = getIO();

        // For demo purposes, let's just re-search "MOODENG" to get fresh data for the top tokens
        // This simulates a "market overview" update.
        const freshTokens = await this.tokenService.searchTokens('MOODENG', true);

        freshTokens.forEach(token => {
            // SIMULATION: Add small random jitter (±0.5%) to demonstrate UI updates
            // because API data might be cached or stable.
            const jitter = 1 + (Math.random() * 0.01 - 0.005);
            token.priceSol *= jitter;
            token.priceChange24h += (Math.random() * 0.2 - 0.1);

            // Broadcast update
            io.emit('priceUpdate', toSnakeCase(token));
        });

        if (freshTokens.length > 0) {
            logger.info(`Broadcasted updates for ${freshTokens.length} tokens. Top token (${freshTokens[0].symbol}): $${freshTokens[0].priceSol.toFixed(6)} (Simulated)`);
        }

    } catch (error) {
        logger.error('Error in pollUpdates:', error);
    }
}
}
