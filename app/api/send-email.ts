// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { name, email, message } = req.body;

        // Set up Nodemailer - replace with your email provider's settings
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        try {
            // Send email
            await transporter.sendMail({
                from: email, // Sender's email
                to: 'ike4football@gamil.com', // Your email address
                subject: `New message from ${name}`,
                text: message, // Plain text body
                html: `<p>${message}</p>`, // HTML body
            });

            res.status(200).json({ message: 'Email sent successfully' });
        } catch (error) {
            console.error();
            res.status(500).json({ message: 'Error sending email' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
