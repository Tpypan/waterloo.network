import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, code, action } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Allow personal email for testing or uwaterloo emails
        const isAllowed = email.endsWith('@uwaterloo.ca') || email === 'shayaanazeem10@gmail.com';

        if (!isAllowed) {
            return NextResponse.json({ error: 'Please use a uwaterloo.ca email' }, { status: 400 });
        }
        if (action === 'send') {
            // Generate code
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Store code (upsert to replace existing)
            try {
                await prisma.verificationCode.create({
                    data: {
                        email,
                        code: generatedCode,
                        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
                    },
                });

                // Send email
                const emailSent = await sendVerificationEmail(email, generatedCode);

                if (!emailSent) {
                    throw new Error('Failed to send email via Resend');
                }

            } catch (e) {
                console.error('DB/Email Error:', e);
                return NextResponse.json({ error: 'Failed to send code' }, { status: 500 });
            }

            return NextResponse.json({ message: 'Code sent' });
        }

        if (action === 'verify') {
            if (!code) {
                return NextResponse.json({ error: 'Missing code' }, { status: 400 });
            }

            // Verify code
            let isValid = false;

            try {
                const record = await prisma.verificationCode.findFirst({
                    where: { email, code },
                });
                if (record && record.expiresAt > new Date()) {
                    isValid = true;
                    // Clean up
                    await prisma.verificationCode.delete({ where: { id: record.id } });
                }
            } catch (e) {
                console.error('DB Error:', e);
            }

            // Fallback for dev if DB fails or for testing
            if (code === '123456') isValid = true;


            // ... inside the verify block ...

            if (isValid) {
                // Create or update user
                try {
                    await prisma.user.upsert({
                        where: { email },
                        update: {},
                        create: { email },
                    });
                } catch (e) {
                    console.error('User Upsert Error:', e);
                }

                // Set session cookie
                const cookieStore = await cookies();
                cookieStore.set('webring_session', email, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 7, // 1 week
                    path: '/',
                });

                return NextResponse.json({ token: 'session-active', email });
            } else {
                return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
