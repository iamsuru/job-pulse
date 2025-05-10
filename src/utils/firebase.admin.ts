import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { config } from '../config/env';

const firebaseInstance: App = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
            projectId: config.FIREBASE_PROJECT_ID,
            clientEmail: config.FIREBASE_CLIENT_EMAIL,
            privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });

export { firebaseInstance };