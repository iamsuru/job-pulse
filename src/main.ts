import express from 'express';
import { config } from './config/env';
import { scheduleJobScraper } from './scheduler/cron';

const app = express();
const PORT: number = config.PORT;
const version: string = '1.0.0'

const rootContext = '/job-pulse/api/v1'

app.get(`${rootContext}/health`, (_, res) => {
    res.send({
        message: 'Welcome to the Job-Pulse!',
        version: version
    });
});

process.on('unhandledRejection', (reason: any, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

app.listen(PORT, async () => {
    console.log(`🚀 Job-Pulse server running on port ${PORT}`);
    scheduleJobScraper();
});
