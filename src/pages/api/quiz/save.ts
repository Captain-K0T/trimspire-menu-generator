// src/pages/api/quiz/save.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import Cors from 'cors'; // Импортируем установленную библиотеку

// Инициализируем middleware для CORS
const cors = Cors({
  methods: ['POST', 'HEAD'],
  origin: 'http://localhost:3000', // Указываем, что мы доверяем запросам с этого адреса
});

// Вспомогательная функция, чтобы наш API дождался выполнения middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Сначала запускаем наш CORS middleware
  await runMiddleware(req, res, cors);

  // Дальше идет наша основная логика, она осталась без изменений
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email, answers } = req.body;

    if (!email || !answers) {
      return res.status(400).json({ error: 'Email and answers are required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await tx.user.create({
          data: { email },
        });
      }

      const quizAnswers = await tx.quizAnswers.upsert({
        where: { userId: user.id },
        update: {
          goal: answers['3'] as string,
          bodyType: answers['2'] as string,
          mainStruggle: answers['4'] as string[],
          // TODO: Добавить сюда маппинг для всех остальных ответов
        },
        create: {
          userId: user.id,
          goal: answers['3'] as string,
          bodyType: answers['2'] as string,
          mainStruggle: answers['4'] as string[],
          // TODO: Добавить сюда маппинг для всех остальных ответов
        },
      });

      return { user, quizAnswers };
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error saving quiz data:', error);
    return res.status(500).json({ error: 'Failed to save quiz data.' });
  }
}