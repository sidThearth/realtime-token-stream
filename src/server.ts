import { createServer } from 'http';
import app from './app';
import { initSocketServer } from './websocket/socketServer';
import logger from './utils/logger';
import dotenv from 'dotenv';
import { UpdateScheduler } from './services/UpdateScheduler';

dotenv.config();

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = initSocketServer(httpServer);

// Start the background scheduler
const scheduler = new UpdateScheduler();
scheduler.start();

httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    scheduler.stop();
    httpServer.close(() => {
        logger.info('HTTP server closed');
    });
});
