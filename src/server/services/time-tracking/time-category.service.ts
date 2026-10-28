import 'server-only';
import { logger } from '@/lib/logger';
import { CategoryNameTakenError, NotFoundError } from '@/server/errors';
import { timeCategoryRepository } from '@/server/repositories/time-tracking/time-category.repository';
import type { CategoryOption } from '@/types/time-tracking';
import type {
  CreateCategoryInput,
  RenameCategoryInput,
  SetCategoryArchivedInput,
} from '@/server/validators/time-tracking/client.schema';

export function listCategories(
  clientIds: readonly string[],
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<CategoryOption[]> {
  if (clientIds.length === 0) {
    return Promise.resolve([]);
  }
  return timeCategoryRepository.listByClients(clientIds, includeArchived);
}

export async function createCategory({ clientId, name }: CreateCategoryInput) {
  if (await timeCategoryRepository.nameExists(clientId, name)) {
    throw new CategoryNameTakenError();
  }
  const category = await timeCategoryRepository.create(clientId, name);
  logger.info({ clientId, categoryId: category.id }, 'Category created');
  return category;
}

export async function renameCategory({ categoryId, name }: RenameCategoryInput) {
  const category = await timeCategoryRepository.findById(categoryId);
  if (!category) {
    throw new NotFoundError('Category');
  }
  if (await timeCategoryRepository.nameExists(category.clientId, name, categoryId)) {
    throw new CategoryNameTakenError();
  }
  return timeCategoryRepository.update(categoryId, { name });
}

export async function setCategoryArchived({ categoryId, isArchived }: SetCategoryArchivedInput) {
  if (!(await timeCategoryRepository.findById(categoryId))) {
    throw new NotFoundError('Category');
  }
  return timeCategoryRepository.update(categoryId, { isArchived });
}
