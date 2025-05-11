import puppeteer, { Page } from 'puppeteer';
import { config } from '../config/env';
import { storeNewJobs } from './database.service';
import { sendJobNotification } from './notifier';

const jobKeywords: string[] = config.JOB_KEYWORDS;
const jobExperience: string = config.JOB_EXPERIENCE;
const jobPortalBaseUrl: string = config.JOB_PORTAL_BASE_URL;
const puppeteerTimeout: number = config.PUPPETER_TIMEOUT;

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

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    console.info('Browser instance created');
    const jobMap: Map<string, any> = new Map();

    try {
        for (const keyword of jobKeywords) {
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
                    throw new Error(`Failed to load page, status: ${response?.status()}`);
                }

                await page.waitForSelector('#listContainer > div.styles_job-listing-container__OCfZC', {
                    timeout: puppeteerTimeout,
                });

                await autoScroll(page);

                const jobsForKeyword = await page.$$eval(
                    '#listContainer > div.styles_job-listing-container__OCfZC > div > div',
                    (nodes) =>
                        nodes.map((el) => ({
                            title: el.querySelector('a.title')?.textContent?.trim(),
                            company: el.querySelector('.comp-name')?.textContent?.trim(),
                            link: el.querySelector('a.title')?.getAttribute('href'),
                            experience: el.querySelector('.ni-job-tuple-icon-srp-experience .expwdth')?.textContent?.trim(),
                        }))
                );

                jobsForKeyword.forEach((job) => {
                    if (job.link && !jobMap.has(job.link)) {
                        jobMap.set(job.link, job);
                    }
                });
            } catch (err) {
                console.error(`Error while searching for "${keyword}":`, err);
            }
        }

        const jobs = Array.from(jobMap.values());

        if (jobs.length > 0) {
            console.info('Found new jobs, updating database...');
            const newJobs = await storeNewJobs(jobs);
            if (newJobs.length > 0) {
                sendJobNotification(newJobs);
            } else {
                console.info('No new job found to send notifications.');
            }
        } else {
            console.info('No matching jobs found.');
        }
    } catch (err) {
        console.error('Unhandled scraping error:', err);
    } finally {
        await browser.close();
        console.info('Browser closed');
    }
}
