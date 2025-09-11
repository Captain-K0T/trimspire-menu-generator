// src/pages/api/quiz/save.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import Cors from 'cors';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

const mapAnswersToDbSchema = (answers: Record<string, any>): Prisma.QuizAnswersCreateInput => {
  const mapped: any = {};

  // ИСПРАВЛЕНИЕ: Теперь маппинг соответствует финальной схеме Prisma
  const mapping: Record<number, string> = {
    1: 'mainGoal', 2: 'bodyType', 3: 'goal', 4: 'mainStruggle', 5: 'followedDiets',
    6: 'dietExperience', 7: 'eatingGuilt', 8: 'bestShape', 9: 'improveAreas',
    10: 'activityLevel', 11: 'energyLevels', 12: 'sleepHours', 13: 'mealsPerDay',
    14: 'waterIntake', 15: 'ageRange', 16: 'currentWeight', 17: 'height',
    18: 'goalWeight', 19: 'likedVegetables', 20: 'meatPreferences', 21: 'sideDishes',
    22: 'healthyFoods', 23: 'allergies', 24: 'dislikedFoods', 25: 'stomachDiscomfort',
    26: 'mealPrepTime', 27: 'motivation', 28: 'lifeEvents', 29: 'upcomingEvent',
  };

  for (const key in answers) {
    const questionId = parseInt(key, 10);
    const dbField = mapping[questionId];
    
    if (dbField) {
      const answer = answers[key];
      
      if (typeof answer === 'object' && answer !== null && 'value' in answer) {
        const numericValue = parseFloat(String(answer.value).replace(',', '.'));
        if (!isNaN(numericValue)) {
            mapped[dbField] = numericValue;
        }
      } 
      else if (dbField === 'stomachDiscomfort') {
        mapped[dbField] = answer === 'Yes';
      }
      else {
        mapped[dbField] = answer;
      }
    }
  }

  return mapped;
};


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
        update: {},
        create: { email },
    });
    
    const dataToSave = mapAnswersToDbSchema(answers);

    await prisma.quizAnswers.upsert({
        where: { userId: user.id },
        update: dataToSave,
        create: {
            userId: user.id,
            ...dataToSave,
        },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
    const setPasswordUrl = `http://localhost:3001/set-password?token=${token}`;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: '"Trimspire" <noreply@trimspire.com>',
        to: email,
        subject: 'Set up your Trimspire Account',
        html: `<h1>Welcome to Trimspire!</h1>
               <p>Click the link below to set your password. This link is valid for 1 hour.</p>
               <a href="${setPasswordUrl}">Click here to create password</a>`,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return res.status(200).json({ message: 'User data saved and password setup link sent.' });

  } catch (error) {
    console.error('Error in /api/quiz/save:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}