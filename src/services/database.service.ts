import { getFirestore } from 'firebase-admin/firestore';
import { firebaseInstance } from '../utils/firebase.admin';

const db = getFirestore(firebaseInstance!);

export async function storeNewJobs(jobs: any[]) {
    const jobsCollection = db.collection('jobs');
    const newJobs: any[] = [];

    for (const job of jobs) {
        if (!job.link) continue;

        const existing = await jobsCollection.where('link', '==', job.link).get();

        if (existing.empty) {
            await jobsCollection.add({
                ...job,
                createdAt: new Date().toISOString(),
            });
            newJobs.push(job);
        }
    }

    return newJobs;
}