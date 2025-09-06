// Код для файла src/app/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';

// Определяем типы данных, которые мы ожидаем от API
interface Meal {
  id: string;
  title: string;
  calories: number;
  mealType: string;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

// Компонент для отображения одной карточки блюда
function MealCard({ meal }: { meal: Meal }) {
  const getMealTypeName = (type: string) => {
    switch (type) {
      case 'BREAKFAST': return 'Завтрак';
      case 'LUNCH': return 'Обед';
      case 'DINNER': return 'Ужин';
      default: return 'Прием пищи';
    }
  };

  return (
    <div className={styles.mealCard}>
      <div className={styles.mealType}>{getMealTypeName(meal.mealType)}</div>
      <div className={styles.mealContent}>
        <h4 className={styles.mealTitle}>{meal.title}</h4>
        <p className={styles.mealDetails}>Калории: {meal.calories}</p>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const router = useRouter();
  const [weekPlan, setWeekPlan] = useState<DayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Запрос к нашему API для генерации меню
        const response = await fetch('/api/menu/generate');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось загрузить меню');
        }

        const data = await response.json();
        setWeekPlan(data.weekPlan);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Отображение в зависимости от состояния
  if (isLoading) {
    return <div className={styles.container}><p className={styles.loading}>Загрузка вашего персонального меню...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>Ошибка: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ваш план питания на неделю</h1>
      <p className={styles.subtitle}>Это первая версия вашего меню, сгенерированная на основе ваших ответов.</p>
      
      {weekPlan ? (
        <div className={styles.weekGrid}>
          {weekPlan.map((dayPlan) => (
            <div key={dayPlan.day} className={styles.dayColumn}>
              <h2 className={styles.dayTitle}>{dayPlan.day}</h2>
              <div className={styles.mealsContainer}>
                {dayPlan.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.error}>Не удалось сгенерировать меню.</p>
      )}

      <button onClick={handleLogout} className={styles.logoutButton}>Выйти</button>
    </div>
  );
}