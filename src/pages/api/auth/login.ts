// src/pages/api/auth/login.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // 1. Проверяем, есть ли такой пользователь в базе данных
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found. Please complete the quiz first.' });
  }

  // 2. Создаем безопасный, временный токен
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }
  // Токен будет "жить" 15 минут
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

  // 3. Формируем "магическую ссылку"
  const loginUrl = `http://localhost:3001/api/auth/verify?token=${token}`;

  // 4. Настраиваем отправку письма через Ethereal
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 5. Отправляем письмо
  try {
    await transporter.sendMail({
      from: '"Trimspire" <noreply@trimspire.com>',
      to: email,
      subject: 'Your Magic Link to Login',
      html: `
        <h1>Login to Trimspire</h1>
        <p>Click the link below to log in. This link is valid for 15 minutes.</p>
        <a href="${loginUrl}">Click here to log in</a>
      `,
    });

    res.status(200).json({ message: 'Login link sent. Please check your email.' });

  } catch (error) {
    console.error("Failed to send email", error);
    res.status(500).json({ error: 'Failed to send login email.' });
  }
}