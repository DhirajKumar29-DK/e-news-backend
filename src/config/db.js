import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['error']
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ MySQL Database connected successfully via Prisma ORM.');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
};
