import { storage } from '../../services/storage';
import { ProductItem } from '../../types';

export const adminProductsService = {
  getProducts(serviceFilter?: string): ProductItem[] {
    const list = storage.getProducts();
    if (!serviceFilter || serviceFilter === 'all') return list;
    return list.filter((p) => p.service === serviceFilter);
  },

  subscribeProducts(callback: (products: ProductItem[]) => void): () => void {
    callback(storage.getProducts());
    return storage.subscribeAdmin(() => {
      callback(storage.getProducts());
    });
  },

  async addProduct(
    product: ProductItem,
    actorId: string,
    actorName: string
  ): Promise<ProductItem> {
    storage.addProduct(product);
    storage.recordAdminActivity(
      actorId,
      actorName,
      'PRODUCT_CREATE',
      `products/${product.id}`,
      null,
      product
    );
    return product;
  },

  async deleteProduct(
    id: string,
    actorId: string,
    actorName: string
  ): Promise<void> {
    const prev = storage.getProducts().find((p) => p.id === id);
    storage.deleteProduct(id);
    storage.recordAdminActivity(
      actorId,
      actorName,
      'PRODUCT_DELETE',
      `products/${id}`,
      prev,
      null
    );
  },

  async toggleProductActive(
    id: string,
    activeOrActorId?: boolean | string,
    actorId?: string,
    actorName?: string
  ): Promise<ProductItem> {
    const prev = storage.getProducts().find((p) => p.id === id);
    const newActive =
      typeof activeOrActorId === 'boolean' ? activeOrActorId : !prev?.active;
    const finalActorId =
      typeof activeOrActorId === 'string' ? activeOrActorId : actorId || 'admin';
    const finalActorName = actorName || 'Administrator';

    const updated = storage.updateProduct(id, { active: newActive });
    storage.recordAdminActivity(
      finalActorId,
      finalActorName,
      newActive ? 'PRODUCT_ACTIVATE' : 'PRODUCT_DEACTIVATE',
      `products/${id}`,
      prev ? { active: prev.active } : null,
      { active: newActive }
    );
    return updated;
  },

  async updateProductPricing(
    id: string,
    updatesOrCost: Partial<ProductItem> | number,
    sellingOrActorId?: number | string,
    actorId?: string,
    actorName?: string
  ): Promise<ProductItem> {
    const prev = storage.getProducts().find((p) => p.id === id);
    let updates: Partial<ProductItem> = {};
    let finalActorId = 'admin';
    let finalActorName = 'Administrator';

    if (typeof updatesOrCost === 'object') {
      updates = updatesOrCost;
      finalActorId = (sellingOrActorId as string) || 'admin';
      finalActorName = actorId || 'Administrator';
    } else {
      updates = {
        cost_price: updatesOrCost,
        base_price: updatesOrCost,
        selling_price: sellingOrActorId as number,
        user_price: sellingOrActorId as number,
      };
      finalActorId = actorId || 'admin';
      finalActorName = actorName || 'Administrator';
    }

    const updated = storage.updateProduct(id, updates);
    storage.recordAdminActivity(
      finalActorId,
      finalActorName,
      'PRODUCT_PRICING_UPDATE',
      `products/${id}`,
      prev,
      updated
    );
    return updated;
  },

  async bulkImportProducts(
    newProducts: ProductItem[],
    actorId: string,
    actorName: string
  ): Promise<{ count: number }> {
    for (const p of newProducts) {
      const existing = storage.getProducts().find((x) => x.id === p.id || x.plan_code === p.plan_code);
      if (existing) {
        storage.updateProduct(existing.id, p);
      } else {
        storage.addProduct(p);
      }
    }
    storage.recordAdminActivity(
      actorId,
      actorName,
      'BULK_IMPORT_PRODUCTS',
      'products/batch',
      null,
      { count: newProducts.length }
    );
    return { count: newProducts.length };
  },
};
