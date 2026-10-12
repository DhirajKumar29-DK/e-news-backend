import { prisma } from '../../config/db.js';

export const DEFAULT_CATEGORIES = [
  { "name": "Latest News", "slug": "latest", "order": 1, "isActive": true },
  { "name": "India", "slug": "india", "order": 2, "isActive": true },
  { "name": "World", "slug": "world", "order": 3, "isActive": true },
  { "name": "Entertainment", "slug": "entertainment", "order": 4, "isActive": true },
  { "name": "Lifestyle", "slug": "lifestyle", "order": 5, "isActive": true },
  { "name": "Business", "slug": "business", "order": 6, "isActive": true },
  { "name": "Education", "slug": "education", "order": 7, "isActive": true },
  { "name": "Cricket", "slug": "cricket", "order": 8, "isActive": true },
  { "name": "Tech", "slug": "tech", "order": 9, "isActive": true },
  { "name": "Sports", "slug": "sports", "order": 10, "isActive": true },
  { "name": "Auto", "slug": "auto", "order": 11, "isActive": true },
  { "name": "Spiritual", "slug": "spiritual", "order": 12, "isActive": true },
  { "name": "Horoscope", "slug": "horoscope", "order": 13, "isActive": true },
  { "name": "Weather", "slug": "weather", "order": 14, "isActive": true }
];

export async function getAllCategories(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    let list = await prisma.category.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    if (list.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat
        });
      }
      list = await prisma.category.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
      });
    }

    return list;
  } catch (err) {
    console.error('Failed to get categories from DB:', err.message);
    return DEFAULT_CATEGORIES.map((c, i) => ({ id: 'cat-' + c.slug, ...c }));
  }
}

export async function createCategory(data) {
  const name = (data.name || '').trim();
  if (!name) throw new Error('Category name is required');

  const slug = (data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')).trim();
  const isActive = typeof data.isActive === 'boolean' ? data.isActive : true;
  const showOnHome = typeof data.showOnHome === 'boolean' ? data.showOnHome : true;

  const allCats = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
  });

  const targetOrder = typeof data.order === 'number' && data.order > 0
    ? data.order
    : allCats.length + 1;

  const targetIndex = Math.min(allCats.length, Math.max(0, targetOrder - 1));

  const newCat = await prisma.category.create({
    data: {
        name,
        slug,
        order: targetOrder,
        isActive,
        showOnHome
      }
  });

  // Re-sequence all categories gapless
  allCats.splice(targetIndex, 0, newCat);
  for (let i = 0; i < allCats.length; i++) {
    await prisma.category.update({
      where: { id: allCats[i].id },
      data: { order: i + 1 }
    });
  }

  return await prisma.category.findUnique({ where: { id: newCat.id } });
}

export async function updateCategory(id, data) {
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) throw new Error('Category not found');

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.slug !== undefined) updateData.slug = data.slug.trim();
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
  if (data.showOnHome !== undefined) updateData.showOnHome = Boolean(data.showOnHome);

  // If order changed, shift other categories so there are NO duplicates and NO gaps!
  if (data.order !== undefined) {
    const targetOrder = Math.max(1, Number(data.order));
    const allCats = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    const filtered = allCats.filter(c => c.id !== id);
    const targetIndex = Math.min(filtered.length, Math.max(0, targetOrder - 1));
    filtered.splice(targetIndex, 0, current);

    for (let i = 0; i < filtered.length; i++) {
      const isTarget = filtered[i].id === id;
      const payload = isTarget ? { ...updateData, order: i + 1 } : { order: i + 1 };
      await prisma.category.update({
        where: { id: filtered[i].id },
        data: payload
      });
    }
  } else {
    await prisma.category.update({
      where: { id },
      data: updateData
    });
  }

  // If slug changed, sync existing articles
  if (data.slug && data.slug.trim() !== current.slug) {
    try {
      await prisma.article.updateMany({
        where: { category: current.slug },
        data: { category: data.slug.trim() }
      });
    } catch (syncErr) {
      console.warn('Article category sync error:', syncErr.message);
    }
  }

  return await prisma.category.findUnique({ where: { id } });
}

export async function reorderCategories(orderedIds) {
  if (!Array.isArray(orderedIds)) throw new Error('orderedIds must be an array');
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.category.update({
      where: { id: orderedIds[i] },
      data: { order: i + 1 }
    });
  }
  return await getAllCategories(true);
}

export async function deleteCategory(id) {
  await prisma.category.delete({
    where: { id }
  });

  // Re-sequence remaining
  const remaining = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
  });
  for (let i = 0; i < remaining.length; i++) {
    await prisma.category.update({
      where: { id: remaining[i].id },
      data: { order: i + 1 }
    });
  }
}
