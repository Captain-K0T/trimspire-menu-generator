// src/app/api/menu/generate/route.ts

import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Убедись, что этот же ключ есть в твоем .env файле
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-dev';

// Это специальная функция, которая обрабатывает GET-запросы на наш URL
export async function GET(req: NextRequest) {
  try {
    // === ШАГ 1: Проверка, авторизован ли пользователь ===
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    let userId: string;
    try {
      // Расшифровываем токен, чтобы получить ID пользователя
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Неверный токен доступа' }, { status: 401 });
    }

    // === ШАГ 2: Получение ответов пользователя из анкеты ===
    const quizAnswers = await prisma.quizAnswers.findUnique({
      where: { userId },
    });

    if (!quizAnswers) {
      return NextResponse.json({ error: 'Ответы на анкету не найдены' }, { status: 404 });
    }

    // === ШАГ 3: Генерация меню (упрощенный алгоритм v1.0) ===

    // 3.1. Получаем все рецепты из базы
    const allRecipes = await prisma.recipe.findMany();

    // 3.2. Делим их на "пулы" по типам приема пищи
    const breakfastPool = allRecipes.filter(r => r.mealType === 'BREAKFAST');
    const lunchPool = allRecipes.filter(r => r.mealType === 'LUNCH');
    const dinnerPool = allRecipes.filter(r => r.mealType === 'DINNER');

    // 3.3. Проверяем, что у нас достаточно рецептов для генерации
    if (breakfastPool.length === 0 || lunchPool.length === 0 || dinnerPool.length === 0) {
      return NextResponse.json({ error: 'Недостаточно рецептов в базе для генерации меню' }, { status: 500 });
    }

    // 3.4. Собираем меню на 7 дней, случайно выбирая по одному блюду из каждого пула
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
    
    // === ШАГ 4: Отправляем сгенерированное меню на фронтенд ===
    return NextResponse.json({ weekPlan: generatedMenuPlan });

  } catch (error) {
    console.error('Ошибка при генерации меню:', error);
    // Прячем детали ошибки от пользователя, но логируем их на сервере
    return NextResponse.json({ error: 'Произошла внутренняя ошибка сервера' }, { status: 500 });
  }
}