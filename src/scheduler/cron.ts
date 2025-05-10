import cron from 'node-cron';
import { scrapeAndNotify } from '../services/scraper';
import { config } from '../config/env';

export function scheduleJobScraper() {
    cron.schedule(config.CRON_TIME, async () => {
        console.info('Cron job started at:', new Date().toLocaleString());
        await scrapeAndNotify();
        console.info('Cron job completed at:', new Date().toLocaleString());
    });
}
