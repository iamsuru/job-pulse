import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config();

assert(process.env.PORT, 'Missing PORT');
assert(process.env.JOB_PORTAL_BASE_URL, 'Missing JOB_PORTAL_BASE_URL');
assert(process.env.JOB_KEYWORDS, 'Missing JOB_KEYWORDS');
assert(process.env.JOB_EXPERIENCE, 'Missing JOB_EXPERIENCE');
assert(process.env.PUPPETER_TIMEOUT, 'Missing PUPPETER_TIMEOUT')
assert(process.env.FIREBASE_PROJECT_ID, 'Missing FIREBASE_PROJECT_ID')
assert(process.env.FIREBASE_CLIENT_EMAIL, 'Missing FIREBASE_CLIENT_EMAIL')
assert(process.env.FIREBASE_PRIVATE_KEY, 'Missing FIREBASE_PRIVATE_KEY')
assert(process.env.NOTIFY_SERVICE, 'Missing NOTIFY_SERVICE')
assert(process.env.NOTIFY_EMAIL, 'Missing NOTIFY_EMAIL')
assert(process.env.NOTIFY_APP_KEY, 'Missing NOTIFY_APP_KEY')
assert(process.env.RECIPIENT_EMAILS, 'Missing RECIPIENT_EMAILS')
assert(process.env.CRON_TIME, 'Missing CRON_TIME')

export const config = {
    PORT: Number(process.env.PORT),
    JOB_PORTAL_BASE_URL: process.env.JOB_PORTAL_BASE_URL,
    JOB_KEYWORDS: process.env.JOB_KEYWORDS.split(',').map(k => k.trim()),
    JOB_EXPERIENCE: process.env.JOB_EXPERIENCE,
    PUPPETER_TIMEOUT: Number(process.env.PUPPETER_TIMEOUT),
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    NOTIFY_SERVICE: process.env.NOTIFY_SERVICE,
    NOTIFY_EMAIL: process.env.NOTIFY_EMAIL,
    NOTIFY_APP_KEY: process.env.NOTIFY_APP_KEY,
    RECIPIENT_EMAILS: process.env.RECIPIENT_EMAILS.split(',').map(k => k.trim()),
    CRON_TIME: process.env.CRON_TIME,
};
