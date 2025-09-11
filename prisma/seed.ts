// Код для файла prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  console.log('Creating tags...');
  await prisma.tag.createMany({
    data: [
      { name: 'Быстро' }, { name: 'Вегетарианство' }, { name: 'Веганство' },
      { name: 'Классика' }, { name: 'Без глютена' }, { name: 'Просто' },
      { name: 'Италия' }, { name: 'Экзотика' },
    ],
    skipDuplicates: true,
  });
  console.log('Tags created.');
  
  console.log('Creating ingredients...');
  await prisma.ingredient.createMany({
    data: [
      { name: 'Овсяные хлопья', category: 'Бакалея' }, { name: 'Ягоды (ассорти)', category: 'Фрукты и ягоды' },
      { name: 'Грецкие орехи', category: 'Орехи' }, { name: 'Яйцо куриное', category: 'Молочные продукты и яйца' },
      { name: 'Авокадо', category: 'Овощи и зелень' }, { name: 'Хлеб цельнозерновой', category: 'Хлебобулочные изделия' },
      { name: 'Лосось (филе)', category: 'Рыба и морепродукты' }, { name: 'Спаржа', category: 'Овощи и зелень' },
      { name: 'Оливковое масло', category: 'Масла и соусы' }, { name: 'Куриная грудка', category: 'Мясо и птица' },
      { name: 'Рис басмати', category: 'Бакалея' }, { name: 'Брокколи', category: 'Овощи и зелень' },
    ],
    skipDuplicates: true,
  });
  console.log('Ingredients created.');

  console.log('Creating recipes...');

  await prisma.recipe.create({
    data: {
      title: 'Овсяная каша с ягодами и орехами',
      description: 'Идеальный здоровый завтрак, который зарядит энергией на весь день. Начните утро правильно с этим простым и вкусным блюдом.',
      mealType: 'BREAKFAST',
      instructions: '1. Залейте овсяные хлопья водой или молоком...',
      imageUrl: '/images/reciept.jpg', // <--- ИЗМЕНЕНИЕ
      calories: 350, proteins: 10, fats: 12, carbs: 50, cookingTime: 10,
      tags: { create: [{ tag: { connect: { name: 'Быстро' } } }, { tag: { connect: { name: 'Вегетарианство' } } }, { tag: { connect: { name: 'Классика' } } }] },
      ingredients: { create: [{ quantity: 50, unit: 'г', ingredient: { connect: { name: 'Овсяные хлопья' } } }, { quantity: 70, unit: 'г', ingredient: { connect: { name: 'Ягоды (ассорти)' } } }, { quantity: 20, unit: 'г', ingredient: { connect: { name: 'Грецкие орехи' } } }] },
    },
  });

  await prisma.recipe.create({
    data: {
      title: 'Запеченный лосось со спаржей',
      description: 'Простой, элегантный и очень полезный ужин. Готовится практически без усилий, идеален для буднего вечера.',
      mealType: 'DINNER',
      instructions: '1. Разогрейте духовку до 200°C...',
      imageUrl: '/images/reciept.jpg', // <--- ИЗМЕНЕНИЕ
      calories: 480, proteins: 40, fats: 30, carbs: 10, cookingTime: 20,
      tags: { create: [{ tag: { connect: { name: 'Просто' } } }, { tag: { connect: { name: 'Без глютена' } } }] },
      ingredients: { create: [{ quantity: 200, unit: 'г', ingredient: { connect: { name: 'Лосось (филе)' } } }, { quantity: 150, unit: 'г', ingredient: { connect: { name: 'Спаржа' } } }, { quantity: 15, unit: 'мл', ingredient: { connect: { name: 'Оливковое масло' } } }] },
    },
  });
  
  await prisma.recipe.create({
    data: {
      title: 'Куриная грудка с брокколи и рисом',
      description: 'Сбалансированный обед для тех, кто следит за фигурой и ценит простоту в приготовлении. Отличный источник белка.',
      mealType: 'LUNCH',
      instructions: '1. Отварите рис согласно инструкции на упаковке...',
      imageUrl: '/images/reciept.jpg', // <--- ИЗМЕНЕНИЕ
      calories: 450, proteins: 50, fats: 10, carbs: 40, cookingTime: 25,
      tags: { create: [{ tag: { connect: { name: 'Просто' } } }, { tag: { connect: { name: 'Без глютена' } } }] },
      ingredients: { create: [{ quantity: 180, unit: 'г', ingredient: { connect: { name: 'Куриная грудка' } } }, { quantity: 150, unit: 'г', ingredient: { connect: { name: 'Брокколи' } } }, { quantity: 50, unit: 'г', ingredient: { connect: { name: 'Рис басмати' } } }] },
    },
  });
  
  console.log('Recipes created.');
  console.log(`Seeding finished.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });