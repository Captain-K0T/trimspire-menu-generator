// src/pages/api/auth/logout.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Создаем "пустой" cookie с истекшим сроком, чтобы браузер его удалил
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: -1, // Устанавливаем прошедшее время
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ message: 'Logged out successfully.' });
}