import { prisma } from './prisma.client';
import { SellerAccount, AccountType } from '@prisma/client';

export interface CreateSellerInput {
  email: string;
  password: string;
  accountType: AccountType;
  fullName?: string;
  companyName?: string;
  taxNo?: string;
  taxOffice?: string;
}

export const SellerRepository = {
  async findByEmail(email: string): Promise<SellerAccount | null> {
    return prisma.sellerAccount.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<Omit<SellerAccount, 'password'> | null> {
    return prisma.sellerAccount.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        accountType: true,
        fullName: true,
        companyName: true,
        taxNo: true,
        taxOffice: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });
  },

  async create(data: CreateSellerInput): Promise<SellerAccount> {
    return prisma.sellerAccount.create({ data });
  },

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.sellerAccount.count({ where: { email } });
    return count > 0;
  },
};
