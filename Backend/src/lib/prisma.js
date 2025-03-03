"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Cria uma instância do PrismaClient
const prisma = new client_1.PrismaClient();
// Exporta a instância para ser usada em outras partes do aplicativo
exports.default = prisma;
