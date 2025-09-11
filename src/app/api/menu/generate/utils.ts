// src/app/api/menu/generate/utils.ts

import type { QuizAnswers } from '@prisma/client';

// Типизация для рассчитанных макронутриентов
export interface RecommendedMacros {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

// Вспомогательная функция для получения среднего возраста из диапазона
const getAverageAge = (ageRange: string | null | undefined): number => {
  if (!ageRange) return 30; // Возраст по умолчанию, если не указан
  const ages = ageRange.split('-').map(Number);
  if (ages.length === 2 && !isNaN(ages[0]) && !isNaN(ages[1])) {
    return (ages[0] + ages[1]) / 2;
  }
  // Для случаев "61-70" или если только одно число
  return parseInt(ageRange, 10) || 30;
};

// Основная функция для расчёта КБЖУ
export const calculateMacros = (answers: QuizAnswers): RecommendedMacros => {
  const {
    currentWeight,
    height,
    ageRange,
    activityLevel,
    goal,
  } = answers;

  // 1. Проверяем наличие всех необходимых данных
  if (!currentWeight || !height || !ageRange || !activityLevel || !goal) {
    // Возвращаем значения по умолчанию, если данных недостаточно
    return { calories: 2000, proteins: 150, fats: 67, carbs: 200 };
  }

  const age = getAverageAge(ageRange);

  // 2. Рассчитываем базовый уровень метаболизма (BMR)
  const bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) - 161;

  // 3. Учитываем уровень активности
  let activityMultiplier = 1.2; // Sedentary по умолчанию
  if (activityLevel === 'Lightly active') activityMultiplier = 1.375;
  if (activityLevel === 'Moderately active') activityMultiplier = 1.55;
  if (activityLevel === 'Very active') activityMultiplier = 1.725;

  const caloriesWithActivity = bmr * activityMultiplier;

  // 4. Корректируем калории в зависимости от цели
  let finalCalories = caloriesWithActivity;
  if (goal === 'Lose weight') {
    finalCalories *= 0.8; // Уменьшаем на 20%
  } else if (goal === 'Get stronger') {
    finalCalories *= 1.1; // Увеличиваем на 10%
  }

  // Округляем калории до ближайшего числа, кратного 10
  const roundedCalories = Math.round(finalCalories / 10) * 10;

  // 5. Рассчитываем белки, жиры и углеводы
  let proteinRatio = 0.25, fatRatio = 0.25, carbRatio = 0.5; // Maintain results по умолчанию
  if (goal === 'Lose weight') {
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  } else if (goal === 'Get stronger') {
    proteinRatio = 0.35;
    fatRatio = 0.20;
    carbRatio = 0.45;
  }

  const proteins = Math.round((roundedCalories * proteinRatio) / 4);
  const fats = Math.round((roundedCalories * fatRatio) / 9);
  const carbs = Math.round((roundedCalories * carbRatio) / 4);

  return {
    calories: roundedCalories,
    proteins,
    fats,
    carbs,
  };
};