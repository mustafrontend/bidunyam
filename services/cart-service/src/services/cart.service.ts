import { getRedisClient } from '../repositories/redis.client';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export const CartService = {
  async getCart(userId: string): Promise<CartItem[]> {
    const redis = getRedisClient();
    const cartData = await redis.get(`cart:${userId}`);
    return cartData ? JSON.parse(cartData) : [];
  },

  async addToCart(userId: string, product: CartItem): Promise<CartItem[]> {
    const redis = getRedisClient();
    const cart = await this.getCart(userId);
    
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    await redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 60 * 60 * 24 * 7); // 7 days
    return cart;
  },

  async removeFromCart(userId: string, productId: string): Promise<CartItem[]> {
    const redis = getRedisClient();
    let cart = await this.getCart(userId);
    
    const existingItem = cart.find(item => item._id === productId);
    if (existingItem && existingItem.quantity > 1) {
      existingItem.quantity -= 1;
    } else {
      cart = cart.filter(item => item._id !== productId);
    }

    await redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 60 * 60 * 24 * 7);
    return cart;
  },

  async clearCart(userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`cart:${userId}`);
  }
};
