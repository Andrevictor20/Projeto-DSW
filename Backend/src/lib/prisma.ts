import { PrismaClient } from '@prisma/client';

// Cria uma instância do PrismaClient
const prisma = new PrismaClient();

// Exporta a instância para ser usada em outras partes do aplicativo
export default prisma;
