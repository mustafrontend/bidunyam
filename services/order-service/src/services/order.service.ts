import Order, { IOrder } from '../models/order.model';

export const OrderService = {
  async createOrder(userId: string, orderData: any): Promise<IOrder> {
    const order = new Order({
      userId,
      ...orderData,
      status: 'PAID' // Payment simulation success
    });
    return await order.save();
  },

  async getOrders(userId: string): Promise<IOrder[]> {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  },

  async getOrderById(orderId: string): Promise<IOrder | null> {
    return await Order.findById(orderId);
  },

  async getAdminOrders(): Promise<IOrder[]> {
    return await Order.find().sort({ createdAt: -1 });
  }
};
