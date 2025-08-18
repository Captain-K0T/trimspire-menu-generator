'use client'; // <-- Говорим Next.js, что это клиентский компонент

import { useState, useEffect } from 'react';

// Определяем типы данных, которые мы ожидаем от API
// Это поможет TypeScript избежать ошибок
interface Meal {
  id: string;
  title: string;
  calories: number;
  imageUrl: string | null;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

export default function DashboardPage() {
  // Состояния для хранения данных, статуса загрузки и ошибок
  const [weekPlan, setWeekPlan] = useState<DayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect выполнится один раз, когда компонент появится на экране
  useEffect(() => {
    // Асинхронная функция для запроса данных
    const fetchMenu = async () => {
      try {
        const response = await fetch('/api/menu/generate');

        if (!response.ok) {
          // Если сервер ответил ошибкой (статус не 200-299)
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось загрузить меню');
        }

        const data = await response.json();
        setWeekPlan(data.weekPlan); // Сохраняем данные в состояние
      } catch (err: any) {
        setError(err.message); // Сохраняем текст ошибки
      } finally {
        setIsLoading(false); // В любом случае убираем индикатор загрузки
      }
    };

    fetchMenu(); // Вызываем функцию
  }, []); // Пустой массив зависимостей означает "выполнить только один раз"

  // --- Отображение в зависимости от состояния ---

  if (isLoading) {
    return <div>Загрузка вашего персонального меню...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div>
      <h1>Ваш план питания на неделю</h1>
      {weekPlan ? (
        weekPlan.map((dayPlan) => (
          <div key={dayPlan.day} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h2>{dayPlan.day}</h2>
            {dayPlan.meals.map((meal) => (
              <div key={meal.id} style={{ marginLeft: '20px' }}>
                <h3>{meal.title}</h3>
                <p>Калории: {meal.calories}</p>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>Не удалось сгенерировать меню.</p>
      )}
    </div>
  );
}