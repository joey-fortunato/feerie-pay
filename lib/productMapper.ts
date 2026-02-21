/**
 * Mapeamento entre ApiProduct (API) e Product (UI)
 */
import type { ApiProduct } from '../api/types';
import type { Product } from '../types';

export const API_TYPE_FROM_CATEGORY: Record<Product['category'], ApiProduct['type']> = {
  book: 'ebook',
  course: 'course',
  service: 'service',
  digital: 'file',
};

const CATEGORY_FROM_TYPE: Record<ApiProduct['type'], Product['category']> = {
  ebook: 'book',
  course: 'course',
  file: 'digital',
  service: 'service',
};

const PLACEHOLDER_IMAGES: Record<Product['category'], string> = {
  book: 'https://placehold.co/400x600/6363F1/FFFFFF?text=E-book',
  course: 'https://placehold.co/600x400/e2e8f0/64748B?text=Curso',
  service: 'https://placehold.co/400x400/orange/white?text=Servi%C3%A7o',
  digital: 'https://placehold.co/400x400/94a3b8/white?text=Arquivo',
};

/** Converte ApiProduct para o formato Product usado na UI */
export function apiProductToProduct(api: ApiProduct): Product {
  const category = CATEGORY_FROM_TYPE[api.type];
  const image = api.cover_image_url ?? PLACEHOLDER_IMAGES[category] ?? PLACEHOLDER_IMAGES.book;
  return {
    id: api.id,
    name: api.name,
    price: parseFloat(api.price) || 0,
    image,
    type: 'unique',
    category,
    sales: 0,
    createdAt: '',
    status: (api.status as Product['status']) ?? 'active',
    description: api.description ?? undefined,
    external_link: api.external_link ?? undefined,
    instructions: api.instructions ?? undefined,
    file_path: api.file_path ?? undefined,
  };
}
