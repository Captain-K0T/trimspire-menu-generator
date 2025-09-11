// Код для файла src/app/api/menu/generate/route.ts

import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-dev';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Неверный токен доступа' }, { status: 401 });
    }

    // --- ИЗМЕНЕНИЕ: Получаем не только меню, но и данные анкеты ---
    const [quizAnswers, allRecipes] = await Promise.all([
      prisma.quizAnswers.findUnique({ where: { userId } }),
      prisma.recipe.findMany(),
    ]);
    // -----------------------------------------------------------

    if (!quizAnswers) {
      return NextResponse.json({ error: 'Ответы на анкету не найдены' }, { status: 404 });
    }

    const breakfastPool = allRecipes.filter(r => r.mealType === 'BREAKFAST');
    const lunchPool = allRecipes.filter(r => r.mealType === 'LUNCH');
    const dinnerPool = allRecipes.filter(r => r.mealType === 'DINNER');

    if (breakfastPool.length === 0 || lunchPool.length === 0 || dinnerPool.length === 0) {
      return NextResponse.json({ error: 'Недостаточно рецептов в базе для генерации меню' }, { status: 500 });
    }

    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const generatedMenuPlan = [];

    for (let i = 0; i < 7; i++) {
      const dayMenu = {
        day: weekDays[i],
        meals: [
          breakfastPool[Math.floor(Math.random() * breakfastPool.length)],
          lunchPool[Math.floor(Math.random() * lunchPool.length)],
          dinnerPool[Math.floor(Math.random() * dinnerPool.length)],
        ],
      };
      generatedMenuPlan.push(dayMenu);
    }
    
    // --- ИЗМЕНЕНИЕ: Отправляем на фронтенд и меню, и данные пользователя ---
    return NextResponse.json({ 
      weekPlan: generatedMenuPlan,
      userData: {
        currentWeight: quizAnswers.currentWeight,
        goalWeight: quizAnswers.goalWeight,
      }
    });
    // -----------------------------------------------------------------

  } catch (error) {
    console.error('Ошибка при генерации меню:', error);
    return NextResponse.json({ error: 'Произошла внутренняя ошибка сервера' }, { status: 500 });
  }
}