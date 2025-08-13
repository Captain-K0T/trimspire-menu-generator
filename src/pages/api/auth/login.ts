// src/pages/api/auth/login.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // 1. Находим пользователя по email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return res.status(401).json({ error: 'Invalid credentials or password not set' });
  }

  // 2. Сравниваем введенный пароль с хэшем в базе данных
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 3. Если все верно, создаем сессию (как и раньше)
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  const sessionToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

  const cookie = serialize('auth_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);

  return res.status(200).json({ message: 'Logged in successfully' });
}