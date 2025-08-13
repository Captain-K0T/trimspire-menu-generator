// src/pages/api/auth/set-password.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';

interface JwtPayload {
  userId: string;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  try {
    // 1. Проверяем токен, который пришел от пользователя
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const { userId } = decoded;

    // 2. Хэшируем (шифруем) пароль
    const hashedPassword = await bcrypt.hash(password, 10); // 10 - сложность шифрования

    // 3. Обновляем пользователя в базе, добавляя ему хэш пароля
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 4. Логиним пользователя, создавая сессионный токен
    const sessionToken = jwt.sign({ userId }, secret, { expiresIn: '7d' });

    const cookie = serialize('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    // 5. Отправляем успешный ответ
    return res.status(200).json({ message: 'Password set successfully.' });

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}