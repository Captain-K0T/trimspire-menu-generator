// Код для файла src/app/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';

// Обновляем типы данных
interface UserData {
  currentWeight: number | null;
  goalWeight: number | null;
}

// --- ИЗМЕНЕНИЕ: Добавляем тип для КБЖУ ---
interface RecommendedMacros {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}
// ------------------------------------------

interface Meal {
  id: string;
  title: string;
  description: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  imageUrl: string | null;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Добавляем новые состояния
  const [weekPlan, setWeekPlan] = useState<DayPlan[] | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [macros, setMacros] = useState<RecommendedMacros | null>(null); // <-- НОВОЕ СОСТОЯНИЕ
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('/api/menu/generate');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось загрузить меню');
        }
        const data = await response.json();
        setWeekPlan(data.weekPlan);
        setUserData(data.userData);
        setMacros(data.recommendedMacros); // <-- СОХРАНЯЕМ ДАННЫЕ В СОСТОЯНИЕ
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

  if (isLoading) {
    return <div className={styles.container}><p className={styles.loading}>Создаём ваш персональный план...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>Ошибка: {error}</p></div>;
  }

  const activeDay = weekPlan ? weekPlan[activeDayIndex] : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ваш план питания</h1>
        {userData && (
          <div className={styles.weightInfo}>
            <p>Ваш текущий вес: <strong>{userData.currentWeight || 'N/A'} кг</strong></p>
            <p>Ваш желаемый вес: <strong>{userData.goalWeight || 'N/A'} кг</strong></p>
          </div>
        )}
        {/* --- ИЗМЕНЕНИЕ: Отображаем динамические данные --- */}
        {macros && (
          <div className={styles.recommendedMacros}>
            <span>Мы рекомендуем:</span>
            <p>🔥 {macros.calories}</p>
            <p>🥩 {macros.proteins}</p>
            <p>🥑 {macros.fats}</p>
            <p>🍞 {macros.carbs}</p>
          </div>
        )}
        {/* ----------------------------------------------- */}
      </header>
      
      <main className={styles.mainContent}>
        <aside className={styles.dayTabs}>
          {weekPlan?.map((dayPlan, index) => (
            <button
              key={dayPlan.day}
              className={`${styles.dayTab} ${index === activeDayIndex ? styles.activeTab : ''}`}
              onClick={() => setActiveDayIndex(index)}
            >
              {dayPlan.day}
            </button>
          ))}
        </aside>
        
        <section className={styles.mealsGrid}>
          {activeDay?.meals.map((meal) => (
            <div key={meal.id} className={styles.mealCard}>
              <img src={meal.imageUrl || '/images/placeholder.jpg'} alt={meal.title} className={styles.mealImage} />
              <div className={styles.mealContent}>
                <h3 className={styles.mealTitle}>{meal.title}</h3>
                <p className={styles.mealDescription}>
                  {meal.description.length > 100 ? `${meal.description.substring(0, 100)}...` : meal.description}
                </p>
                <div className={styles.mealMacros}>
                  <span>🔥 {meal.calories}</span>
                  <span>🥩 {meal.proteins}</span>
                  <span>🥑 {meal.fats}</span>
                  <span>🍞 {meal.carbs}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <button onClick={handleLogout} className={styles.logoutButton}>Выйти</button>
    </div>
  );
}