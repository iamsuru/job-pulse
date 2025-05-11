import puppeteer, { Browser, Page } from 'puppeteer';
import pLimit from 'p-limit';
import { config } from '../config/env';
import { storeNewJobs } from './database.service';
import { sendJobNotification } from './notifier';

const jobKeywords: string[] = config.JOB_KEYWORDS;
const jobExperience: string = config.JOB_EXPERIENCE;
const jobPortalBaseUrl: string = config.JOB_PORTAL_BASE_URL;
const puppeteerTimeout: number = config.PUPPETER_TIMEOUT;
const batchSize: number = config.BATCH_SIZE;

async function autoScroll(page: Page) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const delay = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, delay);
        });
    });
}

async function extractJobsFromPage(page: Page): Promise<any[]> {
    return await page.$$eval(
        '#listContainer > div.styles_job-listing-container__OCfZC > div > div',
        (nodes) =>
            nodes.map((el) => ({
                title: el.querySelector('a.title')?.textContent?.trim() || '',
                company: el.querySelector('.comp-name')?.textContent?.trim() || '',
                link: el.querySelector('a.title')?.getAttribute('href') || '',
                experience: el.querySelector('.ni-job-tuple-icon-srp-experience .expwdth')?.textContent?.trim() || '',
            }))
    );
}

async function processKeyword(browser: Browser, keyword: string, jobMap: Map<string, any>) {
    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const searchUrl = jobPortalBaseUrl
            .replace(':encodedKeyword', encodedKeyword)
            .replace(':encodedKeyword', encodedKeyword)
            .replace(':jobExperience', jobExperience);

        const response = await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: puppeteerTimeout,
        });

        if (!response || !response.ok()) {
            console.warn(`Failed to load page for keyword "${keyword}", status: ${response?.status()}`);
            return;
        }

        await page.waitForSelector('#listContainer > div.styles_job-listing-container__OCfZC', {
            timeout: puppeteerTimeout,
        });

        await autoScroll(page);

        const jobs = await extractJobsFromPage(page);
        jobs.forEach((job) => {
            if (job.link && !jobMap.has(job.link)) {
                jobMap.set(job.link, job);
            }
        });
    } catch (err) {
        console.error(`Error scraping jobs for "${keyword}":`, err);
    } finally {
        await page.close();
    }
}

export async function scrapeAndNotify() {
    console.info('Finding job process started');

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
        ignoreDefaultArgs: ['--disable-extensions']
    });

    console.info('Browser instance created');
    const jobMap: Map<string, any> = new Map();

    try {
        console.info('Started searching for jobs...');
        const limit = pLimit(batchSize);

        const tasks = jobKeywords.map((keyword) =>
            limit(() => processKeyword(browser, keyword, jobMap))
        );

        const results = await Promise.allSettled(tasks);

        results.forEach((result, idx) => {
            if (result.status === 'rejected') {
                console.error(`Keyword "${jobKeywords[idx]}" failed:`, result.reason);
            }
        });

        const jobs = Array.from(jobMap.values());

        if (jobs.length > 0) {
            console.info(`Found ${jobs.length} jobs, updating new ones in DB...`);
            const newJobs = await storeNewJobs(jobs);
            if (newJobs.length > 0) {
                await sendJobNotification(newJobs);
            } else {
                console.info('No new jobs found to notify.');
            }
        } else {
            console.info('No matching jobs found.');
        }
    } catch (err) {
        console.error('Unhandled error during scraping:', err);
    } finally {
        await browser.close();
        console.info('Browser closed');
    }
}
