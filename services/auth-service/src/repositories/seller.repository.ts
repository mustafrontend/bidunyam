import { prisma } from './prisma.client';
import { SellerAccount, AccountType } from '@prisma/client';

export interface CreateSellerInput {
  email: string;
  password: string;
  accountType: AccountType;
  fullName?: string;
  tcNo?: string;
  iban?: string;
  companyName?: string;
  taxNo?: string;
  taxOffice?: string;
  acceptedKvkk?: boolean;
  acceptedSellerAgreement?: boolean;
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
        tcNo: true,
        iban: true,
        companyName: true,
        taxNo: true,
        taxOffice: true,
        acceptedKvkk: true,
        acceptedSellerAgreement: true,
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

  async updateProfile(id: string, data: Record<string, unknown>): Promise<Omit<SellerAccount, 'password'>> {
    return prisma.sellerAccount.update({
      where: { id },
      data,
      select: {
        id: true, email: true, accountType: true, fullName: true, tcNo: true, iban: true,
        companyName: true, taxNo: true, taxOffice: true, companyIban: true,
        acceptedKvkk: true, acceptedSellerAgreement: true,
        storeSlug: true, storeName: true, storeBio: true, storeTheme: true,
        storeColor: true, storeLogo: true, storeBanner: true,
        isActive: true, createdAt: true, updatedAt: true, password: false,
      },
    });
  },

  async findBySlug(slug: string) {
    return prisma.sellerAccount.findUnique({
      where: { storeSlug: slug },
      select: {
        id: true, email: false, accountType: true, fullName: true, companyName: true,
        storeSlug: true, storeName: true, storeBio: true, storeTheme: true,
        storeColor: true, storeLogo: true, storeBanner: true, createdAt: true,
      },
    });
  },

  async slugTaken(slug: string, excludeId: string): Promise<boolean> {
    const found = await prisma.sellerAccount.findUnique({ where: { storeSlug: slug }, select: { id: true } });
    return !!found && found.id !== excludeId;
  },
};
