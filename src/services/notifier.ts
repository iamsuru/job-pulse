import nodemailer from 'nodemailer';
import { config } from '../config/env';

const recipientsEmail: string[] = config.RECIPIENT_EMAILS

export async function sendJobNotification(newJobs: any[]) {
    if (!newJobs.length) return;

    const transporter = nodemailer.createTransport({
        service: config.NOTIFY_SERVICE,
        auth: {
            user: config.NOTIFY_EMAIL,
            pass: config.NOTIFY_APP_KEY,
        },
    });

    const mailBody: string = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <h2 style="color: #2c3e50;">🚀 New Job Alerts from <span style="color:#007BFF">Job Pulse</span></h2>
            <p style="font-size: 16px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #333;">We’ve found <strong>${newJobs.length}</strong> new job opportunities for you. Check them out below:</p>
            <ul style="padding-left: 20px; font-size: 15px; color: #444;">
                ${newJobs.map((job, index) => `
                <li style="margin-bottom: 10px;">
                    <strong>${job.title}</strong><br/>
                    <a href="${job.link}" style="color: #007BFF;">${job.link}</a>
                </li>`).join('')}
            </ul>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #888;">© ${new Date().getFullYear()} Job Pulse. All rights reserved.</p>
            </div>
        </div>
        `

    try {
        recipientsEmail.forEach(async (emailId: string) => {
            const mailOptions = {
                from: `"Job Pulse Notifier" <${config.NOTIFY_EMAIL}>`,
                to: emailId,
                subject: `New Job Opportunities`,
                html: mailBody
            };
            const info = await transporter.sendMail(mailOptions);
            console.info('Notification email sent:', {
                emailId,
                message: info.response
            });
        })
    } catch (error) {
        console.error('Failed to send notification email:', error);
    }
}
