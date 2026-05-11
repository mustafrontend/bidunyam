import { prisma } from './prisma.client';
import { User } from '@prisma/client';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });
  },

  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  },

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },
};
