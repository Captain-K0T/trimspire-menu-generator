// src/pages/api/auth/verify.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

// Типизация для данных внутри токена
interface JwtPayload {
  userId: string;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is missing or invalid.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file');
  }

  try {
    // 1. Проверяем токен из ссылки
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const { userId } = decoded;

    // 2. Если токен валиден, создаем новый токен для сессии (на 7 дней)
    const sessionToken = jwt.sign({ userId }, secret, { expiresIn: '7d' });

    // 3. Устанавливаем токен в httpOnly cookie. Это безопасно.
    const cookie = serialize('auth_token', sessionToken, {
      httpOnly: true, // Защита от XSS-атак
      secure: process.env.NODE_ENV !== 'development', // В продакшене только через HTTPS
      sameSite: 'strict', // Защита от CSRF-атак
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    // 4. Перенаправляем пользователя на его личный кабинет (мы создадим эту страницу позже)
    res.redirect('/dashboard');

  } catch (error) {
    // Если токен невалиден или истек
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}