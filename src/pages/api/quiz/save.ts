// src/pages/api/quiz/save.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import Cors from 'cors';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const cors = Cors({
  methods: ['POST', 'HEAD'],
  origin: 'http://localhost:3000',
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, answers } = req.body;
    if (!email || !answers) {
      return res.status(400).json({ error: 'Email and answers are required.' });
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {}, // Если пользователь есть, ничего не меняем
        create: { email }, // Если нет - создаем
    });

    await prisma.quizAnswers.upsert({
        where: { userId: user.id },
        update: { /* ... mapping answers ... */ },
        create: {
            userId: user.id,
            // TODO: Добавить сюда маппинг для всех остальных ответов
        },
    });

    // --- НОВАЯ ЛОГИКА: ОТПРАВКА ССЫЛКИ ПОСЛЕ СОХРАНЕНИЯ ---

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');

    // Токен для установки пароля, действует 1 час
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });

    // Ссылка теперь ведет на страницу /set-password
    const setPasswordUrl = `http://localhost:3001/set-password?token=${token}`;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: '"Trimspire" <noreply@trimspire.com>',
        to: email,
        subject: 'Set up your Trimspire Account',
        html: `<h1>Welcome to Trimspire!</h1>
               <p>Click the link below to set your password. This link is valid for 1 hour.</p>
               <a href="${setPasswordUrl}">Click here to create password</a>`,
    });

    return res.status(200).json({ message: 'User data saved and password setup link sent.' });

  } catch (error) {
    console.error('Error in /api/quiz/save:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}