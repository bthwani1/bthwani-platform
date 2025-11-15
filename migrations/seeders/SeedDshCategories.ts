import { EntityManager } from '@mikro-orm/core';
import {
  DshCategoryEntity,
  DshCategoryStatus,
} from '../../src/modules/dsh/entities/dsh-category.entity';

/**
 * Seed DSH Categories
 *
 * Creates default DSH categories including Thwani (dsh_quick_task)
 * This seeder is idempotent: it only creates categories that don't already exist.
 */
export async function seedDshCategories(em: EntityManager): Promise<void> {
  const categories: Array<Partial<DshCategoryEntity>> = [
    {
      code: 'dsh_restaurants',
      name_ar: 'مطاعم',
      name_en: 'Restaurants',
      description_ar: 'طلب من المطاعم والمقاهي',
      description_en: 'Order from restaurants and cafes',
      sort_order: 1,
      is_featured: true,
      tags: ['TRENDING', 'NEARBY'],
      var_enabled: 'VAR_DSH_CAT_RESTAURANTS_ENABLED',
    },
    {
      code: 'dsh_supermarkets',
      name_ar: 'سوبرماركت / بقالات',
      name_en: 'Supermarkets / Groceries',
      description_ar: 'تسوق من السوبرماركت والبقالات',
      description_en: 'Shop from supermarkets and grocery stores',
      sort_order: 2,
      is_featured: true,
      tags: ['TRENDING', 'NEARBY'],
      var_enabled: 'VAR_DSH_CAT_SUPERMARKETS_ENABLED',
    },
    {
      code: 'dsh_fruits_veggies',
      name_ar: 'خضار وفواكه',
      name_en: 'Fruits & Vegetables',
      description_ar: 'خضار وفواكه طازجة',
      description_en: 'Fresh fruits and vegetables',
      sort_order: 3,
      is_featured: false,
      tags: ['SEASONAL'],
      var_enabled: 'VAR_DSH_CAT_FRUITS_VEGGIES_ENABLED',
    },
    {
      code: 'dsh_fashion',
      name_ar: 'أناقتي',
      name_en: 'Fashion',
      description_ar: 'أزياء وموضة',
      description_en: 'Fashion and style',
      sort_order: 4,
      is_featured: false,
      tags: ['NEW'],
      var_enabled: 'VAR_DSH_CAT_FASHION_ENABLED',
    },
    {
      code: 'dsh_sweets_cafes',
      name_ar: 'حلا',
      name_en: 'Sweets & Cafes',
      description_ar: 'حلويات ومقاهي',
      description_en: 'Sweets and cafes',
      sort_order: 5,
      is_featured: false,
      tags: ['SEASONAL'],
      var_enabled: 'VAR_DSH_CAT_SWEETS_CAFES_ENABLED',
    },
    {
      code: 'dsh_global_stores',
      name_ar: 'متاجر عالمية',
      name_en: 'Global Stores',
      description_ar: 'متاجر ومواقع عالمية',
      description_en: 'Global stores and websites',
      sort_order: 6,
      is_featured: false,
      tags: ['NEW'],
      var_enabled: 'VAR_DSH_CAT_GLOBAL_STORES_ENABLED',
    },
    {
      code: 'dsh_quick_task',
      name_ar: 'طلبات فورية / مهام سريعة',
      name_en: 'Instant Requests / Quick Tasks',
      description_ar: 'طلب شيء معيّن بسرعة من أي مكان',
      description_en: 'Request something specific quickly from anywhere',
      sort_order: 7,
      is_featured: false,
      tags: ['NEW'],
      var_enabled: 'VAR_DSH_CAT_QUICK_TASK_ENABLED',
    },
  ];

  for (const catData of categories) {
    const existing = await em.findOne(DshCategoryEntity, { code: catData.code });
    if (!existing) {
      const category = em.create(DshCategoryEntity, {
        ...catData,
        status: DshCategoryStatus.ACTIVE,
        is_active: true,
      } as DshCategoryEntity);
      em.persist(category);
    }
  }

  await em.flush();
}
